export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

/**
 * route(path) — returns the correct href for a given path.
 * In standalone/hash-router mode it prepends "#"; in server mode it returns the path as-is.
 */
export function route(path: string): string {
  if (typeof window !== "undefined") {
    const isHashMode =
      window.location.pathname.endsWith(".html") ||
      (window.location.hash.startsWith("#/") &&
        window.location.pathname === "/");
    if (isHashMode) return `#${path}`;
  }
  return path;
}

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};
