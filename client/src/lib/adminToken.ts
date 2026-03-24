/**
 * adminToken — reads the admin secret token from the URL (?key=...) and
 * persists it in localStorage so subsequent page loads don't need the query param.
 *
 * Works with both standard routing (/admin/feedback?key=X) and
 * hash-based routing (/#/admin/feedback?key=X).
 */
const STORAGE_KEY = "admin_token";

/**
 * On first call, checks the URL for ?key= param (in both search and hash) and saves it to localStorage.
 * Returns the stored token (or "" if none).
 */
export function getAdminToken(): string {
  if (typeof window === "undefined") return "";

  // 1. Check window.location.search (standard routing: /admin/feedback?key=X)
  const searchParams = new URLSearchParams(window.location.search);
  const keyFromSearch = searchParams.get("key");

  // 2. Check the hash fragment for query params (hash routing: /#/admin/feedback?key=X)
  const hash = window.location.hash; // e.g. "#/admin/feedback?key=X"
  const hashQueryIndex = hash.indexOf("?");
  const hashParams = hashQueryIndex >= 0
    ? new URLSearchParams(hash.slice(hashQueryIndex + 1))
    : new URLSearchParams();
  const keyFromHash = hashParams.get("key");

  const urlKey = keyFromSearch || keyFromHash;

  if (urlKey) {
    localStorage.setItem(STORAGE_KEY, urlKey);

    // Clean the key from the URL without a page reload
    if (keyFromSearch) {
      searchParams.delete("key");
      const newSearch = searchParams.toString();
      const newUrl =
        window.location.pathname +
        (newSearch ? `?${newSearch}` : "") +
        window.location.hash;
      window.history.replaceState({}, "", newUrl);
    } else if (keyFromHash) {
      hashParams.delete("key");
      const newHashQuery = hashParams.toString();
      const hashPath = hash.slice(1, hashQueryIndex >= 0 ? hashQueryIndex : undefined);
      const newHash = "#" + hashPath + (newHashQuery ? `?${newHashQuery}` : "");
      window.history.replaceState({}, "", window.location.pathname + window.location.search + newHash);
    }
  }

  return localStorage.getItem(STORAGE_KEY) ?? "";
}

/** Clear the stored admin token (e.g. for testing). */
export function clearAdminToken(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
  }
}
