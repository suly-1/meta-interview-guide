import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

/** Derive the public origin from Express request headers (works behind Cloudflare/proxy). */
function getOrigin(req: Request): string {
  const proto =
    (req.headers["x-forwarded-proto"] as string)?.split(",")[0]?.trim() ??
    req.protocol;
  const host = req.headers["x-forwarded-host"] || req.headers.host || "localhost";
  return `${proto}://${host}`;
}

export function registerOAuthRoutes(app: Express) {
  /**
   * /manus-oauth/callback — intercepts the Manus platform-level OAuth gate.
   *
   * When the site is set to "Private", the Manus hosting platform redirects
   * all visitors through its own OAuth flow using this URI as the redirectUri.
   * After the platform authenticates the user it calls this endpoint with:
   *   ?code=<auth_code>&state=<base64(originalUrl)>
   *
   * We exchange the code (using this endpoint as the redirectUri), create an
   * app-level session cookie, and redirect the user to the original URL.
   */
  app.get("/manus-oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code) {
      res.status(400).json({ error: "code is required" });
      return;
    }

    // Decode the original URL from state (base64-encoded by the platform)
    let returnTo = "/";
    if (state) {
      try {
        const decoded = atob(state);
        // Only allow same-origin redirects for safety
        const origin = getOrigin(req);
        if (decoded.startsWith(origin) || decoded.startsWith("/")) {
          returnTo = decoded.startsWith(origin)
            ? decoded.slice(origin.length) || "/"
            : decoded;
        }
      } catch {
        returnTo = "/";
      }
    }

    try {
      const origin = getOrigin(req);
      const platformRedirectUri = `${origin}/manus-oauth/callback`;

      // sdk.exchangeCodeForToken decodes the state to get the redirectUri.
      // We pass a synthetic state that encodes the platform redirectUri.
      const syntheticState = btoa(platformRedirectUri);
      const tokenResponse = await sdk.exchangeCodeForToken(code, syntheticState);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      // Record login event for admin activity monitoring (fire-and-forget)
      const freshUser = await db.getUserByOpenId(userInfo.openId);
      if (freshUser?.id) {
        const ip =
          (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ??
          req.socket.remoteAddress;
        db.recordLoginEvent(freshUser.id, ip).catch(() => {});
      }

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      console.log(
        `[OAuth/platform] Session created for ${userInfo.openId} (${userInfo.name}), redirecting to ${returnTo}`
      );
      res.redirect(302, returnTo);
    } catch (error) {
      console.error("[OAuth/platform] Callback failed", error);
      // On failure, redirect to home so the user isn't stuck on a blank error page
      res.redirect(302, "/");
    }
  });

  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      // Record login event for admin activity monitoring (fire-and-forget)
      const freshUser = await db.getUserByOpenId(userInfo.openId);
      if (freshUser?.id) {
        const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ?? req.socket.remoteAddress;
        db.recordLoginEvent(freshUser.id, ip).catch(() => {});
      }

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
