import assert from "node:assert/strict";
import { toEventProperties } from "./normalize";

const stripped = toEventProperties({
  payment_type: "one_time",
  plan: "pro",
  currency: "usd",
  coupon: undefined,
});

assert.equal(stripped.currency, "USD");
assert.equal(stripped.plan, "pro");
assert.equal(stripped.coupon, undefined);
assert.equal("coupon" in stripped, false);

const subscription = toEventProperties(
  {
    payment_type: "subscription",
    billing_interval: "month",
    amount: 4900,
    currency: "eur",
  },
  { eventName: "checkout_started" },
);

assert.equal(subscription.currency, "EUR");
assert.equal(subscription.billing_interval, "month");

console.log("events normalize: ok");
