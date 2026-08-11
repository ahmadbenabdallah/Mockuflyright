import React, { useState } from "react";
import { Globe, ArrowRight, Plus, Sparkles, Check } from "lucide-react";
import { validateUrl, normalizeUrl } from "../../services/urlValidator";

interface UrlInputProps {
  onGenerate: (url: string, forceRefresh?: boolean) => void;
  isLoading?: boolean;
}

const SAMPLE_URLS = [
  { name: "Apple", url: "https://www.apple.com" },
  { name: "Stripe", url: "https://stripe.com" },
  { name: "OpenAI", url: "https://openai.com" },
  { name: "Google", url: "https://www.google.com" },
];

export const UrlInput: React.FC<UrlInputProps> = ({ onGenerate, isLoading }) => {
  const [inputUrl, setInputUrl] = useState("https://www.apple.com");
  const [forceRefresh, setForceRefresh] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const validation = validateUrl(inputUrl);
    if (!validation.isValid) {
      setErrorMsg(validation.error || "Please enter a valid website URL.");
      return;
    }

    onGenerate(validation.normalizedUrl, forceRefresh);
  };

  const handleSelectSample = (sampleUrl: string) => {
    setInputUrl(sampleUrl);
    setErrorMsg(null);
    onGenerate(sampleUrl, forceRefresh);
  };

  return (
    <div className="w-full bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-100 dark:shadow-none transition-all">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
            Website Address
          </label>
          <div className="relative flex items-center">
            <div className="absolute left-4 text-slate-400 dark:text-slate-500 pointer-events-none">
              <Globe className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => {
                setInputUrl(e.target.value);
                setErrorMsg(null);
              }}
              placeholder="https://example.com"
              className={`w-full pl-12 pr-36 py-3.5 text-base rounded-xl border bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
                errorMsg
                  ? "border-rose-500 focus:ring-rose-500/20"
                  : "border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-indigo-500/20"
              }`}
            />
            <div className="absolute right-2 flex items-center space-x-2">
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium text-sm rounded-lg shadow-sm hover:shadow transition-all duration-150 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Rendering...</span>
                  </>
                ) : (
                  <>
                    <span>Generate Mockup</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
          {errorMsg && (
            <p className="mt-2 text-xs font-medium text-rose-500 dark:text-rose-400 flex items-center space-x-1">
              <span>{errorMsg}</span>
            </p>
          )}
        </div>

        {/* Preset Sample URLs Chips & Force Refresh Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center space-x-1 mr-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Try sample:</span>
            </span>
            {SAMPLE_URLS.map((sample) => (
              <button
                key={sample.name}
                type="button"
                onClick={() => handleSelectSample(sample.url)}
                className="px-3 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg border border-slate-200/60 dark:border-slate-700/60 transition-colors cursor-pointer"
              >
                {sample.name}
              </button>
            ))}
          </div>

          <label className="flex items-center space-x-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={forceRefresh}
              onChange={(e) => setForceRefresh(e.target.checked)}
              className="w-3.5 h-3.5 text-indigo-600 rounded border-slate-300 dark:border-slate-700 focus:ring-indigo-500"
            />
            <span>Bypass Cache (Force Fresh Capture)</span>
          </label>
        </div>
      </form>
    </div>
  );
};
