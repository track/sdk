/**
 * Traits accepted by `identify()`. Reserved `$`-prefixed keys populate the
 * user's profile in the dashboard (name, email, avatar); any other keys are
 * stored verbatim as custom properties.
 */
export type IdentifyTraits = {
  /** Display name shown in the dashboard Users page. */
  $name?: string;
  /** Email shown on the user profile. */
  $email?: string;
  /** Avatar image URL shown on the user profile. */
  $avatar?: string;
  /** Any custom properties to store on the user. */
  [key: string]: unknown;
};

/**
 * A single event as sent to the Analyse ingest endpoint. The site is identified
 * by the envelope `publicKey`, not per event; ingest stamps the resolved
 * `site_id`. Device/browser/OS are intentionally omitted here and derived
 * server-side from the User-Agent.
 */
export type AnalyseEvent = {
  /** Event name, e.g. `pageview`, `page_leave`, or a custom name. */
  event_name: string;
  /** Anonymous device id (first-party, persisted in localStorage). */
  anonymous_id: string;
  /** Known user id once `identify` has been called. */
  person_id?: string;
  /** Current session id. */
  session_id?: string;
  /** ISO timestamp; defaults to send time server-side when omitted. */
  timestamp?: string;
  /** Full page URL. */
  url?: string;
  /** Page pathname. */
  path?: string;
  /** Page hostname. */
  hostname?: string;
  /** Referring URL. */
  referrer?: string;
  /** Bare referring domain. */
  referrer_domain?: string;
  /** UTM source. */
  utm_source?: string;
  /** UTM medium. */
  utm_medium?: string;
  /** UTM campaign. */
  utm_campaign?: string;
  /** UTM term. */
  utm_term?: string;
  /** UTM content. */
  utm_content?: string;
  /** Viewport/screen width in pixels. */
  screen_w?: number;
  /** Viewport/screen height in pixels. */
  screen_h?: number;
  /** Arbitrary custom properties. */
  properties?: Record<string, unknown>;
};

/** Configuration passed to {@link init}. */
export type AnalyseConfig = {
  /** Site public key issued by Analyse. Required. */
  publicKey: string;
  /**
   * Ingest host base URL (no trailing slash). Events are POSTed to
   * `${host}/v1/batch`. Defaults to the hosted Analyse ingest.
   */
  host?: string;
  /** Automatically send a `pageview` on init and on SPA route changes. Default true. */
  autoPageviews?: boolean;
  /**
   * Automatically send a `page_leave` (with `time_on_page` and `scroll_depth`)
   * when a page is hidden/unloaded. Default true.
   */
  autoPageLeave?: boolean;
  /** How often, in ms, to flush the queue. Default 5000. */
  flushIntervalMs?: number;
  /** Max events buffered before an immediate flush. Default 20. */
  maxBatchSize?: number;
};
