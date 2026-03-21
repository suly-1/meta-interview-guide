/**
 * ProgressDashboard — unified panel showing all saved progress from localStorage
 * Reads directly from localStorage keys used across the app.
 */
import { useMemo, useState } from "react";
import { X, Download, Trash2, TrendingUp, BookOpen, Brain, Flame, Star, Trophy, Target, BarChart2, Clock, MessageSquare, Zap, Medal } from "lucide-react";
import { getLevelInfo, XP_LEVELS } from "@/hooks/useXP";

// ── Weakness Sprint Leaderboard helpers ─────────────────────────────────────
const WEAKNESS_SPRINT_KEY = "meta-guide-weakness-sprint-history";

export interface WeaknessSprintRecord {
  date: string;        // "YYYY-MM-DD"
  patterns: string[];  // top-3 weak patterns targeted
  score: number;       // 0-8 correct
  total: number;       // always 8
}

export function saveWeaknessSprintRecord(record: WeaknessSprintRecord) {
  try {
    const existing: WeaknessSprintRecord[] = JSON.parse(
      localStorage.getItem(WEAKNESS_SPRINT_KEY) ?? "[]"
    );
    existing.push(record);
    localStorage.setItem(WEAKNESS_SPRINT_KEY, JSON.stringify(existing.slice(-100)));
  } catch {}
}

function loadWeaknessSprintHistory(): WeaknessSprintRecord[] {
  try { return JSON.parse(localStorage.getItem(WEAKNESS_SPRINT_KEY) ?? "[]"); } catch { return []; }
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function loadJSON<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) ?? "") ?? fallback; } catch { return fallback; }
}

function getStreak(streakDates: string[]): number {
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];
  const sorted = Array.from(new Set(streakDates)).sort().reverse();
  let streak = 0;
  if (sorted.length && (sorted[0] === today || sorted[0] === yesterdayStr)) {
    let cursor = new Date(sorted[0] + "T00:00:00");
    for (const d of sorted) {
      if (d === cursor.toISOString().split("T")[0]) { streak++; cursor.setDate(cursor.getDate() - 1); }
      else break;
    }
  }
  return streak;
}

// ── Types ────────────────────────────────────────────────────────────────────
interface ProgressSnapshot {
  // XP & Level
  totalXP: number;
  levelName: string;
  levelEmoji: string;
  levelProgressPct: number;
  todayXP: number;
  // CTCI
  ctciSolved: number;
  ctciStarred: number;
  ctciTotal: number;
  // Streak
  streak: number;
  // Patterns
  patternsRated: number;
  patternAvgRating: number | null;
  // Behavioral
  behavioralRated: number;
  behavioralAvg: number | null;
  // SD Mocks
  sdMockCount: number;
  // AI Mocks
  aiMockCount: number;
  // Readiness
  readinessTotal: number;
  // Sprints
  sprintCount: number;
  // Session log
  sessionCount: number;
  // Last active
  lastActive: string | null;
}

