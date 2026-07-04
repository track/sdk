/** Canonical content types for `content_viewed` attribution. */
export type ContentType = "blog_post" | "article" | "page" | "doc";

/** First- and last-touch campaign (UTM) fields attached to conversion events. */
export type CampaignAttributionProps = {
  first_utm_source?: string;
  first_utm_medium?: string;
  first_utm_campaign?: string;
  first_utm_term?: string;
  first_utm_content?: string;
  first_referrer_domain?: string;
  first_touched_at?: string;
  last_utm_source?: string;
  last_utm_medium?: string;
  last_utm_campaign?: string;
  last_utm_term?: string;
  last_utm_content?: string;
  last_referrer_domain?: string;
  last_touched_at?: string;
};

/** First- and last-touch content metadata attached to conversion events. */
export type ContentAttributionProps = {
  first_content_id?: string;
  first_content_type?: string;
  first_content_title?: string;
  last_content_id?: string;
  last_content_type?: string;
  last_content_title?: string;
  content_touchpoint_count?: number;
};

/** Properties for {@link contentViewed} / `content_viewed`. */
export type ContentViewedProps = {
  content_id: string;
  content_type?: ContentType;
  title?: string;
};

/** How the customer pays: a single charge or recurring billing. */
export type PaymentType = "one_time" | "subscription";

/** Recurring billing cadence for subscription checkouts. */
export type BillingInterval = "month" | "year" | "week";

/** How the user created their account. */
export type SignupMethod = "email" | "oauth" | "invite" | "sso";

/** Why a checkout did not complete. */
export type CheckoutCancelReason =
  | "user_abandoned"
  | "payment_failed"
  | "validation_error"
  | "other";

/** Why a trial period ended. */
export type TrialEndReason = "expired" | "converted" | "cancelled";

/** Why a subscription was cancelled. */
export type SubscriptionCancelReason =
  | "user_request"
  | "payment_failed"
  | "admin"
  | "other";

/** Shared checkout fields across started, cancelled, and finished events. */
export type CheckoutSharedFields = {
  /** Correlates started → cancelled/finished in funnels. */
  checkout_id?: string;
  /** Payment amount in minor units (cents). Required on `checkout_finished`. */
  amount?: number;
  /** ISO 4217 currency code, e.g. `USD`. */
  currency?: string;
  /** Stripe price id or internal SKU. */
  product_id?: string;
  /** Plan slug shown in the UI. */
  plan?: string;
  /** Number of line items in the cart. */
  items_count?: number;
  /** Applied promo code. */
  coupon?: string;
};

/** One-time checkout: no recurring billing interval. */
export type OneTimeCheckoutProps = CheckoutSharedFields & {
  payment_type: "one_time";
  billing_interval?: never;
};

/** Subscription checkout: requires a billing interval. */
export type SubscriptionCheckoutProps = CheckoutSharedFields & {
  payment_type: "subscription";
  billing_interval: BillingInterval;
};

/** Discriminated checkout base used by all `checkout_*` events. */
export type CheckoutBaseProps = OneTimeCheckoutProps | SubscriptionCheckoutProps;

/** Properties for {@link signedUp} / `signup_completed`. */
export type SignupCompletedProps = ContentAttributionProps &
  CampaignAttributionProps & {
  method?: SignupMethod;
  plan?: string;
  trial_days?: number;
};

/** Properties for {@link checkoutStarted} / `checkout_started`. */
export type CheckoutStartedProps = CheckoutBaseProps;

/** Properties for {@link checkoutCancelled} / `checkout_cancelled`. */
export type CheckoutCancelledProps = CheckoutBaseProps & {
  reason?: CheckoutCancelReason;
  /** Checkout step where the user dropped off, e.g. `payment`. */
  step?: string;
};

/** Properties for {@link checkoutFinished} / `checkout_finished`. */
export type OneTimeCheckoutFinishedProps = OneTimeCheckoutProps & {
  amount: number;
  order_id?: string;
  subscription_id?: never;
};

export type SubscriptionCheckoutFinishedProps = SubscriptionCheckoutProps & {
  amount: number;
  subscription_id?: string;
  order_id?: string;
};

/** Successful payment — one-time or subscription. */
export type CheckoutFinishedProps =
  | OneTimeCheckoutFinishedProps
  | SubscriptionCheckoutFinishedProps;

/** Properties for {@link trialStarted} / `trial_started`. */
export type TrialStartedProps = {
  plan: string;
  trial_days: number;
  payment_type?: "subscription";
};

/** Properties for {@link trialEnded} / `trial_ended`. */
export type TrialEndedProps = {
  plan: string;
  converted: boolean;
  reason?: TrialEndReason;
  payment_type?: "subscription";
};

/** Properties for {@link subscriptionCancelled} / `subscription_cancelled`. */
export type SubscriptionCancelledProps = {
  plan: string;
  payment_type: "subscription";
  billing_interval?: BillingInterval;
  reason?: SubscriptionCancelReason;
  /** ISO date when access ends. */
  effective_at?: string;
};
