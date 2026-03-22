// ProgressExport — generates a formatted text progress report from all localStorage data
import { useState } from "react";
import { Download, FileText, CheckCircle2 } from "lucide-react";
import { PATTERNS, STORY_BANK } from "@/lib/guideData";

const PROGRESS_KEY   = "meta-guide-progress";
const DRILL_KEY      = "meta-guide-drill-ratings";
const PRACTICE_KEY   = "meta-guide-practice-ratings";
const STREAK_KEY     = "meta-guide-streak";
const SESSION_KEY    = "meta-guide-session-log";
const SRS_KEY        = "meta-guide-srs-schedule";
const INTERVIEW_KEY  = "meta-guide-interview-date";

function load<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) ?? "null") ?? fallback; } catch { return fallback; }
}

function stars(n: number) { return "★".repeat(n) + "☆".repeat(5 - n); }

function avg(arr: { rating: number }[]): number | null {
  if (!arr.length) return null;
  return arr.reduce((s, e) => s + e.rating, 0) / arr.length;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function generateReport(): string {
  const progress: Record<string, boolean>    = load(PROGRESS_KEY, {});
  const drillRatings: Record<string, { rating: number; ts: number }[]> = load(DRILL_KEY, {});
  const practiceRatings: Record<string, { rating: number; ts: number }[]> = load(PRACTICE_KEY, {});
  const streak: { current: number; dates: string[] } = load(STREAK_KEY, { current: 0, dates: [] });
  const sessions: { type: string; durationSec: number; date: string; label?: string; patternName?: string; rating?: number }[] = load(SESSION_KEY, []);
  const srs: Record<string, { nextReview: string; lastRating: number; interval: number }> = load(SRS_KEY, {});
  const interviewDate: string | null = load(INTERVIEW_KEY, null);

  const masteredPatterns  = PATTERNS.filter((p) => progress[`pattern-${p.id}`]);
  const preparedStories   = STORY_BANK.filter((_, i) => progress[`story-${i}`]);
  const overallPct        = Math.round(((masteredPatterns.length + preparedStories.length) / (PATTERNS.length + STORY_BANK.length)) * 100);

  // Weak spots
  const patternAvgs = PATTERNS.map((p) => {
    const entries = drillRatings[p.id] ?? [];
    const a = avg(entries.map((e) => ({ rating: e.rating })));
    return { name: p.name, avg: a, attempts: entries.length };
  }).filter((x) => x.avg !== null).sort((a, b) => (a.avg ?? 5) - (b.avg ?? 5));

  const behavioralAvgs = Object.entries(practiceRatings).map(([q, entries]) => {
    const a = avg(entries.map((e) => ({ rating: e.rating })));
    return { question: q, avg: a, attempts: entries.length };
  }).filter((x) => x.avg !== null).sort((a, b) => (a.avg ?? 5) - (b.avg ?? 5));

  const duePatterns = Object.entries(srs)
    .filter(([, e]) => e.nextReview <= new Date().toISOString().split("T")[0])
    .map(([id]) => PATTERNS.find((p) => p.id === id)?.name ?? id);

  const totalMinutes = Math.round(sessions.reduce((s, e) => s + e.durationSec, 0) / 60);

  const lines: string[] = [];

  lines.push("=".repeat(60));
  lines.push("  META L6/L7 INTERVIEW PREPARATION — PROGRESS REPORT");
  lines.push("=".repeat(60));
  lines.push(`  Generated: ${formatDate(new Date().toISOString())}`);
  if (interviewDate) lines.push(`  Interview Date: ${formatDate(interviewDate)}`);
  lines.push("");

  // Overall readiness
  lines.push("─".repeat(60));
  lines.push("  OVERALL READINESS");
  lines.push("─".repeat(60));
  lines.push(`  ${overallPct}% ready  (${masteredPatterns.length}/${PATTERNS.length} patterns · ${preparedStories.length}/${STORY_BANK.length} stories)`);
  lines.push(`  Current Streak: ${streak.current} day${streak.current !== 1 ? "s" : ""} 🔥`);
  lines.push(`  Total Practice Time: ${totalMinutes} minutes across ${sessions.length} sessions`);
  lines.push("");

  // Patterns
  lines.push("─".repeat(60));
  lines.push("  CODING PATTERNS");
  lines.push("─".repeat(60));
  PATTERNS.forEach((p) => {
    const done    = progress[`pattern-${p.id}`] ? "✓" : "○";
    const entries = drillRatings[p.id] ?? [];
    const a       = avg(entries.map((e) => ({ rating: e.rating })));
    const rating  = a !== null ? ` ${stars(Math.round(a))} (${entries.length} drill${entries.length !== 1 ? "s" : ""})` : " (not drilled)";
    const srsEntry = srs[p.id];
    const due     = srsEntry ? `  next review: ${formatDate(srsEntry.nextReview)}` : "";
    lines.push(`  [${done}] ${p.name.padEnd(32)}${rating}${due}`);
  });
  lines.push("");

  // Stories
  lines.push("─".repeat(60));
  lines.push("  STAR STORY BANK");
  lines.push("─".repeat(60));
  STORY_BANK.forEach((s, i) => {
    const done = progress[`story-${i}`] ? "✓" : "○";
    lines.push(`  [${done}] ${s.type}`);
    lines.push(`       Focus: ${s.focusAreas}  |  Values: ${s.values}`);
  });
  lines.push("");

  // Weak spots
  if (patternAvgs.length > 0) {
    lines.push("─".repeat(60));
    lines.push("  TOP WEAK SPOTS — CODING PATTERNS");
    lines.push("─".repeat(60));
    patternAvgs.slice(0, 5).forEach((p, i) => {
      lines.push(`  ${i + 1}. ${p.name.padEnd(32)} avg ${stars(Math.round(p.avg ?? 0))} (${p.avg?.toFixed(1)})`);
    });
    lines.push("");
  }

  if (behavioralAvgs.length > 0) {
    lines.push("─".repeat(60));
    lines.push("  TOP WEAK SPOTS — BEHAVIORAL QUESTIONS");
    lines.push("─".repeat(60));
    behavioralAvgs.slice(0, 5).forEach((b, i) => {
      const q = b.question.length > 55 ? b.question.slice(0, 52) + "..." : b.question;
      lines.push(`  ${i + 1}. ${q}`);
      lines.push(`     avg ${stars(Math.round(b.avg ?? 0))} (${b.avg?.toFixed(1)}) · ${b.attempts} attempt${b.attempts !== 1 ? "s" : ""}`);
    });
    lines.push("");
  }

  // Due today
  if (duePatterns.length > 0) {
    lines.push("─".repeat(60));
    lines.push("  PATTERNS DUE FOR REVIEW TODAY");
    lines.push("─".repeat(60));
    duePatterns.forEach((name) => lines.push(`  • ${name}`));
    lines.push("");
  }

  // Session log
  if (sessions.length > 0) {
    lines.push("─".repeat(60));
    lines.push("  RECENT SESSIONS (last 10)");
    lines.push("─".repeat(60));
    sessions.slice(0, 10).forEach((s) => {
      const label    = s.patternName ?? s.label ?? (s.type === "coding" ? "Coding" : "Behavioral");
      const dur      = `${Math.floor(s.durationSec / 60)}m ${s.durationSec % 60}s`;
      const ratingStr = s.rating != null ? ` · ${stars(s.rating)}` : "";
      lines.push(`  ${formatDate(s.date).padEnd(22)} ${label.padEnd(30)} ${dur}${ratingStr}`);
    });
    lines.push("");
  }

  lines.push("=".repeat(60));
  lines.push("  This report was generated by the Meta L6/L7 Prep Guide.");
  lines.push("  For official resources, visit metacareers.com");
  lines.push("=".repeat(60));

  return lines.join("\n");
}

export default function ProgressExport() {
  const [copied, setCopied] = useState(false);

  const handleDownload = () => {
    const report   = generateReport();
    const blob     = new Blob([report], { type: "text/plain;charset=utf-8" });
    const url      = URL.createObjectURL(blob);
    const a        = document.createElement("a");
    a.href         = url;
    a.download     = `meta-prep-report-${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    const report = generateReport();
    try {
      await navigator.clipboard.writeText(report);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback: download instead
      handleDownload();
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-5">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm">
          <FileText size={18} className="text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Download Progress Report
          </h3>
          <p className="text-sm text-gray-600 mt-0.5 leading-relaxed">
            Generates a formatted summary of your readiness, all 14 pattern statuses, STAR stories, weak spots, spaced-repetition schedule, and session history — ready to share with a coach or recruiter.
          </p>

          <div className="flex flex-wrap gap-2 mt-4">
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all shadow-sm"
            >
              <Download size={14} /> Download .txt
            </button>
            <button
              onClick={handleCopy}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                copied
                  ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                  : "bg-white border-gray-200 text-gray-700 hover:border-blue-300 hover:text-blue-700"
              }`}
            >
              {copied ? <><CheckCircle2 size={14} /> Copied!</> : "Copy to clipboard"}
            </button>
          </div>

          <p className="text-[11px] text-gray-400 mt-3">
            All data is read from your browser's local storage — nothing is sent to any server.
          </p>
        </div>
      </div>
    </div>
  );
}