function computeSnapshot(): ProgressSnapshot {
  // XP
  const xpStore = loadJSON<{ totalXP: number; events: { ts: number; amount: number }[] }>(
    "meta-guide-xp-log", { totalXP: 0, events: [] }
  );
  const totalXP = xpStore.totalXP ?? 0;
  const levelInfo = getLevelInfo(totalXP);
  const today = new Date().toISOString().split("T")[0];
  const todayXP = xpStore.events
    .filter(e => new Date(e.ts).toISOString().split("T")[0] === today)
    .reduce((s, e) => s + e.amount, 0);

  // CTCI
  const ctciData = loadJSON<Record<number, { solved: boolean; starred: boolean }>>("ctci_progress_v1", {});
  const ctciSolved = Object.values(ctciData).filter(p => p.solved).length;
  const ctciStarred = Object.values(ctciData).filter(p => p.starred).length;
  const ctciTotal = 500; // approximate

  // Streak
  const streakDates = loadJSON<string[]>("meta-guide-streak-dates", []);
  const streak = getStreak(streakDates);

  // Pattern drill ratings
  const drillData = loadJSON<Record<string, { rating: number }[]>>("meta-guide-drill-ratings", {});
  const patternEntries = Object.values(drillData).filter(arr => arr.length > 0);
  const patternsRated = patternEntries.length;
  const allRatings = patternEntries.flatMap(arr => arr.map(e => e.rating));
  const patternAvgRating = allRatings.length
    ? Math.round((allRatings.reduce((a, b) => a + b, 0) / allRatings.length) * 10) / 10
    : null;

  // Behavioral ratings
  const behData = loadJSON<Record<string, { rating: number }[]>>("meta-guide-practice-ratings", {});
  const behEntries = Object.values(behData).filter(arr => arr.length > 0);
  const behavioralRated = behEntries.length;
  const allBehRatings = behEntries.flatMap(arr => arr.map(e => e.rating));
  const behavioralAvg = allBehRatings.length
    ? Math.round((allBehRatings.reduce((a, b) => a + b, 0) / allBehRatings.length) * 10) / 10
    : null;

  // SD Mocks
  const sdHistory = loadJSON<{ id: string }[]>("sd_mock_history_v1", []);
  const sdMockCount = sdHistory.length;

  // AI Mocks
  const aiHistory = loadJSON<{ id: string }[]>("ai_mock_session_history", []);
  const aiMockCount = aiHistory.length;

  // Readiness (composite)
  const drillAvgs = patternEntries.map(arr => arr.reduce((s, e) => s + e.rating, 0) / arr.length);
  const drillAvg = drillAvgs.length ? drillAvgs.reduce((a, b) => a + b, 0) / drillAvgs.length : null;
  const drillScore = drillAvg !== null ? Math.round((drillAvg / 5) * 100) : 0;
  const ctciScore = Math.round((ctciSolved / ctciTotal) * 100);
  const behavioralScore = behavioralAvg !== null ? Math.round((behavioralAvg / 5) * 100) : 0;
  const streakScore = Math.min(100, Math.round((streak / 14) * 100));
  const readinessTotal = Math.round(drillScore * 0.4 + ctciScore * 0.3 + behavioralScore * 0.2 + streakScore * 0.1);

  // Sprint count (from code practice stats)
  const sprintHistory = loadJSON<{ id: string }[]>("meta-guide-sprint-history", []);
  const sprintCount = sprintHistory.length;

  // Session log
  const sessionLog = loadJSON<{ id: string }[]>("meta-guide-session-log", []);
  const sessionCount = sessionLog.length;

  // Last active
  const allTimestamps = [
    ...xpStore.events.map(e => e.ts),
  ].filter(Boolean);
  const lastActive = allTimestamps.length
    ? new Date(Math.max(...allTimestamps)).toLocaleDateString()
    : null;

  return {
    totalXP, levelName: levelInfo.current.name, levelEmoji: levelInfo.current.emoji,
    levelProgressPct: levelInfo.progressPct, todayXP,
    ctciSolved, ctciStarred, ctciTotal,
    streak, patternsRated, patternAvgRating,
    behavioralRated, behavioralAvg,
    sdMockCount, aiMockCount, readinessTotal,
    sprintCount, sessionCount, lastActive,
  };
}

