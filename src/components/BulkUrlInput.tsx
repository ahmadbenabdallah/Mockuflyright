import React, { useState, useRef } from "react";
import { UploadCloud, FileText, Layers, Trash2, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import Papa from "papaparse";
import { validateUrl } from "../../services/urlValidator";

interface BulkUrlInputProps {
  onStartBulkJob: (urls: string[], concurrency: number) => void;
  isLoading?: boolean;
}

export const BulkUrlInput: React.FC<BulkUrlInputProps> = ({ onStartBulkJob, isLoading }) => {
  const [rawText, setRawText] = useState<string>(
    "https://www.apple.com\nhttps://stripe.com\nhttps://openai.com\nhttps://www.google.com"
  );
  const [concurrency, setConcurrency] = useState<number>(3);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse lines into clean unique list
  const lines = rawText
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const validUrls = lines.filter((line) => validateUrl(line).isValid);
  const totalCount = lines.length;

  const handleFileUpload = (file: File) => {
    if (!file) return;

    const extension = file.name.split(".").pop()?.toLowerCase();

    if (extension === "csv") {
      Papa.parse(file, {
        complete: (results) => {
          const extractedUrls: string[] = [];
          if (results.data && Array.isArray(results.data)) {
            for (const row of results.data as any[]) {
              if (Array.isArray(row)) {
                for (const cell of row) {
                  if (typeof cell === "string" && cell.includes(".")) {
                    const norm = validateUrl(cell);
                    if (norm.isValid) extractedUrls.push(norm.normalizedUrl);
                  }
                }
              } else if (typeof row === "object" && row !== null) {
                for (const val of Object.values(row)) {
                  if (typeof val === "string" && val.includes(".")) {
                    const norm = validateUrl(val);
                    if (norm.isValid) extractedUrls.push(norm.normalizedUrl);
                  }
                }
              }
            }
          }
          if (extractedUrls.length > 0) {
            setRawText(extractedUrls.join("\n"));
          }
        },
        error: () => {
          alert("Failed to parse CSV file");
        },
      });
    } else {
      // Plain text file
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        if (text) {
          setRawText(text);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validUrls.length === 0) return;
    onStartBulkJob(validUrls, concurrency);
  };

  return (
    <div className="w-full bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            <span>Bulk URL Generator</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Paste multiple website URLs or drop a CSV/TXT file to generate and package all mockups into a single ZIP.
          </p>
        </div>

        {/* Concurrency limit selector */}
        <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
          <span className="font-semibold text-slate-600 dark:text-slate-300">Parallel Workers:</span>
          <select
            value={concurrency}
            onChange={(e) => setConcurrency(Number(e.target.value))}
            className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 font-semibold text-slate-900 dark:text-white"
          >
            <option value={1}>1 (Sequential)</option>
            <option value={2}>2 Concurrent</option>
            <option value={3}>3 Concurrent (Default)</option>
            <option value={5}>5 Concurrent</option>
            <option value={10}>10 Concurrent</option>
          </select>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Drag & Drop File Upload Area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
            dragActive
              ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40"
              : "border-slate-200 dark:border-slate-700 hover:border-indigo-400 bg-slate-50/50 dark:bg-slate-800/30"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.txt"
            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
            className="hidden"
          />
          <UploadCloud className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Drop your URL list here, or <span className="text-indigo-600 dark:text-indigo-400 underline">browse</span>
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Supports .TXT or .CSV files</p>
        </div>

        {/* Multi-line Text Area */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              URL List (One per line)
            </label>
            <div className="flex items-center space-x-3 text-xs">
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                {validUrls.length} Valid URLs detected
              </span>
              <button
                type="button"
                onClick={() => setRawText("")}
                className="text-slate-400 hover:text-rose-500 flex items-center space-x-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            </div>
          </div>
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            rows={6}
            placeholder="https://google.com&#10;https://apple.com&#10;https://stripe.com"
            className="w-full p-4 text-xs sm:text-sm font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
          />
        </div>

        {/* Submit Action Bar */}
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            All mockups will be rendered with your current customization settings and saved into one ZIP.
          </p>
          <button
            type="submit"
            disabled={isLoading || validUrls.length === 0}
            className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Processing Bulk Jobs...</span>
              </>
            ) : (
              <>
                <span>Generate All ({validUrls.length})</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
