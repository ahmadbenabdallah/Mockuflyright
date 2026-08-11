/**
 * LocalStorage Settings Persistence
 */
import { MockupSettings } from "../types";

const SETTINGS_KEY = "mockupify_user_settings_v1";

export const DEFAULT_SETTINGS: MockupSettings = {
  browser: "safari",
  viewportWidth: 1440,
  viewportHeight: 900,
  preset: "desktop",
  captureMode: "viewport",
  scale: 2, // Default 2x high retina
  background: "#f3f4f6",
  backgroundGradient: "purple-glow",
  isGradient: true,
  transparentBackground: false,
  padding: 40,
  borderRadius: 12,
  shadow: "medium",
  frameStyle: "standard",
  dismissCookies: true,
  darkModeBrowser: false,
};

export function loadSavedSettings(): MockupSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch {
    // Ignore storage errors
  }
  return DEFAULT_SETTINGS;
}

export function saveUserSettings(settings: MockupSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage errors
  }
}
