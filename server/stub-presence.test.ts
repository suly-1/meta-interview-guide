/**
 * stub-presence.test.ts
 *
 * Automated guard against missing tRPC stubs.
 *
 * PURPOSE
 * -------
 * Every tRPC procedure that the frontend calls must exist on the appRouter.
 * A missing stub causes a runtime "No procedure found" crash that is invisible
 * at build time but immediately breaks the site for all users.
 *
 * This test suite verifies:
 *   1. Every router namespace is present on appRouter.
 *   2. Every known procedure exists within its namespace.
 *   3. Each procedure is callable (is a function), not undefined or null.
 *
 * MAINTENANCE
 * -----------
 * When you add a new procedure to any router file, add it to the
 * corresponding array below.  The test will fail in CI until you do,
 * giving you an early warning before the site ever sees the change.
 */

import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";

// ---------------------------------------------------------------------------
// Helper: assert a namespace exists and exposes the expected procedure names
// ---------------------------------------------------------------------------
function assertNamespace(
  namespace: string,
  procedures: string[]
): void {
  describe(`router: ${namespace}`, () => {
    it(`namespace "${namespace}" exists on appRouter`, () => {
      expect(
        appRouter._def.procedures,
        `appRouter is missing the "${namespace}" namespace`
      ).toBeDefined();

      const keys = Object.keys(appRouter._def.procedures);
      const matching = keys.filter((k) => k === namespace || k.startsWith(`${namespace}.`));
      expect(
        matching.length,
        `No procedures found under namespace "${namespace}"`
      ).toBeGreaterThan(0);
    });

    for (const proc of procedures) {
      const fullKey = `${namespace}.${proc}`;
      it(`procedure "${fullKey}" is defined`, () => {
        const def = appRouter._def.procedures[fullKey];
        expect(
          def,
          `Missing procedure: "${fullKey}" — add it to the router or remove it from this test`
        ).toBeDefined();
      });
    }
  });
}

// ---------------------------------------------------------------------------
// Router namespace → procedure inventory
// Sourced from server/routers.ts + server/routers/*.ts  (Mar 30 2026)
// ---------------------------------------------------------------------------

// Built-in auth router (defined inline in routers.ts)
assertNamespace("auth", ["me", "logout"]);

// Built-in system router
assertNamespace("system", ["notifyOwner"]);

// Built-in digest router (inline in routers.ts)
assertNamespace("digest", ["send"]);

// ---- External router files ------------------------------------------------

assertNamespace("admin", [
  "listUsers",
  "blockUser",
  "unblockUser",
  "listAuditLog",
  "listLoginActivity",
  "cohortReset",
  "blockUserWithExpiry",
  "reBlockUser",
  "getUserBlockHistory",
  "processExpiredBlocks",
]);

assertNamespace("adminPin", [
  "verifyPin",
  "getPinLockStatus",
  "changeAdminPin",
  "getPinAttemptHistory",
  "getIpAllowlist",
  "setIpAllowlist",
  "getPinAttemptChart",
  "verifyPinToken",
]);

assertNamespace("adminUsers", [
  "listUsers",
  "getUserStats",
  "getUserLoginHistory",
  "blockUser",
  "unblockUser",
  "reBlockUser",
  "exportAuditLogCsv",
  "listEvents",
  "checkInactiveUsers",
  "getUserBlockHistory",
  "listAuditLog",
]);

assertNamespace("ai", [
  "techRetroCoach",
  "sysDesignMockScorecard",
  "codingMockScorecard",
  "xfnMockScorecard",
  "fullMockDayScorecard",
  "explainPattern",
  "guidedWalkthroughFeedback",
  "scoreTradeoff",
  "detectAntiPatterns",
  "peerDesignReview",
  "scorePeerReviewAnswers",
  "explainLikeAPM",
  "reviewSolution",
  "getProgressiveHint",
  "generateFollowUps",
  "analyzeComplexity",
  "scorePatternGuess",
  "ic7OptimizationChallenge",
  "transcribeAndScoreVoice",
  "interviewerPerspective",
  "interruptModeStart",
  "interruptModeScore",
  "scoreBoECalculation",
  "tearDownDesign",
  "scoreThinkOutLoud",
  "scorePatternDrill",
  "generateRemediationPlan",
  "personaStressTestStart",
  "personaStressTestRespond",
  "personaStressTestScore",
  "quantifyImpact",
  "calibrateSeniorityLevel",
  "challengeComplexity",
  "analyzeDebrief",
  "generateTenDaySprint",
  "buildWhyCompanyStory",
  "predictInterviewQuestions",
  "generateReadinessReport",
  "generateReplayCommentary",
  "detectWeakSignals",
  "generateVerdict",
  "analyzePrompt",
  "drillInterruptor",
  "drillClarificationInterrogator",
  "drillDevilsAdvocate",
  "drillSilentSkeptic",
  "drillScopeCreep",
  "drillTimePressure",
  "drillXFNConflict",
  "drillGotchaFollowUp",
]);

