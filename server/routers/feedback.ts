/**
 * feedback router — site-wide feedback, sprint plan feedback, and sprint plan sharing
 */

import { z } from "zod";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { siteFeedback, sprintPlanFeedback, sharedSprintPlans } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { notifyOwner } from "../_core/notification";
import { sendEmail, isSmtpConfigured } from "../email";
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
      // Instant notification — email if SMTP configured, else Manus channel
      const notifTitle = `📨 New ${input.category.toUpperCase()} feedback${input.rating ? ` (${input.rating}★)` : ""} — MetaEngGuide`;
      const notifBody = `Category: ${input.category}\nRating: ${input.rating ? `${input.rating}/5` : "none"}\nPage: ${input.page ?? "unknown"}\n\n${input.message}`;
      const recipientEmail = process.env.DIGEST_RECIPIENT_EMAIL;
      if (isSmtpConfigured() && recipientEmail) {
        await sendEmail({ to: recipientEmail, subject: notifTitle, text: notifBody }).catch(() => {});
      } else {
        await notifyOwner({ title: notifTitle, content: notifBody }).catch(() => {});
      }
      return { success: true };
    }),

  // Update feedback triage status (admin only) — Fix #7: use adminProcedure for consistent enforcement
  updateFeedbackStatus: adminProcedure
    .input(
      z.object({
        id: z.number().int(),
        status: z.enum(["new", "in_progress", "done", "dismissed"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: false };
      await db
        .update(siteFeedback)
        .set({ status: input.status, statusUpdatedAt: Date.now() })
        .where(eq(siteFeedback.id, input.id));
      return { success: true };
    }),

  // Get all site feedback (owner only — for the dashboard) — Fix #7: use adminProcedure
  getAllSiteFeedback: adminProcedure.query(async ({ ctx }) => {
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
      // Fix #6: Enforce expiry — treat expired plans as not found
      if (plan.expiresAt && new Date() > new Date(plan.expiresAt)) {
        return null;
      }
      // Increment view count
      await db
        .update(sharedSprintPlans)
        .set({ viewCount: plan.viewCount + 1 })
        .where(eq(sharedSprintPlans.shareToken, input.token));
      return plan;
    }),
});
