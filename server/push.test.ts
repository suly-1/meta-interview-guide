/**
 * push.test.ts — validates VAPID key configuration and push router registration
 */

import { describe, it, expect } from "vitest";
import { ENV } from "./_core/env";
import { appRouter } from "./routers";

describe("Web Push configuration", () => {
  it("VAPID_PUBLIC_KEY is set and looks like a valid base64url key", () => {
    expect(ENV.vapidPublicKey).toBeTruthy();
    // VAPID public keys are 87-char base64url strings
    expect(ENV.vapidPublicKey.length).toBeGreaterThan(40);
    expect(ENV.vapidPublicKey).toMatch(/^[A-Za-z0-9_\-]+$/);
  });

  it("VAPID_PRIVATE_KEY is set", () => {
    expect(ENV.vapidPrivateKey).toBeTruthy();
    expect(ENV.vapidPrivateKey.length).toBeGreaterThan(10);
  });

  it("VAPID_EMAIL is set", () => {
    expect(ENV.vapidEmail).toBeTruthy();
    expect(ENV.vapidEmail).toContain("@");
  });

  it("push router is registered in appRouter", () => {
    expect(appRouter._def.procedures["push.getVapidPublicKey"]).toBeDefined();
    expect(appRouter._def.procedures["push.subscribe"]).toBeDefined();
    expect(appRouter._def.procedures["push.unsubscribe"]).toBeDefined();
    expect(appRouter._def.procedures["push.status"]).toBeDefined();
    expect(appRouter._def.procedures["push.sendDeploy"]).toBeDefined();
  });
});
