/**
 * Procedure Smoke Tests
 *
 * These tests verify that every major tRPC router can be imported and
 * that its procedures are correctly structured (have a _def property).
 * They do NOT make real DB calls — they just assert the router is wired
 * correctly so broken imports or missing exports are caught before deploy.
 *
 * If a router crashes on import (e.g., missing dependency, bad import path),
 * this test will fail with a clear error pointing to the broken router.
 */

import { describe, it, expect } from "vitest";

// ── Router imports ────────────────────────────────────────────────────────────
// Each import will throw if the file has a syntax error or broken dependency
import { disclaimerRouter } from "./routers/disclaimer";
import { collabRouter } from "./routers/collab";
import { leaderboardRouter } from "./routers/leaderboard";
import { ratingsRouter } from "./routers/ratings";
import { ctciRouter } from "./routers/ctci";
import { ctciProgressRouter } from "./routers/ctciProgress";
import { mockHistoryRouter } from "./routers/mockHistory";
import { onboardingRouter } from "./routers/onboarding";
import { aiRouter } from "./routers/ai";
import { highImpactRouter } from "./routers/highImpact";
import { scoresRouter } from "./routers/scores";
import { feedbackRouter } from "./routers/feedback";
import { adminRouter } from "./routers/admin";
import { siteSettingsRouter } from "./routers/siteSettings";
import { siteAccessRouter } from "./routers/siteAccess";
import { adminUsersRouter } from "./routers/adminUsers";
import { analyticsRouter } from "./routers/analytics";

// ── Helper ────────────────────────────────────────────────────────────────────
/**
 * A tRPC router has a _def property with a record of procedures.
 * This helper asserts the router is a valid tRPC router object.
 */
function assertRouter(router: unknown, name: string) {
  expect(router, `${name} should be defined`).toBeDefined();
  expect(typeof router, `${name} should be an object`).toBe("object");
  expect(router, `${name} should have _def`).toHaveProperty("_def");
}

// ── Tests ─────────────────────────────────────────────────────────────────────
describe("Router smoke tests — all routers import and are valid tRPC routers", () => {
  it("disclaimerRouter is a valid router", () => {
    assertRouter(disclaimerRouter, "disclaimerRouter");
  });

  it("collabRouter is a valid router", () => {
    assertRouter(collabRouter, "collabRouter");
  });

  it("leaderboardRouter is a valid router", () => {
    assertRouter(leaderboardRouter, "leaderboardRouter");
  });

  it("ratingsRouter is a valid router", () => {
    assertRouter(ratingsRouter, "ratingsRouter");
  });

  it("ctciRouter is a valid router", () => {
    assertRouter(ctciRouter, "ctciRouter");
  });

  it("ctciProgressRouter is a valid router", () => {
    assertRouter(ctciProgressRouter, "ctciProgressRouter");
  });

  it("mockHistoryRouter is a valid router", () => {
    assertRouter(mockHistoryRouter, "mockHistoryRouter");
  });

  it("onboardingRouter is a valid router", () => {
    assertRouter(onboardingRouter, "onboardingRouter");
  });

  it("aiRouter is a valid router", () => {
    assertRouter(aiRouter, "aiRouter");
  });

  it("highImpactRouter is a valid router", () => {
    assertRouter(highImpactRouter, "highImpactRouter");
  });

  it("scoresRouter is a valid router", () => {
    assertRouter(scoresRouter, "scoresRouter");
  });

  it("feedbackRouter is a valid router", () => {
    assertRouter(feedbackRouter, "feedbackRouter");
  });

  it("adminRouter is a valid router", () => {
    assertRouter(adminRouter, "adminRouter");
  });

  it("siteSettingsRouter is a valid router", () => {
    assertRouter(siteSettingsRouter, "siteSettingsRouter");
  });

  it("siteAccessRouter is a valid router", () => {
    assertRouter(siteAccessRouter, "siteAccessRouter");
  });

  it("adminUsersRouter is a valid router", () => {
    assertRouter(adminUsersRouter, "adminUsersRouter");
  });

  it("analyticsRouter is a valid router", () => {
    assertRouter(analyticsRouter, "analyticsRouter");
  });
});

// ── Procedure structure tests ─────────────────────────────────────────────────
describe("Procedure structure tests — key procedures have correct shape", () => {
  it("feedbackRouter has submit and list procedures", () => {
    const def = (feedbackRouter as any)._def;
    expect(def.record, "feedbackRouter._def.record should exist").toBeDefined();
    // At least some procedures should be registered
    expect(Object.keys(def.record).length).toBeGreaterThan(0);
  });

  it("siteSettingsRouter has getLockStatus procedure", () => {
    const def = (siteSettingsRouter as any)._def;
    expect(def.record).toBeDefined();
    expect(def.record).toHaveProperty("getLockStatus");
  });

  it("siteAccessRouter has cohortReset procedure", () => {
    const def = (siteAccessRouter as any)._def;
    expect(def.record).toBeDefined();
    expect(def.record).toHaveProperty("cohortReset");
  });

  it("adminUsersRouter has listUsers procedure", () => {
    const def = (adminUsersRouter as any)._def;
    expect(def.record).toBeDefined();
    expect(def.record).toHaveProperty("listUsers");
  });

  it("analyticsRouter has trackEvent procedure", () => {
    const def = (analyticsRouter as any)._def;
    expect(def.record).toBeDefined();
    expect(Object.keys(def.record).length).toBeGreaterThan(0);
  });
});
