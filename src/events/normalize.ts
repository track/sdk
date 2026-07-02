import type { CheckoutBaseProps, CheckoutFinishedProps } from "./types";

function isDevEnvironment(): boolean {
  if (typeof process !== "undefined" && process.env?.NODE_ENV === "production") {
    return false;
  }

  return true;
}

function warn(message: string): void {
  if (!isDevEnvironment()) {
    return;
  }

  console.warn(`[analyse] ${message}`);
}

function normalizeCurrency(currency: string | undefined): string | undefined {
  if (!currency) {
    return undefined;
  }

  return currency.trim().toUpperCase();
}

function validateCheckoutBase(props: CheckoutBaseProps, eventName: string): void {
  if (props.payment_type === "subscription" && !props.billing_interval) {
    warn(
      `${eventName}: payment_type "subscription" requires billing_interval (e.g. "month").`,
    );
  }
}

function validateCheckoutFinished(props: CheckoutFinishedProps): void {
  validateCheckoutBase(props, "checkout_finished");

  if (props.amount === undefined || props.amount < 0) {
    warn("checkout_finished: amount is required and must be a non-negative number (minor units).");
  }
}

/**
 * Strips undefined keys, uppercases currency, and emits dev-only warnings for
 * missing required fields. Never throws — checkout flows must not break.
 */
export function toEventProperties(
  props: Record<string, unknown>,
  options: { eventName?: string } = {},
): Record<string, unknown> {
  const normalized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(props)) {
    if (value !== undefined) {
      normalized[key] = value;
    }
  }

  if (typeof normalized.currency === "string") {
    normalized.currency = normalizeCurrency(normalized.currency);
  }

  if (options.eventName === "checkout_finished") {
    validateCheckoutFinished(props as CheckoutFinishedProps);
  } else if (
    options.eventName === "checkout_started" ||
    options.eventName === "checkout_cancelled"
  ) {
    validateCheckoutBase(props as CheckoutBaseProps, options.eventName);
  } else if (options.eventName === "content_viewed") {
    if (typeof props.content_id !== "string" || !props.content_id.trim()) {
      warn('content_viewed: content_id is required (e.g. your CMS or knowledge-base page id).');
    }
  }

  return normalized;
}
