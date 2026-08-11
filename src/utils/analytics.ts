/**
 * Analytics Abstraction Service
 */
import { AnalyticsEvent } from "../types";

export function trackEvent(eventName: string, properties?: Record<string, any>): void {
  const payload: AnalyticsEvent = {
    event: eventName,
    properties: {
      timestamp: new Date().toISOString(),
      ...properties,
    },
  };

  // Log in development console
  if (process.env.NODE_ENV !== "production") {
    console.log("[Analytics Event]:", payload.event, payload.properties);
  }

  // Hook for custom analytics integrations (e.g. Google Analytics, Plausible, PostHog)
  if (typeof window !== "undefined" && (window as any).gtag) {
    (window as any).gtag("event", eventName, properties);
  }
}
