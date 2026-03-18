// WeeklyDigest — personalized weekly prep checklist generator
// Takes email + interview date, generates a week-by-week plan, copy to clipboard
import { useState, useMemo, useCallback } from "react";
import { Mail, CalendarDays, Copy, Check, Sparkles } from "lucide-react";
import { PATTERNS, STORY_BANK, TIMELINE_WEEKS } from "@/lib/guideData";

// Assign patterns to weeks (split 14 patterns across 4 weeks)
const WEEK_PATTERNS: string[][] = [
  // Week 1 — top 7 high-frequency
  PATTERNS.filter((p) => p.frequency >= 4).slice(0, 7).map((p) => p.name),
  // Week 2 — remaining 7
  PATTERNS.filter((p) => p.frequency < 4).concat(PATTERNS.filter((p) => p.frequency >= 4).slice(7)).slice(0, 7).map((p) => p.name),
  // Week 3 — behavioral stories (first 4)
  [],
  // Week 4 — review
  [],
];

const WEEK_STORIES: string[][] = [
  [], [],
  STORY_BANK.slice(0, 4).map((s) => s.type),
  STORY_BANK.slice(4).map((s) => s.type),
];

function buildDigest(email: string, interviewDate: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const interview = new Date(interviewDate + "T00:00:00");
  const daysLeft = Math.ceil((interview.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  const lines: string[] = [
    `📋 Meta IC6/IC7 — Personalized 4-Week Prep Digest`,
    `For: ${email}`,
    `Interview Date: ${interview.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`,
    `Days Remaining: ${daysLeft > 0 ? daysLeft : "Interview day!"}`,
    `Generated: ${today.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`,
    ``,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    ``,
  ];

  TIMELINE_WEEKS.forEach((week, i) => {
    const weekNum = i + 1;
    const weekStart = new Date(interview);
    weekStart.setDate(interview.getDate() - (4 - weekNum) * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const dateRange = `${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${weekEnd.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;

    lines.push(`📅 ${week.weeks.toUpperCase()} (${dateRange})`);
    lines.push(`   ${week.focus}`);
    lines.push(``);

    if (WEEK_PATTERNS[i].length > 0) {
      lines.push(`   🧩 Coding Patterns to Drill:`);
      WEEK_PATTERNS[i].forEach((p) => lines.push(`      ☐ ${p}`));
      lines.push(``);
    }

    if (WEEK_STORIES[i].length > 0) {
      lines.push(`   🎤 STAR Stories to Prepare:`);
      WEEK_STORIES[i].forEach((s) => lines.push(`      ☐ ${s}`));
      lines.push(``);
    }

    lines.push(`   📌 Focus: ${week.detail.split(".")[0]}.`);
    lines.push(``);
    lines.push(`   ─────────────────────────────────────────────`);
    lines.push(``);
  });

  lines.push(`💡 Daily Habits (Every Day):`);
  lines.push(`   ☐ Solve 1–2 LeetCode problems (timed, 25 min each)`);
  lines.push(`   ☐ Run 1 Practice Mode session on the Behavioral tab`);
  lines.push(`   ☐ Run 2–3 Quick Drill flash cards on the Coding tab`);
  lines.push(`   ☐ Review any mistakes from the previous day`);
  lines.push(``);
  lines.push(`🔗 Guide: https://metacareers.com`);
  lines.push(`⚠️  This is supplementary material. Always defer to official Meta recruiter communications.`);

  return lines.join("\n");
}

export default function WeeklyDigest() {
  const [email, setEmail]           = useState("");
  const [dateStr, setDateStr]       = useState("");
  const [generated, setGenerated]   = useState(false);
  const [copied, setCopied]         = useState(false);

  const digest = useMemo(() => {
    if (!generated || !email || !dateStr) return "";
    return buildDigest(email, dateStr);
  }, [generated, email, dateStr]);

  const handleGenerate = useCallback(() => {
    if (!email.trim() || !dateStr) return;
    setGenerated(true);
    setCopied(false);
  }, [email, dateStr]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(digest).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }, [digest]);

  const handleReset = () => {
    setGenerated(false);
    setCopied(false);
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-4">
      {/* Input form */}
      {!generated && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            {/* Email */}
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Your Email</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300 bg-gray-50"
                />
              </div>
            </div>

            {/* Interview date */}
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Interview Date</label>
              <div className="relative">
                <CalendarDays size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="date"
                  value={dateStr}
                  onChange={(e) => setDateStr(e.target.value)}
                  min={today}
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300 bg-gray-50"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={!email.trim() || !dateStr}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <Sparkles size={15} />
            Generate My Weekly Digest
          </button>
        </div>
      )}

      {/* Generated digest */}
      {generated && digest && (
        <div className="space-y-3">
          {/* Toolbar */}
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-700">Your personalized 4-week checklist is ready</p>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-bold transition-all shadow-sm ${
                  copied ? "bg-emerald-600 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                {copied ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy to Clipboard</>}
              </button>
              <button
                onClick={handleReset}
                className="px-3 py-2 text-xs text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors font-semibold"
              >
                Edit
              </button>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-gray-900 rounded-2xl p-4 overflow-auto max-h-96 shadow-inner">
            <pre className="text-xs text-gray-200 font-mono leading-relaxed whitespace-pre-wrap">{digest}</pre>
          </div>

          <p className="text-[11px] text-gray-400">
            Paste this into a Google Doc, Notion page, or email to yourself as a weekly reminder.
          </p>
        </div>
      )}
    </div>
  );
}
