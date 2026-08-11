import React from "react";
import { X, HelpCircle, Shield, Layers, Monitor, Download, FileText } from "lucide-react";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/80 rounded-xl text-indigo-600 dark:text-indigo-400">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">User Guide & Help</h3>
              <p className="text-xs text-slate-500">Everything you need to know about Mockupify</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sections */}
        <div className="space-y-5 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white flex items-center space-x-2 mb-1">
              <Monitor className="w-4 h-4 text-indigo-500" />
              <span>Single URL Mode</span>
            </h4>
            <p className="leading-relaxed">
              Enter any website address (e.g. <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">https://apple.com</code>).
              Our server-side headless browser renders the site, mounts realistic Safari or Chrome window chrome, applies your canvas background, drop shadow, and padding, and lets you download a high-resolution PNG.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 dark:text-white flex items-center space-x-2 mb-1">
              <Layers className="w-4 h-4 text-indigo-500" />
              <span>Bulk Generator & File Uploads</span>
            </h4>
            <p className="leading-relaxed">
              Switch to <strong>Bulk Generator</strong> to paste a list of URLs or drag & drop a <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">.csv</code> or <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">.txt</code> file.
              All URLs are processed concurrently with automatic duplicate filtering. Once complete, click <strong>Download ZIP</strong> to save all rendered PNGs and a <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">results.csv</code> log file.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 dark:text-white flex items-center space-x-2 mb-1">
              <Shield className="w-4 h-4 text-indigo-500" />
              <span>Security & Iframe Protections</span>
            </h4>
            <p className="leading-relaxed">
              Many modern websites block iframe embedding using <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">X-Frame-Options</code> or Content-Security-Policy headers.
              Mockupify routes requests through an isolated server-side rendering pipeline with SSRF protections that block private IP ranges and internal network endpoints.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all"
          >
            Got it, thanks!
          </button>
        </div>
      </div>
    </div>
  );
};
