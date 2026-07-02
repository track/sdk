const TOUCHPOINTS_KEY = "analyse_content_touchpoints";

/** Maximum content touchpoints retained per device for attribution. */
const MAX_TOUCHPOINTS = 10;

export type ContentTouchpoint = {
  content_id: string;
  content_type?: string;
  title?: string;
  /** ISO timestamp of the first view for this content id on this device. */
  first_seen_at: string;
  /** ISO timestamp of the most recent view for this content id on this device. */
  last_seen_at: string;
};

export type ContentAttribution = {
  first_content_id?: string;
  first_content_type?: string;
  first_content_title?: string;
  last_content_id?: string;
  last_content_type?: string;
  last_content_title?: string;
  content_touchpoint_count?: number;
};

type StoredTouchpoints = {
  touchpoints: ContentTouchpoint[];
  last_content_id?: string;
  last_content_type?: string;
  last_content_title?: string;
};

function readLocal(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeLocal(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage unavailable; touchpoints simply won't persist across loads.
  }
}

function removeLocal(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore.
  }
}

function readTouchpoints(): StoredTouchpoints {
  const raw = readLocal(TOUCHPOINTS_KEY);
  if (!raw) {
    return { touchpoints: [] };
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "touchpoints" in parsed &&
      Array.isArray(parsed.touchpoints)
    ) {
      const record = parsed as StoredTouchpoints;

      return {
        touchpoints: record.touchpoints,
        last_content_id:
          typeof record.last_content_id === "string" ? record.last_content_id : undefined,
        last_content_type:
          typeof record.last_content_type === "string" ? record.last_content_type : undefined,
        last_content_title:
          typeof record.last_content_title === "string" ? record.last_content_title : undefined,
      };
    }
  } catch {
    // Corrupt storage; start fresh.
  }

  return { touchpoints: [] };
}

function writeTouchpoints(data: StoredTouchpoints): void {
  writeLocal(TOUCHPOINTS_KEY, JSON.stringify(data));
}

function isValidTouchpoint(value: unknown): value is ContentTouchpoint {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  if (!("content_id" in value) || typeof value.content_id !== "string" || !value.content_id) {
    return false;
  }

  if ("content_type" in value && value.content_type !== undefined && typeof value.content_type !== "string") {
    return false;
  }

  if ("title" in value && value.title !== undefined && typeof value.title !== "string") {
    return false;
  }

  if (
    !("first_seen_at" in value) ||
    typeof value.first_seen_at !== "string" ||
    !("last_seen_at" in value) ||
    typeof value.last_seen_at !== "string"
  ) {
    return false;
  }

  return true;
}

function sanitizeTouchpoints(touchpoints: ContentTouchpoint[]): ContentTouchpoint[] {
  return touchpoints.filter(isValidTouchpoint).slice(-MAX_TOUCHPOINTS);
}

/**
 * Records a content view for cross-session attribution. Re-visiting the same
 * `content_id` updates `last_seen_at` without changing first-touch order.
 */
export function recordContentTouchpoint(input: {
  content_id: string;
  content_type?: string;
  title?: string;
}): void {
  if (typeof window === "undefined" || !input.content_id) {
    return;
  }

  const now = new Date().toISOString();
  const stored = readTouchpoints();
  const touchpoints = sanitizeTouchpoints(stored.touchpoints);
  const existingIndex = touchpoints.findIndex((item) => item.content_id === input.content_id);
  const existing = existingIndex >= 0 ? touchpoints[existingIndex] : undefined;
  const resolvedTitle = input.title ?? existing?.title;
  const resolvedType = input.content_type ?? existing?.content_type;

  if (existingIndex >= 0) {
    if (!existing) {
      return;
    }

    touchpoints[existingIndex] = {
      content_id: input.content_id,
      content_type: resolvedType,
      title: existing.title,
      first_seen_at: existing.first_seen_at,
      last_seen_at: now,
    };
  } else {
    touchpoints.push({
      content_id: input.content_id,
      content_type: resolvedType,
      title: resolvedTitle,
      first_seen_at: now,
      last_seen_at: now,
    });

    if (touchpoints.length > MAX_TOUCHPOINTS) {
      touchpoints.shift();
    }
  }

  writeTouchpoints({
    touchpoints,
    last_content_id: input.content_id,
    last_content_type: resolvedType,
    last_content_title: resolvedTitle,
  });
}

/** Returns first-touch and last-touch content metadata for conversion events. */
export function getContentAttribution(): ContentAttribution {
  if (typeof window === "undefined") {
    return {};
  }

  const stored = readTouchpoints();
  const touchpoints = sanitizeTouchpoints(stored.touchpoints);
  if (touchpoints.length === 0) {
    return {};
  }

  const first = touchpoints[0];
  if (!first) {
    return {};
  }

  return {
    first_content_id: first.content_id,
    first_content_type: first.content_type,
    first_content_title: first.title,
    last_content_id: stored.last_content_id ?? first.content_id,
    last_content_type: stored.last_content_type ?? first.content_type,
    last_content_title: stored.last_content_title ?? first.title,
    content_touchpoint_count: touchpoints.length,
  };
}

/** Clears stored content touchpoints (e.g. on logout via `reset()`). */
export function clearContentTouchpoints(): void {
  if (typeof window === "undefined") {
    return;
  }

  removeLocal(TOUCHPOINTS_KEY);
}
