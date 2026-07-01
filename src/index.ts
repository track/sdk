import { AnalyseClient } from "./client";
import type { AnalyseConfig } from "./types";

export type { AnalyseConfig, AnalyseEvent } from "./types";
export { AnalyseClient } from "./client";

const client = new AnalyseClient();

/** Initializes the global Analyse client. See {@link AnalyseConfig}. */
export function init(config: AnalyseConfig): void {
  client.init(config);
}

/** Records a custom event with optional properties. */
export function track(eventName: string, properties?: Record<string, unknown>): void {
  client.track(eventName, properties);
}

/** Associates the current device with a known user id. */
export function identify(userId: string, traits?: Record<string, unknown>): void {
  client.identify(userId, traits);
}

/** Sends a `pageview` for the current URL. */
export function page(): void {
  client.page();
}

/** Clears identity/session state and flushes pending events. */
export function reset(): void {
  client.reset();
}

/**
 * Auto-initializes from the loading `<script>` tag's data attributes, enabling a
 * zero-code install:
 *
 * ```html
 * <script src="https://cdn.../index.global.js" data-public-key="pk_live_..."></script>
 * ```
 */
function autoInit(): void {
  if (typeof document === "undefined") {
    return;
  }

  const current = document.currentScript;
  if (!(current instanceof HTMLScriptElement)) {
    return;
  }

  const publicKey = current.dataset.publicKey;
  if (!publicKey) {
    return;
  }

  init({
    publicKey,
    host: current.dataset.host,
    autoPageviews: current.dataset.autoPageviews !== "false",
    autoPageLeave: current.dataset.autoPageLeave !== "false",
  });
}

autoInit();

export default { init, track, identify, page, reset };
