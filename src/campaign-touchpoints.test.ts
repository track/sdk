import assert from "node:assert/strict";
import {
  clearCampaignTouchpoints,
  getCampaignAttribution,
  recordCampaignTouch,
} from "./campaign-touchpoints";

const storage = new Map<string, string>();

Object.defineProperty(globalThis, "window", {
  value: {
    localStorage: {
      getItem(key: string): string | null {
        return storage.get(key) ?? null;
      },
      setItem(key: string, value: string): void {
        storage.set(key, value);
      },
      removeItem(key: string): void {
        storage.delete(key);
      },
    },
  },
  configurable: true,
});

storage.clear();

// No UTM params → nothing recorded.
recordCampaignTouch({ referrer_domain: "google.com" });
assert.deepEqual(getCampaignAttribution(), {});

// First campaign landing sets both first and last touch.
recordCampaignTouch({
  utm_source: "twitter",
  utm_medium: "social",
  utm_campaign: "founding100",
  referrer_domain: "t.co",
});

const firstOnly = getCampaignAttribution();
assert.equal(firstOnly.first_utm_source, "twitter");
assert.equal(firstOnly.first_utm_campaign, "founding100");
assert.equal(firstOnly.first_referrer_domain, "t.co");
assert.equal(firstOnly.last_utm_source, "twitter");
assert.ok(firstOnly.first_touched_at);
const initialLastTouchedAt = firstOnly.last_touched_at;

// Re-recording the same campaign (every event on the landing page) is a no-op.
recordCampaignTouch({
  utm_source: "twitter",
  utm_medium: "social",
  utm_campaign: "founding100",
  referrer_domain: "t.co",
});
assert.equal(getCampaignAttribution().last_touched_at, initialLastTouchedAt);

// UTM-less navigation afterwards does not erase the stored touches.
recordCampaignTouch({ referrer_domain: "" });
assert.equal(getCampaignAttribution().last_utm_campaign, "founding100");

// A different campaign overwrites last touch but keeps first touch.
recordCampaignTouch({
  utm_source: "newsletter",
  utm_medium: "email",
  utm_campaign: "july_launch",
});

const twoCampaigns = getCampaignAttribution();
assert.equal(twoCampaigns.first_utm_source, "twitter");
assert.equal(twoCampaigns.first_utm_campaign, "founding100");
assert.equal(twoCampaigns.last_utm_source, "newsletter");
assert.equal(twoCampaigns.last_utm_campaign, "july_launch");
assert.equal(twoCampaigns.last_referrer_domain, undefined);

// Clearing removes everything.
clearCampaignTouchpoints();
assert.deepEqual(getCampaignAttribution(), {});

// Corrupt storage is tolerated and treated as empty.
storage.set("analyse_campaign_touch", "{not json");
assert.deepEqual(getCampaignAttribution(), {});
recordCampaignTouch({ utm_source: "bing" });
assert.equal(getCampaignAttribution().first_utm_source, "bing");

console.log("campaign touchpoints: ok");
