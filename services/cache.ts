/**
 * In-Memory Cache Service for Rendered Screenshots
 */
import crypto from "crypto";

interface CachedScreenshot {
  image: string;
  metadata: {
    url: string;
    normalizedUrl: string;
    width: number;
    height: number;
    fullPage: boolean;
    deviceScaleFactor: number;
    renderedAt: string;
    isFallback?: boolean;
  };
  expiresAt: number;
}

const cacheMap = new Map<string, CachedScreenshot>();
const DEFAULT_TTL_MS = 30 * 60 * 1000; // 30 minutes cache

/**
 * Creates a unique SHA256 cache key for a render request
 */
export function generateCacheKey(
  url: string,
  width: number,
  height: number,
  fullPage: boolean,
  scale: number
): string {
  const payload = `${url.toLowerCase().trim()}|${width}|${height}|${fullPage}|${scale}`;
  return crypto.createHash("sha256").update(payload).digest("hex");
}

/**
 * Gets a cached screenshot if available and not expired
 */
export function getCachedScreenshot(key: string): CachedScreenshot | null {
  const item = cacheMap.get(key);
  if (!item) return null;

  if (Date.now() > item.expiresAt) {
    cacheMap.delete(key);
    return null;
  }

  return item;
}

/**
 * Deletes an entry from cache for force refresh
 */
export function invalidateCacheKey(key: string): void {
  cacheMap.delete(key);
}

/**
 * Stores a rendered screenshot in cache
 */
export function setCachedScreenshot(
  key: string,
  image: string,
  metadata: CachedScreenshot["metadata"],
  ttlMs: number = DEFAULT_TTL_MS
): void {
  cacheMap.set(key, {
    image,
    metadata,
    expiresAt: Date.now() + ttlMs,
  });
}

/**
 * Clears expired items periodically
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of cacheMap.entries()) {
    if (now > value.expiresAt) {
      cacheMap.delete(key);
    }
  }
}, 5 * 60 * 1000);
