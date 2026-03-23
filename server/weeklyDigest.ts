/**
 * Weekly Feedback Digest
 * Runs every Monday at 08:00 UTC.
 * Summarises new feedback from the past 7 days and sends an email digest
 * to the configured DIGEST_EMAIL address.
 *
 * Email is sent via SMTP (configured through SMTP_* env vars).
 * Falls back to a Manus owner notification if SMTP is not configured.
 */
import cron from "node-cron";
import nodemailer from "nodemailer";
import { getDb } from "./db";
import { feedback as feedbackTable } from "../drizzle/schema";
import { gte } from "drizzle-orm";
import { notifyOwner } from "./_core/notification";

const DIGEST_EMAIL = process.env.DIGEST_EMAIL ?? "";

// ── Email transport ──────────────────────────────────────────────────────────
function createTransport() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT ?? "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

// ── Build digest HTML ────────────────────────────────────────────────────────
function buildDigestHtml(
  items: Array<{
    id: number;
    feedbackType: string;
    category: string;
    message: string;
    page: string | null;
    createdAt: Date;
  }>
): { subject: string; html: string; text: string } {
  const now = new Date();
  const dateRange = `${new Date(Date.now() - 7 * 86400_000).toDateString()} – ${now.toDateString()}`;
  const subject = `📬 Weekly Feedback Digest — ${items.length} new item${items.length !== 1 ? "s" : ""} (${now.toDateString()})`;

  // Group by category
  const grouped: Record<string, typeof items> = {};
  for (const item of items) {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push(item);
  }

  const CATEGORY_LABELS: Record<string, string> = {
    bug: "🐛 Bugs",
    feature_request: "⭐ Feature Requests",
    content: "📚 Content",
    ux: "🎨 UX",
    other: "💬 Other",
    sprint_plan: "🏃 Sprint Plan",
  };

  let html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0d1117; color: #e6edf3; margin: 0; padding: 0; }
  .container { max-width: 640px; margin: 0 auto; padding: 32px 16px; }
  .header { border-bottom: 1px solid #30363d; padding-bottom: 20px; margin-bottom: 24px; }
  .title { font-size: 20px; font-weight: 700; color: #58a6ff; margin: 0 0 4px; }
  .subtitle { font-size: 12px; color: #8b949e; margin: 0; }
  .section-title { font-size: 13px; font-weight: 600; color: #8b949e; text-transform: uppercase; letter-spacing: 0.05em; margin: 20px 0 10px; }
  .item { background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 12px 14px; margin-bottom: 8px; }
  .item-meta { font-size: 10px; color: #8b949e; margin-bottom: 6px; }
  .item-message { font-size: 13px; color: #e6edf3; line-height: 1.5; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: 600; margin-right: 6px; }
  .badge-bug { background: rgba(248,81,73,0.15); color: #f85149; }
  .badge-feature { background: rgba(88,166,255,0.15); color: #58a6ff; }
  .badge-ux { background: rgba(63,185,80,0.15); color: #3fb950; }
  .badge-content { background: rgba(188,140,255,0.15); color: #bc8cff; }
  .badge-other { background: rgba(210,153,34,0.15); color: #d29922; }
  .footer { border-top: 1px solid #30363d; padding-top: 16px; margin-top: 24px; font-size: 11px; color: #8b949e; text-align: center; }
  .kpi { display: inline-block; background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 12px 20px; margin: 4px; text-align: center; }
  .kpi-num { font-size: 28px; font-weight: 700; color: #58a6ff; display: block; }
  .kpi-label { font-size: 10px; color: #8b949e; }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <p class="title">Meta Prep Guide — Weekly Digest</p>
    <p class="subtitle">${dateRange}</p>
  </div>

  <div style="margin-bottom:20px;">
    <span class="kpi"><span class="kpi-num">${items.length}</span><span class="kpi-label">New Items</span></span>
    ${Object.entries(grouped)
      .map(
        ([cat, arr]) =>
          `<span class="kpi"><span class="kpi-num">${arr.length}</span><span class="kpi-label">${cat.replace("_", " ")}</span></span>`
      )
      .join("")}
  </div>
`;

  if (items.length === 0) {
    html += `<p style="color:#8b949e;font-size:14px;">No new feedback this week. 🎉</p>`;
  } else {
    for (const [cat, catItems] of Object.entries(grouped)) {
      html += `<p class="section-title">${CATEGORY_LABELS[cat] ?? cat} (${catItems.length})</p>`;
      for (const item of catItems) {
        const badgeClass =
          cat === "bug"
            ? "badge-bug"
            : cat === "feature_request"
              ? "badge-feature"
              : cat === "ux"
                ? "badge-ux"
                : cat === "content"
                  ? "badge-content"
                  : "badge-other";
        html += `
        <div class="item">
          <div class="item-meta">
            <span class="badge ${badgeClass}">${cat.replace("_", " ")}</span>
            Page: ${item.page ?? "unknown"} · ${new Date(item.createdAt).toLocaleString()}
          </div>
          <div class="item-message">${item.message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
        </div>`;
      }
    }
  }

  html += `
  <div class="footer">
    Meta Prep Guide · Admin Digest · <a href="https://www.metaguide.blog/admin/feedback" style="color:#58a6ff;">View Dashboard</a>
  </div>
</div>
</body>
</html>`;

  const text = [
    `Weekly Feedback Digest — ${dateRange}`,
    `Total: ${items.length} new items`,
    ``,
    ...items.map(
      i =>
        `[${i.category}] ${i.page ?? "?"} — ${i.message.slice(0, 120)}${i.message.length > 120 ? "…" : ""}`
    ),
    ``,
    `View full dashboard: https://www.metaguide.blog/admin/feedback`,
  ].join("\n");

  return { subject, html, text };
}

// ── Send digest ──────────────────────────────────────────────────────────────
async function sendWeeklyDigest() {
  console.log("[WeeklyDigest] Running weekly feedback digest…");
  const db = await getDb();
  if (!db) {
    console.warn("[WeeklyDigest] No DB connection, skipping.");
    return;
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const items = await db
    .select({
      id: feedbackTable.id,
      feedbackType: feedbackTable.feedbackType,
      category: feedbackTable.category,
      message: feedbackTable.message,
      page: feedbackTable.page,
      createdAt: feedbackTable.createdAt,
    })
    .from(feedbackTable)
    .where(gte(feedbackTable.createdAt, sevenDaysAgo));

  console.log(`[WeeklyDigest] Found ${items.length} items in the last 7 days.`);

  const { subject, html, text } = buildDigestHtml(items);

  // Try SMTP first
  const transport = createTransport();
  if (transport && DIGEST_EMAIL) {
    try {
      await transport.sendMail({
        from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
        to: DIGEST_EMAIL,
        subject,
        html,
        text,
      });
      console.log(`[WeeklyDigest] Email sent to ${DIGEST_EMAIL}`);
      return;
    } catch (err) {
      console.warn(
        "[WeeklyDigest] SMTP send failed, falling back to notification:",
        err
      );
    }
  }

  // Fallback: Manus owner notification
  await notifyOwner({
    title: subject,
    content: text,
  }).catch(err =>
    console.warn("[WeeklyDigest] Notification fallback failed:", err)
  );

  console.log(
    "[WeeklyDigest] Digest sent via Manus notification (SMTP not configured)."
  );
}

// ── Schedule: Every Monday at 08:00 UTC ─────────────────────────────────────
export function startWeeklyDigestCron() {
  // "0 8 * * 1" = At 08:00 on Monday
  cron.schedule("0 8 * * 1", () => {
    sendWeeklyDigest().catch(err =>
      console.error("[WeeklyDigest] Unhandled error:", err)
    );
  });
  console.log("[WeeklyDigest] Cron scheduled: every Monday at 08:00 UTC");
}

// Export for manual trigger via admin tRPC procedure
export { sendWeeklyDigest };
