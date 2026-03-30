/**
 * Layer 1: Authentication & Access Control Audit
 *
 * Verifies that every tRPC procedure in every router uses the correct
 * procedure type. Any mismatch between expected and actual access level
 * is a security finding that must be fixed before publishing.
 *
 * Procedure type hierarchy (most → least privileged):
 *   ownerProcedure      — Manus OAuth session + role=admin (site owner only)
 *   adminProcedure      — Manus OAuth session + role=admin
 *   tokenAdminProcedure — x-admin-token header OR Manus OAuth admin session
 *   protectedProcedure  — any authenticated Manus OAuth session
 *   publicProcedure     — no authentication required
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const ROOT = resolve(__dirname, "..");

/** Read a router file and return its raw source */
function readRouter(relPath: string): string {
  return readFileSync(resolve(ROOT, relPath), "utf-8");
}

/** Extract all procedure definitions from source: returns array of { name, type } */
function extractProcedures(
  source: string
): Array<{ name: string; type: string }> {
  const results: Array<{ name: string; type: string }> = [];
  // Match patterns like: `  procedureName: publicProcedure` or `  procedureName: tokenAdminProcedure`
  const re =
    /^\s{2,4}([a-zA-Z_][a-zA-Z0-9_]*):\s+(publicProcedure|protectedProcedure|tokenAdminProcedure|adminProcedure|ownerProcedure)/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(source)) !== null) {
    results.push({ name: m[1], type: m[2] });
  }
  return results;
}

// ---------------------------------------------------------------------------
// Expected access levels — the ground truth for this codebase.
// If you intentionally change a procedure's access level, update this map.
// ---------------------------------------------------------------------------

