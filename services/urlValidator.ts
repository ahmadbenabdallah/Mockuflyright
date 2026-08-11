/**
 * URL Validation and SSRF Protection Module
 */

// Private IP ranges and blocked endpoints
const BLOCKED_HOSTNAMES = [
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "::",
  "metadata.google.internal",
  "169.254.169.254", // Cloud metadata
];

const PRIVATE_IP_REGEXES = [
  /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
  /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3}$/,
  /^192\.168\.\d{1,3}\.\d{1,3}$/,
  /^169\.254\.\d{1,3}\.\d{1,3}$/,
  /^0\.0\.0\.0$/,
];

export interface ValidationResult {
  isValid: boolean;
  normalizedUrl: string;
  error?: string;
  hostname?: string;
}

/**
 * Normalizes input URL by adding protocol if missing and cleaning whitespace
 */
export function normalizeUrl(input: string): string {
  let trimmed = input.trim();
  if (!trimmed) return "";

  // Add https:// if no protocol present
  if (!/^https?:\/\//i.test(trimmed)) {
    // If starts with // e.g. //example.com
    if (trimmed.startsWith("//")) {
      trimmed = "https:" + trimmed;
    } else {
      trimmed = "https://" + trimmed;
    }
  }

  return trimmed;
}

/**
 * Validates a URL and enforces SSRF security protections
 */
export function validateUrl(input: string): ValidationResult {
  if (!input || typeof input !== "string") {
    return { isValid: false, normalizedUrl: "", error: "Please enter a valid website URL." };
  }

  const normalized = normalizeUrl(input);

  let parsed: URL;
  try {
    parsed = new URL(normalized);
  } catch {
    return {
      isValid: false,
      normalizedUrl: normalized,
      error: "Invalid URL structure. Please enter a complete website address.",
    };
  }

  // Only allow http and https
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return {
      isValid: false,
      normalizedUrl: normalized,
      error: "Only HTTP and HTTPS website protocols are supported.",
    };
  }

  const hostname = parsed.hostname.toLowerCase();

  // Check blocked hostnames
  if (BLOCKED_HOSTNAMES.includes(hostname)) {
    return {
      isValid: false,
      normalizedUrl: normalized,
      error: "Access to internal hostnames or local addresses is strictly restricted for security.",
    };
  }

  // Check private IP addresses
  for (const regex of PRIVATE_IP_REGEXES) {
    if (regex.test(hostname)) {
      return {
        isValid: false,
        normalizedUrl: normalized,
        error: "Access to private IP addresses is restricted for security.",
      };
    }
  }

  // Check for common malicious/blocked protocols embedded in hostname
  if (hostname.includes("javascript") || hostname.includes("file") || hostname.includes("data")) {
    return {
      isValid: false,
      normalizedUrl: normalized,
      error: "Invalid protocol in target address.",
    };
  }

  return {
    isValid: true,
    normalizedUrl: normalized,
    hostname: parsed.hostname,
  };
}

/**
 * Generates a clean, sanitized filename for PNG export from a URL
 */
export function generateFilename(url: string, browser: string = "safari", index?: number): string {
  let domain = "website";
  try {
    const parsed = new URL(normalizeUrl(url));
    domain = parsed.hostname.replace(/^www\./i, "");
    if (parsed.pathname && parsed.pathname !== "/") {
      const cleanPath = parsed.pathname.replace(/[^a-zA-Z0-9]/g, "-").replace(/-+/g, "-");
      domain += cleanPath;
    }
  } catch {
    domain = url.replace(/[^a-zA-Z0-9]/g, "-");
  }

  // Clean domain string
  let safeName = domain
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (!safeName) safeName = "mockup";

  const suffix = index && index > 1 ? `-${index}` : "";
  return `${safeName}-${browser}${suffix}.png`;
}
