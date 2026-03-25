/**
 * feedback router — site-wide feedback, sprint plan feedback, and sprint plan sharing.
 * Admin procedures: adminGetAll, adminStats, markAllNew, triggerDigest, triggerDailyAlert,
 *                   updateNote, updateStatus (alias for updateFeedbackStatus)
 */

import { z } from "zod";
import { publicProcedure, protectedProcedure, tokenAdminProcedure, ownerProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { siteFeedback, sprintPlanFeedback, sharedSprintPlans } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { notifyOwner } from "../_core/notification";
import { sendEmail, isSmtpConfigured } from "../email";
import { nanoid } from "nanoid";
import { TRPCError } from "@trpc/server";
import { invokeLLMSafe, parseLLMJson } from "../_core/llmSafe";

// ── Sentiment tagging ─────────────────────────────────────────────────────────

type Sentiment = "positive" | "neutral" | "negative";

async function tagSentiment(message: string, rating?: number): Promise<Sentiment> {
  const ratingHint = rating ? ` The user gave a ${rating}/5 star rating.` : "";
  const result = await invokeLLMSafe(
    {
      messages: [
        {
          role: "system",
          content:
            'You are a sentiment classifier. Classify the following user feedback as exactly one of: "positive", "neutral", or "negative". Respond with JSON only.',
        },
        {
          role: "user",
          content: `Feedback: "${message.slice(0, 500)}"${ratingHint}`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "sentiment_result",
          strict: true,
          schema: {
            type: "object",
            properties: {
              sentiment: { type: "string", enum: ["positive", "neutral", "negative"] },
            },
            required: ["sentiment"],
            additionalProperties: false,
          },
        },
      },
    },
    { fallback: null, timeoutMs: 10_000, retries: 1, context: "sentiment-tag" }
  );
  const parsed = parseLLMJson<{ sentiment: Sentiment }>(result);
  return parsed?.sentiment ?? "neutral";
}

// ── Weekly digest helper ──────────────────────────────────────────────────────

async function sendWeeklyDigest(): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const all = await db.select().from(siteFeedback).orderBy(desc(siteFeedback.createdAt)).limit(200);
  const recent = all.filter(r => new Date(r.createdAt) > sevenDaysAgo);
  if (recent.length === 0) {
    await notifyOwner({ title: "Weekly Feedback Digest — MetaEngGuide", content: "No new feedback this week." });
    return true;
  }
  const lines = recent.map(r =>
    `[${r.category.toUpperCase()}] ${r.rating ? `${r.rating}★ ` : ""}${r.message.slice(0, 200)}${r.message.length > 200 ? "…" : ""} (${r.page ?? "unknown page"})`
  );
  const body = `Weekly Feedback Digest — ${recent.length} item(s) in the last 7 days:\n\n${lines.join("\n\n")}`;
  const recipientEmail = process.env.DIGEST_RECIPIENT_EMAIL;
  if (isSmtpConfigured() && recipientEmail) {
    return sendEmail({ to: recipientEmail, subject: "Weekly Feedback Digest — MetaEngGuide", text: body });
  }
  await notifyOwner({ title: "Weekly Feedback Digest — MetaEngGuide", content: body });
  return true;
}

// ── Daily alert helper ────────────────────────────────────────────────────────

const ALERT_THRESHOLD = 3;

