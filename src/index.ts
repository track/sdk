import type { AnalyseConfig } from "./types";

export type { AnalyseConfig, AnalyseEvent, IdentifyTraits } from "./types";
export { AnalyseClient } from "./client";
export type { ContentAttribution } from "./content-touchpoints";
export { getContentAttribution } from "./content-touchpoints";
export { init, track, identify, page, reset } from "./globals";

export {
  contentViewed,
  signedUp,
  checkoutStarted,
  checkoutCancelled,
  checkoutFinished,
  trialStarted,
  trialEnded,
  subscriptionCancelled,
} from "./events/browser";

export type {
  BillingInterval,
  CheckoutBaseProps,
  CheckoutCancelledProps,
  CheckoutFinishedProps,
  CheckoutStartedProps,
  CheckoutCancelReason,
  ContentAttributionProps,
  ContentType,
  ContentViewedProps,
  OneTimeCheckoutProps,
  PaymentType,
  SignupCompletedProps,
  SignupMethod,
  SubscriptionCancelledProps,
  SubscriptionCancelReason,
  SubscriptionCheckoutProps,
  TrialEndedProps,
  TrialEndReason,
  TrialStartedProps,
} from "./events/types";

export type { StandardEventName } from "./events/names";
export { STANDARD_EVENT_NAMES, STANDARD_EVENT_NAME_LIST } from "./events/names";

import { init, track, identify, page, reset } from "./globals";
import {
  contentViewed,
  signedUp,
  checkoutStarted,
  checkoutCancelled,
  checkoutFinished,
  trialStarted,
  trialEnded,
  subscriptionCancelled,
} from "./events/browser";

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

export default {
  init,
  track,
  identify,
  page,
  reset,
  contentViewed,
  signedUp,
  checkoutStarted,
  checkoutCancelled,
  checkoutFinished,
  trialStarted,
  trialEnded,
  subscriptionCancelled,
};
