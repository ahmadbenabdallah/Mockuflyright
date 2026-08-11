/**
 * Server-Side Website Screenshot Rendering Engine
 * Uses Playwright with smart fallback capture capability
 */
import { chromium } from "patchright";
import type { Browser } from "patchright";
import { validateUrl } from "./urlValidator";
import { generateCacheKey, getCachedScreenshot, setCachedScreenshot, invalidateCacheKey } from "./cache";
import { RenderRequest, RenderResponse } from "../src/types";

let globalBrowser: Browser | null = null;

/**
 * Common cookie banner button text patterns for auto-dismissal (multilingual)
 */
const COOKIE_BUTTON_TEXTS = [
  "Accept",
  "Accept all",
  "Allow all",
  "I agree",
  "Got it",
  "Accept Cookies",
  "Allow cookies",
  "Agree",
  "Consent",
  "OK",
  "Dismiss",
  // French
  "Accepter",
  "Tout accepter",
  "Accepter tout",
  "J'accepte",
  "Autoriser",
  "Accepter les cookies",
  // Spanish
  "Aceptar",
  "Aceptar todo",
  "Acepto",
  "Permitir todas",
  // German
  "Alle akzeptieren",
  "Akzeptieren",
  "Zustimmen",
  // Italian
  "Accetta",
  "Accetta tutti",
  "Accetto",
];

/**
 * Initializes shared browser instance safely
 */
async function getBrowserInstance(): Promise<Browser | null> {
  if (globalBrowser) {
    if (globalBrowser.isConnected()) {
      return globalBrowser;
    }
    globalBrowser = null;
  }

  try {
    globalBrowser = await chromium.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-blink-features=AutomationControlled",
        "--no-first-run",
        "--no-zygote",
      ],
    });
    console.log("Patchright Chromium browser instance initialized successfully.");
    return globalBrowser;
  } catch (err) {
    console.warn("Playwright browser launch failed. Will use fallback renderer.", err);
    globalBrowser = null;
    return null;
  }
}

/**
 * Attempts auto-dismissal of cookie consent banners and suppresses cookie overlays
 */
async function attemptCookieDismissal(page: any): Promise<void> {
  // 1. Inject CSS rules to immediately suppress floating cookie consent banners & modals
  try {
    await page.addStyleTag({
      content: `
        .cky-consent-container, #cookieyes-banner, #onetrust-banner-sdk, 
        .cookie-banner, .cookie-consent, #cookie-law-info-bar, 
        [id*="cookie-banner"], [class*="cookie-banner"], [id*="cookie-consent"],
        [class*="cookie-consent"], [class*="cky-modal"], [id*="gdpr"], [class*="gdpr"],
        .qc-cmp2-container, #cybotcookiebotdialog {
          display: none !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }
      `,
    }).catch(() => {});
  } catch {
    // Non-blocking
  }

  // 2. Only click actual <button> or button-like elements, strictly avoiding <a> links with hrefs that cause navigation
  try {
    const initialUrl = page.url();

    // Fast check for common consent button selectors first
    const specificButtons = [
      ".cky-btn-accept",
      "#onetrust-accept-btn-handler",
      "#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll",
      ".accept-cookies-button",
    ];

    for (const sel of specificButtons) {
      const btn = page.locator(sel).first();
      if (await btn.isVisible({ timeout: 200 }).catch(() => false)) {
        await btn.click({ timeout: 600 }).catch(() => {});
        await page.waitForTimeout(300);
        return;
      }
    }

    for (const text of COOKIE_BUTTON_TEXTS) {
      // Strictly target <button>, [role="button"], or .btn elements to prevent <a> tag link redirects
      const btnLocators = [
        page.locator(`button:has-text("${text}")`),
        page.locator(`[role="button"]:has-text("${text}")`),
        page.locator(`input[type="button"][value*="${text}"]`),
        page.locator(`input[type="submit"][value*="${text}"]`),
      ];

      let clicked = false;
      for (const loc of btnLocators) {
        const btn = loc.first();
        if (await btn.isVisible({ timeout: 200 }).catch(() => false)) {
          const href = await btn.getAttribute("href").catch(() => null);
          if (href && (href.includes("/cookie") || href.includes("policy") || href.includes("privacy") || href.startsWith("http"))) {
            continue; // Skip links pointing to cookie policies
          }
          await btn.click({ timeout: 600 }).catch(() => {});
          await page.waitForTimeout(300);
          clicked = true;
          break;
        }
      }

      // Safeguard: if clicking navigated us to a different URL (like a cookie policy page), go back
      if (page.url() !== initialUrl && !page.url().startsWith(initialUrl)) {
        console.warn(`Cookie dismissal navigated away from ${initialUrl} to ${page.url()}, returning to original page.`);
        await page.goto(initialUrl, { waitUntil: "domcontentloaded", timeout: 10000 }).catch(() => {});
        break;
      }

      if (clicked) break;
    }
  } catch {
    // Non-blocking
  }
}

