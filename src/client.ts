import { getCampaignAttribution, recordCampaignTouch } from "./campaign-touchpoints";
import { collectPageContext } from "./env";
import {
  getAnonId,
  getPersonId,
  getSessionId,
  resetIdentity,
  setPersonId,
} from "./storage";
import type { AnalyseConfig, AnalyseEvent, IdentifyTraits } from "./types";

const DEFAULT_HOST = "https://pulse.analyse.net";
const DEFAULT_FLUSH_INTERVAL_MS = 5000;
const DEFAULT_MAX_BATCH = 20;

type ResolvedConfig = Required<AnalyseConfig>;

/**
 * The Analyse browser client: buffers events and flushes them in batches to the
 * ingest endpoint, and (optionally) auto-tracks pageviews and page-leave signals
 * including time-on-page and scroll depth.
 */
export class AnalyseClient {
  private config: ResolvedConfig | null = null;
  private queue: AnalyseEvent[] = [];
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private pageStartedAt = 0;
  private maxScrollPct = 0;
  private started = false;

  /**
   * Initializes the client. Safe to call once; subsequent calls are ignored.
   * No-ops outside the browser so it is safe to import in SSR contexts.
   */
  init(config: AnalyseConfig): void {
    if (this.started || typeof window === "undefined") {
      return;
    }

    if (!config.publicKey) {
      console.warn("[analyse] init called without a publicKey; ignoring.");

      return;
    }

    this.config = {
      publicKey: config.publicKey,
      host: (config.host ?? DEFAULT_HOST).replace(/\/$/, ""),
      autoPageviews: config.autoPageviews ?? true,
      autoPageLeave: config.autoPageLeave ?? true,
      flushIntervalMs: config.flushIntervalMs ?? DEFAULT_FLUSH_INTERVAL_MS,
      maxBatchSize: config.maxBatchSize ?? DEFAULT_MAX_BATCH,
    };
    this.started = true;

    this.resetPageTiming();
    this.attachListeners();
    this.flushTimer = setInterval(() => {
      this.flush(false);
    }, this.config.flushIntervalMs);

    if (this.config.autoPageviews) {
      this.page();
    }
  }

  /**
   * Records a custom event with optional properties.
   */
  track(eventName: string, properties?: Record<string, unknown>): void {
    if (!this.config) {
      return;
    }

    this.enqueue(this.buildEvent(eventName, properties));
  }

  /**
   * Associates the current anonymous device with a known user id. Identity
   * stitching happens server-side; a `$identify` event is emitted so the join
   * of anonymous history to the person is recorded. First/last-touch campaign
   * attribution is merged into the traits (explicit traits win) so the user's
   * profile records which campaign brought them in.
   */
  identify(userId: string, traits?: IdentifyTraits): void {
    if (!this.config || !userId) {
      return;
    }

    setPersonId(userId);
    this.enqueue(this.buildEvent("$identify", { ...getCampaignAttribution(), ...traits }));
  }

  /**
   * Sends a `pageview` for the current URL. When auto page-leave is enabled,
   * finalizes the previous page first.
   */
  page(): void {
    if (!this.config) {
      return;
    }

    this.enqueue(this.buildEvent("pageview"));
    this.resetPageTiming();
  }

  /** Clears identity/session state (e.g. on logout) and flushes pending events. */
  reset(): void {
    this.flush(true);
    resetIdentity();
  }

  /**
   * Flushes buffered events to the ingest endpoint. Uses `sendBeacon` on unload
   * paths and `fetch` with `keepalive` otherwise.
   */
  flush(useBeacon: boolean): void {
    if (!this.config || this.queue.length === 0) {
      return;
    }

    const events = this.queue;
    this.queue = [];

    const body = JSON.stringify({ publicKey: this.config.publicKey, events });
    const url = `${this.config.host}/v1/batch`;

    if (useBeacon && typeof navigator !== "undefined" && navigator.sendBeacon) {
      const ok = navigator.sendBeacon(url, new Blob([body], { type: "application/json" }));
      if (ok) {
        return;
      }

      // Beacon rejected (payload too large / unavailable): fall through to fetch.
    }

    void fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {
      // Best-effort: drop on network failure rather than blocking the page.
    });
  }

  private buildEvent(
    eventName: string,
    properties?: Record<string, unknown>,
  ): AnalyseEvent {
    const context = collectPageContext();
    recordCampaignTouch(context);

    return {
      event_name: eventName,
      anonymous_id: getAnonId(),
      person_id: getPersonId(),
      session_id: getSessionId(),
      timestamp: new Date().toISOString(),
      ...context,
      properties: properties ?? {},
    };
  }

  private enqueue(event: AnalyseEvent): void {
    this.queue.push(event);
    if (this.config && this.queue.length >= this.config.maxBatchSize) {
      this.flush(false);
    }
  }

  private resetPageTiming(): void {
    this.pageStartedAt = Date.now();
    this.maxScrollPct = 0;
  }

  private sendPageLeave(): void {
    if (!this.config || !this.config.autoPageLeave) {
      return;
    }

    const timeOnPage = Math.round((Date.now() - this.pageStartedAt) / 1000);
    this.enqueue(
      this.buildEvent("page_leave", {
        time_on_page: timeOnPage,
        scroll_depth: this.maxScrollPct,
      }),
    );
  }

  private attachListeners(): void {
    window.addEventListener("scroll", this.handleScroll, { passive: true });

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        this.sendPageLeave();
        this.flush(true);
      }
    });

    window.addEventListener("pagehide", () => {
      this.sendPageLeave();
      this.flush(true);
    });

    this.patchHistory();
    window.addEventListener("analyse:locationchange", this.handleRouteChange);
    window.addEventListener("popstate", this.handleRouteChange);
  }

  private handleScroll = (): void => {
    const doc = document.documentElement;
    const scrollable = doc.scrollHeight - window.innerHeight;
    if (scrollable <= 0) {
      this.maxScrollPct = 100;

      return;
    }

    const pct = Math.round((window.scrollY / scrollable) * 100);
    this.maxScrollPct = Math.min(100, Math.max(this.maxScrollPct, pct));
  };

  private handleRouteChange = (): void => {
    this.sendPageLeave();

    if (this.config?.autoPageviews) {
      this.page();

      return;
    }

    this.resetPageTiming();
  };

  /**
   * Patches `history.pushState`/`replaceState` to emit a `analyse:locationchange`
   * event so SPA navigations trigger pageviews.
   */
  private patchHistory(): void {
    const emit = (): void => {
      window.dispatchEvent(new Event("analyse:locationchange"));
    };

    const originalPush = history.pushState.bind(history);
    const originalReplace = history.replaceState.bind(history);

    history.pushState = (...args: Parameters<History["pushState"]>) => {
      originalPush(...args);
      emit();
    };

    history.replaceState = (...args: Parameters<History["replaceState"]>) => {
      originalReplace(...args);
      emit();
    };
  }
}
