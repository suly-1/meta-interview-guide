/**
 * oauthNonce.ts — CSRF/replay protection for /manus-oauth/callback
 *
 * How it works
 * ─────────────
 * 1. When the Manus platform edge first redirects a browser to our app it also
 *    hits /manus-oauth/init (a new GET endpoint we register).  We issue a
 *    short-lived signed nonce and store it in a Set, then set it as a
 *    HttpOnly cookie on the browser.
 *
 * 2. When /manus-oauth/callback fires, we verify that:
 *    a. A nonce cookie is present.
 *    b. The nonce exists in our in-memory store (not expired, not replayed).
 *    c. The nonce is removed from the store immediately (one-time use).
 *
 * 3. If verification fails we return 403 — the browser is redirected to /
 *    so the user can try again (the platform will issue a fresh nonce cycle).
 *
 * Security properties
 * ────────────────────
 * • Bots that POST directly to /manus-oauth/callback without a browser session
 *   have no nonce cookie → 403.
 * • Replayed callback URLs (e.g. from logs or referrer headers) are rejected
 *   because the nonce is consumed on first use.
 * • Nonces expire after NONCE_TTL_MS even if never consumed.
 *
 * NOTE: This is an in-process store — nonces are lost on server restart.
 * That is acceptable: a restart simply forces the platform to issue a new
 * OAuth cycle, which is the normal recovery path.
 */

import crypto from "crypto";

const NONCE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const NONCE_COOKIE = "manus_oauth_nonce";

interface NonceEntry {
  expiresAt: number;
}

// In-memory nonce store (keyed by nonce value)
const nonceStore = new Map<string, NonceEntry>();

// Periodic cleanup — remove expired nonces every minute
setInterval(() => {
  const now = Date.now();
  nonceStore.forEach((entry, nonce) => {
    if (entry.expiresAt < now) nonceStore.delete(nonce);
  });
}, 60_000);

/** Generate a cryptographically random nonce and register it in the store. */
export function issueNonce(): string {
  const nonce = crypto.randomBytes(32).toString("hex");
  nonceStore.set(nonce, { expiresAt: Date.now() + NONCE_TTL_MS });
  return nonce;
}

/**
 * Validate and consume a nonce.
 * Returns true if the nonce was valid (present and not expired).
 * The nonce is removed from the store on first successful validation.
 */
export function consumeNonce(nonce: string | undefined): boolean {
  if (!nonce) return false;
  const entry = nonceStore.get(nonce);
  if (!entry) return false;
  if (entry.expiresAt < Date.now()) {
    nonceStore.delete(nonce);
    return false;
  }
  nonceStore.delete(nonce); // one-time use
  return true;
}

export { NONCE_COOKIE };
