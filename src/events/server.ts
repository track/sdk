import type { ServerClient, ServerEventInput } from "../server-types";
import { STANDARD_EVENT_NAMES } from "./names";
import { toEventProperties } from "./normalize";
import type {
  CheckoutCancelledProps,
  CheckoutFinishedProps,
  CheckoutStartedProps,
  ContentViewedProps,
  SignupCompletedProps,
  SubscriptionCancelledProps,
  TrialEndedProps,
  TrialStartedProps,
} from "./types";

type CaptureInput<TProps> = Omit<ServerEventInput, "event" | "properties"> & {
  properties: TProps;
};

/** Records `content_viewed` from a trusted server context. */
export function captureContentViewed(
  client: ServerClient,
  input: CaptureInput<ContentViewedProps>,
): void {
  client.capture({
    ...input,
    event: STANDARD_EVENT_NAMES.contentViewed,
    properties: toEventProperties(input.properties, {
      eventName: STANDARD_EVENT_NAMES.contentViewed,
    }),
  });
}

/** Records `signup_completed` from a trusted server context. */
export function captureSignedUp(
  client: ServerClient,
  input: CaptureInput<SignupCompletedProps>,
): void {
  client.capture({
    ...input,
    event: STANDARD_EVENT_NAMES.signupCompleted,
    properties: toEventProperties(input.properties, {
      eventName: STANDARD_EVENT_NAMES.signupCompleted,
    }),
  });
}

/** Records `checkout_started` from a trusted server context. */
export function captureCheckoutStarted(
  client: ServerClient,
  input: CaptureInput<CheckoutStartedProps>,
): void {
  client.capture({
    ...input,
    event: STANDARD_EVENT_NAMES.checkoutStarted,
    properties: toEventProperties(input.properties, {
      eventName: STANDARD_EVENT_NAMES.checkoutStarted,
    }),
  });
}

/** Records `checkout_cancelled` from a trusted server context. */
export function captureCheckoutCancelled(
  client: ServerClient,
  input: CaptureInput<CheckoutCancelledProps>,
): void {
  client.capture({
    ...input,
    event: STANDARD_EVENT_NAMES.checkoutCancelled,
    properties: toEventProperties(input.properties, {
      eventName: STANDARD_EVENT_NAMES.checkoutCancelled,
    }),
  });
}

/**
 * Records `checkout_finished` from a trusted server context.
 *
 * Prefer this over the browser helper — use from Stripe webhooks or billing jobs.
 */
export function captureCheckoutFinished(
  client: ServerClient,
  input: CaptureInput<CheckoutFinishedProps>,
): void {
  client.capture({
    ...input,
    event: STANDARD_EVENT_NAMES.checkoutFinished,
    properties: toEventProperties(input.properties, {
      eventName: STANDARD_EVENT_NAMES.checkoutFinished,
    }),
  });
}

/** Records `trial_started` from a trusted server context. */
export function captureTrialStarted(
  client: ServerClient,
  input: CaptureInput<TrialStartedProps>,
): void {
  client.capture({
    ...input,
    event: STANDARD_EVENT_NAMES.trialStarted,
    properties: toEventProperties(input.properties, {
      eventName: STANDARD_EVENT_NAMES.trialStarted,
    }),
  });
}

/** Records `trial_ended` from a trusted server context. */
export function captureTrialEnded(
  client: ServerClient,
  input: CaptureInput<TrialEndedProps>,
): void {
  client.capture({
    ...input,
    event: STANDARD_EVENT_NAMES.trialEnded,
    properties: toEventProperties(input.properties, {
      eventName: STANDARD_EVENT_NAMES.trialEnded,
    }),
  });
}

/** Records `subscription_cancelled` from a trusted server context. */
export function captureSubscriptionCancelled(
  client: ServerClient,
  input: CaptureInput<SubscriptionCancelledProps>,
): void {
  client.capture({
    ...input,
    event: STANDARD_EVENT_NAMES.subscriptionCancelled,
    properties: toEventProperties(input.properties, {
      eventName: STANDARD_EVENT_NAMES.subscriptionCancelled,
    }),
  });
}
