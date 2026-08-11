import React, { useState, useEffect } from "react";
import {
  Download,
  Copy,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Check,
  AlertCircle,
  ExternalLink,
  Sparkles,
  Monitor,
  Eye,
  Lock,
  RotateCw,
} from "lucide-react";
import { MockupSettings } from "../types";
import { composeMockupImage } from "../../services/imageComposer";
import { generateFilename } from "../../services/urlValidator";

interface MockupPreviewProps {
  url: string;
  screenshotDataUrl: string | null;
  settings: MockupSettings;
  isLoading?: boolean;
  onRefreshScreenshot?: () => void;
  isFallbackScreenshot?: boolean;
}

export const MockupPreview: React.FC<MockupPreviewProps> = ({
  url,
  screenshotDataUrl,
  settings,
  isLoading,
  onRefreshScreenshot,
  isFallbackScreenshot,
}) => {
  const [viewMode, setViewMode] = useState<"mockup" | "iframe">("mockup");
  const [composedDataUrl, setComposedDataUrl] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(100);
  const [copied, setCopied] = useState<boolean>(false);
  const [isComposing, setIsComposing] = useState<boolean>(false);
  const [iframeKey, setIframeKey] = useState<number>(0);

  // Re-compose whenever screenshot or settings change
  useEffect(() => {
    if (!screenshotDataUrl) {
      setComposedDataUrl(null);
      return;
    }

    let isMounted = true;
    setIsComposing(true);

    composeMockupImage({
      screenshotDataUrl,
      url,
      settings,
    })
      .then((dataUrl) => {
        if (isMounted) {
          setComposedDataUrl(dataUrl);
        }
      })
      .catch((err) => {
        console.error("Composition error:", err);
      })
      .finally(() => {
        if (isMounted) setIsComposing(false);
      });

    return () => {
      isMounted = false;
    };
  }, [screenshotDataUrl, url, settings]);

  // Download PNG handler
  const handleDownload = () => {
    if (!composedDataUrl) return;

    const filename = generateFilename(url, settings.browser);
    const link = document.createElement("a");
    link.href = composedDataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copy Image to Clipboard handler
  const handleCopyImage = async () => {
    if (!composedDataUrl) return;

    try {
      const res = await fetch(composedDataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob,
        }),
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("Direct clipboard copy unsupported by browser. Please use Download PNG.");
    }
  };

  return (
    <div className="w-full bg-slate-900/5 dark:bg-slate-950/40 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-6 flex flex-col space-y-4">
      {/* Top Preview Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        {/* Left View Mode Tabs */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            <button
              onClick={() => setViewMode("mockup")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                viewMode === "mockup"
                  ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Mockup PNG</span>
            </button>
            <button
              onClick={() => setViewMode("iframe")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                viewMode === "iframe"
                  ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Interactive Live View</span>
            </button>
          </div>

          <span className="hidden md:inline-flex text-xs px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
            {settings.viewportWidth}×{settings.viewportHeight} ({settings.scale}x)
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          {/* Zoom controls */}
          <div className="hidden sm:flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1 text-slate-600 dark:text-slate-300">
            <button
              onClick={() => setZoom((z) => Math.max(50, z - 15))}
              className="p-1 hover:text-slate-900 dark:hover:text-white rounded cursor-pointer"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono px-1">{zoom}%</span>
            <button
              onClick={() => setZoom((z) => Math.min(150, z + 15))}
              className="p-1 hover:text-slate-900 dark:hover:text-white rounded cursor-pointer"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1 px-3 py-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 rounded-lg transition-colors cursor-pointer"
            title="Open live website in new tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open Site Live</span>
          </a>

          {onRefreshScreenshot && (
            <button
              onClick={onRefreshScreenshot}
              disabled={isLoading}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              title="Force re-hydrate dynamic scripts, carousels & re-render screenshot"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Re-Hydrate Components</span>
            </button>
          )}

          <button
            onClick={handleCopyImage}
            disabled={!composedDataUrl}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied!" : "Copy"}</span>
          </button>

          <button
            onClick={handleDownload}
            disabled={!composedDataUrl}
            className="flex items-center space-x-1.5 px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm hover:shadow transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PNG</span>
          </button>
        </div>
      </div>

      {/* Cloudflare / Anti-Bot / Iframe Notice Banner */}
      {viewMode === "iframe" ? (
        <div className="p-3 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/80 rounded-xl text-xs text-blue-800 dark:text-blue-300 flex items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Lock className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <div>
              <span className="font-semibold">Security / X-Frame Notice: </span>
              If the iframe displays <em>"refused to connect"</em> or <em>"cannot reconnect"</em>, the target site enforces strict <code className="bg-blue-100 dark:bg-blue-900 px-1 py-0.5 rounded font-mono">X-Frame-Options: SAMEORIGIN</code> header rules. Click{" "}
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-bold text-blue-700 dark:text-blue-200 hover:text-blue-900"
              >
                Open Site Live
              </a>{" "}
              to view in a full browser window, or switch back to <button onClick={() => setViewMode("mockup")} className="underline font-bold">Mockup PNG</button> mode.
            </div>
          </div>
        </div>
      ) : isFallbackScreenshot ? (
        <div className="p-3 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/80 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <span className="font-semibold">Anti-Bot / Cloudflare Protection Bypassed: </span>
              Captured via Cloud High-Precision Proxy Pipeline. If carousel banners or components are missing, click{" "}
              <button
                onClick={onRefreshScreenshot}
                className="underline font-bold text-amber-900 dark:text-amber-100 hover:text-amber-950 cursor-pointer"
              >
                Re-Hydrate Components
              </button>{" "}
              to trigger full page script hydration.
            </div>
          </div>
        </div>
      ) : null}

      {/* Main Preview Area */}
      <div className="relative min-h-[500px] w-full flex items-center justify-center bg-slate-200/50 dark:bg-slate-900/60 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 overflow-auto p-4 sm:p-8">
        {isLoading || isComposing ? (
          <div className="flex flex-col items-center justify-center space-y-3 py-16 text-slate-500">
            <div className="w-10 h-10 border-3 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {isLoading
                ? "Executing progressive hydration & capturing high-res render..."
                : "Composing device mockup frame..."}
            </p>
          </div>
        ) : viewMode === "iframe" ? (
          /* Interactive Live Safari iFrame Container */
          <div
            className="w-full max-w-[1200px] transition-transform duration-200 flex flex-col rounded-xl overflow-hidden shadow-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center" }}
          >
            {/* Safari Chrome Window Bar */}
            <div className="bg-slate-100 dark:bg-slate-800 px-4 py-3 border-b border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
              </div>

              {/* Address Bar */}
              <div className="flex-1 max-w-xl mx-4 bg-white dark:bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center space-x-2 text-xs text-slate-600 dark:text-slate-300 shadow-inner">
                <Lock className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="font-mono text-ellipsis overflow-hidden whitespace-nowrap flex-1">{url}</span>
                <button
                  onClick={() => setIframeKey((k) => k + 1)}
                  className="p-0.5 hover:text-indigo-500 transition-colors cursor-pointer"
                  title="Reload iFrame"
                >
                  <RotateCw className="w-3 h-3" />
                </button>
              </div>

              <div className="flex items-center space-x-2 text-xs text-slate-500 font-semibold">
                <Monitor className="w-3.5 h-3.5 text-indigo-500" />
                <span className="hidden sm:inline">Interactive View</span>
              </div>
            </div>

            {/* iFrame Body */}
            <iframe
              key={iframeKey}
              src={url}
              title={`${url} Interactive Live View`}
              className="w-full h-[650px] border-none bg-white"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
          </div>
        ) : composedDataUrl ? (
          /* Composed Mockup Image View */
          <div
            className="transition-transform duration-200 flex items-center justify-center max-w-full"
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: "center center" }}
          >
            <img
              src={composedDataUrl}
              alt={`${url} Safari mockup`}
              className="max-w-full h-auto rounded-lg shadow-2xl object-contain"
            />
          </div>
        ) : (
          <div className="text-center py-16 text-slate-400">
            <p>No preview generated yet. Enter a website URL above.</p>
          </div>
        )}
      </div>
    </div>
  );
};
