import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { UrlInput } from "./components/UrlInput";
import { SettingsPanel } from "./components/SettingsPanel";
import { MockupPreview } from "./components/MockupPreview";
import { BulkUrlInput } from "./components/BulkUrlInput";
import { JobList } from "./components/JobList";
import { EmptyState } from "./components/EmptyState";
import { HelpModal } from "./components/HelpModal";
import { MockupSettings, BulkJob } from "./types";
import { loadSavedSettings, saveUserSettings } from "./utils/storage";
import { trackEvent } from "./utils/analytics";

export default function App() {
  const [activeTab, setActiveTab] = useState<"single" | "bulk">("single");
  const [settings, setSettings] = useState<MockupSettings>(loadSavedSettings);
  const [currentUrl, setCurrentUrl] = useState<string>("https://www.apple.com");
  const [screenshotDataUrl, setScreenshotDataUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFallbackScreenshot, setIsFallbackScreenshot] = useState<boolean>(false);

  // Bulk State
  const [activeBatchId, setActiveBatchId] = useState<string | null>(null);
  const [bulkJobs, setBulkJobs] = useState<BulkJob[]>([]);
  const [isBulkFinished, setIsBulkFinished] = useState<boolean>(true);
  const [isBulkLoading, setIsBulkLoading] = useState<boolean>(false);

  // Help & Dark Mode
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  // Save settings locally whenever changed
  const handleSettingsChange = (newSettings: MockupSettings) => {
    setSettings(newSettings);
    saveUserSettings(newSettings);
  };

  // Toggle Dark Mode
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  // Handle Single URL Mockup Generation
  const handleGenerateSingleMockup = async (targetUrl: string, forceRefresh: boolean = false) => {
    setCurrentUrl(targetUrl);
    setIsLoading(true);
    trackEvent("url_submitted", { url: targetUrl });

    try {
      const res = await fetch("/api/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: targetUrl,
          viewportWidth: settings.viewportWidth,
          viewportHeight: settings.viewportHeight,
          fullPage: settings.captureMode === "fullPage",
          deviceScaleFactor: settings.scale,
          dismissCookies: settings.dismissCookies,
          forceRefresh,
        }),
      });

      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        const rawText = await res.text();
        throw new Error(
          res.status === 503
            ? "Rendering service is starting up or temporarily busy. Please retry in a few seconds."
            : rawText.slice(0, 150) || `Server returned HTTP status ${res.status}`
        );
      }

      const data = await res.json();
      if (data.success && data.image) {
        setScreenshotDataUrl(data.image);
        setIsFallbackScreenshot(Boolean(data.metadata?.isFallback));
        trackEvent("mockup_generated", { url: targetUrl });
      } else {
        alert(data.error || "Failed to render website screenshot.");
      }
    } catch (err: any) {
      console.error("Single render error:", err?.message || err);
      alert(err?.message || "Error connecting to screenshot rendering engine.");
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-generate default initial mockup on load
  useEffect(() => {
    handleGenerateSingleMockup("https://www.apple.com");
  }, []);

  // Handle Bulk Job Batch Creation
  const handleStartBulkJob = async (urls: string[], concurrency: number) => {
    setIsBulkLoading(true);
    trackEvent("bulk_job_started", { count: urls.length, concurrency });

    try {
      const res = await fetch("/api/bulk/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          urls,
          settings,
          concurrency,
        }),
      });

      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        const rawText = await res.text();
        throw new Error(
          res.status === 503
            ? "Service temporarily busy. Please retry."
            : rawText.slice(0, 150) || `Server returned HTTP status ${res.status}`
        );
      }

      const data = await res.json();
      if (data.success && data.batchId) {
        setActiveBatchId(data.batchId);
        setBulkJobs(data.batch.jobs);
        setIsBulkFinished(data.batch.isFinished);
      } else {
        alert(data.error || "Failed to initiate bulk job.");
      }
    } catch (err: any) {
      console.error("Bulk create error:", err?.message || err);
      alert(err?.message || "Error creating bulk job batch.");
    } finally {
      setIsBulkLoading(false);
    }
  };

  // Poll bulk status if active batch in progress
  useEffect(() => {
    if (!activeBatchId || isBulkFinished) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/bulk/status/${activeBatchId}`);
        const contentType = res.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) return;

        const data = await res.json();
        if (data.success && data.batch) {
          setBulkJobs(data.batch.jobs);
          setIsBulkFinished(data.batch.isFinished);
          if (data.batch.isFinished) {
            trackEvent("bulk_job_completed", { batchId: activeBatchId });
          }
        }
      } catch {
        // Silent poll error retry
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeBatchId, isBulkFinished]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      {/* Header */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenHelp={() => setIsHelpOpen(true)}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode((prev) => !prev)}
      />

      {/* Main Container Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {activeTab === "single" ? (
          /* Single URL Mode Layout */
          <div className="space-y-8">
            {/* Top URL Input Card */}
            <UrlInput
              onGenerate={(url, force) => handleGenerateSingleMockup(url, force)}
              isLoading={isLoading}
            />

            {/* Main Desktop Grid Layout: Preview (Left) + Customizer (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Mockup Preview Canvas (8 cols) */}
              <div className="lg:col-span-8 space-y-6">
                <MockupPreview
                  url={currentUrl}
                  screenshotDataUrl={screenshotDataUrl}
                  settings={settings}
                  isLoading={isLoading}
                  onRefreshScreenshot={() => handleGenerateSingleMockup(currentUrl, true)}
                  isFallbackScreenshot={isFallbackScreenshot}
                />
              </div>

              {/* Right Column: Settings Panel (4 cols) */}
              <div className="lg:col-span-4">
                <SettingsPanel settings={settings} onChange={handleSettingsChange} />
              </div>
            </div>
          </div>
        ) : (
          /* Bulk Generator Mode Layout */
          <div className="space-y-8">
            {/* Top Bulk Input */}
            <BulkUrlInput onStartBulkJob={handleStartBulkJob} isLoading={isBulkLoading} />

            {/* Bulk Settings & Job Progress */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-8 space-y-6">
                {bulkJobs.length > 0 ? (
                  <JobList
                    jobs={bulkJobs}
                    settings={settings}
                    isFinished={isBulkFinished}
                    batchId={activeBatchId || undefined}
                  />
                ) : (
                  <EmptyState onSelectSample={(url) => handleGenerateSingleMockup(url)} />
                )}
              </div>

              <div className="lg:col-span-4">
                <SettingsPanel settings={settings} onChange={handleSettingsChange} />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Help Modal */}
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
}