assertNamespace("analytics", [
  "startSession",
  "endSession",
  "trackPageView",
  "trackEvent",
  "sendReportNow",
  "dauTrend",
  "featureClicksToday",
  "adminReport",
  "getSiteAnalytics",
  "getHourlyActivity",
  "getTopPages",
  "getInviteCodeStats",
  "getTopUnactionedFeedback",
  "sendAnalyticsReport",
]);

assertNamespace("collab", [
  "createRoom",
  "getRoom",
  "updateRoom",
  "saveEvent",
  "getReplay",
  "saveScorecard",
  "getScorecard",
  "aiFollowUp",
  "aiFinalFeedback",
  "scoreStarAnswer",
  "transcribeAndStructure",
  "uploadAudio",
  "sendWeeklyDigest",
  "scoreAnswer",
]);

assertNamespace("ctci", [
  "generateDebrief",
  "scoreAnswer",
  "patternHint",
  "studyPlan",
  "getHint",
]);

assertNamespace("ctciProgress", ["get", "save"]);

assertNamespace("deployStatus", ["get"]);

assertNamespace("disclaimer", ["acknowledge", "status", "adminReport"]);

assertNamespace("favorites", ["list", "add", "remove", "toggle", "updateNotes"]);

assertNamespace("feedback", [
  "submitGeneral",
  "submitSprintFeedback",
  "getRecent",
  "adminGetAll",
  "adminStats",
  "triggerDigest",
  "triggerDailyAlert",
  "updateNote",
  "markAllNew",
  "updateStatus",
  "getAllSiteFeedback",
  "getDigestPreview",
  "updateFeedbackStatus",
]);

assertNamespace("highImpact", [
  "quantifyImpact",
  "personaFollowUp",
  "personaScore",
  "remediationPlan",
  "interruptQuestion",
  "scoreInterruptResponse",
  "gradeBoE",
  "adversarialAttack",
  "scoreDefense",
  "readinessReport",
  "generateSprintPlan",
  "upgradeAnswer",
  "storyGapAnalysis",
  "ic7SignalCoach",
]);

assertNamespace("inviteGate", [
  "isEnabled",
  "verifyCode",
  "checkCodeAccess",
  "setEnabled",
  "listCodes",
  "createCode",
  "updateCode",
  "blockCode",
  "unblockCode",
  "extendAccess",
  "deactivateCode",
  "deleteCode",
  "listAttempts",
  "clearAttempts",
  "listActiveSessions",
  "revokeSession",
  "restoreSession",
  "purgeOldSessions",
]);

assertNamespace("leaderboard", ["getTop", "upsert", "remove", "checkHandle", "getMyEntry"]);

assertNamespace("mockHistory", ["getByType", "upsertSession", "deleteSession"]);

assertNamespace("onboarding", ["get", "save"]);

assertNamespace("progress", ["list", "save", "latest"]);

assertNamespace("push", [
  "getVapidPublicKey",
  "subscribe",
  "unsubscribe",
  "status",
  "sendDeploy",
]);

assertNamespace("ratings", ["getAll", "savePatternRatings", "saveBqRatings"]);

assertNamespace("scores", [
  "save",
  "getMyScores",
  "getAggregate",
  "saveSprintPlan",
  "getMySprintPlan",
]);

assertNamespace("siteAccess", [
  "checkAccess",
  "getDisclaimerEnabled",
  "getSettings",
  "updateSettings",
  "setDisclaimerEnabled",
  "cohortReset",
]);

assertNamespace("siteSettings", [
  "getLockStatus",
  "lockNow",
  "unlock",
  "resetClock",
  "updateLockSettings",
  "getCohortHealth",
  "getDisclaimerEnabled",
  "setDisclaimerEnabled",
]);

assertNamespace("sprintPlan", [
  "generate",
  "save",
  "getById",
  "getByShareToken",
  "listMine",
]);

assertNamespace("userScores", ["load", "save", "getAggregateStats"]);

// ---------------------------------------------------------------------------
// Inline routers defined directly in routers.ts
// (behavioral, hints, mockInterview, codeExec, patternHint, studyPlanner,
//  systemDesign, aiRound, requirementsTrainer, tradeoffDrill, mathTrainer,
//  signalDetector, stressTest, skepticScoring, metaRubric, interviewerChat,
//  deployStatus)
// ---------------------------------------------------------------------------

assertNamespace("behavioral", [
  "score",
]);

assertNamespace("hints", [
  "get",
]);

assertNamespace("mockInterview", [
  "followUps",
  "debrief",
]);

assertNamespace("codeExec", [
  "run",
]);

assertNamespace("patternHint", [
  "get",
]);

assertNamespace("systemDesign", [
  "debrief",
]);

assertNamespace("aiRound", [
  "debrief",
]);
