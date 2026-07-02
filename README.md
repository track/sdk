# @analyse.net/sdk

The official [Analyse](https://analyse.net) web analytics browser SDK. Lightweight, dependency-free, and privacy-friendly. Collects pageviews, session, and engagement signals (time on page, scroll depth) and batches them to the Analyse ingest endpoint.

## Install

### Script tag (zero-code)

```html
<script
  src="https://cdn.jsdelivr.net/npm/@analyse.net/sdk/dist/index.global.js"
  data-public-key="pk_live_your_key"
  defer
></script>
```

That's it — pageviews and page-leave signals are tracked automatically.

Optional data attributes:

- `data-host` — override the ingest host (defaults to the hosted Analyse ingest).
- `data-auto-pageviews="false"` — disable automatic pageview tracking.
- `data-auto-page-leave="false"` — disable automatic `page_leave` tracking.

Script-tag users also get standard lifecycle helpers on the global `Analyse` object (e.g. `Analyse.checkoutStarted(...)`).

### npm

```bash
npm install @analyse.net/sdk
```

```ts
import { init, identify, contentViewed, signedUp } from "@analyse.net/sdk";

init({ publicKey: "pk_live_your_key" });

contentViewed({
  content_id: "post_abc123",
  content_type: "blog_post",
  title: "How to track attribution",
});

identify("user_123");
signedUp({ method: "email" });
```

## Browser API

| Function | Description |
| --- | --- |
| `init(config)` | Initialize the client. Safe to call once. |
| `track(name, properties?)` | Record a custom event. |
| `identify(userId, traits?)` | Associate the device with a known user. |
| `page()` | Manually send a `pageview`. |
| `reset()` | Clear identity/session (e.g. on logout) and flush. |

## Standard lifecycle events

Typed helpers enforce consistent event names and property shapes across customers. Import from `@analyse.net/sdk` (browser) or `@analyse.net/sdk/events` (browser + server helpers).

| Event | Browser helper | Server helper |
| --- | --- | --- |
| `content_viewed` | `contentViewed()` | `captureContentViewed()` |
| `signup_completed` | `signedUp()` | `captureSignedUp()` |
| `checkout_started` | `checkoutStarted()` | `captureCheckoutStarted()` |
| `checkout_cancelled` | `checkoutCancelled()` | `captureCheckoutCancelled()` |
| `checkout_finished` | `checkoutFinished()` | `captureCheckoutFinished()` |
| `trial_started` | `trialStarted()` | `captureTrialStarted()` |
| `trial_ended` | `trialEnded()` | `captureTrialEnded()` |
| `subscription_cancelled` | `subscriptionCancelled()` | `captureSubscriptionCancelled()` |

### Checkout properties

All `checkout_*` events share a base shape with a required `payment_type`:

- `"one_time"` — single charge (no `billing_interval`)
- `"subscription"` — requires `billing_interval`: `"month"`, `"year"`, or `"week"`

Common optional fields: `checkout_id`, `amount` (minor units / cents), `currency` (ISO 4217), `product_id`, `plan`, `items_count`, `coupon`.

Use the same `checkout_id` across `checkout_started`, `checkout_cancelled`, and `checkout_finished` so funnels correlate correctly.

### Example: checkout funnel

```ts
import { init, identify, checkoutStarted, checkoutCancelled, checkoutFinished } from "@analyse.net/sdk";

init({ publicKey: "pk_live_your_key" });

const checkoutId = crypto.randomUUID();

checkoutStarted({
  checkout_id: checkoutId,
  payment_type: "subscription",
  plan: "pro",
  billing_interval: "month",
  amount: 4900,
  currency: "USD",
});

// On abandon:
checkoutCancelled({
  checkout_id: checkoutId,
  payment_type: "subscription",
  billing_interval: "month",
  reason: "user_abandoned",
  step: "payment",
});

// On success (browser — see trust model below):
checkoutFinished({
  checkout_id: checkoutId,
  payment_type: "subscription",
  billing_interval: "month",
  amount: 4900,
  currency: "USD",
  plan: "pro",
  subscription_id: "sub_123",
});
```

### Trust model for `checkout_finished`

- **Browser** — fine for prototyping and client-only apps.
- **Server (preferred)** — capture from Stripe webhooks or billing jobs so revenue data cannot be spoofed.

```ts
import { createServerClient, captureCheckoutFinished } from "@analyse.net/sdk/server";

const analyse = createServerClient({ publicKey: process.env.ANALYSE_KEY! });

captureCheckoutFinished(analyse, {
  personId: "user_123",
  properties: {
    checkout_id: checkoutId,
    payment_type: "subscription",
    billing_interval: "month",
    amount: 4900,
    currency: "USD",
    plan: "pro",
    subscription_id: "sub_123",
  },
});

await analyse.flush();
```

Pair lifecycle events with `identify()` after signup or login — do not put PII (email, name) in event properties.

### Content attribution (blog → signup)

Call `contentViewed()` on blog or doc pages with a stable `content_id` from your CMS or knowledge base (not just the URL slug). The SDK stores first-party touchpoints in `localStorage` and attaches first-touch / last-touch metadata to `signedUp()` automatically:

| Property (on `signup_completed`) | Description |
| --- | --- |
| `first_content_id` | First content piece viewed on this device |
| `last_content_id` | Most recently viewed content before signup |
| `content_touchpoint_count` | Distinct content pieces viewed |

Cross-session stitching still uses the anonymous device id plus `identify()` — content attribution adds the *which post* layer on top.

```ts
import { init, contentViewed, identify, signedUp } from "@analyse.net/sdk";

init({ publicKey: "pk_live_your_key" });

// On your blog post template:
contentViewed({
  content_id: "kb_page_abc123",
  content_type: "blog_post",
  title: "How we handle attribution",
});

// Days later, on signup:
identify(user.id);
signedUp({ method: "email" }); // includes first/last content metadata
```

Use `getContentAttribution()` if you need the same metadata on custom conversion events.

## Server-side (`@analyse.net/sdk/server`)

For trusted, backend-generated events (Stripe webhooks, API-side conversions). Runs in Node 18+ — all identity and context are supplied explicitly; there is no automatic tracking. Buffer events and `flush()` before the handler returns.

| Method | Description |
| --- | --- |
| `createServerClient(config)` | Create a server client (`publicKey`, `host?`, `maxBatchSize?`). |
| `capture(input)` | Buffer an event. Requires `personId` or `anonymousId`. |
| `captureSignedUp`, `captureCheckoutStarted`, … | Typed standard lifecycle captures. |
| `identify(personId, { anonymousId?, traits? })` | Record an identity association. |
| `flush()` | Send buffered events. Rejects on non-2xx (batch is re-buffered for retry). |
| `shutdown()` | Alias for `flush()`; call before a process exits. |

Set `maxBatchSize: 1` to send every event immediately.

### Config

```ts
type AnalyseConfig = {
  publicKey: string;        // required
  host?: string;            // ingest base URL, no trailing slash
  autoPageviews?: boolean;  // default true (incl. SPA route changes)
  autoPageLeave?: boolean;  // default true (time_on_page + scroll_depth)
  flushIntervalMs?: number; // default 5000
  maxBatchSize?: number;    // default 20
};
```

## What it collects

Automatically, per event: anonymous device id (first-party `localStorage`), session id (30-min inactivity window), URL/path/hostname, referrer, UTM parameters, and screen size. Device/browser/OS are derived server-side from the User-Agent — the SDK stays tiny and ships no UA-parsing code.

- `pageview` — on load and SPA navigations.
- `page_leave` — on tab hide/unload, with `time_on_page` (seconds) and `scroll_depth` (max %).
- `$identify` — when `identify()` is called, for server-side identity stitching.

Custom and standard lifecycle events use `track()` / typed helpers and appear in the Analyse dashboard, funnels, and conversion KPIs.

## License

MIT
