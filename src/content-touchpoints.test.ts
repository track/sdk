import assert from "node:assert/strict";
import { getContentAttribution, recordContentTouchpoint } from "./content-touchpoints";

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

recordContentTouchpoint({
  content_id: "post_a",
  content_type: "blog_post",
  title: "First post",
});

const firstOnly = getContentAttribution();
assert.equal(firstOnly.first_content_id, "post_a");
assert.equal(firstOnly.last_content_id, "post_a");
assert.equal(firstOnly.content_touchpoint_count, 1);

recordContentTouchpoint({
  content_id: "post_b",
  content_type: "blog_post",
  title: "Second post",
});

const twoPosts = getContentAttribution();
assert.equal(twoPosts.first_content_id, "post_a");
assert.equal(twoPosts.last_content_id, "post_b");
assert.equal(twoPosts.content_touchpoint_count, 2);

recordContentTouchpoint({
  content_id: "post_a",
  title: "First post (updated title)",
});

const revisit = getContentAttribution();
assert.equal(revisit.first_content_id, "post_a");
assert.equal(revisit.last_content_id, "post_a");
assert.equal(revisit.first_content_title, "First post");
assert.equal(revisit.last_content_title, "First post (updated title)");
assert.equal(revisit.content_touchpoint_count, 2);

console.log("content touchpoints: ok");
