import React, { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  RotateCcw,
  FileSpreadsheet,
  Archive,
  Image as ImageIcon,
} from "lucide-react";
import JSZip from "jszip";
import { BulkJob, MockupSettings } from "../types";
import { composeMockupImage } from "../../services/imageComposer";
import { generateResultsCsv } from "../utils/csv";

interface JobListProps {
  jobs: BulkJob[];
  settings: MockupSettings;
  isFinished: boolean;
  onRetryJob?: (jobId: string) => void;
  batchId?: string;
}

export const JobList: React.FC<JobListProps> = ({
  jobs,
  settings,
  isFinished,
  onRetryJob,
  batchId,
}) => {
  const [isZipping, setIsZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);

  const completedJobs = jobs.filter((j) => j.status === "Complete");
  const failedJobs = jobs.filter((j) => j.status === "Failed");
  const totalCount = jobs.length;
  const processedCount = completedJobs.length + failedJobs.length;
  const overallPercent = totalCount > 0 ? Math.round((processedCount / totalCount) * 100) : 0;

  // Download complete ZIP package of all PNGs
  const handleDownloadZip = async () => {
    if (completedJobs.length === 0) return;
    setIsZipping(true);
    setZipProgress(10);

    try {
      const zip = new JSZip();
      const folder = zip.folder("mockups") || zip;

      let index = 0;
      for (const job of completedJobs) {
        if (job.screenshotUrl) {
          // Compose full browser frame image
          const composedDataUrl = await composeMockupImage({
            screenshotDataUrl: job.screenshotUrl,
            url: job.url,
            settings,
          });

          // Convert data URL to base64 buffer
          const base64Data = composedDataUrl.replace(/^data:image\/png;base64,/, "");
          const filename = job.filename || `mockup-${index + 1}.png`;
          folder.file(filename, base64Data, { base64: true });
        }
        index++;
        setZipProgress(10 + Math.round((index / completedJobs.length) * 80));
      }

      // Add results.csv
      const csvData = generateResultsCsv(jobs);
      zip.file("results.csv", csvData);

      // Generate ZIP blob
      const content = await zip.generateAsync({ type: "blob" });
      const downloadUrl = URL.createObjectURL(content);

      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `mockupify-batch-${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error("ZIP creation error:", err);
      alert("Failed to build ZIP archive.");
    } finally {
      setIsZipping(false);
      setZipProgress(0);
    }
  };

  // Download CSV log
  const handleDownloadCsv = () => {
    const csvContent = generateResultsCsv(jobs);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mockupify-results-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
      {/* Batch Progress Overview Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <span>Bulk Job Progress</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              {processedCount} / {totalCount} Processed
            </span>
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {completedJobs.length} Successful, {failedJobs.length} Failed
          </p>
        </div>

        {/* Export ZIP and CSV buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleDownloadCsv}
            className="flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Download CSV</span>
          </button>

          <button
            onClick={handleDownloadZip}
            disabled={completedJobs.length === 0 || isZipping}
            className="flex items-center space-x-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-sm hover:shadow transition-all cursor-pointer"
          >
            <Archive className="w-4 h-4" />
            <span>{isZipping ? `Zipping (${zipProgress}%)...` : "Download ZIP"}</span>
          </button>
        </div>
      </div>

      {/* Main Overall Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
          <span>Processing Queue</span>
          <span>{overallPercent}%</span>
        </div>
        <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-300"
            style={{ width: `${overallPercent}%` }}
          />
        </div>
      </div>

      {/* Jobs Table List */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <th className="py-3 px-4">Website URL</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 hidden sm:table-cell">Duration</th>
              <th className="py-3 px-4 text-right">Result</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs font-medium">
            {jobs.map((job) => (
              <tr key={job.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                {/* URL */}
                <td className="py-3 px-4 max-w-xs truncate text-slate-900 dark:text-slate-100 font-mono">
                  {job.url}
                </td>

                {/* Status Badge */}
                <td className="py-3 px-4">
                  {job.status === "Complete" && (
                    <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Complete</span>
                    </span>
                  )}
                  {job.status === "Failed" && (
                    <span
                      title={job.error}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Failed</span>
                    </span>
                  )}
                  {job.status !== "Complete" && job.status !== "Failed" && (
                    <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                      <div className="w-3 h-3 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                      <span>{job.status}...</span>
                    </span>
                  )}
                </td>

                {/* Duration */}
                <td className="py-3 px-4 hidden sm:table-cell text-slate-500 dark:text-slate-400">
                  {job.durationMs ? `${(job.durationMs / 1000).toFixed(1)}s` : "—"}
                </td>

                {/* Result / Error or Action */}
                <td className="py-3 px-4 text-right">
                  {job.status === "Complete" ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓ Ready</span>
                  ) : job.status === "Failed" ? (
                    <div className="flex items-center justify-end space-x-2">
                      <span className="text-rose-500 text-[11px] truncate max-w-[150px]" title={job.error}>
                        {job.error || "Blocked"}
                      </span>
                      {onRetryJob && (
                        <button
                          onClick={() => onRetryJob(job.id)}
                          className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300"
                          title="Retry job"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
