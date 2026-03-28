import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  json,
  bigint,
  boolean,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  disclaimerAcknowledgedAt: timestamp("disclaimerAcknowledgedAt"),
  /** When set to true, the user is blocked from accessing the site */
  blocked: int("blocked").default(0).notNull(),
  /** Optional reason recorded by the owner when blocking a user */
  blockReason: text("blockReason"),
  /** If set, the block auto-expires at this timestamp */
  blockedUntil: timestamp("blockedUntil"),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ── Collab Rooms ──────────────────────────────────────────────────────────
export const collabRooms = mysqlTable("collab_rooms", {
  id: int("id").autoincrement().primaryKey(),
  roomCode: varchar("roomCode", { length: 16 }).notNull().unique(),
  questionId: varchar("questionId", { length: 64 }),
  questionTitle: text("questionTitle"),
  mode: mysqlEnum("mode", ["human", "ai"]).default("human").notNull(),
  status: mysqlEnum("status", ["waiting", "active", "ended"])
    .default("waiting")
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  endedAt: timestamp("endedAt"),
});
export type CollabRoom = typeof collabRooms.$inferSelect;

// ── Session Events (for replay) ───────────────────────────────────────────
export const sessionEvents = mysqlTable("session_events", {
  id: int("id").autoincrement().primaryKey(),
  roomCode: varchar("roomCode", { length: 16 }).notNull(),
  eventType: varchar("eventType", { length: 32 }).notNull(),
  payload: json("payload").notNull(),
  actorName: varchar("actorName", { length: 128 }),
  ts: bigint("ts", { mode: "number" }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type SessionEvent = typeof sessionEvents.$inferSelect;

// ── Scorecards ────────────────────────────────────────────────────────────
export const scorecards = mysqlTable("scorecards", {
  id: int("id").autoincrement().primaryKey(),
  roomCode: varchar("roomCode", { length: 16 }).notNull(),
  scorerName: varchar("scorerName", { length: 128 }),
  candidateName: varchar("candidateName", { length: 128 }),
  requirementsScore: int("requirementsScore").notNull().default(3),
  architectureScore: int("architectureScore").notNull().default(3),
  scalabilityScore: int("scalabilityScore").notNull().default(3),
  communicationScore: int("communicationScore").notNull().default(3),
  overallFeedback: text("overallFeedback"),
  aiCoachingNote: text("aiCoachingNote"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Scorecard = typeof scorecards.$inferSelect;

// ── Leaderboard ────────────────────────────────────────────────────────────
export const leaderboardEntries = mysqlTable("leaderboard_entries", {
  id: int("id").autoincrement().primaryKey(),
  anonHandle: varchar("anonHandle", { length: 32 }).notNull(),
  streakDays: int("streakDays").notNull().default(0),
  patternsMastered: int("patternsMastered").notNull().default(0),
  mockSessions: int("mockSessions").notNull().default(0),
  overallPct: int("overallPct").notNull().default(0),
  badges: json("badges").notNull().$type<string[]>().default([]),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type LeaderboardEntry = typeof leaderboardEntries.$inferSelect;

// ── Onboarding Progress ───────────────────────────────────────────────────
export const onboardingProgress = mysqlTable("onboarding_progress", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  progress: json("progress").notNull().$type<Record<string, boolean>>(),
  dismissed: int("dismissed").notNull().default(0), // 0 = false, 1 = true
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type OnboardingProgress = typeof onboardingProgress.$inferSelect;

// ── User Ratings (pattern + behavioral question ratings) ─────────────────────
export const userRatings = mysqlTable("user_ratings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  ratingType: varchar("ratingType", { length: 32 }).notNull(), // 'pattern' | 'bq'
  ratings: json("ratings").notNull().$type<Record<string, number>>(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type UserRating = typeof userRatings.$inferSelect;

// ── CTCI Progress (solved state + self-difficulty estimates) ────────────────────
export const ctciProgress = mysqlTable("ctci_progress", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  solved: json("solved").notNull().$type<Record<string, boolean>>(),
  difficulty: json("difficulty").notNull().$type<Record<string, string>>(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type CtciProgress = typeof ctciProgress.$inferSelect;

// ── Mock Session History (Coding, System Design, XFN) ───────────────────────
export const mockSessions = mysqlTable("mock_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  sessionType: varchar("sessionType", { length: 32 }).notNull(), // 'coding' | 'sd' | 'xfn'
  sessionId: varchar("sessionId", { length: 64 }).notNull(), // client-generated nanoid
  sessionData: json("sessionData").notNull().$type<Record<string, unknown>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type MockSession = typeof mockSessions.$inferSelect;

// ── User Feedback (general site + sprint plan suggestions) ─────────────────
export const feedback = mysqlTable("feedback", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  feedbackType: mysqlEnum("feedbackType", ["general", "sprint_plan"])
    .notNull()
    .default("general"),
  category: mysqlEnum("category", [
    "bug",
    "feature_request",
    "content",
    "ux",
    "other",
  ])
    .notNull()
    .default("other"),
  message: text("message").notNull(),
  page: varchar("page", { length: 64 }),
  status: mysqlEnum("status", ["new", "in_progress", "done", "dismissed"])
    .notNull()
    .default("new"),
  metadata: json("metadata").$type<Record<string, unknown>>().default({}),
  adminNote: text("admin_note"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Feedback = typeof feedback.$inferSelect;

// ── User Score Snapshots (cross-device persistent scores) ─────────────────
export const userScores = mysqlTable("user_scores", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  patternRatings: json("patternRatings")
    .notNull()
    .$type<Record<string, number>>()
    .default({}),
  behavioralRatings: json("behavioralRatings")
    .notNull()
    .$type<Record<string, number>>()
    .default({}),
  starNotes: json("starNotes")
    .notNull()
    .$type<Record<string, string>>()
    .default({}),
  patternTime: json("patternTime")
    .notNull()
    .$type<Record<string, number>>()
    .default({}),
  interviewDate: varchar("interviewDate", { length: 16 }),
  targetLevel: varchar("targetLevel", { length: 8 }),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type UserScores = typeof userScores.$inferSelect;

// ── Sprint Plans (7-day generated plans) ─────────────────────────────────
export const sprintPlans = mysqlTable("sprint_plans", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  planId: varchar("planId", { length: 64 }).notNull().unique(),
  targetLevel: varchar("targetLevel", { length: 8 }),
  timeline: varchar("timeline", { length: 32 }),
  planData: json("planData").notNull().$type<Record<string, unknown>>(),
  shareToken: varchar("shareToken", { length: 64 }).unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type SprintPlan = typeof sprintPlans.$inferSelect;

// ── Site Analytics ────────────────────────────────────────────────────────
// Lightweight first-party analytics: page views, sessions, feature events.
// No PII stored — userId is optional and device/browser info is aggregated.

export const analyticsPageViews = mysqlTable("analytics_page_views", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: varchar("sessionId", { length: 64 }).notNull(),
  userId: int("userId"), // null = anonymous
  page: varchar("page", { length: 128 }).notNull(), // e.g. "overview", "coding"
  referrer: varchar("referrer", { length: 256 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type AnalyticsPageView = typeof analyticsPageViews.$inferSelect;

export const analyticsSessions = mysqlTable("analytics_sessions", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: varchar("sessionId", { length: 64 }).notNull().unique(),
  userId: int("userId"),
  deviceType: mysqlEnum("deviceType", ["desktop", "tablet", "mobile"]).default(
    "desktop"
  ),
  browser: varchar("browser", { length: 64 }),
  os: varchar("os", { length: 64 }),
  country: varchar("country", { length: 64 }),
  durationSeconds: int("durationSeconds").default(0), // updated on session end
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  endedAt: timestamp("endedAt"),
});
export type AnalyticsSession = typeof analyticsSessions.$inferSelect;

export const analyticsEvents = mysqlTable("analytics_events", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: varchar("sessionId", { length: 64 }).notNull(),
  userId: int("userId"),
  eventName: varchar("eventName", { length: 128 }).notNull(), // e.g. "feature_click:sprint_plan"
  page: varchar("page", { length: 128 }),
  metadata: json("metadata").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;

// ── APEX Picks Sets (weekly rotating featured tool recommendations) ──────────
// Each row is one "set" of picks. The active set for any given week is
// determined by the weekIndex field (ISO week number) or the isActive flag.
// Admin can create multiple sets and mark one as active; the system also
// auto-rotates by week number when no explicit active set is found.
export const apexPicksSets = mysqlTable("apex_picks_sets", {
  id: int("id").autoincrement().primaryKey(),
  weekLabel: varchar("weekLabel", { length: 64 }).notNull(), // e.g. "Week of Mar 24"
  picks: json("picks").notNull().$type<ApexPick[]>(), // array of pick objects
  isActive: int("isActive").notNull().default(0), // 1 = manually pinned active
  weekIndex: int("weekIndex"), // ISO week number (1-52) for auto-rotation
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ApexPicksSet = typeof apexPicksSets.$inferSelect;

// ── Favorite Questions ──────────────────────────────────────────────────────
// Users can bookmark any coding pattern, behavioral question, or system design
// topic for later focused practice.
export const favoriteQuestions = mysqlTable("favorite_questions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  questionId: varchar("questionId", { length: 128 }).notNull(), // e.g. "two-pointers" or "bq-conflict-1"
  questionType: mysqlEnum("questionType", [
    "coding",
    "behavioral",
    "design",
    "ctci",
  ])
    .notNull()
    .default("coding"),
  questionText: text("questionText").notNull(), // display label
  notes: text("notes"), // optional personal note
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type FavoriteQuestion = typeof favoriteQuestions.$inferSelect;

// ── Progress Snapshots (daily readiness snapshots for trend charts) ───────────
// Taken automatically when user saves scores or manually via the tracker.
export const progressSnapshots = mysqlTable("progress_snapshots", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  snapshotDate: varchar("snapshotDate", { length: 16 }).notNull(), // YYYY-MM-DD
  codingPct: int("codingPct").notNull().default(0), // 0-100
  behavioralPct: int("behavioralPct").notNull().default(0),
  overallPct: int("overallPct").notNull().default(0),
  streakDays: int("streakDays").notNull().default(0),
  mockSessionCount: int("mockSessionCount").notNull().default(0),
  patternsMastered: int("patternsMastered").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ProgressSnapshot = typeof progressSnapshots.$inferSelect;

export interface ApexPick {
  id: string; // unique slug, e.g. "full-mock-day"
  title: string;
  description: string;
  tab: string; // "overview" | "coding" | "behavioral" | "design" | "collab"
  section?: string; // optional deep-link section param
  icon: string; // emoji or icon name
  badge?: string; // optional badge text, e.g. "New" | "Hot" | "AI"
  badgeColor?: string; // "blue" | "green" | "amber" | "red" | "purple"
}

// ── Site Settings (access gate & global config) ───────────────────────────────
// Single-row table (id=1). Controls the 60-day auto-lock and manual lock toggle.
export const siteSettings = mysqlTable("site_settings", {
  id: int("id").autoincrement().primaryKey(),
  /** When the 60-day clock started (ISO date string YYYY-MM-DD). Null = no auto-lock. */
  lockStartDate: varchar("lockStartDate", { length: 16 }),
  /** Number of days before auto-lock kicks in. Default 60. */
  lockDays: int("lockDays").notNull().default(60),
  /** If true, the site is manually locked regardless of the date. */
  manualLockEnabled: int("manualLockEnabled").notNull().default(0), // 0=off, 1=on
  /** Custom message shown on the locked gate screen. */
  lockMessage: text("lockMessage"),
  /**
   * When 0, the disclaimer gate is hidden for all users (owner can toggle it off).
   * Default 1 = disclaimer is shown.
   */
  disclaimerEnabled: int("disclaimerEnabled").notNull().default(1),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type SiteSettings = typeof siteSettings.$inferSelect;

// ── User Events (admin audit log) ────────────────────────────────────────────
// Immutable append-only log of admin actions (block/unblock, role changes, etc.)
export const userEvents = mysqlTable("user_events", {
  id: int("id").autoincrement().primaryKey(),
  /** The admin/owner who performed the action */
  actorId: int("actorId").notNull(),
  actorName: varchar("actorName", { length: 128 }),
  /** The user the action was performed on */
  targetId: int("targetId").notNull(),
  targetName: varchar("targetName", { length: 128 }),
  /** e.g. 'block' | 'unblock' | 'role_change' */
  eventType: varchar("eventType", { length: 32 }).notNull(),
  /** Optional extra context (reason, old/new value, etc.) */
  metadata: json("metadata").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type UserEvent = typeof userEvents.$inferSelect;

// ── Login Events (per-user login history) ────────────────────────────────────
// Lightweight append-only log of successful logins. Used for the admin
// login activity view and inactivity detection.
export const loginEvents = mysqlTable("login_events", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type LoginEvent = typeof loginEvents.$inferSelect;

// ── Admin PIN Attempts (security audit log) ───────────────────────────────────
// Records every failed PIN attempt so the owner can detect brute-force attacks.
// Successful unlocks are NOT logged here to avoid storing sensitive timing data.
export const pinAttempts = mysqlTable("pin_attempts", {
  id: int("id").autoincrement().primaryKey(),
  /** IP address of the requester (IPv4 or IPv6). Stored for audit purposes only. */
  ip: varchar("ip", { length: 64 }).notNull(),
  /** Whether the attempt succeeded (0 = failed, 1 = success). Only failures are inserted. */
  succeeded: int("succeeded").notNull().default(0),
  attemptedAt: timestamp("attemptedAt").defaultNow().notNull(),
});
export type PinAttempt = typeof pinAttempts.$inferSelect;

// ── AI-Native Drill Scores ────────────────────────────────────────────────────
// Persists per-drill scores for the 9 AI-Native practice drills.
// drillId maps to the drill slug (e.g. 'rag-explainer', 'ai-stack-builder').
// scores is a JSON object with per-dimension scores (0-10) returned by the LLM.
export const aiNativeDrillScores = mysqlTable("ai_native_drill_scores", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  drillId: varchar("drillId", { length: 64 }).notNull(),
  drillLabel: varchar("drillLabel", { length: 128 }).notNull(),
  coreSkill: varchar("coreSkill", { length: 64 }).notNull(), // 'fluency' | 'impact' | 'responsible' | 'continuous'
  overallScore: int("overallScore").notNull(), // 0-10
  scores: json("scores").notNull().$type<Record<string, number>>(), // per-dimension breakdown
  feedback: text("feedback"), // LLM coaching note
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type AiNativeDrillScore = typeof aiNativeDrillScores.$inferSelect;

// ── AI-Native Mock Screening Sessions ─────────────────────────────────────────
// Persists full 4-phase mock screening call sessions for the FullMockScreeningCall drill.
// sessionData stores per-phase answers, scores, and the final AI scorecard.
export const aiNativeMockSessions = mysqlTable("ai_native_mock_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  sessionId: varchar("sessionId", { length: 64 }).notNull().unique(), // client-generated nanoid
  overallScore: int("overallScore").notNull().default(0), // 0-10 composite
  maturityLevel: varchar("maturityLevel", { length: 32 }), // e.g. 'AI First'
  sessionData: json("sessionData").notNull().$type<Record<string, unknown>>(), // full phase data
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type AiNativeMockSession = typeof aiNativeMockSessions.$inferSelect;

// ── AI-Native Maturity Level (persisted from MaturitySelfClassifier) ──────────
// Stores the most recent assessed maturity level per user.
export const aiNativeMaturityLevels = mysqlTable("ai_native_maturity_levels", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(), // one row per user
  level: varchar("level", { length: 32 }).notNull(), // 'Traditionalist' | 'AI Aware' | 'AI Enabled' | 'AI First' | 'AI Native'
  levelIndex: int("levelIndex").notNull().default(0), // 0-4 for progress bar
  scores: json("scores").notNull().$type<Record<string, number>>(), // per-dimension breakdown
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type AiNativeMaturityLevel = typeof aiNativeMaturityLevels.$inferSelect;

// ── Learning Path Drill Sessions ──────────────────────────────────────────────
// Persists completed drill session results from the LearningPathTab.
// Each row represents one completed session for a given week.
// drillScores is a JSON array of { drillId, score, completedAt } objects.
export const drillSessions = mysqlTable("drill_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  weekNumber: int("weekNumber").notNull(), // 1–4
  sessionScore: int("sessionScore").notNull().default(0), // 0–100 composite
  drillScores: json("drillScores")
    .notNull()
    .$type<Array<{ drillId: string; score: number; completedAt: number }>>(),
  completedAt: timestamp("completedAt").defaultNow().notNull(),
});
export type DrillSession = typeof drillSessions.$inferSelect;

// ── Persona Stress Test Sessions ──────────────────────────────────────────────
// Persists completed Persona Stress Test simulator sessions.
// personaId maps to one of the 5 archetypes (skeptic, devils-advocate, etc.).
// turns is a JSON array of { challenge, response, score } objects.
export const personaStressSessions = mysqlTable("persona_stress_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  personaId: varchar("personaId", { length: 64 }).notNull(),
  personaLabel: varchar("personaLabel", { length: 128 }).notNull(),
  resilienceScore: int("resilienceScore").notNull().default(0), // 0–100
  turns: json("turns").notNull().$type<
    Array<{
      challenge: string;
      response: string;
      score: number;
      feedback: string;
    }>
  >(),
  aiCoachNote: text("aiCoachNote"),
  completedAt: timestamp("completedAt").defaultNow().notNull(),
});
export type PersonaStressSession = typeof personaStressSessions.$inferSelect;

// ── Failure Drill Sessions ─────────────────────────────────────────────────────
// Persists completed sessions for all 18 Failure Analysis hands-on drills.
// drillId maps to one of the 18 drill identifiers (e.g. "nfr-ambush", "interruptor").
// payload stores drill-specific input data as JSON.
export const failureDrillSessions = mysqlTable("failure_drill_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  drillId: varchar("drillId", { length: 64 }).notNull(),
  score: int("score").notNull().default(0), // 0–100
  payload: json("payload").$type<Record<string, unknown>>(),
  feedback: text("feedback"),
  completedAt: timestamp("completedAt").defaultNow().notNull(),
});
export type FailureDrillSession = typeof failureDrillSessions.$inferSelect;

// ── Daily Interview Challenge ─────────────────────────────────────────────────
export const dailyChallengeSubmissions = mysqlTable(
  "daily_challenge_submissions",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    dateKey: varchar("dateKey", { length: 10 }).notNull(),
    category: varchar("category", { length: 32 }).notNull(),
    questionId: varchar("questionId", { length: 64 }).notNull(),
    answer: text("answer").notNull(),
    score: int("score").notNull().default(0),
    feedback: text("feedback"),
    submittedAt: timestamp("submittedAt").defaultNow().notNull(),
  }
);
export type DailyChallengeSubmission =
  typeof dailyChallengeSubmissions.$inferSelect;

// ── User Streaks ──────────────────────────────────────────────────────────────
export const userStreaks = mysqlTable("user_streaks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  currentStreak: int("currentStreak").notNull().default(0),
  longestStreak: int("longestStreak").notNull().default(0),
  lastActivityDate: varchar("lastActivityDate", { length: 10 }),
  hardModeUnlocked: boolean("hardModeUnlocked").notNull().default(false),
  bossFightUnlocked: boolean("bossFightUnlocked").notNull().default(false),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type UserStreak = typeof userStreaks.$inferSelect;

// ── Boss Fight Sessions ───────────────────────────────────────────────────────
export const bossFightSessions = mysqlTable("boss_fight_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  verdict: varchar("verdict", { length: 16 }).notNull(),
  overallScore: int("overallScore").notNull().default(0),
  transcript: json("transcript").notNull().$type<
    Array<{
      role: "architect" | "candidate";
      content: string;
      timestamp: number;
      personaMode?: string;
      score?: number;
    }>
  >(),
  scoreBreakdown: json("scoreBreakdown").$type<{
    systemDesign: number;
    coding: number;
    behavioral: number;
    resilience: number;
    communication: number;
  }>(),
  completedAt: timestamp("completedAt").defaultNow().notNull(),
});
export type BossFightSession = typeof bossFightSessions.$inferSelect;

// ── Comeback Arc Plans ────────────────────────────────────────────────────────
export const comebackArcPlans = mysqlTable("comeback_arc_plans", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  drillId: varchar("drillId", { length: 64 }).notNull(),
  triggerScore: int("triggerScore").notNull(),
  steps: json("steps").notNull().$type<
    Array<{
      title: string;
      description: string;
      drillToRun?: string;
    }>
  >(),
  predictedScore: int("predictedScore"),
  retryScore: int("retryScore"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ComebackArcPlan = typeof comebackArcPlans.$inferSelect;

// ── Adaptive Difficulty State ─────────────────────────────────────────────────
export const adaptiveDifficultyState = mysqlTable("adaptive_difficulty_state", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  drillId: varchar("drillId", { length: 64 }).notNull(),
  difficulty: varchar("difficulty", { length: 8 }).notNull().default("normal"),
  recentScores: json("recentScores").notNull().$type<number[]>().default([]),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type AdaptiveDifficultyState =
  typeof adaptiveDifficultyState.$inferSelect;

// ── Interview Seasons ─────────────────────────────────────────────────────────
export const interviewSeasons = mysqlTable("interview_seasons", {
  id: int("id").autoincrement().primaryKey(),
  seasonNumber: int("seasonNumber").notNull().unique(),
  theme: varchar("theme", { length: 128 }).notNull(),
  description: text("description"),
  drillIds: json("drillIds").notNull().$type<string[]>(),
  startDate: varchar("startDate", { length: 10 }).notNull(),
  endDate: varchar("endDate", { length: 10 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type InterviewSeason = typeof interviewSeasons.$inferSelect;

// ── Invite Codes ────────────────────────────────────────────────────────────
export const inviteCodes = mysqlTable("invite_codes", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 64 }).notNull().unique(),
  cohortName: varchar("cohortName", { length: 128 }),
  welcomeMessage: text("welcomeMessage"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type InviteCode = typeof inviteCodes.$inferSelect;

// ── Invite Attempt Log ────────────────────────────────────────────────────────
export const inviteAttemptLog = mysqlTable("invite_attempt_log", {
  id: int("id").autoincrement().primaryKey(),
  ip: varchar("ip", { length: 64 }).notNull(),
  codeTried: varchar("codeTried", { length: 64 }).notNull(),
  success: boolean("success").notNull().default(false),
  userAgent: varchar("userAgent", { length: 256 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type InviteAttemptLog = typeof inviteAttemptLog.$inferSelect;

// ── Season Scores ─────────────────────────────────────────────────────────────
export const seasonScores = mysqlTable("season_scores", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  seasonId: int("seasonId").notNull(),
  totalScore: int("totalScore").notNull().default(0),
  drillsCompleted: int("drillsCompleted").notNull().default(0),
  isChampion: boolean("isChampion").notNull().default(false),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type SeasonScore = typeof seasonScores.$inferSelect;

// ── Visitor Sessions (real-time user tracking) ────────────────────────────────
export const visitorSessions = mysqlTable("visitor_sessions", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: varchar("sessionId", { length: 128 }).notNull().unique(),
  inviteCode: varchar("inviteCode", { length: 64 }),
  userAgent: varchar("userAgent", { length: 512 }),
  currentTab: varchar("currentTab", { length: 64 }),
  firstSeenAt: timestamp("firstSeenAt").defaultNow().notNull(),
  lastHeartbeatAt: timestamp("lastHeartbeatAt")
    .defaultNow()
    .onUpdateNow()
    .notNull(),
});
export type VisitorSession = typeof visitorSessions.$inferSelect;

// ── Invite Attempts — Rate Limiting Log ───────────────────────────────────────
export const inviteAttempts = mysqlTable("invite_attempts", {
  id: int("id").autoincrement().primaryKey(),
  ipAddress: varchar("ipAddress", { length: 64 }).notNull(),
  submittedCode: varchar("submittedCode", { length: 64 }),
  success: boolean("success").notNull().default(false),
  reason: varchar("reason", { length: 32 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type InviteAttempt = typeof inviteAttempts.$inferSelect;

// ── Invite Gate Settings — Single-Row Config ──────────────────────────────────
export const inviteGateSettings = mysqlTable("invite_gate_settings", {
  id: int("id").autoincrement().primaryKey(),
  enabled: boolean("enabled").notNull().default(false),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type InviteGateSetting = typeof inviteGateSettings.$inferSelect;

// ── Active Sessions — Live Browser Session Tracking ───────────────────────────
export const activeSessions = mysqlTable("active_sessions", {
  id: int("id").autoincrement().primaryKey(),
  sessionToken: varchar("sessionToken", { length: 64 }).notNull().unique(),
  codeId: int("codeId").notNull(),
  code: varchar("code", { length: 32 }).notNull(),
  ipAddress: varchar("ipAddress", { length: 64 }).notNull(),
  userAgent: varchar("userAgent", { length: 256 }),
  firstSeenAt: timestamp("firstSeenAt").defaultNow().notNull(),
  lastSeenAt: timestamp("lastSeenAt").defaultNow().onUpdateNow().notNull(),
  isRevoked: boolean("isRevoked").notNull().default(false),
});
export type ActiveSession = typeof activeSessions.$inferSelect;
