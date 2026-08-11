export type BrowserType = "safari" | "chrome" | "firefox";

export type CaptureMode = "viewport" | "fullPage";

export type ExportScale = 1 | 2 | 3;

export type ShadowType = "none" | "soft" | "medium" | "strong";

export type FrameStyle = "compact" | "standard" | "large";

export type ViewportPreset = "desktop" | "laptop" | "tablet" | "mobile" | "custom";

export interface ViewportConfig {
  label: string;
  width: number;
  height: number;
  preset: ViewportPreset;
}

export interface MockupSettings {
  browser: BrowserType;
  viewportWidth: number;
  viewportHeight: number;
  preset: ViewportPreset;
  captureMode: CaptureMode;
  scale: ExportScale;
  background: string;
  backgroundGradient: string;
  isGradient: boolean;
  transparentBackground: boolean;
  padding: number;
  borderRadius: number;
  shadow: ShadowType;
  frameStyle: FrameStyle;
  dismissCookies: boolean;
  darkModeBrowser: boolean;
}

export type JobStatus = 
  | "Waiting"
  | "Validating"
  | "Rendering"
  | "Capturing"
  | "Processing"
  | "Complete"
  | "Failed";

export interface BulkJob {
  id: string;
  url: string;
  normalizedUrl: string;
  status: JobStatus;
  progress: number;
  screenshotUrl?: string;
  error?: string;
  timestamp: number;
  durationMs?: number;
  filename?: string;
}

export interface RenderRequest {
  url: string;
  viewportWidth?: number;
  viewportHeight?: number;
  fullPage?: boolean;
  deviceScaleFactor?: number;
  dismissCookies?: boolean;
  forceRefresh?: boolean;
}

export interface RenderResponse {
  success: boolean;
  image?: string;
  metadata?: {
    url: string;
    normalizedUrl: string;
    width: number;
    height: number;
    fullPage: boolean;
    deviceScaleFactor: number;
    renderedAt: string;
    isFallback?: boolean;
  };
  error?: string;
}

export interface BulkJobRequest {
  urls: string[];
  settings: MockupSettings;
  concurrency?: number;
}

export interface BulkJobResult {
  jobId: string;
  jobs: BulkJob[];
  completedCount: number;
  totalCount: number;
  isFinished: boolean;
}

export interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
}
