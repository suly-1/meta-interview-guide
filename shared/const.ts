export const COOKIE_NAME = "app_session_id";
export const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365;

// ── Site identity ────────────────────────────────────────────────────────────
// Used to apply site-specific branding (color palette, favicon, wordmark).
// Injected at build time via VITE_SITE_ID env var in vite.standalone.config.ts.
// "metaengguide-pro"  → deep blue + gold  (serious exam prep)
// "metaguide-blog"    → warm green + amber (community hub)
export const SITE_ID = (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_SITE_ID as string) ?? "metaengguide-pro";
export const IS_METAGUIDE_BLOG = SITE_ID === "metaguide-blog";