const EXPECTED: Record<string, Record<string, string>> = {
  // inviteGate router
  "server/routers/inviteGate.ts": {
    isEnabled: "publicProcedure",
    checkCodeAccess: "publicProcedure",
    verifyCode: "publicProcedure",
    setEnabled: "tokenAdminProcedure",
    listCodes: "tokenAdminProcedure",
    createCode: "tokenAdminProcedure",
    updateCode: "tokenAdminProcedure",
    blockCode: "tokenAdminProcedure",
    unblockCode: "tokenAdminProcedure",
    extendAccess: "tokenAdminProcedure",
    deactivateCode: "tokenAdminProcedure",
    deleteCode: "tokenAdminProcedure",
    listAttempts: "tokenAdminProcedure",
    clearAttempts: "tokenAdminProcedure",
    listActiveSessions: "tokenAdminProcedure",
    revokeSession: "tokenAdminProcedure",
    restoreSession: "tokenAdminProcedure",
    purgeOldSessions: "tokenAdminProcedure",
  },
  // siteAccess router
  "server/routers/siteAccess.ts": {
    checkAccess: "publicProcedure",
    getDisclaimerEnabled: "publicProcedure",
    getSettings: "ownerProcedure",
    updateSettings: "ownerProcedure",
    setDisclaimerEnabled: "ownerProcedure",
    cohortReset: "ownerProcedure",
  },
  // siteSettings router
  "server/routers/siteSettings.ts": {
    getLockStatus: "publicProcedure",
    lockNow: "tokenAdminProcedure",
    unlock: "tokenAdminProcedure",
    resetClock: "tokenAdminProcedure",
    updateLockSettings: "tokenAdminProcedure",
    getCohortHealth: "ownerProcedure",
    getDisclaimerEnabled: "publicProcedure",
    setDisclaimerEnabled: "ownerProcedure",
  },
  // adminPin router
  "server/routers/adminPin.ts": {
    verifyPin: "publicProcedure",
    getPinLockStatus: "publicProcedure",
    verifyPinToken: "publicProcedure",
    changeAdminPin: "ownerProcedure",
    getPinAttemptHistory: "ownerProcedure",
    getIpAllowlist: "ownerProcedure",
    setIpAllowlist: "ownerProcedure",
    getPinAttemptChart: "ownerProcedure",
  },
  // adminUsers router
  "server/routers/adminUsers.ts": {
    listUsers: "ownerProcedure",
    getUserStats: "ownerProcedure",
    getUserLoginHistory: "ownerProcedure",
    blockUser: "ownerProcedure",
    unblockUser: "ownerProcedure",
    reBlockUser: "ownerProcedure",
    exportAuditLogCsv: "ownerProcedure",
    listEvents: "ownerProcedure",
    checkInactiveUsers: "ownerProcedure",
    getUserBlockHistory: "ownerProcedure",
    listAuditLog: "ownerProcedure",
  },
  // admin router
  "server/routers/admin.ts": {
    listUsers: "ownerProcedure",
    blockUser: "ownerProcedure",
    unblockUser: "ownerProcedure",
    listAuditLog: "ownerProcedure",
    listLoginActivity: "ownerProcedure",
    cohortReset: "ownerProcedure",
    blockUserWithExpiry: "ownerProcedure",
    reBlockUser: "ownerProcedure",
    getUserBlockHistory: "ownerProcedure",
    processExpiredBlocks: "ownerProcedure",
  },
  // feedback router
  "server/routers/feedback.ts": {
    submitGeneral: "publicProcedure",
    submitSprintFeedback: "publicProcedure",
    getRecent: "publicProcedure",
    adminGetAll: "adminProcedure",
    adminStats: "adminProcedure",
    triggerDigest: "adminProcedure",
    triggerDailyAlert: "adminProcedure",
    updateNote: "adminProcedure",
    markAllNew: "adminProcedure",
    updateStatus: "adminProcedure",
    getAllSiteFeedback: "adminProcedure",
    getDigestPreview: "adminProcedure",
    updateFeedbackStatus: "adminProcedure",
  },
  // analytics router
  "server/routers/analytics.ts": {
    startSession: "publicProcedure",
    endSession: "publicProcedure",
    trackPageView: "publicProcedure",
    trackEvent: "publicProcedure",
    featureClicksToday: "publicProcedure",
    sendReportNow: "adminProcedure",
    dauTrend: "adminProcedure",
    adminReport: "adminProcedure",
    getSiteAnalytics: "adminProcedure",
    getHourlyActivity: "adminProcedure",
    getTopPages: "adminProcedure",
    getInviteCodeStats: "adminProcedure",
    getTopUnactionedFeedback: "adminProcedure",
    sendAnalyticsReport: "adminProcedure",
  },
  // disclaimer router
  "server/routers/disclaimer.ts": {
    acknowledge: "protectedProcedure",
    status: "publicProcedure",
    adminReport: "ownerProcedure",
  },
  // push router
  "server/routers/push.ts": {
    getVapidPublicKey: "publicProcedure",
    subscribe: "protectedProcedure",
    unsubscribe: "protectedProcedure",
    status: "protectedProcedure",
    sendDeploy: "ownerProcedure",
  },
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Layer 1: Authentication & Access Control Audit", () => {
  for (const [routerPath, expectedProcs] of Object.entries(EXPECTED)) {
    describe(`Router: ${routerPath}`, () => {
      const source = readRouter(routerPath);
      const actual = extractProcedures(source);
      const actualMap = Object.fromEntries(actual.map((p) => [p.name, p.type]));

      for (const [procName, expectedType] of Object.entries(expectedProcs)) {
        it(`${procName} uses ${expectedType}`, () => {
          expect(
            actualMap[procName],
            `Procedure "${procName}" in ${routerPath}: expected "${expectedType}" but got "${actualMap[procName] ?? "NOT FOUND"}". ` +
              `If this was intentional, update the EXPECTED map in security.auth-audit.test.ts.`
          ).toBe(expectedType);
        });
      }
    });
  }

  it("no procedure in inviteGate uses ownerProcedure (must use tokenAdminProcedure for API access)", () => {
    const source = readRouter("server/routers/inviteGate.ts");
    const hasOwner = /ownerProcedure/.test(source.replace(/\/\/.*/g, "").replace(/\/\*[\s\S]*?\*\//g, ""));
    expect(hasOwner, "inviteGate.ts must not use ownerProcedure — use tokenAdminProcedure instead so the admin token header works").toBe(false);
  });

  it("panic button procedures (lockNow, unlock) use tokenAdminProcedure not adminProcedure", () => {
    // lockNow and unlock live in siteSettings.ts, not inviteGate.ts
    const source = readRouter("server/routers/siteSettings.ts");
    const lockNowMatch = source.match(/lockNow:\s+(\w+Procedure)/);
    const unlockMatch = source.match(/unlock:\s+(\w+Procedure)/);
    expect(lockNowMatch?.[1], "lockNow must use tokenAdminProcedure").toBe("tokenAdminProcedure");
    expect(unlockMatch?.[1], "unlock must use tokenAdminProcedure").toBe("tokenAdminProcedure");
  });
});
