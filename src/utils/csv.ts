/**
 * Frontend & Common CSV Helper
 */
import { BulkJob } from "../types";

export function generateResultsCsv(jobs: BulkJob[]): string {
  const headers = ["url", "status", "filename", "duration_ms", "error"];
  const rows = jobs.map((job) => [
    `"${job.url.replace(/"/g, '""')}"`,
    job.status,
    job.filename || "",
    job.durationMs || 0,
    `"${(job.error || "").replace(/"/g, '""')}"`,
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}