/**
 * Progressive scrolling & aggressive hydration for lazy loaded images, sliders, and Web Components
 */
async function forceFullPageHydration(page: any, maxHeight: number = 6000): Promise<void> {
  try {
    // 1. Force lazy attributes to eager src/srcset and trigger carousel/slider scripts
    await page.evaluate(() => {
      // Force img lazy loading to eager
      const images = Array.from(document.querySelectorAll("img, iframe, picture, source"));
      images.forEach((el: any) => {
        el.removeAttribute("loading");
        el.setAttribute("loading", "eager");

        // Copy data attributes to actual src/srcset
        const srcAttr =
          el.getAttribute("data-src") ||
          el.getAttribute("data-lazy-src") ||
          el.getAttribute("data-original") ||
          el.getAttribute("data-lazy") ||
          el.getAttribute("data-url") ||
          el.getAttribute("data-full-url");
        if (srcAttr && !el.src) {
          el.src = srcAttr;
        }

        const srcsetAttr =
          el.getAttribute("data-srcset") || el.getAttribute("data-lazy-srcset");
        if (srcsetAttr && !el.srcset) {
          el.srcset = srcsetAttr;
        }
      });

      // Force background images
      const bgElements = Array.from(document.querySelectorAll("[data-bg], [data-background], [data-bg-src]"));
      bgElements.forEach((el: any) => {
        const bg = el.getAttribute("data-bg") || el.getAttribute("data-background") || el.getAttribute("data-bg-src");
        if (bg && !el.style.backgroundImage) {
          el.style.backgroundImage = `url("${bg}")`;
        }
      });

      // Dispatch global resize & scroll events to activate IntersectionObserver / Swiper / Slick / Carousel sliders
      window.dispatchEvent(new Event("resize"));
      window.dispatchEvent(new Event("scroll"));
    }).catch(() => {});

    // 2. Smooth step scroll down to bottom and back up to trigger IntersectionObservers
    await page.evaluate(async (maxH: number) => {
      await new Promise<void>((resolve) => {
        let totalHeight = 0;
        const distance = 350;
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;

          if (totalHeight >= scrollHeight || totalHeight >= maxH) {
            clearInterval(timer);
            window.scrollTo(0, 0); // Return to top
            resolve();
          }
        }, 120);
      });
    }, maxHeight).catch(() => {});

    // 3. Wait for image elements to report complete status
    await page.evaluate(async () => {
      const imgs = Array.from(document.querySelectorAll("img"));
      const promises = imgs.map((img) => {
        if (img.complete) return Promise.resolve();
        return new Promise((res) => {
          img.onload = res;
          img.onerror = res;
          setTimeout(res, 1200); // 1.2s timeout per image
        });
      });
      await Promise.all(promises);
    }).catch(() => {});

    await page.waitForTimeout(1000);
  } catch {
    // Non-blocking
  }
}

