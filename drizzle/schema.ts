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
  targetLevel: varchar("targetLevel", { length: 8 }).notNull().default("L6"),
  daysUntilInterview: int("daysUntilInterview"),
  plan: json("plan").notNull().$type<Record<string, unknown>[]>(),
  readinessScore: int("readinessScore").notNull().default(0),
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
