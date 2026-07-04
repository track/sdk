const CAMPAIGN_KEY = "analyse_campaign_touch";

/** A single campaign landing captured from the URL at visit time. */
export type CampaignTouch = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  /** Referring domain at the moment of the campaign landing. */
  referrer_domain?: string;
  /** ISO timestamp of the landing. */
  touched_at: string;
};

/** First- and last-touch campaign fields for user profiles and conversions. */
export type CampaignAttribution = {
  first_utm_source?: string;
  first_utm_medium?: string;
  first_utm_campaign?: string;
  first_utm_term?: string;
  first_utm_content?: string;
  first_referrer_domain?: string;
  first_touched_at?: string;
  last_utm_source?: string;
  last_utm_medium?: string;
  last_utm_campaign?: string;
  last_utm_term?: string;
  last_utm_content?: string;
  last_referrer_domain?: string;
  last_touched_at?: string;
};

type StoredCampaignTouches = {
  first?: CampaignTouch;
  last?: CampaignTouch;
};

function readLocal(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeLocal(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage unavailable; attribution simply won't persist across loads.
  }
}

function removeLocal(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore.
  }
}

function asOptionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function isValidTouch(value: unknown): value is CampaignTouch {
  return (
    typeof value === "object" &&
    value !== null &&
    "touched_at" in value &&
    typeof value.touched_at === "string"
  );
}

function sanitizeTouch(value: unknown): CampaignTouch | undefined {
  if (!isValidTouch(value)) {
    return undefined;
  }

  return {
    utm_source: asOptionalString(value.utm_source),
    utm_medium: asOptionalString(value.utm_medium),
    utm_campaign: asOptionalString(value.utm_campaign),
    utm_term: asOptionalString(value.utm_term),
    utm_content: asOptionalString(value.utm_content),
    referrer_domain: asOptionalString(value.referrer_domain),
    touched_at: value.touched_at,
  };
}

function readTouches(): StoredCampaignTouches {
  const raw = readLocal(CAMPAIGN_KEY);
  if (!raw) {
    return {};
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed === "object" && parsed !== null) {
      const record = parsed as StoredCampaignTouches;

      return {
        first: sanitizeTouch(record.first),
        last: sanitizeTouch(record.last),
      };
    }
  } catch {
    // Corrupt storage; start fresh.
  }

  return {};
}

/** The UTM subset of page context relevant to campaign attribution. */
type CampaignContext = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  referrer_domain?: string;
};

function hasUtm(context: CampaignContext): boolean {
  return Boolean(
    context.utm_source ||
      context.utm_medium ||
      context.utm_campaign ||
      context.utm_term ||
      context.utm_content,
  );
}

function sameCampaign(a: CampaignTouch, b: CampaignTouch): boolean {
  return (
    a.utm_source === b.utm_source &&
    a.utm_medium === b.utm_medium &&
    a.utm_campaign === b.utm_campaign &&
    a.utm_term === b.utm_term &&
    a.utm_content === b.utm_content
  );
}

/**
 * Records a campaign landing when the current page context carries UTM
 * parameters. The first touch is written once per device; the last touch is
 * overwritten whenever a different campaign arrives.
 */
export function recordCampaignTouch(context: CampaignContext): void {
  if (typeof window === "undefined" || !hasUtm(context)) {
    return;
  }

  const touch: CampaignTouch = {
    utm_source: context.utm_source,
    utm_medium: context.utm_medium,
    utm_campaign: context.utm_campaign,
    utm_term: context.utm_term,
    utm_content: context.utm_content,
    referrer_domain: context.referrer_domain || undefined,
    touched_at: new Date().toISOString(),
  };

  const stored = readTouches();

  // Re-recording the campaign already held as last touch (e.g. every event on
  // the landing page) must not bump its timestamp.
  if (stored.first && stored.last && sameCampaign(stored.last, touch)) {
    return;
  }

  writeLocal(
    CAMPAIGN_KEY,
    JSON.stringify({ first: stored.first ?? touch, last: touch }),
  );
}

/** Returns first-touch and last-touch campaign fields, flattened for traits. */
export function getCampaignAttribution(): CampaignAttribution {
  if (typeof window === "undefined") {
    return {};
  }

  const { first, last } = readTouches();
  if (!first) {
    return {};
  }

  const resolvedLast = last ?? first;

  return {
    first_utm_source: first.utm_source,
    first_utm_medium: first.utm_medium,
    first_utm_campaign: first.utm_campaign,
    first_utm_term: first.utm_term,
    first_utm_content: first.utm_content,
    first_referrer_domain: first.referrer_domain,
    first_touched_at: first.touched_at,
    last_utm_source: resolvedLast.utm_source,
    last_utm_medium: resolvedLast.utm_medium,
    last_utm_campaign: resolvedLast.utm_campaign,
    last_utm_term: resolvedLast.utm_term,
    last_utm_content: resolvedLast.utm_content,
    last_referrer_domain: resolvedLast.referrer_domain,
    last_touched_at: resolvedLast.touched_at,
  };
}

/** Clears stored campaign touches (e.g. on logout via `reset()`). */
export function clearCampaignTouchpoints(): void {
  if (typeof window === "undefined") {
    return;
  }

  removeLocal(CAMPAIGN_KEY);
}
