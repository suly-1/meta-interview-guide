/**
 * adminToken — reads the admin secret token from the URL (?key=...) and
 * persists it in localStorage so subsequent page loads don't need the query param.
 *
 * Usage:
 *   import { getAdminToken } from "@/lib/adminToken";
 *   const token = getAdminToken(); // "" if not set
 */

const STORAGE_KEY = "admin_token";

/**
 * On first call, checks the URL for ?key=... and saves it to localStorage.
 * Returns the stored token (or "" if none).
 */
export function getAdminToken(): string {
  if (typeof window === "undefined") return "";

  // Check URL for ?key= param and persist it
  const params = new URLSearchParams(window.location.search);
  const urlKey = params.get("key");
  if (urlKey) {
    localStorage.setItem(STORAGE_KEY, urlKey);
    // Clean the key from the URL without a page reload
    params.delete("key");
    const newSearch = params.toString();
    const newUrl =
      window.location.pathname + (newSearch ? `?${newSearch}` : "") + window.location.hash;
    window.history.replaceState({}, "", newUrl);
  }

  return localStorage.getItem(STORAGE_KEY) ?? "";
}

/** Clear the stored admin token (e.g. for testing). */
export function clearAdminToken(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
  }
}
