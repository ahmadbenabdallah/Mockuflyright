/**
 * High-Resolution Browser Mockup Canvas Image Composer
 * Composes website screenshot + Safari/Chrome/Firefox browser chrome + shadow + background
 */
import { MockupSettings } from "../src/types";

export interface CompositionOptions {
  screenshotDataUrl: string;
  url: string;
  settings: MockupSettings;
}

/**
 * Draws rounded rectangle path on canvas context
 */
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.arcTo(x + width, y, x + width, y + radius, radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
  ctx.lineTo(x + radius, y + height);
  ctx.arcTo(x, y + height, x, y + height - radius, radius);
  ctx.lineTo(x, y + radius);
  ctx.arcTo(x, y, x + radius, y, radius);
  ctx.closePath();
}

/**
 * Parses URL for address bar display
 */
function formatDisplayUrl(rawUrl: string): { domain: string; path: string; protocol: string } {
  try {
    const parsed = new URL(rawUrl);
    return {
      domain: parsed.hostname,
      path: parsed.pathname + parsed.search,
      protocol: parsed.protocol,
    };
  } catch {
    return { domain: rawUrl, path: "", protocol: "https:" };
  }
}

/**
 * Main Browser Mockup Composer
 * Renders on a canvas and returns base64 PNG data URL or Blob
 */
