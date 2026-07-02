/** Configuration for the server-side client. */
export type ServerClientConfig = {
  /** Site public key issued by Analyse. Required. */
  publicKey: string;
  /**
   * Ingest host base URL (no trailing slash). Events are POSTed to
   * `${host}/v1/batch`. Defaults to the hosted Analyse ingest.
   */
  host?: string;
  /**
   * Buffer size that triggers an automatic best-effort flush. Set to 1 to send
   * every event immediately. Default 100.
   */
  maxBatchSize?: number;
};

/** Page/campaign context for a server-captured event (all optional). */
export type ServerEventContext = {
  /** Full page URL associated with the event, if known. */
  url?: string;
  /** Page pathname. */
  path?: string;
  /** Page hostname. */
  hostname?: string;
  /** Referring URL. */
  referrer?: string;
  /** Bare referring domain; derived from `referrer` when omitted. */
  referrerDomain?: string;
  /** UTM source. */
  utmSource?: string;
  /** UTM medium. */
  utmMedium?: string;
  /** UTM campaign. */
  utmCampaign?: string;
  /** UTM term. */
  utmTerm?: string;
  /** UTM content. */
  utmContent?: string;
};

/** Input for a single server-side event capture. */
export type ServerEventInput = {
  /** Event name, e.g. `checkout_finished`. */
  event: string;
  /** Known user id. Also used as the anonymous id when none is supplied. */
  personId?: string;
  /** Anonymous id, when the actor isn't identified. */
  anonymousId?: string;
  /** Session id, if you track sessions server-side. */
  sessionId?: string;
  /** Event timestamp; defaults to now. */
  timestamp?: string | Date;
  /** Arbitrary custom properties. */
  properties?: Record<string, unknown>;
  /** Optional page/campaign context. */
  context?: ServerEventContext;
};

/** The server-side Analyse client. */
export type ServerClient = {
  /** Buffers an event; may trigger a best-effort flush at `maxBatchSize`. */
  capture: (input: ServerEventInput) => void;
  /** Records an identity association (`$identify`) for server-side stitching. */
  identify: (
    personId: string,
    options?: { anonymousId?: string; traits?: Record<string, unknown> },
  ) => void;
  /** Sends all buffered events. Rejects on a non-2xx response or network error. */
  flush: () => Promise<void>;
  /** Flushes and should be called before a process/handler exits. */
  shutdown: () => Promise<void>;
};
