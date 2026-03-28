/**
 * Daily Unactioned Feedback Alert
 * Runs every day at 09:00 UTC.
 * If 3 or more feedback items have status "new" (unactioned), sends an email
 * alert to the configured DIGEST_EMAIL address so Apex can triage promptly.
 *
 * The alert is intentionally concise — it shows the count and the top 5
 * oldest unactioned items so the admin can act immediately.
 */
import cron from "node-cron";
import { getDb } from "./db";
import { feedback as feedbackTable } from "../drizzle/schema";
import { eq, asc } from "drizzle-orm";
import { sendEmail } from "./weeklyDigest";
import { notifyOwner } from "./_core/notification";

const DIGEST_EMAIL = process.env.DIGEST_EMAIL ?? "";
const ALERT_THRESHOLD = 3; // send alert when ≥ this many unactioned items exist

// ── Build alert HTML ─────────────────────────────────────────────────────────
function buildAlertHtml(
  count: number,
  topItems: Array<{
    id: number;
    category: string;
    message: string;
    page: string | null;
    createdAt: Date;
  }>
): { subject: string; html: string; text: string } {
  const subject = `⚠️ Action Required: ${count} unactioned feedback item${count !== 1 ? "s" : ""} need triage`;

  const CATEGORY_LABELS: Record<string, string> = {
    bug: "🐛 Bug",
    feature_request: "⭐ Feature",
    content: "📚 Content",
    ux: "🎨 UX",
    other: "💬 Other",
  };

  const itemsHtml = topItems
    .map(
      item => `
    <div style="background:#161b22;border:1px solid #30363d;border-radius:8px;padding:12px 14px;margin-bottom:8px;">
      <div style="font-size:10px;color:#8b949e;margin-bottom:6px;">
        <span style="background:rgba(88,166,255,0.15);color:#58a6ff;padding:2px 8px;border-radius:12px;font-size:10px;font-weight:600;margin-right:6px;">
          ${CATEGORY_LABELS[item.category] ?? item.category}
        </span>
        Page: ${item.page ?? "unknown"} · ${new Date(item.createdAt).toLocaleString()}
      </div>
      <div style="font-size:13px;color:#e6edf3;line-height:1.5;">
        ${item.message.replace(/</g, "&lt;").replace(/>/g, "&gt;").slice(0, 200)}${item.message.length > 200 ? "…" : ""}
      </div>
    </div>`
    )
    .join("");

  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0d1117; color: #e6edf3; margin: 0; padding: 0; }
  .container { max-width: 580px; margin: 0 auto; padding: 28px 16px; }
  .header { border-bottom: 1px solid #30363d; padding-bottom: 16px; margin-bottom: 20px; }
  .title { font-size: 18px; font-weight: 700; color: #f85149; margin: 0 0 4px; }
  .subtitle { font-size: 12px; color: #8b949e; margin: 0; }
  .count-box { background: rgba(248,81,73,0.1); border: 1px solid rgba(248,81,73,0.3); border-radius: 10px; padding: 16px 20px; margin-bottom: 20px; text-align: center; }
  .count-num { font-size: 40px; font-weight: 700; color: #f85149; display: block; }
  .count-label { font-size: 13px; color: #8b949e; }
  .section-title { font-size: 12px; font-weight: 600; color: #8b949e; text-transform: uppercase; letter-spacing: 0.05em; margin: 16px 0 8px; }
  .footer { border-top: 1px solid #30363d; padding-top: 14px; margin-top: 20px; font-size: 11px; color: #8b949e; text-align: center; }
  a { color: #58a6ff; }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <p class="title">⚠️ Feedback Triage Alert</p>
    <p class="subtitle">MetaGuide · Daily Check · ${new Date().toDateString()}</p>
  </div>

  <div class="count-box">
    <span class="count-num">${count}</span>
    <span class="count-label">unactioned "New" feedback item${count !== 1 ? "s" : ""} waiting for triage</span>
  </div>

  <p class="section-title">📋 Oldest Unactioned Items (up to 5)</p>
  ${itemsHtml}

  <div class="footer">
    <span>Feedback received</span>
    <br><br>
    MetaGuide Admin Alert · You receive this because ${count}+ items are unactioned.
  </div>
</div>
</body>
</html>`;

  const text = [
    `⚠️ Feedback Triage Alert — ${new Date().toDateString()}`,
    ``,
    `${count} unactioned "New" feedback item${count !== 1 ? "s" : ""} need your attention.`,
    ``,
    `Top items:`,
    ...topItems.map(
      (i, idx) =>
        `${idx + 1}. [${i.category}] ${i.page ?? "?"} — ${i.message.slice(0, 100)}${i.message.length > 100 ? "…" : ""}`
    ),
    ``,
    ``,
  ].join("\n");

  return { subject, html, text };
}

// ── Check and send alert ─────────────────────────────────────────────────────
export async function checkAndSendDailyAlert(): Promise<void> {
  console.log("[DailyAlert] Checking unactioned feedback count…");
  const db = await getDb();
  if (!db) {
    console.warn("[DailyAlert] No DB connection, skipping.");
    return;
  }

  // Fetch all "new" items, oldest first
  const newItems = await db
    .select({
      id: feedbackTable.id,
      category: feedbackTable.category,
      message: feedbackTable.message,
      page: feedbackTable.page,
      createdAt: feedbackTable.createdAt,
    })
    .from(feedbackTable)
    .where(eq(feedbackTable.status, "new"))
    .orderBy(asc(feedbackTable.createdAt));

  const count = newItems.length;
  console.log(`[DailyAlert] Found ${count} unactioned item(s).`);

  if (count < ALERT_THRESHOLD) {
    console.log(
      `[DailyAlert] Below threshold (${ALERT_THRESHOLD}), no alert sent.`
    );
    return;
  }

  const topItems = newItems.slice(0, 5);
  const { subject, html, text } = buildAlertHtml(count, topItems);

  // Try SMTP first
  if (DIGEST_EMAIL) {
    try {
      const sent = await sendEmail({ to: DIGEST_EMAIL, subject, html, text });
      if (sent) {
        console.log(`[DailyAlert] Alert email sent to ${DIGEST_EMAIL}`);
        return;
      }
    } catch (err) {
      console.warn(
        "[DailyAlert] SMTP send failed, falling back to notification:",
        err
      );
    }
  }

  // Fallback: Manus owner notification
  await notifyOwner({ title: subject, content: text }).catch(err =>
    console.warn("[DailyAlert] Notification fallback failed:", err)
  );
  console.log(
    "[DailyAlert] Alert sent via Manus notification (SMTP fallback)."
  );
}

// ── Schedule: Every day at 09:00 UTC ────────────────────────────────────────
export function startDailyAlertCron(): void {
  cron.schedule("0 9 * * *", () => {
    checkAndSendDailyAlert().catch(err =>
      console.error("[DailyAlert] Unhandled error:", err)
    );
  });
  console.log("[DailyAlert] Cron scheduled: every day at 09:00 UTC");
}
