import {
  bigint,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  tinyint,
  varchar,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  disclaimerAcknowledgedAt: timestamp("disclaimerAcknowledgedAt"),
  isBanned: tinyint("isBanned").notNull().default(0),
  bannedAt: timestamp("bannedAt"),
  bannedUntil: timestamp("bannedUntil"),   // null = permanent block, set = auto-unblock date
  bannedReason: text("bannedReason"),
});
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const collabRooms = mysqlTable("collab_rooms", {
  id: int("id").autoincrement().primaryKey(),
  roomCode: varchar("roomCode", { length: 16 }).notNull().unique(),
  questionId: varchar("questionId", { length: 64 }),
  questionTitle: text("questionTitle"),
  mode: mysqlEnum("mode", ["human", "ai"]).default("human").notNull(),
  status: mysqlEnum("status", ["waiting", "active", "ended"]).default("waiting").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  endedAt: timestamp("endedAt"),
});
export type CollabRoom = typeof collabRooms.$inferSelect;

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

export const leaderboardEntries = mysqlTable("leaderboard_entries", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"), // nullable for backward-compat; new entries always have userId
  anonHandle: varchar("anonHandle", { length: 32 }).notNull(),
  streakDays: int("streakDays").notNull().default(0),
  patternsMastered: int("patternsMastered").notNull().default(0),
  mockSessions: int("mockSessions").notNull().default(0),
  overallPct: int("overallPct").notNull().default(0),
  badges: json("badges").notNull().$type<string[]>().default([]),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type LeaderboardEntry = typeof leaderboardEntries.$inferSelect;

export const onboardingProgress = mysqlTable("onboarding_progress", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  progress: json("progress").notNull().$type<Record<string, boolean>>(),
  dismissed: int("dismissed").notNull().default(0),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type OnboardingProgress = typeof onboardingProgress.$inferSelect;

export const userRatings = mysqlTable("user_ratings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  ratingType: varchar("ratingType", { length: 32 }).notNull(),
  ratings: json("ratings").notNull().$type<Record<string, number>>(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type UserRating = typeof userRatings.$inferSelect;

export const ctciProgress = mysqlTable("ctci_progress", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  solved: json("solved").notNull().$type<Record<string, boolean>>(),
  difficulty: json("difficulty").notNull().$type<Record<string, string>>(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type CtciProgress = typeof ctciProgress.$inferSelect;

export const mockSessions = mysqlTable("mock_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  sessionType: varchar("sessionType", { length: 32 }).notNull(),
  sessionId: varchar("sessionId", { length: 64 }).notNull(),
  sessionData: json("sessionData").notNull().$type<Record<string, unknown>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type MockSession = typeof mockSessions.$inferSelect;

// High-impact feature scores — persisted per user per feature
export const highImpactScores = mysqlTable("high_impact_scores", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  feature: varchar("feature", { length: 64 }).notNull(),
  scoreType: varchar("scoreType", { length: 64 }).notNull(),
  scoreValue: int("scoreValue").notNull(),
  metadata: json("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type HighImpactScore = typeof highImpactScores.$inferSelect;

// Sprint plans — 7-day AI-generated study plans per user
export const sprintPlans = mysqlTable("sprint_plans", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  planId: varchar("planId", { length: 64 }).unique(),
  targetLevel: varchar("targetLevel", { length: 8 }).notNull().default("IC6"),
  timeline: varchar("timeline", { length: 32 }),
  daysUntilInterview: int("daysUntilInterview"),
  plan: json("plan").notNull().$type<Record<string, unknown>[]>(),
  planData: json("planData").$type<Record<string, unknown>>(),
  shareToken: varchar("shareToken", { length: 64 }).unique(),
  readinessScore: int("readinessScore").notNull().default(0),
  focusPriority: varchar("focusPriority", { length: 32 }),
  weakAreas: json("weakAreas").$type<string[]>(),
  viewCount: int("viewCount").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type SprintPlan = typeof sprintPlans.$inferSelect;

// Site-wide user feedback
export const siteFeedback = mysqlTable("site_feedback", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  category: varchar("category", { length: 64 }).notNull().default("other"),
  rating: int("rating"),
  message: text("message").notNull(),
  page: varchar("page", { length: 128 }),
  status: varchar("status", { length: 20 }).notNull().default("new"),
  statusUpdatedAt: bigint("status_updated_at", { mode: "number" }),
  adminNote: text("admin_note"),
  sentiment: varchar("sentiment", { length: 16 }), // 'positive' | 'neutral' | 'negative' — auto-tagged by LLM on submit
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type SiteFeedback = typeof siteFeedback.$inferSelect;

// Sprint plan feedback
export const sprintPlanFeedback = mysqlTable("sprint_plan_feedback", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  dayNumber: int("dayNumber"),
  rating: int("rating").notNull(),
  suggestion: text("suggestion"),
  helpful: tinyint("helpful"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type SprintPlanFeedback = typeof sprintPlanFeedback.$inferSelect;

// Shared sprint plans (public shareable links)
export const sharedSprintPlans = mysqlTable("shared_sprint_plans", {
  id: int("id").autoincrement().primaryKey(),
  shareToken: varchar("shareToken", { length: 64 }).notNull().unique(),
  userId: int("userId").notNull(),
  planData: json("planData").notNull().$type<Record<string, unknown>[]>(),
  targetLevel: varchar("targetLevel", { length: 8 }),
  focusPriority: varchar("focusPriority", { length: 32 }),
  weakAreas: json("weakAreas").$type<string[]>(),
  viewCount: int("viewCount").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt"),
});
export type SharedSprintPlan = typeof sharedSprintPlans.$inferSelect;

// Site settings — key/value store for admin-configurable settings
// Keys: 'lock_enabled' (0/1), 'lock_start_date' (ISO date string), 'lock_duration_days' (number)
export const siteSettings = mysqlTable("site_settings", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 64 }).notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type SiteSetting = typeof siteSettings.$inferSelect;

// Admin audit log — tamper-evident record of every block/unblock action
export const userEvents = mysqlTable("user_events", {
  id: int("id").autoincrement().primaryKey(),
  action: mysqlEnum("action", ["block", "unblock", "role_change"]).notNull(),
  actorId: int("actorId").notNull(),          // admin who performed the action
  actorName: varchar("actorName", { length: 128 }),
  targetUserId: int("targetUserId").notNull(), // user who was affected
  targetUserName: varchar("targetUserName", { length: 128 }),
  targetUserEmail: varchar("targetUserEmail", { length: 320 }),
  reason: text("reason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type UserEvent = typeof userEvents.$inferSelect;

// Login activity log — one row per login event, used for admin activity monitoring
export const loginEvents = mysqlTable("login_events", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  ipAddress: varchar("ipAddress", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type LoginEvent = typeof loginEvents.$inferSelect;

// PIN attempt log — records every admin PIN attempt for audit and rate-limiting
export const pinAttempts = mysqlTable("pin_attempts", {
  id: int("id").autoincrement().primaryKey(),
  ipAddress: varchar("ipAddress", { length: 64 }).notNull(),
  success: tinyint("success").notNull().default(0),  // 0 = failed, 1 = success
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type PinAttempt = typeof pinAttempts.$inferSelect;

// Page view events — one row per tab switch, used for real analytics
export const pageViews = mysqlTable("page_views", {
  id: int("id").autoincrement().primaryKey(),
  tabName: varchar("tabName", { length: 64 }).notNull(),  // e.g. "coding", "behavioral"
  userId: int("userId"),                                   // null for anonymous visitors
  sessionId: varchar("sessionId", { length: 64 }),         // browser-generated session ID
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type PageView = typeof pageViews.$inferSelect;

// Favorite questions — user-saved interview questions for quick review
export const favoriteQuestions = mysqlTable("favorite_questions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  questionId: varchar("questionId", { length: 128 }).notNull(),
  questionType: mysqlEnum("questionType", [
    "coding",
    "behavioral",
    "design",
    "ctci",
  ])
    .notNull()
    .default("coding"),
  questionText: text("questionText").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type FavoriteQuestion = typeof favoriteQuestions.$inferSelect;

// Progress snapshots — daily readiness snapshots for trend charts
export const progressSnapshots = mysqlTable("progress_snapshots", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  snapshotDate: varchar("snapshotDate", { length: 16 }).notNull(), // YYYY-MM-DD
  codingPct: int("codingPct").notNull().default(0),
  behavioralPct: int("behavioralPct").notNull().default(0),
  overallPct: int("overallPct").notNull().default(0),
  streakDays: int("streakDays").notNull().default(0),
  mockSessionCount: int("mockSessionCount").notNull().default(0),
  patternsMastered: int("patternsMastered").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ProgressSnapshot = typeof progressSnapshots.$inferSelect;

// Analytics tables — page views, sessions, and feature events
export const analyticsPageViews = mysqlTable("analytics_page_views", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: varchar("sessionId", { length: 64 }).notNull(),
  userId: int("userId"),
  page: varchar("page", { length: 128 }).notNull(),
  referrer: varchar("referrer", { length: 256 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type AnalyticsPageView = typeof analyticsPageViews.$inferSelect;

export const analyticsSessions = mysqlTable("analytics_sessions", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: varchar("sessionId", { length: 64 }).notNull().unique(),
  userId: int("userId"),
  deviceType: mysqlEnum("deviceType", ["desktop", "tablet", "mobile"]).default("desktop"),
  browser: varchar("browser", { length: 64 }),
  os: varchar("os", { length: 64 }),
  country: varchar("country", { length: 64 }),
  durationSeconds: int("durationSeconds").default(0),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  endedAt: timestamp("endedAt"),
});
export type AnalyticsSession = typeof analyticsSessions.$inferSelect;

export const analyticsEvents = mysqlTable("analytics_events", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: varchar("sessionId", { length: 64 }).notNull(),
  userId: int("userId"),
  eventName: varchar("eventName", { length: 128 }).notNull(),
  page: varchar("page", { length: 128 }),
  metadata: json("metadata").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;

// Feedback table — user feedback submissions
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

// User scores — per-user pattern ratings, behavioral ratings, and notes
export const userScores = mysqlTable("user_scores", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  patternRatings: json("patternRatings").notNull().$type<Record<string, number>>().default({}),
  behavioralRatings: json("behavioralRatings").notNull().$type<Record<string, number>>().default({}),
  starNotes: json("starNotes").notNull().$type<Record<string, string>>().default({}),
  patternTime: json("patternTime").notNull().$type<Record<string, number>>().default({}),
  interviewDate: varchar("interviewDate", { length: 16 }),
  targetLevel: varchar("targetLevel", { length: 8 }),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type UserScores = typeof userScores.$inferSelect;

// Web Push subscriptions — stores browser push endpoints for owner notifications
export const pushSubscriptions = mysqlTable("push_subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  userAgent: varchar("userAgent", { length: 256 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PushSubscription = typeof pushSubscriptions.$inferSelect;

// Invite codes — controls access to the site when invite gate is enabled
export const inviteCodes = mysqlTable("invite_codes", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 32 }).notNull().unique(),
  label: varchar("label", { length: 128 }), // optional note (e.g. "Batch Jan 2026")
  maxUses: int("maxUses").default(0), // 0 = unlimited
  useCount: int("useCount").notNull().default(0),
  isActive: tinyint("isActive").notNull().default(1),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt"), // null = never expires
});
export type InviteCode = typeof inviteCodes.$inferSelect;

// Invite gate settings — single-row config for the access gate
export const inviteGateSettings = mysqlTable("invite_gate_settings", {
  id: int("id").autoincrement().primaryKey(),
  enabled: tinyint("enabled").notNull().default(0),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type InviteGateSettings = typeof inviteGateSettings.$inferSelect;