/**
 * Detects and interacts with Cloudflare Turnstile widgets / security challenges using stealth interactions
 */
async function attemptTurnstileSolve(page: any): Promise<boolean> {
  try {
    // Simulate natural human cursor movement
    await page.mouse.move(120 + Math.random() * 200, 180 + Math.random() * 150).catch(() => {});
    await page.waitForTimeout(300);

    // Scan page frames for Cloudflare Turnstile / Challenge widget
    const frames = page.frames();
    const turnstileFrame = frames.find((f: any) => {
      const u = f.url() || "";
      return u.includes("challenges.cloudflare.com") || u.includes("turnstile");
    });

    if (turnstileFrame) {
      console.log("Cloudflare Turnstile widget detected. Performing stealth interaction...");
      const target = turnstileFrame
        .locator('input[type="checkbox"], .cb-i, span.mark, #challenge-stage, .ctp-checkbox-label')
        .first();

      if (await target.isVisible({ timeout: 1500 }).catch(() => false)) {
        await target.click({ timeout: 2000 }).catch(() => {});
      } else {
        // Fallback: Click center of the Turnstile iframe bounding box
        const frameEl = await page.$('iframe[src*="challenges.cloudflare.com"]').catch(() => null);
        if (frameEl) {
          const box = await frameEl.boundingBox().catch(() => null);
          if (box) {
            await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2).catch(() => {});
          }
        }
      }

      // Wait for challenge validation / redirect
      for (let i = 0; i < 12; i++) {
        await page.waitForTimeout(500);
        const title = (await page.title().catch(() => "")) || "";
        const html = (await page.content().catch(() => "")) || "";
        const isStillChallenged =
          title.includes("Just a moment") ||
          title.includes("Un instant") ||
          title.includes("Attention Required") ||
          html.includes("cf-challenge");

        if (!isStillChallenged) {
          console.log("Turnstile security challenge successfully passed in Playwright!");
          return true;
        }
      }
    }
  } catch (err) {
    console.warn("Turnstile stealth solver attempt completed:", err);
  }
  return false;
}

/**
 * Fetches screenshot via urlscan.io public API for sites protected by Cloudflare / anti-bot challenges.
 * Filters out stale historical scans older than maxAgeMs (14 days, or 2 days on force refresh).
 */
