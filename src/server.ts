import type { AnalyseEvent } from "./types";
import type {
  ServerClient,
  ServerClientConfig,
  ServerEventInput,
} from "./server-types";

export type { AnalyseEvent } from "./types";
export type {
  ServerClient,
  ServerClientConfig,
  ServerEventContext,
  ServerEventInput,
} from "./server-types";

const DEFAULT_HOST = "https://pulse.analyse.net";
const DEFAULT_MAX_BATCH = 100;

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
 * (e.g. a Stripe `checkout_finished` webhook). Unlike the browser client, all
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

export {
  captureContentViewed,
  captureSignedUp,
  captureCheckoutStarted,
  captureCheckoutCancelled,
  captureCheckoutFinished,
  captureTrialStarted,
  captureTrialEnded,
  captureSubscriptionCancelled,
} from "./events/server";

export type {
  BillingInterval,
  CheckoutCancelledProps,
  CheckoutFinishedProps,
  CheckoutStartedProps,
  ContentAttributionProps,
  ContentType,
  ContentViewedProps,
  PaymentType,
  SignupCompletedProps,
  SubscriptionCancelledProps,
  TrialEndedProps,
  TrialStartedProps,
} from "./events/types";

export { STANDARD_EVENT_NAMES, STANDARD_EVENT_NAME_LIST } from "./events/names";
