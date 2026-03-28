/**
 * adminToken — manages the admin secret token stored in localStorage.
 *
 * The token is read from the ?key= query parameter on first load, saved to
 * localStorage, and stripped from the URL. Subsequent visits to admin pages
 * do not require the ?key= parameter.
 *
 * Usage in tRPC calls:
 *   const headers = getAdminTokenHeaders();
 *   // pass as custom headers via trpc utils or fetch options
 */

const STORAGE_KEY = "admin_secret_token";

/**
 * Read the ?key= param from the URL (handles both regular query string and
 * hash fragment query string, e.g. /#/admin/settings?key=TOKEN).
 */
function extractKeyFromUrl(): string | null {
  // Check standard query string
  const params = new URLSearchParams(window.location.search);
  if (params.has("key")) return params.get("key");

  // Check hash fragment query string (e.g. /#/admin/settings?key=TOKEN)
  const hash = window.location.hash;
  const hashQueryIndex = hash.indexOf("?");
  if (hashQueryIndex !== -1) {
    const hashParams = new URLSearchParams(hash.slice(hashQueryIndex + 1));
    if (hashParams.has("key")) return hashParams.get("key");
  }

  return null;
}

/**
 * Strip the ?key= parameter from the URL without triggering a page reload.
 */
function stripKeyFromUrl(): void {
  // Standard query string
  const url = new URL(window.location.href);
  if (url.searchParams.has("key")) {
    url.searchParams.delete("key");
    window.history.replaceState(null, "", url.toString());
    return;
  }

  // Hash fragment query string
  const hash = window.location.hash;
  const hashQueryIndex = hash.indexOf("?");
  if (hashQueryIndex !== -1) {
    const path = hash.slice(0, hashQueryIndex);
    const hashParams = new URLSearchParams(hash.slice(hashQueryIndex + 1));
    if (hashParams.has("key")) {
      hashParams.delete("key");
      const newHash = hashParams.toString()
        ? `${path}?${hashParams.toString()}`
        : path;
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${newHash}`
      );
    }
  }
}

/**
 * Returns the stored admin token, or null if not set.
 * Also checks the URL for a ?key= param on first call and saves it.
 */
export function getAdminToken(): string | null {
  const fromUrl = extractKeyFromUrl();
  if (fromUrl) {
    localStorage.setItem(STORAGE_KEY, fromUrl);
    stripKeyFromUrl();
    return fromUrl;
  }
  return localStorage.getItem(STORAGE_KEY);
}

/**
 * Clear the stored admin token (e.g., on logout or token rotation).
 */
export function clearAdminToken(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Returns the x-admin-token header object for use in tRPC fetch options.
 * Returns an empty object if no token is stored.
 */
export function getAdminTokenHeaders(): Record<string, string> {
  const token = getAdminToken();
  if (!token) return {};
  return { "x-admin-token": token };
}
