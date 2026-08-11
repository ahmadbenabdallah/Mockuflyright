import React from "react";
import { Monitor, CheckCircle, Sparkles, Layers, ShieldCheck, Zap } from "lucide-react";

interface EmptyStateProps {
  onSelectSample: (url: string) => void;
}

const HIGHLIGHTS = [
  "Realistic Safari & Chrome browser frames",
  "High-resolution 1x, 2x, 3x PNG export",
  "Full-page scrolling website capture",
  "Bulk URL processing & ZIP packaging",
  "Automatic cookie banner dismissal",
  "SSRF protected server rendering pipeline",
];

export const EmptyState: React.FC<EmptyStateProps> = ({ onSelectSample }) => {
  return (
    <div className="w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 sm:p-12 text-center shadow-sm space-y-8">
      {/* Icon Badge */}
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25">
        <Monitor className="w-8 h-8" />
      </div>

      {/* Hero Headline */}
      <div className="max-w-2xl mx-auto space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Turn any website URL into a polished browser mockup
        </h1>
        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400">
          Paste a website address, preview it inside realistic Safari browser chrome, customize shadows and canvas padding, and download high-resolution PNGs.
        </p>
      </div>

      {/* Quick Test Drive Chips */}
      <div className="pt-2">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
          Click any sample website to test instantly:
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {[
            { name: "Apple", url: "https://www.apple.com" },
            { name: "Stripe", url: "https://stripe.com" },
            { name: "OpenAI", url: "https://openai.com" },
            { name: "Google", url: "https://www.google.com" },
          ].map((sample) => (
            <button
              key={sample.name}
              onClick={() => onSelectSample(sample.url)}
              className="px-4 py-2 text-sm font-semibold rounded-xl bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200/80 dark:border-slate-700 transition-all hover:scale-105 cursor-pointer"
            >
              🚀 {sample.name} ({sample.url})
            </button>
          ))}
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div className="pt-6 border-t border-slate-200 dark:border-slate-800 max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
        {HIGHLIGHTS.map((item, idx) => (
          <div key={idx} className="flex items-center space-x-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium">
            <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