function exportProgress(snap: ProgressSnapshot) {
  const lines = [
    `# Meta IC6/IC7 Interview Guide — Progress Export`,
    `Generated: ${new Date().toLocaleString()}`,
    ``,
    `## Overview`,
    `- Level: ${snap.levelEmoji} ${snap.levelName} (${snap.totalXP} XP)`,
    `- Readiness Score: ${snap.readinessTotal}%`,
    `- Daily Streak: ${snap.streak} day${snap.streak !== 1 ? "s" : ""}`,
    `- Today's XP: +${snap.todayXP}`,
    ``,
    `## Practice Tracker`,
    `- Problems Solved: ${snap.ctciSolved} / ${snap.ctciTotal} (${Math.round(snap.ctciSolved / snap.ctciTotal * 100)}%)`,
    `- Starred Problems: ${snap.ctciStarred}`,
    ``,
    `## Coding Patterns`,
    `- Patterns Rated: ${snap.patternsRated}`,
    `- Average Rating: ${snap.patternAvgRating !== null ? snap.patternAvgRating + " / 5" : "Not rated yet"}`,
    ``,
    `## Behavioral`,
    `- Questions Rated: ${snap.behavioralRated}`,
    `- Average Rating: ${snap.behavioralAvg !== null ? snap.behavioralAvg + " / 5" : "Not rated yet"}`,
    ``,
    `## Mock Sessions`,
    `- System Design Mocks: ${snap.sdMockCount}`,
    `- AI Round Mocks: ${snap.aiMockCount}`,
    `- Topic Sprints: ${snap.sprintCount}`,
    `- Coding Sessions: ${snap.sessionCount}`,
    ``,
    `## Last Active`,
    `- ${snap.lastActive ?? "No activity recorded"}`,
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `meta-guide-progress-${new Date().toISOString().split("T")[0]}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

function resetAllProgress() {
  if (!confirm("⚠️ This will permanently delete ALL your saved progress — XP, solved problems, ratings, streaks, notes, and mock history. This cannot be undone.\n\nAre you absolutely sure?")) return;
  const keysToDelete = [
    "meta-guide-xp-log", "ctci_progress_v1", "meta-guide-streak-dates",
    "meta-guide-drill-ratings", "meta-guide-practice-ratings", "meta-guide-pattern-notes",
    "meta-guide-story-notes", "meta-guide-srs-schedule", "meta-guide-session-log",
    "meta-guide-progress-patterns", "meta-guide-candidate-profile", "meta-guide-pattern-priority",
    "meta-guide-interview-date", "meta_ctci_progress", "meta_ic7_signals",
    "meta_pattern_ratings", "meta_readiness_goal_v1", "meta_star_stories",
    "sd_mock_history_v1", "ai_mock_session_history", "meta-guide-sprint-history",
    "meta-guide-speed-run-history", "meta-guide-tournament-history",
    "gauntlet_history", "gauntlet_cleared_badge",
  ];
  keysToDelete.forEach(k => localStorage.removeItem(k));
  window.location.reload();
}

// ── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string; color: string;
}) {
  return (
    <div className={`rounded-xl border p-4 flex items-start gap-3 bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700`}>
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-0.5">{label}</div>
        <div className="text-xl font-bold text-gray-900 dark:text-gray-100 leading-tight">{value}</div>
        {sub && <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

// ── Progress Bar ─────────────────────────────────────────────────────────────
function ProgressBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
        <span>{label}</span>
        <span className="font-semibold text-gray-700 dark:text-gray-300">{value} / {max}</span>
      </div>
      <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ProgressDashboard({ open, onClose }: Props) {
  const snap = useMemo(() => computeSnapshot(), [open]);
  const [confirmReset, setConfirmReset] = useState(false);

  if (!open) return null;

  const levelInfo = getLevelInfo(snap.totalXP);
  const nextLevel = levelInfo.next;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white">
              <TrendingUp size={18} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Progress Dashboard</h2>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {snap.lastActive ? `Last active: ${snap.lastActive}` : "Start practicing to track progress"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Level & XP */}
          <div className="rounded-xl bg-gradient-to-r from-blue-50 to-violet-50 dark:from-blue-950/40 dark:to-violet-950/40 border border-blue-100 dark:border-blue-900/40 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{snap.levelEmoji}</span>
                <div>
                  <div className="font-bold text-gray-900 dark:text-gray-100">{snap.levelName}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{snap.totalXP.toLocaleString()} XP total · +{snap.todayXP} today</div>
                </div>
              </div>
              {nextLevel && (
                <div className="text-right text-xs text-gray-500 dark:text-gray-400">
                  <div className="font-semibold text-gray-700 dark:text-gray-300">{snap.levelProgressPct}%</div>
                  <div>to {nextLevel.name}</div>
                </div>
              )}
            </div>
            <div className="h-2.5 bg-white/60 dark:bg-gray-800/60 rounded-full overflow-hidden border border-blue-100 dark:border-blue-900/30">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-violet-500 rounded-full transition-all"
                style={{ width: `${snap.levelProgressPct}%` }}
              />
            </div>
            {/* Level milestones */}
            <div className="flex justify-between mt-2">
              {XP_LEVELS.map((lvl, i) => (
                <div key={i} className="flex flex-col items-center gap-0.5" title={`${lvl.name}: ${lvl.minXP} XP`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${snap.totalXP >= lvl.minXP ? "bg-blue-500" : "bg-gray-200 dark:bg-gray-700"}`} />
                  <span className="text-[9px] text-gray-400 hidden sm:block">{lvl.emoji}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Readiness Score */}
          <div className="rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                <Target size={15} className="text-rose-500" />
                Overall Readiness Score
              </div>
              <div className={`text-2xl font-bold ${
                snap.readinessTotal >= 70 ? "text-emerald-600" :
                snap.readinessTotal >= 40 ? "text-amber-600" : "text-rose-600"
              }`}>{snap.readinessTotal}%</div>
            </div>
            <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  snap.readinessTotal >= 70 ? "bg-emerald-500" :
                  snap.readinessTotal >= 40 ? "bg-amber-500" : "bg-rose-500"
                }`}
                style={{ width: `${snap.readinessTotal}%` }}
              />
            </div>
            <div className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
              Weighted: 40% patterns · 30% CTCI · 20% behavioral · 10% streak
            </div>
          </div>

          {/* Stat Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <StatCard icon={<Flame size={16} className="text-orange-500" />} label="Daily Streak" value={`${snap.streak}d`} sub={snap.streak >= 7 ? "🔥 On fire!" : snap.streak > 0 ? "Keep going!" : "Start today"} color="bg-orange-50 dark:bg-orange-900/20" />
            <StatCard icon={<BookOpen size={16} className="text-violet-500" />} label="Problems Solved" value={snap.ctciSolved} sub={`of ${snap.ctciTotal} · ${Math.round(snap.ctciSolved / snap.ctciTotal * 100)}%`} color="bg-violet-50 dark:bg-violet-900/20" />
            <StatCard icon={<Star size={16} className="text-amber-500" />} label="Starred Problems" value={snap.ctciStarred} sub="for review" color="bg-amber-50 dark:bg-amber-900/20" />
            <StatCard icon={<Brain size={16} className="text-blue-500" />} label="Patterns Rated" value={snap.patternsRated} sub={snap.patternAvgRating !== null ? `avg ${snap.patternAvgRating}/5` : "Not started"} color="bg-blue-50 dark:bg-blue-900/20" />
            <StatCard icon={<MessageSquare size={16} className="text-teal-500" />} label="Behavioral Qs" value={snap.behavioralRated} sub={snap.behavioralAvg !== null ? `avg ${snap.behavioralAvg}/5` : "Not started"} color="bg-teal-50 dark:bg-teal-900/20" />
            <StatCard icon={<Trophy size={16} className="text-rose-500" />} label="Mock Sessions" value={snap.sdMockCount + snap.aiMockCount} sub={`${snap.sdMockCount} SD · ${snap.aiMockCount} AI`} color="bg-rose-50 dark:bg-rose-900/20" />
          </div>

          {/* Progress Bars */}
          <div className="rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 space-y-3">
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-1">
              <BarChart2 size={14} className="text-blue-500" />
              Detailed Progress
            </div>
            <ProgressBar label="CTCI Problems Solved" value={snap.ctciSolved} max={snap.ctciTotal} color="bg-violet-500" />
            <ProgressBar label="Coding Patterns Rated" value={snap.patternsRated} max={14} color="bg-blue-500" />
            <ProgressBar label="Behavioral Questions Rated" value={snap.behavioralRated} max={28} color="bg-teal-500" />
            <ProgressBar label="Topic Sprints Completed" value={snap.sprintCount} max={20} color="bg-emerald-500" />
            <ProgressBar label="Mock Sessions Completed" value={snap.sdMockCount + snap.aiMockCount} max={10} color="bg-rose-500" />
          </div>

          {/* Activity summary */}
          <div className="rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-3">
              <Clock size={14} className="text-gray-400" />
              Activity Summary
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              {[
                { label: "Sprints", value: snap.sprintCount },
                { label: "Sessions", value: snap.sessionCount },
                { label: "SD Mocks", value: snap.sdMockCount },
                { label: "AI Mocks", value: snap.aiMockCount },
              ].map(({ label, value }) => (
                <div key={label} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg py-2 px-3">
                  <div className="text-lg font-bold text-gray-900 dark:text-gray-100">{value}</div>
                  <div className="text-xs text-gray-400 dark:text-gray-500">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Weakness Sprint Leaderboard */}
          {(() => {
            const history = loadWeaknessSprintHistory();
            if (history.length === 0) return null;

            // Group by pattern set to find personal bests
            const byPatternKey: Record<string, WeaknessSprintRecord[]> = {};
            history.forEach(r => {
              const key = r.patterns.slice().sort().join(" · ");
              if (!byPatternKey[key]) byPatternKey[key] = [];
              byPatternKey[key].push(r);
            });

            // Build personal-best rows: best score per pattern combo
            const pbRows = Object.entries(byPatternKey).map(([key, records]) => {
              const best = records.reduce((a, b) => (b.score > a.score ? b : a));
              const attempts = records.length;
              const avgScore = records.reduce((s, r) => s + r.score, 0) / records.length;
              return { key, best, attempts, avgScore };
            }).sort((a, b) => b.best.score - a.best.score);

            const totalSprints = history.length;
            const allTimeAvg = history.reduce((s, r) => s + r.score, 0) / history.length;

            return (
              <div className="rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Medal size={14} className="text-rose-500" />
                    Weakness Sprint Leaderboard
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span><span className="font-bold text-gray-700 dark:text-gray-300">{totalSprints}</span> sprint{totalSprints !== 1 ? "s" : ""}</span>
                    <span><span className="font-bold text-gray-700 dark:text-gray-300">{allTimeAvg.toFixed(1)}/8</span> avg</span>
                  </div>
                </div>

                <div className="space-y-2">
                  {pbRows.slice(0, 5).map((row, i) => {
                    const pct = (row.best.score / row.best.total) * 100;
                    const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "";
                    return (
                      <div key={row.key} className="flex items-center gap-3">
                        <span className="text-base w-5 flex-shrink-0">{medal || <span className="text-xs text-gray-400 font-bold">#{i + 1}</span>}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate" title={row.key}>
                            {row.key}
                          </p>
                          <p className="text-[10px] text-gray-400">
                            Best: {row.best.score}/{row.best.total} · Avg: {row.avgScore.toFixed(1)}/8 · {row.attempts} attempt{row.attempts !== 1 ? "s" : ""} · {row.best.date}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="w-16 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${pct >= 75 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-rose-500"}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className={`text-xs font-bold tabular-nums ${
                            pct >= 75 ? "text-emerald-600" : pct >= 50 ? "text-amber-600" : "text-rose-600"
                          }`}>{row.best.score}/{row.best.total}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {history.length > 0 && (
                  <p className="text-[10px] text-gray-400 mt-3 text-center">
                    Personal bests from "Fix My Weaknesses" sprints — run more to improve your scores
                  </p>
                )}
              </div>
            );
          })()}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <button
              onClick={() => exportProgress(snap)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-all"
            >
              <Download size={15} />
              Export Progress (Markdown)
            </button>
            <button
              onClick={() => setConfirmReset(true)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm font-semibold transition-all"
            >
              <Trash2 size={15} />
              Reset All Data
            </button>
          </div>

          {/* Reset confirmation */}
          {confirmReset && (
            <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4">
              <p className="text-sm text-red-700 dark:text-red-300 font-semibold mb-1">⚠️ This will permanently delete all your progress.</p>
              <p className="text-xs text-red-600 dark:text-red-400 mb-3">XP, solved problems, ratings, streaks, notes, and mock history will all be erased. This cannot be undone.</p>
              <div className="flex gap-2">
                <button onClick={resetAllProgress} className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all">Yes, delete everything</button>
                <button onClick={() => setConfirmReset(false)} className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-xs font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">Cancel</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


