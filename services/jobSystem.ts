/**
 * Bulk URL Queue Management & Concurrency Service
 */
import { BulkJob, MockupSettings, JobStatus } from "../src/types";
import { validateUrl, generateFilename } from "./urlValidator";
import { renderWebsiteScreenshot } from "./renderer";
import { generateResultsCsv } from "../src/utils/csv";

export { generateResultsCsv };

export interface BulkBatchState {
  id: string;
  jobs: BulkJob[];
  settings: MockupSettings;
  concurrency: number;
  completedCount: number;
  totalCount: number;
  isFinished: boolean;
  createdAt: number;
}

const batchStore = new Map<string, BulkBatchState>();

/**
 * Creates a new bulk batch process with normalized unique URLs
 */
export function createBulkBatch(
  urls: string[],
  settings: MockupSettings,
  concurrency: number = 3
): BulkBatchState {
  // Filter out empty lines & trim
  const cleanLines = urls.map((u) => u.trim()).filter((u) => u.length > 0);

  // Remove duplicates while keeping order
  const seen = new Set<string>();
  const uniqueUrls: string[] = [];

  for (const line of cleanLines) {
    const norm = validateUrl(line).normalizedUrl || line;
    if (!seen.has(norm)) {
      seen.add(norm);
      uniqueUrls.push(line);
    }
  }

  const batchId = "batch_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);

  const jobs: BulkJob[] = uniqueUrls.map((rawUrl, index) => {
    const val = validateUrl(rawUrl);
    const filename = generateFilename(val.normalizedUrl || rawUrl, settings.browser, index + 1);

    return {
      id: `job_${batchId}_${index}`,
      url: rawUrl,
      normalizedUrl: val.normalizedUrl || rawUrl,
      status: val.isValid ? "Waiting" : "Failed",
      progress: 0,
      error: val.isValid ? undefined : val.error,
      timestamp: Date.now(),
      filename,
    };
  });

  const batchState: BulkBatchState = {
    id: batchId,
    jobs,
    settings,
    concurrency: Math.max(1, Math.min(10, concurrency)),
    completedCount: jobs.filter((j) => j.status === "Failed").length,
    totalCount: jobs.length,
    isFinished: jobs.every((j) => j.status === "Failed"),
    createdAt: Date.now(),
  };

  batchStore.set(batchId, batchState);

  // Start processing queue asynchronously
  processBatchQueue(batchId);

  return batchState;
}

/**
 * Retrieves the current status of a bulk batch
 */
export function getBatchState(batchId: string): BulkBatchState | null {
  return batchStore.get(batchId) || null;
}

/**
 * Processes batch queue with strict concurrency limits
 */
async function processBatchQueue(batchId: string): Promise<void> {
  const batch = batchStore.get(batchId);
  if (!batch) return;

  const pendingJobs = batch.jobs.filter((j) => j.status === "Waiting");
  if (pendingJobs.length === 0) {
    batch.isFinished = true;
    return;
  }

  let activeCount = 0;
  let jobIndex = 0;

  const runNext = async () => {
    if (jobIndex >= batch.jobs.length) {
      if (activeCount === 0) {
        batch.isFinished = true;
      }
      return;
    }

    const currentJob = batch.jobs[jobIndex++];
    if (currentJob.status !== "Waiting") {
      runNext();
      return;
    }

    activeCount++;
    const startTime = Date.now();

    try {
      // 1. Validating
      currentJob.status = "Validating";
      currentJob.progress = 15;

      const validation = validateUrl(currentJob.url);
      if (!validation.isValid) {
        currentJob.status = "Failed";
        currentJob.error = validation.error || "Invalid website URL";
        currentJob.progress = 100;
        batch.completedCount++;
        activeCount--;
        runNext();
        return;
      }

      // 2. Rendering
      currentJob.status = "Rendering";
      currentJob.progress = 40;

      const renderResult = await renderWebsiteScreenshot({
        url: validation.normalizedUrl,
        viewportWidth: batch.settings.viewportWidth,
        viewportHeight: batch.settings.viewportHeight,
        fullPage: batch.settings.captureMode === "fullPage",
        deviceScaleFactor: batch.settings.scale,
        dismissCookies: batch.settings.dismissCookies,
      });

      if (!renderResult.success || !renderResult.image) {
        currentJob.status = "Failed";
        currentJob.error = renderResult.error || "Website blocked automated browser access.";
        currentJob.progress = 100;
      } else {
        // 3. Complete
        currentJob.status = "Complete";
        currentJob.progress = 100;
        currentJob.screenshotUrl = renderResult.image;
      }

      currentJob.durationMs = Date.now() - startTime;
      batch.completedCount++;
    } catch (err: any) {
      currentJob.status = "Failed";
      currentJob.error = err.message || "Failed to render website.";
      currentJob.progress = 100;
      currentJob.durationMs = Date.now() - startTime;
      batch.completedCount++;
    } finally {
      activeCount--;
      runNext();
    }
  };

  // Launch initial concurrent workers
  for (let i = 0; i < batch.concurrency; i++) {
    runNext();
  }
}
