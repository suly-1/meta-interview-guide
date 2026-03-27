import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  aiNativeDrillScores,
  aiNativeMockSessions,
  aiNativeMaturityLevels,
} from "../../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";

const CORE_SKILLS = ["fluency", "impact", "responsible", "continuous"] as const;

const MATURITY_LEVELS = [
  "Traditionalist",
  "AI Aware",
  "AI Enabled",
  "AI First",
  "AI Native",
] as const;

export const aiNativeHistoryRouter = router({
  // ── Drill Score Persistence ──────────────────────────────────────────────

  /** Save a completed drill score to the DB */
  saveDrillScore: protectedProcedure
    .input(
      z.object({
        drillId: z.string().min(1).max(64),
        drillLabel: z.string().min(1).max(128),
        coreSkill: z.enum(CORE_SKILLS),
        overallScore: z.number().int().min(0).max(10),
        scores: z.record(z.string(), z.number()),
        feedback: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: false };
      await db.insert(aiNativeDrillScores).values({
        userId: ctx.user.id,
        drillId: input.drillId,
        drillLabel: input.drillLabel,
        coreSkill: input.coreSkill,
        overallScore: input.overallScore,
        scores: input.scores,
        feedback: input.feedback ?? null,
      });
      return { success: true };
    }),

  /** Get the 20 most recent drill scores for the current user */
  getDrillHistory: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) return [];
    const db = await getDb();
    if (!db) return [];
    const rows = await db
      .select()
      .from(aiNativeDrillScores)
      .where(eq(aiNativeDrillScores.userId, ctx.user.id))
      .orderBy(desc(aiNativeDrillScores.createdAt))
      .limit(20);
    return rows;
  }),

  /** Get the best score per drill (for radar chart) */
  getBestScoresByDrill: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) return {};
    const db = await getDb();
    if (!db) return {};
    const rows = await db
      .select()
      .from(aiNativeDrillScores)
      .where(eq(aiNativeDrillScores.userId, ctx.user.id))
      .orderBy(desc(aiNativeDrillScores.createdAt))
      .limit(100);
    // Group by drillId, keep best overallScore
    const best: Record<
      string,
      { overallScore: number; coreSkill: string; drillLabel: string }
    > = {};
    for (const row of rows) {
      if (
        !best[row.drillId] ||
        row.overallScore > best[row.drillId].overallScore
      ) {
        best[row.drillId] = {
          overallScore: row.overallScore,
          coreSkill: row.coreSkill,
          drillLabel: row.drillLabel,
        };
      }
    }
    return best;
  }),

  // ── Maturity Level Persistence ───────────────────────────────────────────

  /** Upsert the user's assessed maturity level (from MaturitySelfClassifier) */
  saveMaturityLevel: protectedProcedure
    .input(
      z.object({
        level: z.enum(MATURITY_LEVELS),
        levelIndex: z.number().int().min(0).max(4),
        scores: z.record(z.string(), z.number()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: false };
      // Upsert: one row per user
      const existing = await db
        .select({ id: aiNativeMaturityLevels.id })
        .from(aiNativeMaturityLevels)
        .where(eq(aiNativeMaturityLevels.userId, ctx.user.id))
        .limit(1);
      if (existing.length > 0) {
        await db
          .update(aiNativeMaturityLevels)
          .set({
            level: input.level,
            levelIndex: input.levelIndex,
            scores: input.scores,
          })
          .where(eq(aiNativeMaturityLevels.userId, ctx.user.id));
      } else {
        await db.insert(aiNativeMaturityLevels).values({
          userId: ctx.user.id,
          level: input.level,
          levelIndex: input.levelIndex,
          scores: input.scores,
        });
      }
      return { success: true };
    }),

  /** Get the current user's maturity level */
  getMaturityLevel: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) return null;
    const db = await getDb();
    if (!db) return null;
    const rows = await db
      .select()
      .from(aiNativeMaturityLevels)
      .where(eq(aiNativeMaturityLevels.userId, ctx.user.id))
      .limit(1);
    return rows[0] ?? null;
  }),

  // ── Mock Screening Session Persistence ───────────────────────────────────

  /** Save a completed 4-phase mock screening session */
  saveMockSession: protectedProcedure
    .input(
      z.object({
        sessionId: z.string().min(1).max(64),
        overallScore: z.number().int().min(0).max(10),
        maturityLevel: z.string().optional(),
        sessionData: z.record(z.string(), z.unknown()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: false };
      // Insert-or-ignore on duplicate sessionId
      const existing = await db
        .select({ id: aiNativeMockSessions.id })
        .from(aiNativeMockSessions)
        .where(
          and(
            eq(aiNativeMockSessions.userId, ctx.user.id),
            eq(aiNativeMockSessions.sessionId, input.sessionId)
          )
        )
        .limit(1);
      if (existing.length > 0) return { success: true };
      await db.insert(aiNativeMockSessions).values({
        userId: ctx.user.id,
        sessionId: input.sessionId,
        overallScore: input.overallScore,
        maturityLevel: input.maturityLevel ?? null,
        sessionData: input.sessionData as Record<string, unknown>,
      });
      return { success: true };
    }),

  /** Get all mock sessions for the current user */
  getMockHistory: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) return [];
    const db = await getDb();
    if (!db) return [];
    const rows = await db
      .select()
      .from(aiNativeMockSessions)
      .where(eq(aiNativeMockSessions.userId, ctx.user.id))
      .orderBy(desc(aiNativeMockSessions.createdAt))
      .limit(50);
    return rows.map(r => ({
      sessionId: r.sessionId,
      overallScore: r.overallScore,
      maturityLevel: r.maturityLevel,
      sessionData: r.sessionData as Record<string, unknown>,
      createdAt: r.createdAt,
    }));
  }),

  /** Delete a mock session by sessionId */
  deleteMockSession: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: false };
      await db
        .delete(aiNativeMockSessions)
        .where(
          and(
            eq(aiNativeMockSessions.userId, ctx.user.id),
            eq(aiNativeMockSessions.sessionId, input.sessionId)
          )
        );
      return { success: true };
    }),
});