async function checkAndSendDailyAlert(): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const unactioned = await db
    .select()
    .from(siteFeedback)
    .where(eq(siteFeedback.status, "new"));
  if (unactioned.length < ALERT_THRESHOLD) return false;
  const body = `⚠️ ${unactioned.length} unactioned feedback item(s) need your attention on MetaEngGuide.\n\nVisit /admin/feedback to triage them.`;
  const recipientEmail = process.env.DIGEST_RECIPIENT_EMAIL;
  if (isSmtpConfigured() && recipientEmail) {
    return sendEmail({ to: recipientEmail, subject: `[MetaEngGuide] ${unactioned.length} unactioned feedback items`, text: body });
  }
  await notifyOwner({ title: `[MetaEngGuide] ${unactioned.length} unactioned feedback items`, content: body });
  return true;
}

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
      // Run sentiment tagging in parallel with DB insert — don't block on it
      const sentimentPromise = tagSentiment(input.message, input.rating);
      const [insertResult, sentiment] = await Promise.all([
        db.insert(siteFeedback).values({
          userId: userId ?? undefined,
          category: input.category,
          rating: input.rating ?? null,
          message: input.message,
          page: input.page ?? null,
          sentiment: "neutral", // placeholder; updated below
        }),
        sentimentPromise,
      ]);
      // Update the row with the real sentiment once the LLM responds
      const insertId = (insertResult as { insertId?: number }).insertId;
      if (insertId) {
        await db
          .update(siteFeedback)
          .set({ sentiment })
          .where(eq(siteFeedback.id, insertId))
          .catch(() => {}); // non-critical — don't fail the submission
      }
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

  // Update feedback triage status (admin only) — Fix #7: use tokenAdminProcedure for consistent enforcement
  updateFeedbackStatus: tokenAdminProcedure
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

  // Get all site feedback (owner only — for the dashboard) — Fix #7: use tokenAdminProcedure
  getAllSiteFeedback: tokenAdminProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db
      .select()
      .from(siteFeedback)
      .orderBy(desc(siteFeedback.createdAt))
      .limit(200);
  }),

  /** Admin: Get all feedback with optional filters */
  adminGetAll: tokenAdminProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(500).default(200),
        category: z.string().default("all"),
        status: z.string().default("all"),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { items: [], total: 0 };
      const items = await db
        .select()
        .from(siteFeedback)
        .orderBy(desc(siteFeedback.createdAt))
        .limit(input.limit);
      let filtered = items;
      if (input.category !== "all") filtered = filtered.filter(i => i.category === input.category);
      if (input.status !== "all") filtered = filtered.filter(i => i.status === input.status);
      return { items: filtered, total: filtered.length };
    }),

  /**
   * Lightweight new-feedback count for the admin badge in the nav.
   * Uses ownerProcedure so only the site owner can call it.
   * Returns { newCount } — the number of feedback items with status "new".
   */
  getNewCount: ownerProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { newCount: 0 };
    const rows = await db
      .select({ status: siteFeedback.status })
      .from(siteFeedback)
      .where(eq(siteFeedback.status, "new"));
    return { newCount: rows.length };
  }),

  /** Admin: Summary stats */
  adminStats: tokenAdminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { byCategory: [], total: 0, last7Days: 0, newCount: 0 };
    const all = await db
      .select({
        category: siteFeedback.category,
        status: siteFeedback.status,
        createdAt: siteFeedback.createdAt,
      })
      .from(siteFeedback);
    const total = all.length;
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const last7Days = all.filter(r => new Date(r.createdAt) > sevenDaysAgo).length;
    const newCount = all.filter(r => r.status === "new").length;
    const catMap: Record<string, number> = {};
    for (const r of all) catMap[r.category] = (catMap[r.category] ?? 0) + 1;
    const byCategory = Object.entries(catMap).map(([category, count]) => ({ category, count }));
    return { byCategory, total, last7Days, newCount };
  }),

  /** Admin: Preview the weekly digest content without sending */
  getDigestPreview: tokenAdminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const all = await db.select().from(siteFeedback).orderBy(desc(siteFeedback.createdAt)).limit(200);
    const recent = all.filter(r => new Date(r.createdAt) > sevenDaysAgo);
    const recipientEmail = process.env.DIGEST_RECIPIENT_EMAIL ?? "(Manus inbox — no SMTP configured)";
    const subject = "Weekly Feedback Digest — MetaEngGuide";
    if (recent.length === 0) {
      return {
        subject,
        to: recipientEmail,
        body: "No new feedback this week.",
        itemCount: 0,
        items: [] as Array<{ id: number; category: string; rating: number | null; message: string; page: string | null; createdAt: Date; status: string }>,
      };
    }
    const lines = recent.map(r =>
      `[${r.category.toUpperCase()}] ${r.rating ? `${r.rating}\u2605 ` : ""}${r.message.slice(0, 200)}${r.message.length > 200 ? "\u2026" : ""} (${r.page ?? "unknown page"})`
    );
    const body = `Weekly Feedback Digest \u2014 ${recent.length} item(s) in the last 7 days:\n\n${lines.join("\n\n")}`;
    return {
      subject,
      to: recipientEmail,
      body,
      itemCount: recent.length,
      items: recent.map(r => ({
        id: r.id,
        category: r.category,
        rating: r.rating,
        message: r.message.slice(0, 200),
        page: r.page,
        createdAt: r.createdAt,
        status: r.status,
      })),
    };
  }),

  /** Admin: Manually trigger weekly digest */
  triggerDigest: tokenAdminProcedure.mutation(async () => {
    await sendWeeklyDigest();
    return { success: true };
  }),

  /** Admin: Manually trigger daily alert check */
  triggerDailyAlert: tokenAdminProcedure.mutation(async () => {
    const sent = await checkAndSendDailyAlert();
    return { success: true, sent };
  }),

  /** Admin: Save internal note on a feedback item */
  updateNote: tokenAdminProcedure
    .input(z.object({ id: z.number().int(), adminNote: z.string().max(1000) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db
        .update(siteFeedback)
        .set({ adminNote: input.adminNote })
        .where(eq(siteFeedback.id, input.id));
      return { success: true };
    }),

  /** Admin: Bulk-update all 'new' items to 'in_progress' */
  markAllNew: tokenAdminProcedure.mutation(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const result = await db
      .update(siteFeedback)
      .set({ status: "in_progress", statusUpdatedAt: Date.now() })
      .where(eq(siteFeedback.status, "new"));
    return { success: true, updated: (result as { affectedRows?: number }).affectedRows ?? 0 };
  }),

  /** Admin: Update triage status (alias for updateFeedbackStatus) */
  updateStatus: tokenAdminProcedure
    .input(
      z.object({
        id: z.number().int(),
        status: z.enum(["new", "in_progress", "done", "dismissed"]),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db
        .update(siteFeedback)
        .set({ status: input.status, statusUpdatedAt: Date.now() })
        .where(eq(siteFeedback.id, input.id));
      return { success: true };
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