export async function composeMockupImage(options: CompositionOptions): Promise<string> {
  const { screenshotDataUrl, url, settings } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const scale = settings.scale || 1;
        const padding = (settings.padding || 32) * scale;
        const borderRadius = (settings.borderRadius || 12) * scale;

        // Frame header height based on style
        let headerHeight = 44 * scale;
        if (settings.frameStyle === "compact") headerHeight = 36 * scale;
        if (settings.frameStyle === "large") headerHeight = 52 * scale;

        const webWidth = img.width;
        const webHeight = img.height;

        const windowWidth = webWidth;
        const windowHeight = webHeight + headerHeight;

        // Total canvas size including background padding
        const canvasWidth = windowWidth + padding * 2;
        const canvasHeight = windowHeight + padding * 2;

        const canvas = document.createElement("canvas");
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas 2D context not available"));
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        // 1. Draw Background
        if (!settings.transparentBackground) {
          if (settings.isGradient && settings.backgroundGradient) {
            const grad = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
            if (settings.backgroundGradient === "sunset") {
              grad.addColorStop(0, "#ff7e5f");
              grad.addColorStop(1, "#feb47b");
            } else if (settings.backgroundGradient === "ocean") {
              grad.addColorStop(0, "#2b5876");
              grad.addColorStop(1, "#4e4376");
            } else if (settings.backgroundGradient === "purple-glow") {
              grad.addColorStop(0, "#667eea");
              grad.addColorStop(1, "#764ba2");
            } else if (settings.backgroundGradient === "mint") {
              grad.addColorStop(0, "#0ba360");
              grad.addColorStop(1, "#3cba92");
            } else if (settings.backgroundGradient === "dark-minimal") {
              grad.addColorStop(0, "#1f2937");
              grad.addColorStop(1, "#111827");
            } else {
              grad.addColorStop(0, "#6366f1");
              grad.addColorStop(1, "#a855f7");
            }
            ctx.fillStyle = grad;
          } else {
            ctx.fillStyle = settings.background || "#f3f4f6";
          }
          ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        }

        // Window coordinates
        const winX = padding;
        const winY = padding;

        // 2. Draw Drop Shadow
        if (settings.shadow && settings.shadow !== "none") {
          ctx.save();
          let shadowBlur = 24 * scale;
          let shadowOffsetY = 12 * scale;
          let shadowAlpha = 0.15;

          if (settings.shadow === "soft") {
            shadowBlur = 16 * scale;
            shadowOffsetY = 8 * scale;
            shadowAlpha = 0.10;
          } else if (settings.shadow === "medium") {
            shadowBlur = 32 * scale;
            shadowOffsetY = 16 * scale;
            shadowAlpha = 0.20;
          } else if (settings.shadow === "strong") {
            shadowBlur = 48 * scale;
            shadowOffsetY = 24 * scale;
            shadowAlpha = 0.32;
          }

          ctx.shadowColor = `rgba(0, 0, 0, ${shadowAlpha})`;
          ctx.shadowBlur = shadowBlur;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = shadowOffsetY;

          // Fill window shape for shadow cast
          drawRoundedRect(ctx, winX, winY, windowWidth, windowHeight, borderRadius);
          ctx.fillStyle = "#ffffff";
          ctx.fill();
          ctx.restore();
        }

        // 3. Draw Browser Window Container
        ctx.save();
        drawRoundedRect(ctx, winX, winY, windowWidth, windowHeight, borderRadius);
        ctx.clip();

        // Browser Header background
        const isDarkTheme = settings.darkModeBrowser;
        const headerBgColor = isDarkTheme
          ? "#1e1e24"
          : settings.browser === "safari"
          ? "#f6f6f7"
          : "#e8eaed";
        
        ctx.fillStyle = headerBgColor;
        ctx.fillRect(winX, winY, windowWidth, headerHeight);

        // Header bottom divider border
        ctx.strokeStyle = isDarkTheme ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)";
        ctx.lineWidth = 1 * scale;
        ctx.beginPath();
        ctx.moveTo(winX, winY + headerHeight);
        ctx.lineTo(winX + windowWidth, winY + headerHeight);
        ctx.stroke();

        // Traffic Light buttons (Safari / Mac Style)
        const dotRadius = 6 * scale;
        const dotY = winY + headerHeight / 2;
        const dotStartX = winX + 18 * scale;
        const dotSpacing = 18 * scale;

        // Red
        ctx.beginPath();
        ctx.arc(dotStartX, dotY, dotRadius, 0, Math.PI * 2);
        ctx.fillStyle = "#ff5f56";
        ctx.fill();

        // Yellow
        ctx.beginPath();
        ctx.arc(dotStartX + dotSpacing, dotY, dotRadius, 0, Math.PI * 2);
        ctx.fillStyle = "#ffbd2e";
        ctx.fill();

        // Green
        ctx.beginPath();
        ctx.arc(dotStartX + dotSpacing * 2, dotY, dotRadius, 0, Math.PI * 2);
        ctx.fillStyle = "#27c93f";
        ctx.fill();

        // Address bar calculation
        const addressBarWidth = Math.min(windowWidth * 0.55, 520 * scale);
        const addressBarHeight = Math.max(headerHeight - 16 * scale, 24 * scale);
        const addressBarX = winX + (windowWidth - addressBarWidth) / 2;
        const addressBarY = winY + (headerHeight - addressBarHeight) / 2;
        const addressBarRadius = (settings.browser === "safari" ? 8 : 16) * scale;

        // Draw Address Bar Background
        ctx.save();
        drawRoundedRect(ctx, addressBarX, addressBarY, addressBarWidth, addressBarHeight, addressBarRadius);
        ctx.fillStyle = isDarkTheme
          ? "#2a2a32"
          : settings.browser === "safari"
          ? "#e8e8ed"
          : "#ffffff";
        ctx.fill();

        // Address Bar Border
        ctx.strokeStyle = isDarkTheme ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
        ctx.lineWidth = 1 * scale;
        ctx.stroke();

        // Lock icon + Format URL text
        const urlInfo = formatDisplayUrl(url);
        ctx.font = `${Math.round(12 * scale)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const addressTextY = addressBarY + addressBarHeight / 2;

        // Lock icon symbol (safari SSL indicator)
        ctx.fillStyle = isDarkTheme ? "#9ca3af" : "#6b7280";
        ctx.fillText(`🔒  ${urlInfo.domain}${urlInfo.path}`, addressBarX + addressBarWidth / 2, addressTextY);

        ctx.restore();

        // Navigation controls (Back / Forward arrows on left of address bar if space permits)
        if (addressBarX - (dotStartX + dotSpacing * 3) > 60 * scale) {
          ctx.save();
          ctx.font = `${Math.round(14 * scale)}px sans-serif`;
          ctx.fillStyle = isDarkTheme ? "#6b7280" : "#9ca3af";
          ctx.fillText("‹  ›", dotStartX + dotSpacing * 3.2, addressTextY);
          ctx.restore();
        }

        // 4. Draw Website Screenshot below Chrome Header
        const webY = winY + headerHeight;
        ctx.drawImage(img, 0, 0, img.width, img.height, winX, webY, webWidth, webHeight);

        // 5. Draw subtle outer border around whole browser frame
        drawRoundedRect(ctx, winX, winY, windowWidth, windowHeight, borderRadius);
        ctx.strokeStyle = isDarkTheme ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.12)";
        ctx.lineWidth = 1 * scale;
        ctx.stroke();

        ctx.restore();

        // Export data URL
        const dataUrl = canvas.toDataURL("image/png", 1.0);
        resolve(dataUrl);
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = (err) => {
      reject(new Error("Failed to load website screenshot image into canvas"));
    };

    img.src = screenshotDataUrl;
  });
}
