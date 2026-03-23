/**
 * feedback router — site-wide feedback, sprint plan feedback, and sprint plan sharing
 */

import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { siteFeedback, sprintPlanFeedback, sharedSprintPlans } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { notifyOwner } from "../_core/notification";
import { nanoid } from "nanoid";

export const feedbackRouter = router({
  // ── Site-wide feedback ──────────────────────────────────────────────────────
  submitSiteFeedback: publicProcedure
    .input(
      z.object({
        category: z.enum(["bug", "feature", "content", "ux", "other"]),
        rating: z.number().int().min(1).max(5).optional(),
        message: z.string().min(10).max(2000),
        page: z.string().max(128).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: false };
      const userId = (ctx as { user?: { id: number } }).user?.id ?? null;
      await db.insert(siteFeedback).values({
        userId: userId ?? undefined,
        category: input.category,
        rating: input.rating ?? null,
        message: input.message,
        page: input.page ?? null,
      });
      // Notify owner
      await notifyOwner({
        title: `New Site Feedback: ${input.category.toUpperCase()}${input.rating ? ` (${input.rating}/5)` : ""}`,
        content: `Page: ${input.page ?? "unknown"}\n\n${input.message}`,
      });
      return { success: true };
    }),

  // Get all site feedback (owner only — for the dashboard)
  getAllSiteFeedback: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") return [];
    const db = await getDb();
    if (!db) return [];
    return db
      .select()
      .from(siteFeedback)
      .orderBy(desc(siteFeedback.createdAt))
      .limit(200);
  }),

  // ── Sprint plan feedback ────────────────────────────────────────────────────
  submitSprintFeedback: publicProcedure
    .input(
      z.object({
        dayNumber: z.number().int().min(1).max(7).optional(),
        rating: z.number().int().min(1).max(5),
        suggestion: z.string().max(1000).optional(),
        helpful: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: false };
      const userId = (ctx as { user?: { id: number } }).user?.id ?? null;
      await db.insert(sprintPlanFeedback).values({
        userId: userId ?? undefined,
        dayNumber: input.dayNumber ?? null,
        rating: input.rating,
        suggestion: input.suggestion ?? null,
        helpful: input.helpful !== undefined ? (input.helpful ? 1 : 0) : null,
      });
      if (input.suggestion) {
        await notifyOwner({
          title: `Sprint Plan Feedback — ${input.rating}/5 stars${input.dayNumber ? ` (Day ${input.dayNumber})` : " (Overall)"}`,
          content: input.suggestion,
        });
      }
      return { success: true };
    }),

  // ── Sprint plan sharing ─────────────────────────────────────────────────────
  shareSprintPlan: protectedProcedure
    .input(
      z.object({
        planData: z.array(z.object({
          dayNumber: z.number(),
          theme: z.string(),
          tasks: z.array(z.object({
            title: z.string(),
            tool: z.string(),
            duration: z.string(),
            description: z.string(),
          })),
        })),
        targetLevel: z.enum(["L4", "L5", "L6", "L7"]).optional(),
        focusPriority: z.string().max(32).optional(),
        weakAreas: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { token: null };
      const token = nanoid(12);
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
      await db.insert(sharedSprintPlans).values({
        shareToken: token,
        userId: ctx.user.id,
        planData: input.planData as Record<string, unknown>[],
        targetLevel: input.targetLevel ?? "L6",
        focusPriority: input.focusPriority ?? "balanced",
        weakAreas: input.weakAreas ?? [],
        expiresAt,
      });
      return { token };
    }),

  getSharedPlan: publicProcedure
    .input(z.object({ token: z.string().max(64) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const rows = await db
        .select()
        .from(sharedSprintPlans)
        .where(eq(sharedSprintPlans.shareToken, input.token))
        .limit(1);
      if (!rows.length) return null;
      const plan = rows[0];
      // Increment view count
      await db
        .update(sharedSprintPlans)
        .set({ viewCount: plan.viewCount + 1 })
        .where(eq(sharedSprintPlans.shareToken, input.token));
      return plan;
    }),
});
