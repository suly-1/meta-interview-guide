/**
 * scores router — DB persistence for all 10 HIGH IMPACT features
 *
 * Procedures:
 *  - scores.save          Save a score for a feature (protected)
 *  - scores.getMyScores   Get all scores for the current user (protected)
 *  - scores.getAggregate  Get anonymized aggregate stats per feature (public)
 *  - scores.saveSprintPlan  Save a generated sprint plan (protected)
 *  - scores.getMySprintPlan Get the latest sprint plan for the current user (protected)
 */

import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { highImpactScores, sprintPlans } from "../../drizzle/schema";
import { eq, desc, avg, count, sql } from "drizzle-orm";

export const scoresRouter = router({
  // Save a score for a high-impact feature
  save: protectedProcedure
    .input(
      z.object({
        feature: z.string().max(64),
        scoreType: z.string().max(64),
        scoreValue: z.number().int().min(0).max(100),
        metadata: z.record(z.string(), z.unknown()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: false };
      await db.insert(highImpactScores).values({
        userId: ctx.user.id,
        feature: input.feature,
        scoreType: input.scoreType,
        scoreValue: input.scoreValue,
        metadata: input.metadata ?? {},
      });
      return { success: true };
    }),

  // Get all scores for the current user, grouped by feature
  getMyScores: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return {};
    const rows = await db
      .select()
      .from(highImpactScores)
      .where(eq(highImpactScores.userId, ctx.user.id))
      .orderBy(desc(highImpactScores.createdAt));

    // Group by feature → latest score per feature + history
    const byFeature: Record<string, { latest: number; history: number[]; scoreType: string; lastAt: Date }> = {};
    for (const row of rows) {
      if (!byFeature[row.feature]) {
        byFeature[row.feature] = {
          latest: row.scoreValue,
          history: [],
          scoreType: row.scoreType,
          lastAt: row.createdAt,
        };
      }
      byFeature[row.feature].history.push(row.scoreValue);
    }
    return byFeature;
  }),

  // Anonymized aggregate stats per feature (public — for showing pass rates)
  getAggregate: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    const rows = await db
      .select({
        feature: highImpactScores.feature,
        scoreType: highImpactScores.scoreType,
        avgScore: avg(highImpactScores.scoreValue),
        totalSessions: count(highImpactScores.id),
        highScorers: sql<number>`SUM(CASE WHEN ${highImpactScores.scoreValue} >= 70 THEN 1 ELSE 0 END)`,
      })
      .from(highImpactScores)
      .groupBy(highImpactScores.feature, highImpactScores.scoreType);

    return rows.map((r) => ({
      feature: r.feature,
      scoreType: r.scoreType,
      avgScore: r.avgScore ? Math.round(Number(r.avgScore)) : 0,
      totalSessions: r.totalSessions,
      passRate:
        r.totalSessions > 0
          ? Math.round((Number(r.highScorers) / r.totalSessions) * 100)
          : 0,
    }));
  }),

  // Save a generated sprint plan
  saveSprintPlan: protectedProcedure
    .input(
      z.object({
        targetLevel: z.enum(["L4", "L5", "L6", "L7"]),
        daysUntilInterview: z.number().int().optional(),
        plan: z.array(z.record(z.string(), z.unknown())),
        readinessScore: z.number().int().min(0).max(100),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: false };
      await db.insert(sprintPlans).values({
        userId: ctx.user.id,
        targetLevel: input.targetLevel,
        daysUntilInterview: input.daysUntilInterview,
        plan: input.plan,
        readinessScore: input.readinessScore,
      });
      return { success: true };
    }),

  // Get the latest sprint plan for the current user
  getMySprintPlan: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;
    const rows = await db
      .select()
      .from(sprintPlans)
      .where(eq(sprintPlans.userId, ctx.user.id))
      .orderBy(desc(sprintPlans.createdAt))
      .limit(1);
    return rows[0] ?? null;
  }),
});
