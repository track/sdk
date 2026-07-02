/** Canonical lifecycle event names emitted by standard SDK helpers. */
export const STANDARD_EVENT_NAMES = {
  contentViewed: "content_viewed",
  signupCompleted: "signup_completed",
  checkoutStarted: "checkout_started",
  checkoutCancelled: "checkout_cancelled",
  checkoutFinished: "checkout_finished",
  trialStarted: "trial_started",
  trialEnded: "trial_ended",
  subscriptionCancelled: "subscription_cancelled",
} as const;

/** Union of all standard lifecycle event name strings. */
export type StandardEventName =
  (typeof STANDARD_EVENT_NAMES)[keyof typeof STANDARD_EVENT_NAMES];

/** Ordered list of standard lifecycle events for registry and funnel defaults. */
export const STANDARD_EVENT_NAME_LIST: StandardEventName[] = [
  STANDARD_EVENT_NAMES.contentViewed,
  STANDARD_EVENT_NAMES.signupCompleted,
  STANDARD_EVENT_NAMES.checkoutStarted,
  STANDARD_EVENT_NAMES.checkoutCancelled,
  STANDARD_EVENT_NAMES.checkoutFinished,
  STANDARD_EVENT_NAMES.trialStarted,
  STANDARD_EVENT_NAMES.trialEnded,
  STANDARD_EVENT_NAMES.subscriptionCancelled,
];