async function fetchUrlscanScreenshot(url: string, forceRefresh: boolean = false): Promise<string | null> {
  try {
    let domain = "";
    try {
      domain = new URL(url).hostname.replace(/^www\./, "");
    } catch {
      domain = url;
    }

    const searchUrl = `https://urlscan.io/api/v1/search/?q=domain:${encodeURIComponent(domain)}&size=10`;
    const res = await fetch(searchUrl, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;

    const json: any = await res.json();
    const results: any[] = json.results || [];

    // Sort by task time descending (latest scans first)
    results.sort((a, b) => {
      const timeA = new Date(a.task?.time || a.time || 0).getTime();
      const timeB = new Date(b.task?.time || b.time || 0).getTime();
      return timeB - timeA;
    });

    const now = Date.now();
    // Maximum allowable age for historical scans (14 days default, 2 days on force refresh)
    const maxAgeMs = forceRefresh ? 2 * 24 * 60 * 60 * 1000 : 14 * 24 * 60 * 60 * 1000;

    for (const r of results) {
      const scanTime = new Date(r.task?.time || r.time || 0).getTime();
      if (scanTime > 0 && now - scanTime > maxAgeMs) {
        // Skip stale scans exceeding age limit
        continue;
      }

      if (
        r.screenshot &&
        (r.task?.domain?.includes(domain) ||
          r.task?.url?.includes(domain) ||
          r.page?.domain?.includes(domain))
      ) {
        const imgRes = await fetch(r.screenshot);
        if (!imgRes.ok) continue;

        const arrayBuffer = await imgRes.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        if (buffer.length > 15000) {
          return "data:image/png;base64," + buffer.toString("base64");
        }
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Fetches screenshot via thum.io service as a proxy capture provider with refresh parameter
 */
async function fetchThumScreenshot(url: string, width: number, height: number): Promise<string | null> {
  try {
    const thumUrl = `https://image.thum.io/get/refresh/width/${width}/crop/${height}/${encodeURIComponent(url)}`;
    const res = await fetch(thumUrl);
    if (!res.ok) return null;

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("image")) return null;

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Filter out tiny placeholder images (< 10KB)
    if (buffer.length < 10000) return null;

    const mime = contentType.split(";")[0] || "image/png";
    return `data:${mime};base64,` + buffer.toString("base64");
  } catch {
    return null;
  }
}

/**
 * Fetches screenshot via s-shot.ru as a secondary proxy capture provider
 */
async function fetchSshotScreenshot(url: string, width: number, height: number): Promise<string | null> {
  try {
    const sshotUrl = `https://mini.s-shot.ru/${width}x${height}/JPEG/${width}/?${encodeURIComponent(url)}`;
    const res = await fetch(sshotUrl);
    if (!res.ok) return null;

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("image")) return null;

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length < 10000) return null;

    return "data:image/jpeg;base64," + buffer.toString("base64");
  } catch {
    return null;
  }
}

/**
 * Fetches screenshot via Automattic mshots service as a proxy renderer for Cloudflare protected sites
 */
async function fetchMshotsScreenshot(url: string, width: number, height: number): Promise<string | null> {
  try {
    const mshotsUrl = `https://s0.wp.com/mshots/v1/${encodeURIComponent(url)}?w=${width}&h=${height}`;
    
    // Trigger initial generation
    await fetch(mshotsUrl).catch(() => {});
    await new Promise((resolve) => setTimeout(resolve, 2500));
    
    // Fetch generated screenshot
    const res = await fetch(mshotsUrl);
    if (!res.ok) return null;
    
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("image")) return null;
    
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Ignore small placeholder images (< 10KB)
    if (buffer.length < 10000) return null;
    
    const mime = contentType.split(";")[0] || "image/jpeg";
    return `data:${mime};base64,` + buffer.toString("base64");
  } catch {
    return null;
  }
}

/**
 * Renders an fallback preview image when browser automation binary isn't available
 * Generates an SVG / HTML data URI screenshot placeholder representing the website
 */
function generateFallbackScreenshot(
  url: string,
  width: number,
  height: number,
  fullPage: boolean
): string {
  let hostname = "Website";
  try {
    hostname = new URL(url).hostname;
  } catch {
    hostname = url;
  }

  const captureH = fullPage ? height * 1.8 : height;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${captureH}" viewBox="0 0 ${width} ${captureH}">
    <rect width="100%" height="100%" fill="#ffffff" />
    <!-- Gradient Top Hero -->
    <defs>
      <linearGradient id="heroGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#4f46e5" />
        <stop offset="100%" stop-color="#7c3aed" />
      </linearGradient>
    </defs>
    
    <!-- Hero Section -->
    <rect x="0" y="0" width="${width}" height="320" fill="url(#heroGrad)" />
    
    <!-- Hero Navigation Bar -->
    <rect x="40" y="24" width="120" height="28" rx="6" fill="#ffffff" fill-opacity="0.2" />
    <rect x="${width - 240}" y="28" width="60" height="20" rx="4" fill="#ffffff" fill-opacity="0.8" />
    <rect x="${width - 160}" y="28" width="60" height="20" rx="4" fill="#ffffff" fill-opacity="0.8" />
    <rect x="${width - 80}" y="24" width="50" height="28" rx="6" fill="#ffffff" />
    
    <!-- Hero Content -->
    <text x="60" y="140" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="36" font-weight="bold" fill="#ffffff">${hostname}</text>
    <text x="60" y="180" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="18" fill="#e0e7ff">Welcome to ${hostname}. Clean, modern digital experiences.</text>
    <rect x="60" y="210" width="140" height="42" rx="8" fill="#ffffff" />
    <text x="130" y="236" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="14" font-weight="600" fill="#4f46e5" text-anchor="middle">Explore Features</text>

    <!-- Main Content Cards Grid -->
    <rect x="60" y="380" width="${(width - 160) / 3}" height="180" rx="12" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1" />
    <rect x="${60 + (width - 160) / 3 + 20}" y="380" width="${(width - 160) / 3}" height="180" rx="12" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1" />
    <rect x="${60 + ((width - 160) / 3) * 2 + 40}" y="380" width="${(width - 160) / 3}" height="180" rx="12" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1" />
    
    <!-- Feature Headlines -->
    <rect x="80" y="410" width="100" height="16" rx="4" fill="#6366f1" />
    <rect x="80" y="440" width="160" height="12" rx="3" fill="#cbd5e1" />
    <rect x="80" y="460" width="130" height="12" rx="3" fill="#cbd5e1" />

    <rect x="${80 + (width - 160) / 3 + 20}" y="410" width="100" height="16" rx="4" fill="#3b82f6" />
    <rect x="${80 + (width - 160) / 3 + 20}" y="440" width="160" height="12" rx="3" fill="#cbd5e1" />
    <rect x="${80 + (width - 160) / 3 + 20}" y="460" width="130" height="12" rx="3" fill="#cbd5e1" />

    <rect x="${80 + ((width - 160) / 3) * 2 + 40}" y="410" width="100" height="16" rx="4" fill="#10b981" />
    <rect x="${80 + ((width - 160) / 3) * 2 + 40}" y="440" width="160" height="12" rx="3" fill="#cbd5e1" />
    <rect x="${80 + ((width - 160) / 3) * 2 + 40}" y="460" width="130" height="12" rx="3" fill="#cbd5e1" />

    ${
      fullPage
        ? `
      <!-- Additional Full Page Content Block -->
      <rect x="60" y="600" width="${width - 120}" height="240" rx="16" fill="#f1f5f9" />
      <text x="${width / 2}" y="680" font-family="sans-serif" font-size="24" font-weight="bold" fill="#334155" text-anchor="middle">Full Page Capture Preview</text>
      <text x="${width / 2}" y="710" font-family="sans-serif" font-size="14" fill="#64748b" text-anchor="middle">Rendering complete height for ${url}</text>
    `
        : ""
    }
  </svg>`;

  return "data:image/svg+xml;base64," + Buffer.from(svg).toString("base64");
}

/**
 * Renders website screenshot with caching, SSRF validation, and timeouts
 */
export async function renderWebsiteScreenshot(req: RenderRequest): Promise<RenderResponse> {
  // 1. SSRF and URL validation
  const validation = validateUrl(req.url);
  if (!validation.isValid) {
    return {
      success: false,
      error: validation.error || "Invalid website URL",
    };
  }

  const url = validation.normalizedUrl;
  const width = req.viewportWidth || 1440;
  const height = req.viewportHeight || 900;
  const fullPage = Boolean(req.fullPage);
  const scale = req.deviceScaleFactor || 2;
  const dismissCookies = req.dismissCookies !== false;

  // 2. Check Cache
  const cacheKey = generateCacheKey(url, width, height, fullPage, scale);
  if (req.forceRefresh) {
    invalidateCacheKey(cacheKey);
  } else {
    const cached = getCachedScreenshot(cacheKey);
    if (cached) {
      return {
        success: true,
        image: cached.image,
        metadata: cached.metadata,
      };
    }
  }

  // 3. Attempt Playwright Browser Screenshot
  const browser = await getBrowserInstance();

  if (browser) {
    let context = null;
    let page = null;
    try {
      context = await browser.newContext({
        viewport: { width, height },
        deviceScaleFactor: scale,
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        locale: "en-US",
        extraHTTPHeaders: {
          "Accept-Language": "en-US,en;q=0.9",
          "Sec-Ch-Ua": '"Chromium";v="125", "Google Chrome";v="125", "Not-A.Brand";v="99"',
          "Sec-Ch-Ua-Mobile": "?0",
          "Sec-Ch-Ua-Platform": '"Windows"',
        },
        ignoreHTTPSErrors: true,
      });

      page = await context.newPage();

      // Set timeout (convert seconds to ms if < 1000, e.g. RENDER_TIMEOUT=90 => 90000ms)
      let parsedTimeout = Number(process.env.RENDER_TIMEOUT) || 30000;
      if (parsedTimeout < 1000) {
        parsedTimeout = parsedTimeout * 1000;
      }
      const timeoutMs = Math.max(parsedTimeout, 15000);
      page.setDefaultTimeout(timeoutMs);

      // Navigate with smart fallback wait strategy
      try {
        await page.goto(url, {
          waitUntil: "load",
          timeout: timeoutMs,
        });
      } catch {
        // Fallback to DOMContentLoaded if 'load' event times out due to persistent background streams
        await page.goto(url, {
          waitUntil: "domcontentloaded",
          timeout: timeoutMs,
        }).catch(() => {});
      }

      // Wait for network idle or quick stabilization for JS hydration & animations
      await page.waitForLoadState("networkidle", { timeout: 3000 }).catch(() => {});

      // Wait for web fonts
      await page.evaluate(() => document.fonts.ready).catch(() => {});

      // Trigger scroll event to wake up IntersectionObservers / scroll-based fade-in animations
      await page.evaluate(() => {
        window.scrollBy(0, 100);
        window.scrollTo(0, 0);
      }).catch(() => {});

      await page.waitForTimeout(600);

      if (dismissCookies) {
        await attemptCookieDismissal(page);
      }

      // Perform full page hydration for lazy images, sliders, fonts, and Web Components
      await forceFullPageHydration(page, fullPage ? 10000 : 5000);

      // Check if caught in a Cloudflare / Bot Verification challenge screen
      let pageTitle = (await page.title().catch(() => "")) || "";
      let pageHtml = (await page.content().catch(() => "")) || "";
      let bodyTextLength = (await page.evaluate(() => document.body?.innerText?.trim().length || 0).catch(() => 0));

      const challengeTitles = [
        "Just a moment",
        "Un instant",
        "Attention Required",
        "Security Verification",
        "Checking your browser",
        "Verify you are human",
        "DDOS-GUARD",
      ];

      const isChallengeTitle = challengeTitles.some((t) => pageTitle.toLowerCase().includes(t.toLowerCase()));
      const hasChallengeContainer =
        pageHtml.includes("id=\"challenge-stage\"") ||
        pageHtml.includes("id=\"cf-challenge-running\"") ||
        pageHtml.includes("class=\"cf-browser-verification\"");

      // Only flag as a blocking Cloudflare challenge if the title indicates a challenge or an active challenge stage exists with minimal page content
      let isCloudflareChallenge = isChallengeTitle || (hasChallengeContainer && bodyTextLength < 400);

      if (isCloudflareChallenge) {
        console.warn(`Cloudflare Interstitial Challenge detected on ${url} (Title: "${pageTitle}"). Executing stealth solver...`);
        const solvedInPlaywright = await attemptTurnstileSolve(page);

        if (solvedInPlaywright) {
          // Re-hydrate page if challenge was bypassed
          await page.waitForTimeout(1000);
          await forceFullPageHydration(page, fullPage ? 10000 : 5000);
          pageTitle = (await page.title().catch(() => "")) || "";
          pageHtml = (await page.content().catch(() => "")) || "";
          bodyTextLength = (await page.evaluate(() => document.body?.innerText?.trim().length || 0).catch(() => 0));

          const stillChallengeTitle = challengeTitles.some((t) => pageTitle.toLowerCase().includes(t.toLowerCase()));
          isCloudflareChallenge = stillChallengeTitle || (hasChallengeContainer && bodyTextLength < 400);
        }
      }

      if (isCloudflareChallenge) {
        console.warn(`Cloudflare Protection challenge persistent on ${url}. Attempting multi-provider live proxy capture...`);
        
        // 1. Try real-time s-shot service (renders live page)
        const sshotImage = await fetchSshotScreenshot(url, width, height);
        if (sshotImage) {
          const metadata = {
            url,
            normalizedUrl: url,
            width,
            height,
            fullPage,
            deviceScaleFactor: scale,
            renderedAt: new Date().toISOString(),
            isCloudflareBypassed: true,
            provider: "s-shot",
          };
          setCachedScreenshot(cacheKey, sshotImage, metadata);
          return {
            success: true,
            image: sshotImage,
            metadata,
          };
        }

        // 2. Try WordPress mshots service (renders live page)
        const mshotsImage = await fetchMshotsScreenshot(url, width, height);
        if (mshotsImage) {
          const metadata = {
            url,
            normalizedUrl: url,
            width,
            height,
            fullPage,
            deviceScaleFactor: scale,
            renderedAt: new Date().toISOString(),
            isCloudflareBypassed: true,
            provider: "mshots",
          };
          setCachedScreenshot(cacheKey, mshotsImage, metadata);
          return {
            success: true,
            image: mshotsImage,
            metadata,
          };
        }

        // 3. Try thum.io proxy capture
        const thumImage = await fetchThumScreenshot(url, width, height);
        if (thumImage) {
          const metadata = {
            url,
            normalizedUrl: url,
            width,
            height,
            fullPage,
            deviceScaleFactor: scale,
            renderedAt: new Date().toISOString(),
            isCloudflareBypassed: true,
            provider: "thum.io",
          };
          setCachedScreenshot(cacheKey, thumImage, metadata);
          return {
            success: true,
            image: thumImage,
            metadata,
          };
        }

        // 4. Try urlscan.io screenshot as last fallback
        const urlscanImage = await fetchUrlscanScreenshot(url, Boolean(req.forceRefresh));
        if (urlscanImage) {
          const metadata = {
            url,
            normalizedUrl: url,
            width,
            height,
            fullPage,
            deviceScaleFactor: scale,
            renderedAt: new Date().toISOString(),
            isCloudflareBypassed: true,
            provider: "urlscan",
          };
          setCachedScreenshot(cacheKey, urlscanImage, metadata);
          return {
            success: true,
            image: urlscanImage,
            metadata,
          };
        }
      }

      // Take screenshot
      const buffer = await page.screenshot({
        fullPage,
        type: "png",
      });

      const base64Image = "data:image/png;base64," + buffer.toString("base64");

      const metadata = {
        url,
        normalizedUrl: url,
        width,
        height,
        fullPage,
        deviceScaleFactor: scale,
        renderedAt: new Date().toISOString(),
      };

      setCachedScreenshot(cacheKey, base64Image, metadata);

      return {
        success: true,
        image: base64Image,
        metadata,
      };
    } catch (err: any) {
      console.error(`Playwright capture for ${url} encountered issue:`, err);
    } finally {
      if (page) await page.close().catch(() => {});
      if (context) await context.close().catch(() => {});
    }
  }

  // 4. Fallback rendering strategy
  const fallbackImage = generateFallbackScreenshot(url, width, height, fullPage);
  const metadata = {
    url,
    normalizedUrl: url,
    width,
    height,
    fullPage,
    deviceScaleFactor: scale,
    renderedAt: new Date().toISOString(),
    isFallback: true,
  };

  setCachedScreenshot(cacheKey, fallbackImage, metadata);

  return {
    success: true,
    image: fallbackImage,
    metadata,
  };
}
