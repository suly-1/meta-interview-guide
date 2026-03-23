/**
 * Feedback Router
 * Handles general site feedback and sprint-plan-specific suggestions.
 * Stores feedback in DB and notifies the owner via Manus notification.
 */
import { z } from "zod";
import { adminProcedure, publicProcedure, router } from "../_core/trpc";
import { notifyOwner } from "../_core/notification";
import { getDb } from "../db";
import { feedback as feedbackTable } from "../../drizzle/schema";
import { desc, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { sendWeeklyDigest } from "../weeklyDigest";

export const feedbackRouter = router({
  /** Submit general site feedback */
  submitGeneral: publicProcedure
    .input(
      z.object({
        category: z.enum(["bug", "feature_request", "content", "ux", "other"]),
        message: z.string().min(10).max(2000),
        page: z.string().max(64).optional(),
        userAgent: z.string().max(256).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user?.id ?? null;
      const db = await getDb();
      if (!db) return { success: false };
      await db.insert(feedbackTable).values({
        userId,
        feedbackType: "general",
        category: input.category,
        message: input.message,
        page: input.page ?? null,
        metadata: { userAgent: input.userAgent ?? null },
      });

      // Notify owner
      await notifyOwner({
        title: `📬 New Site Feedback: ${input.category.replace("_", " ").toUpperCase()}`,
        content: [
          `**Category:** ${input.category}`,
          `**Page:** ${input.page ?? "unknown"}`,
          `**User:** ${ctx.user?.name ?? "Anonymous"}`,
          ``,
          `**Message:**`,
          input.message,
        ].join("\n"),
      }).catch(() => null);

      return { success: true };
    }),

  /** Submit sprint-plan-specific feedback */
  submitSprintFeedback: publicProcedure
    .input(
      z.object({
        sprintPlanId: z.string().max(64).optional(),
        rating: z.number().int().min(1).max(5),
        message: z.string().min(5).max(2000),
        dayFeedback: z
          .array(
            z.object({
              day: z.number().int().min(1).max(7),
              comment: z.string().max(500),
            })
          )
          .optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user?.id ?? null;
      const db = await getDb();
      if (!db) return { success: false };
      await db.insert(feedbackTable).values({
        userId,
        feedbackType: "sprint_plan",
        category: "feature_request",
        message: input.message,
        page: "7-day-sprint",
        metadata: {
          rating: input.rating,
          sprintPlanId: input.sprintPlanId ?? null,
          dayFeedback: input.dayFeedback ?? [],
        },
      });

      await notifyOwner({
        title: `🏃 Sprint Plan Feedback — ${input.rating}/5 stars`,
        content: [
          `**Rating:** ${"⭐".repeat(input.rating)}`,
          `**User:** ${ctx.user?.name ?? "Anonymous"}`,
          `**Sprint Plan ID:** ${input.sprintPlanId ?? "N/A"}`,
          ``,
          `**Overall Feedback:**`,
          input.message,
          ...(input.dayFeedback && input.dayFeedback.length > 0
            ? [
                ``,
                `**Per-Day Comments:**`,
                ...input.dayFeedback.map(d => `Day ${d.day}: ${d.comment}`),
              ]
            : []),
        ].join("\n"),
      }).catch(() => null);

      return { success: true };
    }),

  /** Get recent feedback (legacy — kept for backward compat) */
  getRecent: publicProcedure
    .input(z.object({ limit: z.number().int().min(1).max(100).default(50) }))
    .query(async ({ input, ctx }) => {
      if (!ctx.user) return { items: [] };
      const db = await getDb();
      if (!db) return { items: [] };
      const items = await db
        .select()
        .from(feedbackTable)
        .orderBy(desc(feedbackTable.createdAt))
        .limit(input.limit);
      return { items };
    }),

  /** Admin: Get all feedback entries with full details (owner-only) */
  adminGetAll: adminProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(500).default(200),
        category: z
          .enum(["all", "bug", "feature_request", "content", "ux", "other"])
          .default("all"),
        feedbackType: z.enum(["all", "general", "sprint_plan"]).default("all"),
        sortBy: z
          .enum(["createdAt", "category", "feedbackType"])
          .default("createdAt"),
        sortDir: z.enum(["asc", "desc"]).default("desc"),
        status: z
          .enum(["all", "new", "in_progress", "done", "dismissed"])
          .default("all"),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { items: [], total: 0 };
      const items = await db
        .select()
        .from(feedbackTable)
        .orderBy(desc(feedbackTable.createdAt))
        .limit(input.limit);
      // Filter in JS (small dataset)
      let filtered = items;
      if (input.category !== "all") {
        filtered = filtered.filter(i => i.category === input.category);
      }
      if (input.feedbackType !== "all") {
        filtered = filtered.filter(i => i.feedbackType === input.feedbackType);
      }
      if (input.status !== "all") {
        filtered = filtered.filter(i => i.status === input.status);
      }
      return { items: filtered, total: filtered.length };
    }),

  /** Admin: Get feedback summary stats */
  adminStats: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { byCategory: [], byType: [], total: 0, last7Days: 0 };
    const all = await db
      .select({
        category: feedbackTable.category,
        feedbackType: feedbackTable.feedbackType,
        createdAt: feedbackTable.createdAt,
      })
      .from(feedbackTable);
    const total = all.length;
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const last7Days = all.filter(
      r => new Date(r.createdAt) > sevenDaysAgo
    ).length;
    const catMap: Record<string, number> = {};
    for (const r of all) catMap[r.category] = (catMap[r.category] ?? 0) + 1;
    const byCategory = Object.entries(catMap).map(([category, count]) => ({
      category,
      count,
    }));
    const typeMap: Record<string, number> = {};
    for (const r of all)
      typeMap[r.feedbackType] = (typeMap[r.feedbackType] ?? 0) + 1;
    const byType = Object.entries(typeMap).map(([type, count]) => ({
      type,
      count,
    }));
    return { byCategory, byType, total, last7Days };
  }),

  /** Admin: Manually trigger the weekly digest (for testing) */
  triggerDigest: adminProcedure.mutation(async () => {
    await sendWeeklyDigest();
    return { success: true };
  }),

  /** Admin: Update the triage status of a feedback item */
  updateStatus: adminProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["new", "in_progress", "done", "dismissed"]),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db
        .update(feedbackTable)
        .set({ status: input.status })
        .where(eq(feedbackTable.id, input.id));
      return { success: true };
    }),
});
