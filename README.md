# @track/sdk

The official [Analyse](https://analyse.net) web analytics browser SDK. Lightweight, dependency-free, and privacy-friendly. Collects pageviews, session, and engagement signals (time on page, scroll depth) and batches them to the Analyse ingest endpoint.

## Install

### Script tag (zero-code)

```html
<script
  src="https://cdn.jsdelivr.net/npm/@track/sdk/dist/index.global.js"
  data-public-key="pk_live_your_key"
  defer
></script>
```

That's it — pageviews and page-leave signals are tracked automatically.

Optional data attributes:

- `data-host` — override the ingest host (defaults to the hosted Analyse ingest).
- `data-auto-pageviews="false"` — disable automatic pageview tracking.
- `data-auto-page-leave="false"` — disable automatic `page_leave` tracking.

### npm

```bash
npm install @track/sdk
```

```ts
import { init, track, identify } from "@track/sdk";

init({ publicKey: "pk_live_your_key" });

track("signup_started", { plan: "pro" });
identify("user_123", { email: "a@b.com" });
```

## Browser API

| Function | Description |
| --- | --- |
| `init(config)` | Initialize the client. Safe to call once. |
| `track(name, properties?)` | Record a custom event. |
| `identify(userId, traits?)` | Associate the device with a known user. |
| `page()` | Manually send a `pageview`. |
| `reset()` | Clear identity/session (e.g. on logout) and flush. |

## Server-side (`@track/sdk/server`)

For trusted, backend-generated events (Stripe webhooks, API-side conversions). Runs in Node 18+ — all identity and context are supplied explicitly; there is no automatic tracking. Buffer events and `flush()` before the handler returns.

```ts
import { createServerClient } from "@track/sdk/server";

const analyse = createServerClient({ publicKey: process.env.ANALYSE_KEY! });

// e.g. inside a Stripe webhook handler
analyse.capture({
  event: "purchase_completed",
  personId: "user_123",
  properties: { amount: 4900, currency: "usd", plan: "pro" },
});

await analyse.flush(); // send before the serverless function exits
```

| Method | Description |
| --- | --- |
| `createServerClient(config)` | Create a server client (`publicKey`, `host?`, `maxBatchSize?`). |
| `capture(input)` | Buffer an event. Requires `personId` or `anonymousId`. |
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

## License

MIT
