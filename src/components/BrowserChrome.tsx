import React from "react";
import { Lock, RefreshCw, ChevronLeft, ChevronRight, ShieldCheck } from "lucide-react";
import { BrowserType, FrameStyle } from "../types";

interface BrowserChromeProps {
  url: string;
  browser?: BrowserType;
  frameStyle?: FrameStyle;
  darkMode?: boolean;
  children: React.ReactNode;
}

export const BrowserChrome: React.FC<BrowserChromeProps> = ({
  url,
  browser = "safari",
  frameStyle = "standard",
  darkMode = false,
  children,
}) => {
  let displayDomain = "example.com";
  let displayPath = "";

  try {
    const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
    displayDomain = parsed.hostname;
    displayPath = parsed.pathname + parsed.search;
  } catch {
    displayDomain = url || "example.com";
  }

  // Header height classes
  const headerHeightClass =
    frameStyle === "compact"
      ? "h-9 text-xs"
      : frameStyle === "large"
      ? "h-14 text-sm"
      : "h-11 text-xs sm:text-sm";

  const headerBgClass = darkMode
    ? "bg-slate-900 text-slate-100 border-slate-800"
    : browser === "safari"
    ? "bg-slate-100/90 text-slate-800 border-slate-200/80"
    : "bg-slate-200/70 text-slate-800 border-slate-300/70";

  const addressBarBgClass = darkMode
    ? "bg-slate-800 border-slate-700 text-slate-200"
    : browser === "safari"
    ? "bg-white/80 border-slate-200/80 text-slate-700"
    : "bg-white border-slate-300 text-slate-800";

  return (
    <div className="w-full flex flex-col rounded-xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-2xl transition-all">
      {/* Browser Window Header Chrome */}
      <div
        className={`w-full px-4 border-b flex items-center justify-between select-none ${headerHeightClass} ${headerBgClass}`}
      >
        {/* Left Section: Traffic Lights & Navigation */}
        <div className="flex items-center space-x-3 min-w-0">
          {/* Traffic Lights */}
          <div className="flex items-center space-x-2 shrink-0">
            <span className="w-3 h-3 rounded-full bg-rose-500 inline-block shadow-inner hover:opacity-80 transition-opacity"></span>
            <span className="w-3 h-3 rounded-full bg-amber-400 inline-block shadow-inner hover:opacity-80 transition-opacity"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block shadow-inner hover:opacity-80 transition-opacity"></span>
          </div>

          {/* Navigation Arrows */}
          <div className="hidden sm:flex items-center space-x-1 text-slate-400 dark:text-slate-500 shrink-0">
            <button className="p-1 hover:text-slate-600 dark:hover:text-slate-300 rounded transition-colors" title="Back">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="p-1 hover:text-slate-600 dark:hover:text-slate-300 rounded transition-colors" title="Forward">
              <ChevronRight className="w-4 h-4" />
            </button>
            <button className="p-1 hover:text-slate-600 dark:hover:text-slate-300 rounded transition-colors" title="Reload">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Center Section: Address Bar */}
        <div className="flex-1 max-w-lg mx-3 min-w-0">
          <div
            className={`w-full h-7 px-3 flex items-center justify-center space-x-2 rounded-lg border text-center truncate ${addressBarBgClass}`}
          >
            <Lock className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-mono text-xs truncate">
              <span className="font-semibold">{displayDomain}</span>
              <span className="opacity-60">{displayPath}</span>
            </span>
          </div>
        </div>

        {/* Right Section: Safari / Browser Indicator */}
        <div className="hidden sm:flex items-center space-x-2 shrink-0 text-slate-400 dark:text-slate-500">
          <ShieldCheck className="w-4 h-4 text-slate-400" />
          <span className="text-[11px] font-medium capitalize">{browser}</span>
        </div>
      </div>

      {/* Website Viewport Area */}
      <div className="relative w-full bg-white dark:bg-slate-950 overflow-hidden flex-1">
        {children}
      </div>
    </div>
  );
};
