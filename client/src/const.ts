export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

/**
 * route() — type-safe route helper for wouter navigation.
 * Returns the path as-is; useful for centralizing route definitions.
 * Usage: route("/admin/feedback") or route("/admin/users")
 */
export const route = (path: string) => path;

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
