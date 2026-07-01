import type { AnalyseEvent } from "./types";

export type { AnalyseEvent } from "./types";

const DEFAULT_HOST = "https://pulse.analyse.net";
const DEFAULT_MAX_BATCH = 100;

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
  /** Event name, e.g. `purchase_completed`. */
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

/** Extracts the bare domain from a URL string, or "" when not parseable. */
function domainOf(rawUrl: string | undefined): string {
  if (!rawUrl) {
    return "";
  }

  try {
    return new URL(rawUrl).hostname;
  } catch {
    return "";
  }
}

function toIso(timestamp: string | Date | undefined): string {
  if (!timestamp) {
    return new Date().toISOString();
  }

  if (timestamp instanceof Date) {
    return timestamp.toISOString();
  }

  return timestamp;
}

/**
 * Creates a server-side Analyse client for trusted, backend-generated events
 * (e.g. a Stripe `purchase_completed` webhook). Unlike the browser client, all
 * identity and context are supplied explicitly; there is no automatic tracking.
 *
 * Events are buffered and sent with `flush()`. In short-lived handlers, call
 * `flush()` (or `shutdown()`) before returning so nothing is lost.
 */
export function createServerClient(config: ServerClientConfig): ServerClient {
  if (!config.publicKey) {
    throw new Error("[analyse] createServerClient requires a publicKey.");
  }

  const host = (config.host ?? DEFAULT_HOST).replace(/\/$/, "");
  const maxBatchSize = config.maxBatchSize ?? DEFAULT_MAX_BATCH;
  const url = `${host}/v1/batch`;

  let queue: AnalyseEvent[] = [];

  function buildEvent(input: ServerEventInput): AnalyseEvent {
    const anonymousId = input.anonymousId ?? input.personId;
    if (!anonymousId) {
      throw new Error("[analyse] capture requires personId or anonymousId.");
    }

    const context = input.context ?? {};

    return {
      event_name: input.event,
      anonymous_id: anonymousId,
      person_id: input.personId,
      session_id: input.sessionId,
      timestamp: toIso(input.timestamp),
      url: context.url,
      path: context.path,
      hostname: context.hostname,
      referrer: context.referrer,
      referrer_domain: context.referrerDomain ?? domainOf(context.referrer),
      utm_source: context.utmSource,
      utm_medium: context.utmMedium,
      utm_campaign: context.utmCampaign,
      utm_term: context.utmTerm,
      utm_content: context.utmContent,
      properties: input.properties ?? {},
    };
  }

  async function flush(): Promise<void> {
    if (queue.length === 0) {
      return;
    }

    const events = queue;
    queue = [];

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicKey: config.publicKey, events }),
    });

    if (!response.ok) {
      // Re-buffer so a later flush/retry can resend the batch.
      queue = events.concat(queue);
      throw new Error(`[analyse] ingest responded ${response.status}`);
    }
  }

  function enqueue(event: AnalyseEvent): void {
    queue.push(event);
    if (queue.length >= maxBatchSize) {
      // Best-effort auto-flush; explicit flush()/shutdown() is the durable path.
      void flush().catch(() => {
        // Swallow here; the batch was re-buffered for the next flush.
      });
    }
  }

  return {
    capture(input: ServerEventInput): void {
      enqueue(buildEvent(input));
    },
    identify(personId, options): void {
      enqueue(
        buildEvent({
          event: "$identify",
          personId,
          anonymousId: options?.anonymousId,
          properties: options?.traits,
        }),
      );
    },
    flush,
    shutdown: flush,
  };
}
