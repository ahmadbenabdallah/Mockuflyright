import React from "react";
import {
  Sliders,
  Monitor,
  Smartphone,
  Tablet,
  Laptop,
  Palette,
  Maximize2,
  Sparkles,
  Layers,
  Moon,
  Cookie,
} from "lucide-react";
import { MockupSettings, BrowserType, ViewportPreset, ShadowType, FrameStyle } from "../types";

interface SettingsPanelProps {
  settings: MockupSettings;
  onChange: (newSettings: MockupSettings) => void;
}

const VIEWPORT_PRESETS = [
  { id: "desktop" as ViewportPreset, label: "Desktop", width: 1440, height: 900, icon: Monitor },
  { id: "laptop" as ViewportPreset, label: "Laptop", width: 1280, height: 800, icon: Laptop },
  { id: "tablet" as ViewportPreset, label: "Tablet", width: 1024, height: 1366, icon: Tablet },
  { id: "mobile" as ViewportPreset, label: "Mobile", width: 390, height: 844, icon: Smartphone },
];

const GRADIENT_PRESETS = [
  { id: "purple-glow", name: "Purple Glow", class: "from-indigo-500 to-purple-600" },
  { id: "sunset", name: "Sunset", class: "from-rose-500 to-amber-400" },
  { id: "ocean", name: "Ocean", class: "from-blue-600 to-indigo-800" },
  { id: "mint", name: "Mint", class: "from-emerald-500 to-teal-600" },
  { id: "dark-minimal", name: "Dark Minimal", class: "from-slate-800 to-slate-950" },
];

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ settings, onChange }) => {
  const updateSetting = <K extends keyof MockupSettings>(key: K, value: MockupSettings[K]) => {
    onChange({ ...settings, [key]: value });
  };

  const handleSelectPreset = (preset: ViewportPreset) => {
    const found = VIEWPORT_PRESETS.find((p) => p.id === preset);
    if (found) {
      onChange({
        ...settings,
        preset,
        viewportWidth: found.width,
        viewportHeight: found.height,
      });
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-2">
          <Sliders className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="font-bold text-slate-900 dark:text-white text-base">Mockup Settings</h3>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full">
          Live Customizer
        </span>
      </div>

      {/* 1. Browser Type */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
          Browser Chrome Style
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(["safari", "chrome", "firefox"] as BrowserType[]).map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => updateSetting("browser", b)}
              className={`py-2 px-3 text-xs font-semibold rounded-xl border capitalize transition-all ${
                settings.browser === b
                  ? "bg-indigo-50 dark:bg-indigo-950/80 border-indigo-500 text-indigo-700 dark:text-indigo-300 shadow-sm"
                  : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Viewport Device Presets */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
          Device Viewport
        </label>
        <div className="grid grid-cols-2 gap-2 mb-3">
          {VIEWPORT_PRESETS.map((vp) => {
            const Icon = vp.icon;
            const isSelected = settings.preset === vp.id;
            return (
              <button
                key={vp.id}
                type="button"
                onClick={() => handleSelectPreset(vp.id)}
                className={`p-2.5 flex items-center space-x-2.5 text-xs font-medium rounded-xl border text-left transition-all ${
                  isSelected
                    ? "bg-indigo-50 dark:bg-indigo-950/80 border-indigo-500 text-indigo-700 dark:text-indigo-300 shadow-sm"
                    : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <div className="min-w-0">
                  <div className="font-semibold">{vp.label}</div>
                  <div className="text-[10px] opacity-70">
                    {vp.width} × {vp.height}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Custom Width / Height Inputs */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 block mb-1">Width (px)</span>
            <input
              type="number"
              value={settings.viewportWidth}
              onChange={(e) =>
                onChange({
                  ...settings,
                  viewportWidth: Number(e.target.value) || 1440,
                  preset: "custom",
                })
              }
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block mb-1">Height (px)</span>
            <input
              type="number"
              value={settings.viewportHeight}
              onChange={(e) =>
                onChange({
                  ...settings,
                  viewportHeight: Number(e.target.value) || 900,
                  preset: "custom",
                })
              }
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* 3. Capture Mode & Quality Scale */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            Capture Mode
          </label>
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => updateSetting("captureMode", "viewport")}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                settings.captureMode === "viewport"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              Viewport
            </button>
            <button
              type="button"
              onClick={() => updateSetting("captureMode", "fullPage")}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                settings.captureMode === "fullPage"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              Full Page
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            Resolution Scale
          </label>
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            {[1, 2, 3].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => updateSetting("scale", s as 1 | 2 | 3)}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  settings.scale === s
                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Canvas Background & Transparency */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Canvas Background
          </label>
          <label className="flex items-center space-x-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.transparentBackground}
              onChange={(e) => updateSetting("transparentBackground", e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
              Transparent
            </span>
          </label>
        </div>

        {!settings.transparentBackground && (
          <div className="space-y-3">
            {/* Preset Gradients */}
            <div className="grid grid-cols-5 gap-1.5">
              {GRADIENT_PRESETS.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  title={g.name}
                  onClick={() =>
                    onChange({
                      ...settings,
                      isGradient: true,
                      backgroundGradient: g.id,
                    })
                  }
                  className={`h-8 rounded-lg bg-gradient-to-tr ${g.class} border-2 transition-transform hover:scale-105 ${
                    settings.isGradient && settings.backgroundGradient === g.id
                      ? "border-indigo-600 scale-105 ring-2 ring-indigo-500/30"
                      : "border-transparent"
                  }`}
                />
              ))}
            </div>

            {/* Solid Color Presets */}
            <div className="flex items-center space-x-2">
              {["#f3f4f6", "#ffffff", "#0f172a", "#1e293b", "#e0e7ff"].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() =>
                    onChange({
                      ...settings,
                      isGradient: false,
                      background: c,
                    })
                  }
                  style={{ backgroundColor: c }}
                  className={`w-7 h-7 rounded-full border border-slate-300 dark:border-slate-700 transition-transform ${
                    !settings.isGradient && settings.background === c ? "ring-2 ring-indigo-500 scale-110" : ""
                  }`}
                />
              ))}
              <input
                type="color"
                value={settings.background}
                onChange={(e) =>
                  onChange({
                    ...settings,
                    isGradient: false,
                    background: e.target.value,
                  })
                }
                className="w-7 h-7 rounded-full border-0 p-0 cursor-pointer overflow-hidden"
              />
            </div>
          </div>
        )}
      </div>

      {/* 5. Drop Shadow Strength */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
          Drop Shadow
        </label>
        <div className="grid grid-cols-4 gap-2">
          {(["none", "soft", "medium", "strong"] as ShadowType[]).map((sh) => (
            <button
              key={sh}
              type="button"
              onClick={() => updateSetting("shadow", sh)}
              className={`py-1.5 text-xs font-semibold rounded-xl border capitalize transition-all ${
                settings.shadow === sh
                  ? "bg-indigo-50 dark:bg-indigo-950/80 border-indigo-500 text-indigo-700 dark:text-indigo-300 shadow-sm"
                  : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
              }`}
            >
              {sh}
            </button>
          ))}
        </div>
      </div>

      {/* 6. Border Radius & Outer Padding Sliders */}
      <div className="space-y-4 pt-2">
        <div>
          <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            <span>Border Radius</span>
            <span>{settings.borderRadius}px</span>
          </div>
          <input
            type="range"
            min={0}
            max={40}
            value={settings.borderRadius}
            onChange={(e) => updateSetting("borderRadius", Number(e.target.value))}
            className="w-full accent-indigo-600"
          />
        </div>

        <div>
          <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            <span>Outer Canvas Padding</span>
            <span>{settings.padding}px</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={settings.padding}
            onChange={(e) => updateSetting("padding", Number(e.target.value))}
            className="w-full accent-indigo-600"
          />
        </div>
      </div>

      {/* 7. Cookie Banner & Browser Dark Mode Toggles */}
      <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
        <label className="flex items-center justify-between cursor-pointer">
          <div className="flex items-center space-x-2">
            <Cookie className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Dismiss Cookie Banners
            </span>
          </div>
          <input
            type="checkbox"
            checked={settings.dismissCookies}
            onChange={(e) => updateSetting("dismissCookies", e.target.checked)}
            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
        </label>

        <label className="flex items-center justify-between cursor-pointer">
          <div className="flex items-center space-x-2">
            <Moon className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Dark Browser Header
            </span>
          </div>
          <input
            type="checkbox"
            checked={settings.darkModeBrowser}
            onChange={(e) => updateSetting("darkModeBrowser", e.target.checked)}
            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
        </label>
      </div>
    </div>
  );
};
