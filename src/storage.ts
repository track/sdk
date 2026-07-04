import { clearCampaignTouchpoints } from "./campaign-touchpoints";
import { clearContentTouchpoints } from "./content-touchpoints";

const ANON_KEY = "analyse_anon_id";
const PERSON_KEY = "analyse_person_id";
const SESSION_ID_KEY = "analyse_session_id";
const SESSION_TS_KEY = "analyse_session_ts";

/** Session inactivity timeout: a gap longer than this starts a new session. */
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

/**
 * Generates a RFC-4122 UUID, using the native crypto API when available and
 * falling back to a Math.random-based v4 otherwise.
 */
function uuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const rand = (Math.random() * 16) | 0;
    const value = char === "x" ? rand : (rand & 0x3) | 0x8;

    return value.toString(16);
  });
}

/**
 * Reads a localStorage value, tolerating environments where storage is
 * unavailable (private mode, blocked cookies).
 */
function readLocal(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** Writes a localStorage value, silently ignoring storage failures. */
function writeLocal(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage unavailable; ids simply won't persist across loads.
  }
}

/** Removes a localStorage value, silently ignoring failures. */
function removeLocal(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore.
  }
}

/**
 * Returns the persistent anonymous device id, creating one on first use.
 */
export function getAnonId(): string {
  const existing = readLocal(ANON_KEY);
  if (existing) {
    return existing;
  }

  const created = uuid();
  writeLocal(ANON_KEY, created);

  return created;
}

/** Returns the identified person id, if `identify` has been called. */
export function getPersonId(): string | undefined {
  return readLocal(PERSON_KEY) ?? undefined;
}

/** Persists the identified person id. */
export function setPersonId(personId: string): void {
  writeLocal(PERSON_KEY, personId);
}

/**
 * Returns the current session id, rotating it when the inactivity timeout has
 * elapsed. Every call refreshes the session's last-activity timestamp.
 */
export function getSessionId(): string {
  const now = Date.now();
  const lastTs = Number(readLocal(SESSION_TS_KEY) ?? 0);
  const existing = readLocal(SESSION_ID_KEY);

  const sessionId = existing && now - lastTs < SESSION_TIMEOUT_MS ? existing : uuid();

  writeLocal(SESSION_ID_KEY, sessionId);
  writeLocal(SESSION_TS_KEY, String(now));

  return sessionId;
}

/**
 * Clears identity and session state (e.g. on logout). The anonymous id is
 * regenerated on the next event.
 */
export function resetIdentity(): void {
  removeLocal(ANON_KEY);
  removeLocal(PERSON_KEY);
  removeLocal(SESSION_ID_KEY);
  removeLocal(SESSION_TS_KEY);
  clearContentTouchpoints();
  clearCampaignTouchpoints();
}
