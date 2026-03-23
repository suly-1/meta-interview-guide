/**
 * emailDigest.ts — Weekly feedback digest for the site owner.
 *
 * Runs every Monday at 8:00 AM UTC via node-cron.
 * Summarises all site feedback from the past 7 days and delivers it via
 * the Manus notifyOwner channel (which routes to the owner's registered email).
 *
 * Also exposes a manual `sendFeedbackDigest()` function that can be called
 * from a tRPC admin procedure for on-demand delivery.
 */

import cron from "node-cron";
import { getDb } from "./db";
import { siteFeedback, sprintPlanFeedback } from "../drizzle/schema";
import { gte, sql } from "drizzle-orm";
import { notifyOwner } from "./_core/notification";
import { sendEmail, isSmtpConfigured } from "./email";

// Recipient is configured via DIGEST_RECIPIENT_EMAIL env var (set in Secrets panel)
const DIGEST_EMAIL = process.env.DIGEST_RECIPIENT_EMAIL ?? "owner";

/** Build a plain-text digest of the last N days of feedback */
async function buildDigest(days = 7): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [siteItems, sprintItems] = await Promise.all([
    db
      .select()
      .from(siteFeedback)
      .where(gte(siteFeedback.createdAt, since))
      .orderBy(siteFeedback.createdAt),
    db
      .select()
      .from(sprintPlanFeedback)
      .where(gte(sprintPlanFeedback.createdAt, since))
      .orderBy(sprintPlanFeedback.createdAt),
  ]);

  if (!siteItems.length && !sprintItems.length) {
    return null; // nothing to report
  }

  const dateRange = `${since.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;

  // Category breakdown
  const catCounts: Record<string, number> = {};
  let totalRating = 0;
  let ratedCount = 0;
  for (const item of siteItems) {
    catCounts[item.category] = (catCounts[item.category] ?? 0) + 1;
    if (item.rating) { totalRating += item.rating; ratedCount++; }
  }
  const avgRating = ratedCount > 0 ? (totalRating / ratedCount).toFixed(1) : "N/A";

  const catSummary = Object.entries(catCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, count]) => `  • ${cat.toUpperCase()}: ${count}`)
    .join("\n");

  // Triage status counts (across ALL feedback, not just this week)
  const allItems = await db.select().from(siteFeedback);
  const statusCounts = { new: 0, in_progress: 0, done: 0, dismissed: 0 };
  for (const item of allItems) {
    const s = (item as { status?: string }).status ?? "new";
    if (s in statusCounts) statusCounts[s as keyof typeof statusCounts]++;
  }
  const backlogHealth = `  🔵 New: ${statusCounts.new}  |  🟡 In Progress: ${statusCounts.in_progress}  |  🟢 Done: ${statusCounts.done}  |  ⚪ Dismissed: ${statusCounts.dismissed}`;

  // Top-rated site feedback (rating ≥ 4)
  const topFeedback = siteItems
    .filter(f => (f.rating ?? 0) >= 4)
    .slice(0, 5)
    .map(f => `  [${f.rating}★] ${f.category.toUpperCase()} — "${f.message.slice(0, 120)}${f.message.length > 120 ? "…" : ""}"`)
    .join("\n");

  // Bug reports
  const bugs = siteItems
    .filter(f => f.category === "bug")
    .slice(0, 5)
    .map(f => `  • "${f.message.slice(0, 120)}${f.message.length > 120 ? "…" : ""}" (page: ${f.page ?? "unknown"})`)
    .join("\n");

  // Sprint plan feedback summary
  const sprintHelpful = sprintItems.filter(f => f.helpful === 1).length;
  const sprintUnhelpful = sprintItems.filter(f => f.helpful === 0).length;
  const sprintSuggestions = sprintItems
    .filter(f => f.suggestion)
    .slice(0, 3)
    .map(f => `  • "${f.suggestion?.slice(0, 120)}${(f.suggestion?.length ?? 0) > 120 ? "…" : ""}"`)
    .join("\n");

  const lines: string[] = [
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `  MetaEngGuide.pro — Weekly Feedback Digest`,
    `  ${dateRange}`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `BACKLOG HEALTH (all-time)`,
    backlogHealth,
    ``,
    `SITE FEEDBACK SUMMARY (this week)`,
    `  Total submissions: ${siteItems.length}`,
    `  Average rating:    ${avgRating}/5`,
    ``,
    `Category breakdown:`,
    catSummary || "  (none)",
    ``,
  ];

  if (topFeedback) {
    lines.push(`Top-rated feedback (4–5 stars):`);
    lines.push(topFeedback);
    lines.push(``);
  }

  if (bugs) {
    lines.push(`Bug reports:`);
    lines.push(bugs);
    lines.push(``);
  }

  if (sprintItems.length) {
    lines.push(`SPRINT PLAN FEEDBACK`);
    lines.push(`  Total: ${sprintItems.length} | 👍 ${sprintHelpful} helpful | 👎 ${sprintUnhelpful} not helpful`);
    if (sprintSuggestions) {
      lines.push(`  Top suggestions:`);
      lines.push(sprintSuggestions);
    }
    lines.push(``);
  }

  lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`Digest delivered to: ${DIGEST_EMAIL}`);
  lines.push(`View full dashboard: https://metaengguide.pro/admin/feedback`);

  return lines.join("\n");
}

/** Send the weekly digest — can be called manually or by cron */
export async function sendFeedbackDigest(days = 7): Promise<boolean> {
  try {
    const digest = await buildDigest(days);
    if (!digest) {
      console.log("[Digest] No new feedback in the past", days, "days — skipping.");
      return true;
    }

    const title = `📊 MetaEngGuide Weekly Digest — ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
    const recipientEmail = process.env.DIGEST_RECIPIENT_EMAIL;

    // Prefer SMTP if configured and recipient email is set
    if (isSmtpConfigured() && recipientEmail) {
      const sent = await sendEmail({
        to: recipientEmail,
        subject: title,
        text: digest,
        html: `<pre style="font-family:monospace;font-size:13px;white-space:pre-wrap;">${digest.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>`,
      });
      if (sent) {
        console.log("[Digest] Weekly digest sent via SMTP to", recipientEmail.replace(/(.{2}).*@/, "$1***@"));
        return true;
      }
      console.warn("[Digest] SMTP send failed — falling back to notifyOwner.");
    }

    // Fallback: Manus owner notification channel
    const delivered = await notifyOwner({ title, content: digest });
    if (delivered) {
      console.log("[Digest] Weekly feedback digest sent via notifyOwner.");
    } else {
      console.warn("[Digest] notifyOwner returned false — digest may not have been delivered.");
    }
    return delivered;
  } catch (err) {
    console.error("[Digest] Failed to send feedback digest:", err);
    return false;
  }
}

/** Register the weekly cron job — call once at server startup */
export function registerFeedbackDigestCron(): void {
  // Every Monday at 08:00 UTC
  cron.schedule("0 8 * * 1", async () => {
    console.log("[Digest] Running weekly feedback digest cron…");
    await sendFeedbackDigest(7);
  }, { timezone: "UTC" });

  console.log("[Digest] Weekly feedback digest cron registered (Mondays 08:00 UTC)");
}
