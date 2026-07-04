import { getCampaignAttribution } from "../campaign-touchpoints";
import { getContentAttribution, recordContentTouchpoint } from "../content-touchpoints";
import { track } from "../globals";
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

/**
 * Records `content_viewed` and stores a first-party touchpoint for later
 * conversion attribution (e.g. blog post → signup days later).
 */
export function contentViewed(props: ContentViewedProps): void {
  recordContentTouchpoint({
    content_id: props.content_id,
    content_type: props.content_type,
    title: props.title,
  });

  track(
    STANDARD_EVENT_NAMES.contentViewed,
    toEventProperties(props, { eventName: STANDARD_EVENT_NAMES.contentViewed }),
  );
}

/** Records `signup_completed` after a user successfully creates an account. */
export function signedUp(props: SignupCompletedProps = {}): void {
  const attribution = { ...getContentAttribution(), ...getCampaignAttribution() };

  track(
    STANDARD_EVENT_NAMES.signupCompleted,
    toEventProperties(
      { ...attribution, ...props },
      { eventName: STANDARD_EVENT_NAMES.signupCompleted },
    ),
  );
}

/** Records `checkout_started` when a user enters the payment flow. */
export function checkoutStarted(props: CheckoutStartedProps): void {
  track(
    STANDARD_EVENT_NAMES.checkoutStarted,
    toEventProperties(props, { eventName: STANDARD_EVENT_NAMES.checkoutStarted }),
  );
}

/** Records `checkout_cancelled` when a checkout is abandoned or fails. */
export function checkoutCancelled(props: CheckoutCancelledProps): void {
  track(
    STANDARD_EVENT_NAMES.checkoutCancelled,
    toEventProperties(props, { eventName: STANDARD_EVENT_NAMES.checkoutCancelled }),
  );
}

/**
 * Records `checkout_finished` when payment succeeds.
 *
 * Prefer the server helper from a billing webhook for production revenue data.
 */
export function checkoutFinished(props: CheckoutFinishedProps): void {
  track(
    STANDARD_EVENT_NAMES.checkoutFinished,
    toEventProperties(props, { eventName: STANDARD_EVENT_NAMES.checkoutFinished }),
  );
}

/** Records `trial_started` when a user begins a free trial. */
export function trialStarted(props: TrialStartedProps): void {
  track(
    STANDARD_EVENT_NAMES.trialStarted,
    toEventProperties(props, { eventName: STANDARD_EVENT_NAMES.trialStarted }),
  );
}

/** Records `trial_ended` when a trial expires or converts to paid. */
export function trialEnded(props: TrialEndedProps): void {
  track(
    STANDARD_EVENT_NAMES.trialEnded,
    toEventProperties(props, { eventName: STANDARD_EVENT_NAMES.trialEnded }),
  );
}

/** Records `subscription_cancelled` when recurring billing is stopped. */
export function subscriptionCancelled(props: SubscriptionCancelledProps): void {
  track(
    STANDARD_EVENT_NAMES.subscriptionCancelled,
    toEventProperties(props, {
      eventName: STANDARD_EVENT_NAMES.subscriptionCancelled,
    }),
  );
}
