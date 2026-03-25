/**
 * analytics router — site-wide usage analytics for admin dashboard.
 * Derives metrics from loginEvents, highImpactScores, mockSessions, users, siteFeedback.
 */
import { z } from "zod";
import { tokenAdminProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { users, loginEvents, highImpactScores, mockSessions, siteFeedback } from "../../drizzle/schema";
import { desc, gte, and, eq, count, sql } from "drizzle-orm";
import { notifyOwner } from "../_core/notification";
import { sendEmail, isSmtpConfigured } from "../email";

export const analyticsRouter = router({
  /**
   * getSiteAnalytics — returns sessions, logged-in users, page views (proxy via login events),
   * avg session duration (proxy via mock sessions), total time, and daily active users.
   */
  getSiteAnalytics: tokenAdminProcedure
    .input(z.object({ days: z.number().int().min(1).max(90).default(7) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return {
        sessions: 0,
        loggedInUsers: 0,
        pageViews: 0,
        avgSessionMinutes: 0,
        totalTimeHours: 0,
        dailyActive: [] as { date: string; sessions: number }[],
      };

      const since = new Date(Date.now() - input.days * 86_400_000);

      // Sessions = distinct users who logged in during the period
      const loginRows = await db
        .select({ userId: loginEvents.userId, createdAt: loginEvents.createdAt })
        .from(loginEvents)
        .where(gte(loginEvents.createdAt, since))
        .orderBy(desc(loginEvents.createdAt));

      const uniqueUsers = new Set(loginRows.map(r => r.userId));
      const sessions = loginRows.length;
      const loggedInUsers = uniqueUsers.size;

      // Page views = proxy: each login event + each high-impact score submission (each is a "page interaction")
      const scoreRows = await db
        .select({ userId: highImpactScores.userId, createdAt: highImpactScores.createdAt })
        .from(highImpactScores)
        .where(gte(highImpactScores.createdAt, since));

      const mockRows = await db
        .select({ userId: mockSessions.userId, createdAt: mockSessions.createdAt })
        .from(mockSessions)
        .where(gte(mockSessions.createdAt, since));

      const pageViews = sessions + scoreRows.length + mockRows.length;

      // Avg session: each mock session counts as ~15 min, each score submission as ~5 min
      const totalMinutes = (mockRows.length * 15) + (scoreRows.length * 5);
      const avgSessionMinutes = sessions > 0 ? Math.round(totalMinutes / sessions) : 0;
      const totalTimeHours = Math.round(totalMinutes / 60 * 10) / 10;

      // Daily active users — group loginEvents by date
      const dailyMap: Record<string, Set<number>> = {};
      for (const row of loginRows) {
        const d = new Date(row.createdAt).toISOString().slice(0, 10);
        if (!dailyMap[d]) dailyMap[d] = new Set();
        dailyMap[d].add(row.userId);
      }

      // Fill all days in range
      const dailyActive: { date: string; sessions: number }[] = [];
      for (let i = input.days - 1; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10);
        dailyActive.push({ date: d, sessions: dailyMap[d]?.size ?? 0 });
      }

      return { sessions, loggedInUsers, pageViews, avgSessionMinutes, totalTimeHours, dailyActive };
    }),

  /**
   * getTopUnactionedFeedback — returns the top N unactioned (status=new) feedback items.
   */
  getTopUnactionedFeedback: tokenAdminProcedure
    .input(z.object({ limit: z.number().int().min(1).max(20).default(3) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const rows = await db
        .select()
        .from(siteFeedback)
        .where(eq(siteFeedback.status, "new"))
        .orderBy(desc(siteFeedback.createdAt))
        .limit(input.limit);
      return rows;
    }),

  /**
   * sendAnalyticsReport — sends a site analytics report to the owner via email/notification.
   */
  sendAnalyticsReport: tokenAdminProcedure
    .input(z.object({ days: z.number().int().min(1).max(90).default(7) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { success: false };

      const since = new Date(Date.now() - input.days * 86_400_000);

      const loginRows = await db
        .select({ userId: loginEvents.userId })
        .from(loginEvents)
        .where(gte(loginEvents.createdAt, since));

      const scoreRows = await db
        .select({ userId: highImpactScores.userId })
        .from(highImpactScores)
        .where(gte(highImpactScores.createdAt, since));

      const mockRows = await db
        .select({ userId: mockSessions.userId })
        .from(mockSessions)
        .where(gte(mockSessions.createdAt, since));

      const unactionedRows = await db
        .select({ id: siteFeedback.id, category: siteFeedback.category, message: siteFeedback.message })
        .from(siteFeedback)
        .where(eq(siteFeedback.status, "new"))
        .orderBy(desc(siteFeedback.createdAt))
        .limit(10);

      const uniqueUsers = new Set(loginRows.map(r => r.userId)).size;
      const sessions = loginRows.length;
      const pageViews = sessions + scoreRows.length + mockRows.length;
      const totalMinutes = (mockRows.length * 15) + (scoreRows.length * 5);
      const totalTimeHours = Math.round(totalMinutes / 60 * 10) / 10;

      const unactionedLines = unactionedRows.length > 0
        ? unactionedRows.map(r => `[${r.category.toUpperCase()}] ${r.message.slice(0, 150)}${r.message.length > 150 ? "…" : ""}`).join("\n")
        : "None — backlog is clear! 🎉";

      const body = [
        `📊 Site Analytics Report — Last ${input.days} Days`,
        ``,
        `Sessions: ${sessions}`,
        `Logged-in Users: ${uniqueUsers}`,
        `Page Views (estimated): ${pageViews}`,
        `Total Time on Site: ${totalTimeHours}h`,
        ``,
        `Top Unactioned Feedback (${unactionedRows.length} items):`,
        unactionedLines,
        ``,
        `Generated: ${new Date().toUTCString()}`,
      ].join("\n");

      const recipientEmail = process.env.DIGEST_RECIPIENT_EMAIL;
      if (isSmtpConfigured() && recipientEmail) {
        await sendEmail({
          to: recipientEmail,
          subject: `MetaEngGuide Analytics Report — Last ${input.days} Days`,
          text: body,
        });
      } else {
        await notifyOwner({
          title: `📊 Analytics Report — Last ${input.days} Days`,
          content: body,
        });
      }

      return { success: true };
    }),
});
