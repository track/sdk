import { AnalyseClient } from "./client";
import type { AnalyseConfig } from "./types";

/** Process-wide browser client singleton shared by the public API and event helpers. */
export const client = new AnalyseClient();

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
