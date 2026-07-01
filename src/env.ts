import type { AnalyseEvent } from "./types";

/** The subset of event fields describing the current page/context. */
export type PageContext = Pick<
  AnalyseEvent,
  | "url"
  | "path"
  | "hostname"
  | "referrer"
  | "referrer_domain"
  | "utm_source"
  | "utm_medium"
  | "utm_campaign"
  | "utm_term"
  | "utm_content"
  | "screen_w"
  | "screen_h"
>;

/** Extracts the bare domain from a URL string, or "" when not parseable. */
function domainOf(rawUrl: string): string {
  if (!rawUrl) {
    return "";
  }

  try {
    return new URL(rawUrl).hostname;
  } catch {
    return "";
  }
}

/**
 * Collects the current page context (URL, referrer, UTM params, screen size)
 * from the browser environment.
 */
export function collectPageContext(): PageContext {
  const params = new URLSearchParams(window.location.search);
  const referrer = document.referrer;

  return {
    url: window.location.href,
    path: window.location.pathname,
    hostname: window.location.hostname,
    referrer,
    referrer_domain: domainOf(referrer),
    utm_source: params.get("utm_source") ?? undefined,
    utm_medium: params.get("utm_medium") ?? undefined,
    utm_campaign: params.get("utm_campaign") ?? undefined,
    utm_term: params.get("utm_term") ?? undefined,
    utm_content: params.get("utm_content") ?? undefined,
    screen_w: window.screen?.width,
    screen_h: window.screen?.height,
  };
}
