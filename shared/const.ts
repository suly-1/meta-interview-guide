export const COOKIE_NAME = "app_session_id";
export const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365;

// ── Site identity ────────────────────────────────────────────────────────────
// Site ID string constants — safe to import from both client and server code.
// Frontend components read the active site ID via: import.meta.env.VITE_SITE_ID
// (injected at build time by vite.standalone.config.ts).
// Do NOT use import.meta.env here — this file is also imported by server-side code.
export const METAENGGUIDE_PRO_SITE_ID = "metaengguide-pro";
export const METAGUIDE_BLOG_SITE_ID = "metaguide-blog";

// ── tRPC / auth constants ────────────────────────────────────────────────────
export const AXIOS_TIMEOUT_MS = 30_000;
export const UNAUTHED_ERR_MSG = "Please login (10001)";
export const NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";
