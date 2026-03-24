export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

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

/**
 * Returns a navigation href that works in both server (path) and standalone (hash) modes.
 * In standalone mode (GitHub Pages), all routes use hash routing: #/path
 * Usage: <a href={route("/admin/feedback")}>Admin</a>
 */
export const route = (path: string): string => {
  if (import.meta.env.VITE_STANDALONE === "true") {
    return `#${path}`;
  }
  return path;
};
