/**
 * CodePractice — Full interactive coding practice environment.
 * Features: Monaco editor, 6 languages, Judge0 code execution, AI hints,
 * countdown timer, per-problem notes, solve/star tracking, session history,
 * custom test cases with pass/fail summary, submission history snapshots,
 * and personal stats dashboard.
 */
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Editor from "@monaco-editor/react";
import { trpc } from "@/lib/trpc";
import { CTCI_PROBLEMS, DIFFICULTY_COLORS } from "@/lib/ctciProblems";
import { useCTCIProgress } from "@/hooks/useCTCIProgress";
import { useSpacedRepetition } from "@/hooks/useSpacedRepetition";
import { getWeakestPatterns } from "@/hooks/useDrillRatings";
import { useReadinessScore } from "@/hooks/useReadinessScore";
import { useXPContext } from "@/contexts/XPContext";
import {
  Play, Send, Lightbulb, Clock, CheckCircle2, Circle, Star, StarOff,
  Search, X, ChevronLeft, ChevronRight, ExternalLink, RotateCcw,
  Terminal, AlertCircle, Loader2, StickyNote, History, Trophy,
  ChevronDown, ChevronUp, Flame, BookOpen, Zap, Plus, Trash2,
  BarChart2, FlaskConical, GitCommit, TrendingUp, Award,
  Lock, Download, Copy, Shuffle, Timer, EyeOff, Mail, Database, Cpu
} from "lucide-react";

// ─── Language config ───────────────────────────────────────────────────────
const LANGUAGES = [
  { id: 100, name: "Python 3",    monaco: "python",     ext: "py"  },
  { id: 102, name: "JavaScript",  monaco: "javascript", ext: "js"  },
  { id: 91,  name: "Java",        monaco: "java",       ext: "java"},
  { id: 105, name: "C++",         monaco: "cpp",        ext: "cpp" },
  { id: 95,  name: "Go",          monaco: "go",         ext: "go"  },
  { id: 83,  name: "Swift",       monaco: "swift",      ext: "swift"},
] as const;

type LangId = typeof LANGUAGES[number]["id"];

// ─── Boilerplate templates ─────────────────────────────────────────────────
const BOILERPLATE: Record<LangId, string> = {
  100: `# Python 3
# Problem: {name}
# Topics: {topic}
# Difficulty: {difficulty}
# LeetCode: {url}

from typing import List, Optional

class Solution:
    def solve(self) -> None:
        # Write your solution here
        pass

# Test your solution
sol = Solution()
# print(sol.solve())
`,
  102: `// JavaScript (Node.js)
// Problem: {name}
// Topics: {topic}
// Difficulty: {difficulty}

/**
 * @return {*}
 */
var solve = function() {
    // Write your solution here
};

// Test
// console.log(solve());
`,
  91: `// Java
// Problem: {name}
// Topics: {topic}
// Difficulty: {difficulty}

import java.util.*;

class Solution {
    public void solve() {
        // Write your solution here
    }

    public static void main(String[] args) {
        Solution sol = new Solution();
        // sol.solve();
    }
}
`,
  105: `// C++
// Problem: {name}
// Topics: {topic}
// Difficulty: {difficulty}

#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    void solve() {
        // Write your solution here
    }
};

int main() {
    Solution sol;
    // sol.solve();
    return 0;
}
`,
  95: `// Go
// Problem: {name}
// Topics: {topic}
// Difficulty: {difficulty}

package main

import "fmt"

func solve() {
    // Write your solution here
}

func main() {
    solve()
    fmt.Println("Done")
}
`,
  83: `// Swift
// Problem: {name}
// Topics: {topic}
// Difficulty: {difficulty}

class Solution {
    func solve() {
        // Write your solution here
    }
}

let sol = Solution()
// sol.solve()
`,
};

function getBoilerplate(langId: LangId, problem: typeof CTCI_PROBLEMS[0]): string {
  return BOILERPLATE[langId]
    .replace("{name}", problem.name)
    .replace("{topic}", problem.topic)
    .replace("{difficulty}", problem.difficulty)
    .replace("{url}", problem.url);
}

// ─── localStorage helpers ──────────────────────────────────────────────────
const CODE_KEY        = (pid: number, lid: LangId) => `cp_code_${pid}_${lid}`;
const NOTES_KEY       = (pid: number) => `cp_notes_${pid}`;
const LANG_KEY        = "cp_last_lang";
const SESSION_KEY     = "cp_session";
const TEST_CASES_KEY  = (pid: number) => `cp_tests_${pid}`;
const SUBMISSIONS_KEY = (pid: number) => `cp_submissions_${pid}`;

// ─── Types ─────────────────────────────────────────────────────────────────
interface SessionEntry {
  problemId: number;
  problemName: string;
  difficulty: string;
  langId: LangId;
  solvedAt: number;
  timeSec: number;
}

interface TestCase {
  id: string;
  input: string;
  expected: string;
  result?: "pass" | "fail" | "error" | "pending";
  actual?: string;
}

interface Submission {
  id: string;
  timestamp: number;
  langId: LangId;
  code: string;
  statusId: number;
  statusDescription: string;
  stdout: string;
  stderr: string;
  time: string | null;
  memory: number | null;
}

// Speed Run leaderboard
interface SpeedRunEntry {
  id: string;
  problemId: number;
  problemName: string;
  difficulty: string;
  solved: boolean;
  timeSec: number;
  score: number;
  hintsUsed: number;
  date: number;
}

const LEADERBOARD_KEY = "cp_speedrun_leaderboard";
const SPRINT_HISTORY_KEY = "cp_sprint_history";
const DAILY_GOAL_KEY = "cp_daily_goal";
const DIFF_ASSESSMENTS_KEY = "cp_diff_assessments";

// Daily goal
function loadDailyGoal(): number {
  try { return parseInt(localStorage.getItem(DAILY_GOAL_KEY) ?? "5", 10) || 5; } catch { return 5; }
}
function saveDailyGoal(n: number) {
  localStorage.setItem(DAILY_GOAL_KEY, String(n));
}

// Difficulty self-assessments
interface DifficultyAssessment {
  problemId: number;
  problemName: string;
  officialDifficulty: string;
  selfRating: "Easy" | "Medium" | "Hard" | "Very Hard";
  date: number;
}
function loadAssessments(): DifficultyAssessment[] {
  try { return JSON.parse(localStorage.getItem(DIFF_ASSESSMENTS_KEY) ?? "[]"); } catch { return []; }
}
function saveAssessments(entries: DifficultyAssessment[]) {
  localStorage.setItem(DIFF_ASSESSMENTS_KEY, JSON.stringify(entries.slice(0, 200)));
}
function loadLeaderboard(): SpeedRunEntry[] {
  try { return JSON.parse(localStorage.getItem(LEADERBOARD_KEY) ?? "[]"); } catch { return []; }
}
function saveLeaderboard(entries: SpeedRunEntry[]) {
  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(entries.slice(0, 50)));
}

// Sprint history
interface SprintHistoryEntry {
  id: string;
  topic: string;
  totalScore: number;
  scores: number[];
  problemNames: string[];
  date: number;
}

function loadSprintHistory(): SprintHistoryEntry[] {
  try { return JSON.parse(localStorage.getItem(SPRINT_HISTORY_KEY) ?? "[]"); } catch { return []; }
}
function saveSprintHistory(entries: SprintHistoryEntry[]) {
  localStorage.setItem(SPRINT_HISTORY_KEY, JSON.stringify(entries.slice(0, 100)));
}

// Topic Sprint types
interface TopicSprintState {
  active: boolean;
  topic: string;
  queue: number[];        // problem IDs
  currentIdx: number;
  secsLeft: number;
  hintsUsed: number;
  scores: number[];       // score per problem
  done: boolean;
}

function loadSession(): SessionEntry[] {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) ?? "[]"); } catch { return []; }
}
function saveSession(entries: SessionEntry[]) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(entries.slice(-200)));
}
function loadTestCases(pid: number): TestCase[] {
  try { return JSON.parse(localStorage.getItem(TEST_CASES_KEY(pid)) ?? "[]"); } catch { return []; }
}
function saveTestCases(pid: number, cases: TestCase[]) {
  localStorage.setItem(TEST_CASES_KEY(pid), JSON.stringify(cases));
}
function loadSubmissions(pid: number): Submission[] {
  try { return JSON.parse(localStorage.getItem(SUBMISSIONS_KEY(pid)) ?? "[]"); } catch { return []; }
}
function saveSubmissions(pid: number, subs: Submission[]) {
  localStorage.setItem(SUBMISSIONS_KEY(pid), JSON.stringify(subs.slice(-20)));
}

// ─── Status badge helper ───────────────────────────────────────────────────
function StatusBadge({ statusId, desc }: { statusId: number; desc: string }) {
  const color =
    statusId === 3 ? "bg-emerald-100 text-emerald-700 border-emerald-300" :
    statusId === 6 ? "bg-red-100 text-red-700 border-red-300" :
    statusId >= 4 && statusId <= 14 ? "bg-amber-100 text-amber-700 border-amber-300" :
    "bg-gray-100 text-gray-600 border-gray-300";
  const icon = statusId === 3 ? "✅" : statusId === 6 ? "❌" : statusId >= 4 ? "⚠️" : "ℹ️";
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${color}`}>
      {icon} {desc}
    </span>
  );
}

// ─── Timer component ───────────────────────────────────────────────────────
function PracticeTimer({ running, onReset, onTick }: { running: boolean; onReset: () => void; onTick: (s: number) => void }) {
  const [secs, setSecs] = useState(0);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (running) {
      ref.current = setInterval(() => setSecs(s => { const n = s + 1; onTick(n); return n; }), 1000);
    } else {
      if (ref.current) clearInterval(ref.current);
    }
    return () => { if (ref.current) clearInterval(ref.current); };
  }, [running]);
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  const fmt = (n: number) => String(n).padStart(2, "0");
  return (
    <div className="flex items-center gap-2">
      <Clock size={14} className={running ? "text-blue-500 animate-pulse" : "text-gray-400"} />
      <span className={`font-mono text-sm font-bold ${secs > 2700 ? "text-red-500" : secs > 1500 ? "text-amber-500" : "text-foreground"}`}>
        {h > 0 ? `${fmt(h)}:` : ""}{fmt(m)}:{fmt(s)}
      </span>
      <button onClick={() => { setSecs(0); onReset(); }} title="Reset timer" className="text-gray-400 hover:text-gray-600 transition-colors">
        <RotateCcw size={12} />
      </button>
    </div>
  );
}

// ─── Personal Stats Dashboard ──────────────────────────────────────────────
function StatsDashboard({ session, progress, leaderboard, sprintHistory, assessments, onClearAssessments, srStreak }: {
  session: SessionEntry[];
  progress: Record<number, { solved: boolean; starred: boolean; notes: string }>;
  leaderboard: SpeedRunEntry[];
  sprintHistory: SprintHistoryEntry[];
  assessments: DifficultyAssessment[];
  onClearAssessments: () => void;
  srStreak: { streak: number; lastDate: string | null; longestStreak: number };
}) {
  const totalSolved = useMemo(() => Object.values(progress).filter(p => p.solved).length, [progress]);
  const totalStarred = useMemo(() => Object.values(progress).filter(p => p.starred).length, [progress]);

  // Avg time per difficulty
  const avgByDiff = useMemo(() => {
    const buckets: Record<string, number[]> = { Easy: [], Medium: [], Hard: [] };
    session.forEach(e => { if (e.timeSec > 0) buckets[e.difficulty]?.push(e.timeSec); });
    return Object.entries(buckets).map(([diff, times]) => ({
      diff,
      avg: times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : null,
      count: times.length,
    }));
  }, [session]);

  // Most used language
  const langCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    session.forEach(e => { counts[e.langId] = (counts[e.langId] ?? 0) + 1; });
    return Object.entries(counts)
      .map(([id, count]) => ({ lang: LANGUAGES.find(l => l.id === Number(id))?.name ?? "?", count }))
      .sort((a, b) => b.count - a.count);
  }, [session]);

  // Weekly solve chart (last 7 days)
  const weeklyData = useMemo(() => {
    const days: { label: string; count: number; date: string }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toDateString();
      const label = i === 0 ? "Today" : d.toLocaleDateString("en-US", { weekday: "short" });
      const count = session.filter(e => new Date(e.solvedAt).toDateString() === dateStr).length;
      days.push({ label, count, date: dateStr });
    }
    return days;
  }, [session]);

  const maxWeekly = Math.max(...weeklyData.map(d => d.count), 1);

  // Solve rate by difficulty from all problems
  const diffStats = useMemo(() => {
    const stats: Record<string, { total: number; solved: number }> = { Easy: { total: 0, solved: 0 }, Medium: { total: 0, solved: 0 }, Hard: { total: 0, solved: 0 } };
    CTCI_PROBLEMS.forEach(p => {
      if (stats[p.difficulty]) {
        stats[p.difficulty].total++;
        if (progress[p.id]?.solved) stats[p.difficulty].solved++;
      }
    });
    return stats;
  }, [progress]);

  const todaySolved = weeklyData[6].count;
  const weekTotal = weeklyData.reduce((a, b) => a + b.count, 0);

  return (
    <div className="p-4 space-y-5 overflow-y-auto h-full">
      <div className="flex items-center gap-2 mb-1">
        <BarChart2 size={16} className="text-blue-500" />
        <h2 className="text-sm font-bold text-foreground">Personal Stats</h2>
        <span className="text-xs text-muted-foreground ml-auto">All-time progress</span>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Solved", value: totalSolved, icon: <CheckCircle2 size={16} className="text-emerald-500" />, color: "border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20" },
          { label: "Starred", value: totalStarred, icon: <Star size={16} className="text-yellow-500 fill-current" />, color: "border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20" },
          { label: "Today", value: todaySolved, icon: <Flame size={16} className="text-orange-500" />, color: "border-orange-200 bg-orange-50 dark:bg-orange-900/20" },
          { label: "This Week", value: weekTotal, icon: <TrendingUp size={16} className="text-blue-500" />, color: "border-blue-200 bg-blue-50 dark:bg-blue-900/20" },
        ].map(card => (
          <div key={card.label} className={`rounded-xl border p-3 ${card.color}`}>
            <div className="flex items-center gap-2 mb-1">{card.icon}<span className="text-xs text-muted-foreground font-medium">{card.label}</span></div>
            <div className="text-2xl font-bold text-foreground">{card.value}</div>
          </div>
        ))}
      </div>
      {/* Well-calibrated badge */}
      {(() => {
        if (assessments.length < 5) return null;
        const ratingNum = (r: string) => r === "Easy" ? 1 : r === "Medium" ? 2 : r === "Hard" ? 3 : 4;
        const diverged = assessments.filter(a => ratingNum(a.selfRating) !== ratingNum(a.officialDifficulty)).length;
        const pct = diverged / assessments.length;
        if (pct >= 0.2) return null;
        return (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20">
            <span className="text-base">🎯</span>
            <div>
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Well-calibrated</span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-500 ml-1.5">
                Only {Math.round(pct * 100)}% of your {assessments.length} ratings diverge from official difficulty — your self-assessment is highly accurate.
              </span>
            </div>
          </div>
        );
      })()}

      {/* Weekly chart */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={13} className="text-blue-500" />
          <span className="text-xs font-semibold text-foreground">Problems Solved — Last 7 Days</span>
        </div>
        <div className="flex items-end gap-2 h-20">
          {weeklyData.map(day => (
            <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex flex-col justify-end" style={{ height: "60px" }}>
                <div
                  className={`w-full rounded-t-sm transition-all ${day.count > 0 ? "bg-blue-500" : "bg-muted"}`}
                  style={{ height: `${Math.max(day.count > 0 ? 8 : 4, (day.count / maxWeekly) * 60)}px` }}
                  title={`${day.count} solved`}
                />
              </div>
              <span className="text-[9px] text-muted-foreground font-medium">{day.label}</span>
              {day.count > 0 && <span className="text-[9px] font-bold text-blue-600">{day.count}</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Solve rate by difficulty */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Award size={13} className="text-purple-500" />
            <span className="text-xs font-semibold text-foreground">Solve Rate by Difficulty</span>
          </div>
          <div className="space-y-2.5">
            {Object.entries(diffStats).map(([diff, { total, solved }]) => {
              const pct = total > 0 ? Math.round((solved / total) * 100) : 0;
              const barColor = diff === "Easy" ? "bg-emerald-500" : diff === "Medium" ? "bg-amber-500" : "bg-red-500";
              const textColor = diff === "Easy" ? "text-emerald-600" : diff === "Medium" ? "text-amber-600" : "text-red-600";
              return (
                <div key={diff}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-semibold ${textColor}`}>{diff}</span>
                    <span className="text-xs text-muted-foreground">{solved}/{total} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Language breakdown */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Terminal size={13} className="text-teal-500" />
            <span className="text-xs font-semibold text-foreground">Language Usage</span>
          </div>
          {langCounts.length === 0 ? (
            <div className="text-xs text-muted-foreground flex items-center gap-2"><BookOpen size={12} /> Solve problems to see your language stats.</div>
          ) : (
            <div className="space-y-2">
              {langCounts.map(({ lang, count }, i) => {
                const maxCount = langCounts[0].count;
                return (
                  <div key={lang} className="flex items-center gap-2">
                    {i === 0 && <span title="Most used">🏆</span>}
                    {i !== 0 && <span className="w-4 text-center text-xs text-muted-foreground">{i + 1}</span>}
                    <span className="text-xs font-medium text-foreground w-20 truncate">{lang}</span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-teal-500 rounded-full" style={{ width: `${(count / maxCount) * 100}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground w-6 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Avg time per difficulty */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Clock size={13} className="text-indigo-500" />
          <span className="text-xs font-semibold text-foreground">Average Solve Time by Difficulty</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {avgByDiff.map(({ diff, avg, count }) => {
            const textColor = diff === "Easy" ? "text-emerald-600" : diff === "Medium" ? "text-amber-600" : "text-red-600";
            const bgColor = diff === "Easy" ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20" : diff === "Medium" ? "bg-amber-50 border-amber-200 dark:bg-amber-900/20" : "bg-red-50 border-red-200 dark:bg-red-900/20";
            const mins = avg ? Math.floor(avg / 60) : null;
            const secs = avg ? avg % 60 : null;
            return (
              <div key={diff} className={`rounded-lg border p-3 text-center ${bgColor}`}>
                <div className={`text-xs font-bold mb-1 ${textColor}`}>{diff}</div>
                {avg !== null ? (
                  <div className="text-lg font-bold text-foreground font-mono">{mins}:{String(secs).padStart(2, "0")}</div>
                ) : (
                  <div className="text-sm text-muted-foreground">—</div>
                )}
                <div className="text-[10px] text-muted-foreground mt-0.5">{count} timed</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Speed Run Leaderboard */}
      {leaderboard.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Trophy size={13} className="text-orange-500" />
            <span className="text-xs font-semibold text-foreground">Speed Run Personal Best</span>
            <span className="text-xs text-muted-foreground ml-auto">{leaderboard.length} runs</span>
          </div>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {leaderboard.slice(0, 10).map((e, i) => {
              const mins = Math.floor(e.timeSec / 60);
              const secs = e.timeSec % 60;
              const dc = { Easy: "text-emerald-600", Medium: "text-amber-600", Hard: "text-red-600" }[e.difficulty] ?? "";
              return (
                <div key={e.id} className="flex items-center gap-2 text-xs bg-muted/30 rounded-lg px-3 py-1.5">
                  <span className="text-[10px] font-bold text-muted-foreground w-4 text-center">{i + 1}</span>
                  {e.solved ? <CheckCircle2 size={11} className="text-emerald-500 flex-shrink-0" /> : <X size={11} className="text-red-400 flex-shrink-0" />}
                  <span className="font-medium text-foreground truncate flex-1">{e.problemName}</span>
                  <span className={`font-semibold text-[10px] ${dc}`}>{e.difficulty}</span>
                  {e.hintsUsed > 0 && <span className="text-[10px] text-amber-500" title="Hints used">💡{e.hintsUsed}</span>}
                  <span className="text-muted-foreground text-[10px] font-mono">{mins}:{String(secs).padStart(2, "0")}</span>
                  <span className="text-orange-600 dark:text-orange-400 font-bold text-[10px]">{e.score}pts</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Speed Run Streak Stats */}
      {(srStreak.streak > 0 || srStreak.longestStreak > 0) && (
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Flame size={13} className="text-orange-500" />
            <span className="text-xs font-semibold text-foreground">Speed Run Streak</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-orange-200 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-800 p-3 text-center">
              <div className="text-[10px] font-semibold text-orange-600 dark:text-orange-400 mb-1 uppercase tracking-wide">Current</div>
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 font-mono">{srStreak.streak}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">days</div>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 p-3 text-center">
              <div className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 mb-1 uppercase tracking-wide">Best</div>
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono">{srStreak.longestStreak}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">days</div>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-3 text-center">
              <div className="text-[10px] font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Last Run</div>
              {srStreak.lastDate ? (
                <div className="text-xs font-bold text-foreground">
                  {new Date(srStreak.lastDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              ) : (
                <div className="text-xs text-muted-foreground">—</div>
              )}
              <div className="text-[10px] text-muted-foreground mt-0.5">
                {srStreak.lastDate === new Date().toISOString().slice(0, 10) ? '✅ today' : srStreak.lastDate ? 'keep it up!' : 'no runs yet'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sprint History + Personal Best */}
      {sprintHistory.length > 0 && (() => {
        // Compute personal best per topic
        const pbByTopic: Record<string, number> = {};
        sprintHistory.forEach(e => {
          if (pbByTopic[e.topic] === undefined || e.totalScore > pbByTopic[e.topic]) {
            pbByTopic[e.topic] = e.totalScore;
          }
        });
        return (
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Zap size={13} className="text-violet-500" />
              <span className="text-xs font-semibold text-foreground">Topic Sprint History</span>
              <span className="text-xs text-muted-foreground">{sprintHistory.length} sprints</span>
              <button
                onClick={() => {
                  const rows = [
                    ["Date", "Topic", "Total Score", "Problems (name:score)"].join(","),
                    ...sprintHistory.map(e => [
                      new Date(e.date).toLocaleDateString(),
                      `"${e.topic}"`,
                      e.totalScore,
                      `"${(e.problemNames || []).map((name, i) => `${name}:${e.scores[i] ?? 0}`).join(" | ")}"`
                    ].join(",")),
                  ];
                  navigator.clipboard.writeText(rows.join("\n")).catch(() => {
                    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url; a.download = "sprint-history.csv"; a.click();
                    URL.revokeObjectURL(url);
                  });
                }}
                className="ml-auto text-[10px] font-semibold text-muted-foreground hover:text-violet-600 transition-colors flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-violet-50 dark:hover:bg-violet-900/20"
                title="Export sprint history as CSV"
              >
                <Copy size={10} /> CSV
              </button>
            </div>
            {/* Personal Best summary */}
            <div className="mb-3">
              <div className="text-[10px] font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Personal Best by Topic</div>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(pbByTopic).sort((a, b) => b[1] - a[1]).map(([topic, pb]) => (
                  <span key={topic} className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 border border-violet-200 dark:border-violet-700">
                    ⚡ {topic.length > 14 ? topic.slice(0, 14) + '…' : topic}
                    <span className="font-bold text-violet-600 dark:text-violet-400">{pb}pts</span>
                  </span>
                ))}
              </div>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {sprintHistory.slice(0, 15).map((entry, i) => {
                const isPB = entry.totalScore === pbByTopic[entry.topic];
                return (
                  <div key={entry.id} className="bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-lg px-3 py-2">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-muted-foreground w-4 text-center">{i + 1}</span>
                        <span className="text-xs font-semibold text-violet-700 dark:text-violet-300">⚡ {entry.topic}</span>
                        {isPB && <span className="text-[9px] font-bold px-1.5 py-0 rounded-full bg-yellow-100 text-yellow-700 border border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400" title="Personal Best for this topic">🏆 PB</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-violet-600 dark:text-violet-400">{entry.totalScore} pts</span>
                        <span className="text-[10px] text-muted-foreground">{new Date(entry.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {entry.scores.map((s, j) => (
                        <span key={j} className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                          s >= 60 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                          s >= 30 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                          "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        }`} title={entry.problemNames[j]}>
                          P{j + 1}: {s}pts
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Difficulty Perception Divergence */}
      {(() => {
        if (assessments.length === 0) return null;
        // Map self-rating to numeric
        const ratingNum = (r: string) => r === "Easy" ? 1 : r === "Medium" ? 2 : r === "Hard" ? 3 : 4;
        const divergences = assessments.map(a => ({
          ...a,
          delta: ratingNum(a.selfRating) - ratingNum(a.officialDifficulty),
        }));
        const harderthanExpected = divergences.filter(d => d.delta > 0).sort((a, b) => b.delta - a.delta).slice(0, 5);
        const easierThanExpected = divergences.filter(d => d.delta < 0).sort((a, b) => a.delta - b.delta).slice(0, 5);
        return (
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={13} className="text-indigo-500" />
              <span className="text-xs font-semibold text-foreground">Difficulty Perception</span>
              <span className="text-xs text-muted-foreground">{assessments.length} rated</span>
              <div className="ml-auto flex items-center gap-1">
                <button
                  onClick={() => {
                    // Build CSV: header + one row per assessment
                    const rows = [
                      ["Problem", "Official Difficulty", "Self Rating", "Date"].join(","),
                      ...assessments.map(a =>
                        [
                          `"${a.problemName.replace(/"/g, '""')}"`,
                          a.officialDifficulty,
                          a.selfRating,
                          new Date(a.date).toLocaleDateString(),
                        ].join(",")
                      ),
                    ];
                    navigator.clipboard.writeText(rows.join("\n")).catch(() => {
                      // fallback: download as file
                      const blob = new Blob([rows.join("\n")], { type: "text/csv" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url; a.download = "difficulty-ratings.csv"; a.click();
                      URL.revokeObjectURL(url);
                    });
                  }}
                  className="text-[10px] font-semibold text-muted-foreground hover:text-blue-500 transition-colors flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  title="Copy all ratings as CSV"
                >
                  <Copy size={10} /> CSV
                </button>
                <button
                  onClick={() => {
                    if (!window.confirm("Clear all difficulty ratings? This cannot be undone.")) return;
                    onClearAssessments();
                  }}
                  className="text-[10px] font-semibold text-muted-foreground hover:text-red-500 transition-colors flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                  title="Clear all self-assessments"
                >
                  <Trash2 size={10} /> Clear
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {harderthanExpected.length > 0 && (
                <div>
                  <div className="text-[10px] font-semibold text-red-600 dark:text-red-400 mb-1.5 uppercase tracking-wide">💥 Harder than expected</div>
                  <div className="space-y-1">
                    {harderthanExpected.map(a => (
                      <div key={a.problemId} className="flex items-center gap-1.5 text-[10px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                        <span className="text-foreground truncate flex-1" title={a.problemName}>{a.problemName.length > 18 ? a.problemName.slice(0, 18) + '…' : a.problemName}</span>
                        <span className="text-red-500 font-bold flex-shrink-0">{a.officialDifficulty} → {a.selfRating}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {easierThanExpected.length > 0 && (
                <div>
                  <div className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 mb-1.5 uppercase tracking-wide">✨ Easier than expected</div>
                  <div className="space-y-1">
                    {easierThanExpected.map(a => (
                      <div key={a.problemId} className="flex items-center gap-1.5 text-[10px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                        <span className="text-foreground truncate flex-1" title={a.problemName}>{a.problemName.length > 18 ? a.problemName.slice(0, 18) + '…' : a.problemName}</span>
                        <span className="text-emerald-600 font-bold flex-shrink-0">{a.officialDifficulty} → {a.selfRating}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {harderthanExpected.length === 0 && easierThanExpected.length === 0 && (
              <div className="text-xs text-muted-foreground">Your perception matches official ratings exactly. Impressive calibration!</div>
            )}
          </div>
        );
      })()}

      {/* Difficulty Calibration Trend Chart */}
      {assessments.length >= 2 && (() => {
        // Group by official difficulty tier and compute avg self-rating (numeric)
        const ratingNum = (r: string) => r === "Easy" ? 1 : r === "Medium" ? 2 : r === "Hard" ? 3 : 4;
        const tiers = ["Easy", "Medium", "Hard"] as const;
        const tierData = tiers.map(tier => {
          const bucket = assessments.filter(a => a.officialDifficulty === tier);
          const avgSelf = bucket.length ? bucket.reduce((s, a) => s + ratingNum(a.selfRating), 0) / bucket.length : null;
          const official = ratingNum(tier);
          return { tier, official, avgSelf, count: bucket.length };
        }).filter(d => d.count > 0);

        if (tierData.length === 0) return null;

        // Scale: 1=Easy … 4=Very Hard → map to 0–100% bar height
        const maxRating = 4;
        const barH = (v: number) => Math.round((v / maxRating) * 100);

        const tierColors: Record<string, { official: string; self: string }> = {
          Easy:   { official: "bg-emerald-400", self: "bg-emerald-600" },
          Medium: { official: "bg-amber-400",   self: "bg-amber-600"   },
          Hard:   { official: "bg-red-400",     self: "bg-red-600"     },
        };

        return (
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <BarChart2 size={13} className="text-indigo-500" />
              <span className="text-xs font-semibold text-foreground">Difficulty Calibration</span>
              <span className="text-xs text-muted-foreground ml-auto">{assessments.length} rated</span>
            </div>
            {/* Legend */}
            <div className="flex items-center gap-3 mb-3">
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <span className="w-3 h-2 rounded-sm bg-gray-300 dark:bg-gray-600 inline-block" /> Official
              </span>
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <span className="w-3 h-2 rounded-sm bg-indigo-500 inline-block" /> Your avg perception
              </span>
            </div>
            {/* Bar chart */}
            <div className="flex items-end gap-4 h-28">
              {tierData.map(d => {
                const colors = tierColors[d.tier];
                const officialH = barH(d.official);
                const selfH = d.avgSelf !== null ? barH(d.avgSelf) : 0;
                const delta = d.avgSelf !== null ? d.avgSelf - d.official : 0;
                const deltaLabel = delta > 0.15 ? `+${delta.toFixed(1)} harder` : delta < -0.15 ? `${delta.toFixed(1)} easier` : "on target";
                const deltaColor = delta > 0.15 ? "text-red-500" : delta < -0.15 ? "text-emerald-600" : "text-muted-foreground";
                return (
                  <div key={d.tier} className="flex-1 flex flex-col items-center gap-1">
                    {/* Delta label */}
                    <span className={`text-[9px] font-bold ${deltaColor}`}>{deltaLabel}</span>
                    {/* Bars side by side */}
                    <div className="flex items-end gap-1 w-full" style={{ height: "72px" }}>
                      {/* Official */}
                      <div
                        className={`flex-1 rounded-t-md ${colors.official} opacity-50`}
                        style={{ height: `${officialH}%` }}
                        title={`Official: ${d.tier}`}
                      />
                      {/* Self avg */}
                      {d.avgSelf !== null && (
                        <div
                          className="flex-1 rounded-t-md bg-indigo-500"
                          style={{ height: `${selfH}%` }}
                          title={`Your avg: ${d.avgSelf.toFixed(2)}`}
                        />
                      )}
                    </div>
                    {/* Tier label */}
                    <span className="text-[10px] font-semibold text-foreground">{d.tier}</span>
                    <span className="text-[9px] text-muted-foreground">{d.count} rated</span>
                  </div>
                );
              })}
            </div>
            {/* Interpretation note */}
            <div className="mt-2 text-[10px] text-muted-foreground">
              Taller indigo bar = you find that tier harder than its label suggests. Shorter = easier.
            </div>
          </div>
        );
      })()}

      {/* Weekly Email Digest */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Mail size={13} className="text-blue-500" />
          <span className="text-xs font-semibold text-foreground">Weekly Summary</span>
          <span className="text-xs text-muted-foreground">Send a progress report to yourself</span>
        </div>
        <button
          onClick={() => {
            const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            const topWeakTopics = sprintHistory.length > 0
              ? (() => {
                  const topicScores: Record<string, number[]> = {};
                  sprintHistory.forEach(e => {
                    if (!topicScores[e.topic]) topicScores[e.topic] = [];
                    topicScores[e.topic].push(e.totalScore);
                  });
                  return Object.entries(topicScores)
                    .map(([t, scores]) => ({ topic: t, avg: scores.reduce((a, b) => a + b, 0) / scores.length }))
                    .sort((a, b) => a.avg - b.avg)
                    .slice(0, 3)
                    .map(t => `  - ${t.topic} (avg ${t.avg.toFixed(0)} pts)`)
                    .join('\n');
                })()
              : '  (no sprint data yet)';
            const recentSprints = sprintHistory.slice(0, 5)
              .map(e => `  - ${e.topic}: ${e.totalScore} pts (${new Date(e.date).toLocaleDateString()})`)
              .join('\n') || '  (none yet)';
            const body = [
              `Meta Interview Prep — Weekly Summary`,
              `Generated: ${today}`,
              ``,
              `=== PROGRESS ===`,
              `Total Solved: ${totalSolved}`,
              `Starred: ${totalStarred}`,
              `Speed Run Streak: ${srStreak.streak} days (best: ${srStreak.longestStreak})`,
              ``,
              `=== TOP WEAK TOPICS (by sprint score) ===`,
              topWeakTopics,
              ``,
              `=== RECENT SPRINTS ===`,
              recentSprints,
              ``,
              `Keep grinding! 💪`,
            ].join('\n');
            window.location.href = `mailto:?subject=${encodeURIComponent('Meta Prep Weekly Summary — ' + today)}&body=${encodeURIComponent(body)}`;
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors"
        >
          <Mail size={12} /> Send Weekly Summary
        </button>
      </div>

      {/* System Design Mock History */}
      {(() => {
        let sdHistory: Array<{ id: string; problemTitle: string; targetLevel: string; verdict: string; scores: { requirements: number; dataModel: number; api: number; scale: number; metaDepth: number }; durationSec: number; date: number }> = [];
        try { sdHistory = JSON.parse(localStorage.getItem("sd_mock_history_v1") || "[]"); } catch { /* empty */ }
        if (sdHistory.length === 0) return null;
        const VERDICT_COLORS: Record<string, string> = {
          "Strong Hire": "text-emerald-700 bg-emerald-100",
          "Hire": "text-blue-700 bg-blue-100",
          "Borderline": "text-amber-700 bg-amber-100",
          "No Hire": "text-red-700 bg-red-100",
        };
        return (
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Database size={13} className="text-indigo-500" />
              <span className="text-xs font-semibold text-foreground">System Design Mock History</span>
              <span className="text-xs text-muted-foreground">{sdHistory.length} sessions</span>
            </div>
            <div className="space-y-2 max-h-52 overflow-y-auto">
              {sdHistory.slice().reverse().slice(0, 15).map((e) => {
                const avgScore = Math.round((e.scores.requirements + e.scores.dataModel + e.scores.api + e.scores.scale + e.scores.metaDepth) / 5 * 10) / 10;
                return (
                  <div key={e.id} className="flex items-center gap-2 text-xs bg-muted/30 rounded-lg px-3 py-2">
                    <span className={`shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold ${VERDICT_COLORS[e.verdict] || "text-gray-600 bg-gray-100"}`}>{e.verdict}</span>
                    <span className="font-medium text-foreground truncate flex-1">{e.problemTitle}</span>
                    <span className="text-[10px] text-muted-foreground shrink-0">{e.targetLevel}</span>
                    <span className="text-[10px] font-mono font-bold text-indigo-600 shrink-0">{avgScore}/5</span>
                    <span className="text-[10px] text-muted-foreground shrink-0">{new Date(e.date).toLocaleDateString()}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* AI Round Mock History */}
      {(() => {
        let aiHistory: Array<{ id: string; problemTitle: string; domain: string; targetLevel: string; verdict: string; problemSolvingScore: number; codeDevelopmentScore: number; verificationScore: number; communicationScore: number; aiToolUsageScore: number; date: string }> = [];
        try { aiHistory = JSON.parse(localStorage.getItem("ai_mock_session_history") || "[]"); } catch { /* empty */ }
        if (aiHistory.length === 0) return null;
        const VERDICT_COLORS: Record<string, string> = {
          "Strong Hire": "text-emerald-700 bg-emerald-100",
          "Hire": "text-blue-700 bg-blue-100",
          "Borderline": "text-amber-700 bg-amber-100",
          "No Hire": "text-red-700 bg-red-100",
        };
        return (
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Cpu size={13} className="text-teal-500" />
              <span className="text-xs font-semibold text-foreground">AI-Enabled Round Mock History</span>
              <span className="text-xs text-muted-foreground">{aiHistory.length} sessions</span>
            </div>
            <div className="space-y-2 max-h-52 overflow-y-auto">
              {aiHistory.slice().reverse().slice(0, 15).map((e) => {
                const avgScore = Math.round((e.problemSolvingScore + e.codeDevelopmentScore + e.verificationScore + e.communicationScore + e.aiToolUsageScore) / 5 * 10) / 10;
                return (
                  <div key={e.id} className="flex items-center gap-2 text-xs bg-muted/30 rounded-lg px-3 py-2">
                    <span className={`shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold ${VERDICT_COLORS[e.verdict] || "text-gray-600 bg-gray-100"}`}>{e.verdict}</span>
                    <span className="font-medium text-foreground truncate flex-1">{e.problemTitle}</span>
                    <span className="text-[10px] text-teal-600 font-semibold shrink-0">{e.domain}</span>
                    <span className="text-[10px] text-muted-foreground shrink-0">{e.targetLevel}</span>
                    <span className="text-[10px] font-mono font-bold text-teal-600 shrink-0">{avgScore}/5</span>
                    <span className="text-[10px] text-muted-foreground shrink-0">{new Date(e.date).toLocaleDateString()}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Recent session log */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <History size={13} className="text-gray-500" />
          <span className="text-xs font-semibold text-foreground">Recent Solves</span>
          <span className="text-xs text-muted-foreground ml-auto">{session.length} total</span>
        </div>
        {session.length === 0 ? (
          <div className="text-xs text-muted-foreground flex items-center gap-2"><BookOpen size={12} /> No solves recorded yet.</div>
        ) : (
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {session.slice().reverse().slice(0, 20).map((e, i) => {
              const langName = LANGUAGES.find(l => l.id === e.langId)?.name ?? "?";
              const mins = Math.floor(e.timeSec / 60);
              const secs = e.timeSec % 60;
              const dc = { Easy: "text-emerald-600", Medium: "text-amber-600", Hard: "text-red-600" }[e.difficulty] ?? "";
              return (
                <div key={i} className="flex items-center gap-2 text-xs bg-muted/30 rounded-lg px-3 py-1.5">
                  <CheckCircle2 size={11} className="text-emerald-500 flex-shrink-0" />
                  <span className="font-medium text-foreground truncate flex-1">{e.problemName}</span>
                  <span className={`font-semibold text-[10px] ${dc}`}>{e.difficulty}</span>
                  <span className="text-muted-foreground text-[10px]">{langName}</span>
                  {e.timeSec > 0 && <span className="text-muted-foreground text-[10px] font-mono">{mins}:{String(secs).padStart(2, "0")}</span>}
                  <span className="text-muted-foreground text-[10px]">{new Date(e.solvedAt).toLocaleDateString()}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────
export default function CodePractice() {
  const { progress, toggleSolved, toggleStarred, setNotes: setProgressNotes } = useCTCIProgress();
  const { addXP } = useXPContext();

  // Problem selection
  const [search, setSearch] = useState("");
  const [diffFilter, setDiffFilter] = useState<"All" | "Easy" | "Medium" | "Hard">("All");
  const [statusFilter, setStatusFilter] = useState<"All" | "Solved" | "Unsolved" | "Starred">("All");
  const [selectedId, setSelectedId] = useState<number>(CTCI_PROBLEMS[0].id);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Top-level view: "editor" or "stats"
  const [mainView, setMainView] = useState<"editor" | "stats">("editor");

  // Editor state
  const [langId, setLangId] = useState<LangId>(() => {
    const saved = localStorage.getItem(LANG_KEY);
    return saved ? (Number(saved) as LangId) : 100;
  });
  const [code, setCode] = useState("");
  const [stdin, setStdin] = useState("");
  const [showStdin, setShowStdin] = useState(false);

  // Output
  const [output, setOutput] = useState<{
    stdout: string; stderr: string; compileOutput: string;
    statusId: number; statusDescription: string; time: string | null; memory: number | null;
  } | null>(null);
  const [outputTab, setOutputTab] = useState<"output" | "tests" | "notes" | "history" | "submissions">("output");

  // Notes
  const [notes, setNotes] = useState("");

  // Timer
  const [timerRunning, setTimerRunning] = useState(false);
  const timerSecsRef = useRef(0);

  // Hints
  const [hintOpen, setHintOpen] = useState(false);
  const [hintLevel, setHintLevel] = useState<"gentle" | "medium" | "strong">("gentle");
  const [hintText, setHintText] = useState("");

  // Session history
  const [session, setSession] = useState<SessionEntry[]>(() => loadSession());

  // Custom test cases
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [runningTests, setRunningTests] = useState(false);

  // Submission history
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [viewingSubmission, setViewingSubmission] = useState<Submission | null>(null);

  // Speed Run mode
  const [speedRunActive, setSpeedRunActive] = useState(false);
  const [speedRunSecsLeft, setSpeedRunSecsLeft] = useState(20 * 60);
  const [speedRunScore, setSpeedRunScore] = useState<{
    solved: boolean; timeSec: number; score: number;
    baseScore: number; timeBonus: number; hintPenalty: number; hintsUsed: number;
  } | null>(null);
  const speedRunRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Copied state for export button
  const [copied, setCopied] = useState(false);

  // Speed Run leaderboard
  const [leaderboard, setLeaderboard] = useState<SpeedRunEntry[]>(() => loadLeaderboard());

  // Sprint history
  const [sprintHistory, setSprintHistory] = useState<SprintHistoryEntry[]>(() => loadSprintHistory());

  // Speed Run difficulty filter
  const [speedRunDifficulty, setSpeedRunDifficulty] = useState<"All" | "Easy" | "Medium" | "Hard">("All");

  // Topic Sprint — chosen topic (empty = random)
  const [sprintTopic, setSprintTopic] = useState<string>("");

  // Topic Sprint state
  const [sprint, setSprint] = useState<TopicSprintState>({
    active: false, topic: "", queue: [], currentIdx: 0,
    secsLeft: 10 * 60, hintsUsed: 0, scores: [], done: false,
  });
  const sprintRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Hint penalty counter (resets per problem)
  const [hintsUsedThisRun, setHintsUsedThisRun] = useState(0);

  // Daily goal
  const [dailyGoal, setDailyGoal] = useState<number>(() => loadDailyGoal());
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInputVal, setGoalInputVal] = useState("");

  // Difficulty estimator
  const [assessments, setAssessments] = useState<DifficultyAssessment[]>(() => loadAssessments());
  const [diffEstimatorOpen, setDiffEstimatorOpen] = useState(false);
  const [pendingAssessmentProblem, setPendingAssessmentProblem] = useState<{ id: number; name: string; difficulty: string } | null>(null);

  // Study Session Planner
  const [studyPlannerOpen, setStudyPlannerOpen] = useState(false);
  const [studyPlanDuration, setStudyPlanDuration] = useState<30 | 60 | 90>(60);
  const [planCopied, setPlanCopied] = useState(false);
  const [planIcsDownloaded, setPlanIcsDownloaded] = useState(false);
  const [studyPlan, setStudyPlan] = useState<{
    headline: string;
    focusAreas: string[];
    blocks: Array<{ type: string; title: string; durationMinutes: number; tasks: string[]; priority: string }>;
    coachingNote: string;
  } | null>(null);

  const problem = useMemo(() => CTCI_PROBLEMS.find(p => p.id === selectedId)!, [selectedId]);
  const prog = progress[selectedId] || { solved: false, starred: false, notes: "" };
  const lang = LANGUAGES.find(l => l.id === langId)!;

  // Study planner data sources
  const { dueToday: srDueToday } = useSpacedRepetition();
  const { total: readinessScore } = useReadinessScore();
  const studyPlanMutation = trpc.studyPlanner.generate.useMutation();

  // Load code from localStorage when problem/lang changes
  useEffect(() => {
    const saved = localStorage.getItem(CODE_KEY(selectedId, langId));
    setCode(saved ?? getBoilerplate(langId, problem));
    const savedNotes = localStorage.getItem(NOTES_KEY(selectedId)) ?? prog.notes ?? "";
    setNotes(savedNotes);
    setOutput(null);
    setHintText("");
    setHintOpen(false);
    setTimerRunning(false);
    setTestCases(loadTestCases(selectedId));
    setSubmissions(loadSubmissions(selectedId));
    setViewingSubmission(null);
  }, [selectedId, langId]);

  // Auto-save code
  useEffect(() => {
    if (code) localStorage.setItem(CODE_KEY(selectedId, langId), code);
  }, [code, selectedId, langId]);

  // Auto-save notes
  useEffect(() => {
    localStorage.setItem(NOTES_KEY(selectedId), notes);
    setProgressNotes(selectedId, notes);
  }, [notes, selectedId]);

  // Save lang preference
  useEffect(() => {
    localStorage.setItem(LANG_KEY, String(langId));
  }, [langId]);

  // Progression lock thresholds
  const progressionStats = useMemo(() => {
    const easyTotal = CTCI_PROBLEMS.filter(p => p.difficulty === "Easy").length;
    const medTotal = CTCI_PROBLEMS.filter(p => p.difficulty === "Medium").length;
    const easySolved = CTCI_PROBLEMS.filter(p => p.difficulty === "Easy" && progress[p.id]?.solved).length;
    const medSolved = CTCI_PROBLEMS.filter(p => p.difficulty === "Medium" && progress[p.id]?.solved).length;
    const easyPct = easyTotal > 0 ? easySolved / easyTotal : 0;
    const medPct = medTotal > 0 ? medSolved / medTotal : 0;
    const hardUnlocked = easyPct >= 0.60 && medPct >= 0.40;
    return { easySolved, easyTotal, medSolved, medTotal, easyPct, medPct, hardUnlocked };
  }, [progress]);

  // Filtered problem list
  const filtered = useMemo(() => {
    return CTCI_PROBLEMS.filter(p => {
      if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.topic.toLowerCase().includes(search.toLowerCase())) return false;
      if (diffFilter !== "All" && p.difficulty !== diffFilter) return false;
      if (statusFilter === "Solved" && !progress[p.id]?.solved) return false;
      if (statusFilter === "Unsolved" && progress[p.id]?.solved) return false;
      if (statusFilter === "Starred" && !progress[p.id]?.starred) return false;
      return true;
    });
  }, [search, diffFilter, statusFilter, progress]);

  // tRPC mutations
  const runMutation = trpc.codeExec.run.useMutation();
  const hintMutation = trpc.hints.get.useMutation();

  const handleRun = useCallback(async () => {
    setOutput(null);
    setOutputTab("output");
    if (!timerRunning) setTimerRunning(true);
    try {
      const result = await runMutation.mutateAsync({ sourceCode: code, languageId: langId, stdin });
      setOutput(result);
      // Save submission snapshot
      const sub: Submission = {
        id: `${Date.now()}`,
        timestamp: Date.now(),
        langId,
        code,
        statusId: result.statusId,
        statusDescription: result.statusDescription,
        stdout: result.stdout,
        stderr: result.stderr,
        time: result.time,
        memory: result.memory,
      };
      const updated = [sub, ...loadSubmissions(selectedId)].slice(0, 20);
      saveSubmissions(selectedId, updated);
      setSubmissions(updated);
    } catch (e) {
      setOutput({ stdout: "", stderr: String(e), compileOutput: "", statusId: 0, statusDescription: "Error", time: null, memory: null });
    }
  }, [code, langId, stdin, timerRunning, selectedId]);

  // Run all custom test cases
  const handleRunTests = useCallback(async () => {
    if (testCases.length === 0) return;
    setRunningTests(true);
    setOutputTab("tests");
    const updated = testCases.map(tc => ({ ...tc, result: "pending" as const, actual: undefined }));
    setTestCases(updated);
    const results: TestCase[] = [];
    for (const tc of updated) {
      try {
        const res = await runMutation.mutateAsync({ sourceCode: code, languageId: langId, stdin: tc.input });
        const actual = (res.stdout ?? "").trim();
        const expected = tc.expected.trim();
        const passed = actual === expected;
        results.push({ ...tc, result: passed ? "pass" : "fail", actual });
      } catch {
        results.push({ ...tc, result: "error", actual: "Execution error" });
      }
    }
    setTestCases(results);
    saveTestCases(selectedId, results.map(r => ({ ...r, result: undefined, actual: undefined })));
    setRunningTests(false);
  }, [testCases, code, langId, selectedId]);

  const addTestCase = useCallback(() => {
    const newCase: TestCase = { id: `${Date.now()}`, input: "", expected: "" };
    const updated = [...testCases, newCase];
    setTestCases(updated);
    saveTestCases(selectedId, updated);
  }, [testCases, selectedId]);

  const updateTestCase = useCallback((id: string, field: "input" | "expected", value: string) => {
    const updated = testCases.map(tc => tc.id === id ? { ...tc, [field]: value } : tc);
    setTestCases(updated);
    saveTestCases(selectedId, updated);
  }, [testCases, selectedId]);

  const removeTestCase = useCallback((id: string) => {
    const updated = testCases.filter(tc => tc.id !== id);
    setTestCases(updated);
    saveTestCases(selectedId, updated);
  }, [testCases, selectedId]);

  const handleSubmit = useCallback(async () => {
    await handleRun();
    if (output?.statusId === 3 && !prog.solved) {
      toggleSolved(selectedId);
      const entry: SessionEntry = {
        problemId: selectedId, problemName: problem.name,
        difficulty: problem.difficulty, langId,
        solvedAt: Date.now(), timeSec: timerSecsRef.current,
      };
      const updated = [...session, entry];
      setSession(updated);
      saveSession(updated);
    }
  }, [handleRun, output, prog.solved, selectedId, problem, langId, session]);

  const handleGetHint = useCallback(async () => {
    setHintText("");
    // Track hint usage for Speed Run penalty
    if (speedRunActive || sprint.active) setHintsUsedThisRun(h => h + 1);
    try {
      const result = await hintMutation.mutateAsync({ problemName: problem.name, currentCode: code, hintLevel });
      const hintStr = typeof result.hint === "string" ? result.hint : String(result.hint);
      setHintText(hintStr);
    } catch { setHintText("Failed to get hint. Please try again."); }
  }, [problem.name, code, hintLevel, speedRunActive, sprint.active]);

  const handleReset = useCallback(() => {
    setCode(getBoilerplate(langId, problem));
    localStorage.removeItem(CODE_KEY(selectedId, langId));
  }, [langId, problem, selectedId]);

  // Code export
  const handleDownload = useCallback(() => {
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${problem.name.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.${lang.ext}`;
    a.click();
    URL.revokeObjectURL(url);
  }, [code, problem.name, lang.ext]);

  const handleCopyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* fallback: select all */ }
  }, [code]);

  // Speed Run streak (consecutive days with at least one completed Speed Run)
  const SR_STREAK_KEY = "cp_sr_streak";
  const loadSRStreak = (): { streak: number; lastDate: string | null; longestStreak: number } => {
    try { return JSON.parse(localStorage.getItem(SR_STREAK_KEY) ?? "null") ?? { streak: 0, lastDate: null, longestStreak: 0 }; } catch { return { streak: 0, lastDate: null, longestStreak: 0 }; }
  };
  const saveSRStreak = (d: { streak: number; lastDate: string | null; longestStreak: number }) => {
    localStorage.setItem(SR_STREAK_KEY, JSON.stringify(d));
  };
  const [srStreak, setSRStreak] = useState(() => {
    const d = loadSRStreak();
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = (() => { const x = new Date(); x.setDate(x.getDate() - 1); return x.toISOString().slice(0, 10); })();
    // Reset broken streak on mount
    if (d.streak > 0 && d.lastDate !== today && d.lastDate !== yesterday) {
      const reset = { ...d, streak: 0 };
      saveSRStreak(reset);
      return reset;
    }
    return d;
  });
  const recordSRStreakDay = () => {
    setSRStreak(prev => {
      const today = new Date().toISOString().slice(0, 10);
      const yesterday = (() => { const x = new Date(); x.setDate(x.getDate() - 1); return x.toISOString().slice(0, 10); })();
      if (prev.lastDate === today) return prev; // already recorded today
      const newStreak = prev.lastDate === yesterday ? prev.streak + 1 : 1;
      const updated = { streak: newStreak, lastDate: today, longestStreak: Math.max(prev.longestStreak, newStreak) };
      saveSRStreak(updated);
      return updated;
    });
  };

  // Speed Run — 24-hour problem lock (prevents repeats in non-rematch runs)
  const SR_LOCK_KEY = "cp_sr_recent_ids";
  const loadRecentSpeedRunIds = (): { id: number; ts: number }[] => {
    try { return JSON.parse(localStorage.getItem(SR_LOCK_KEY) ?? "[]"); } catch { return []; }
  };
  const saveRecentSpeedRunIds = (entries: { id: number; ts: number }[]) => {
    localStorage.setItem(SR_LOCK_KEY, JSON.stringify(entries));
  };

  const startSpeedRun = useCallback((rematchId?: number) => {
    const now = Date.now();
    const recent = loadRecentSpeedRunIds().filter(e => now - e.ts < 24 * 60 * 60 * 1000);

    if (rematchId !== undefined) {
      // Rematch: use exact same problem, add it to recent list
      const updated = [{ id: rematchId, ts: now }, ...recent.filter(e => e.id !== rematchId)].slice(0, 50);
      saveRecentSpeedRunIds(updated);
      setSelectedId(rematchId);
    } else {
      // New run: exclude recently seen problems
      const lockedIds = new Set(recent.map(e => e.id));
      let pool = CTCI_PROBLEMS.filter(p => !progress[p.id]?.solved && !lockedIds.has(p.id));
      // Fallback 1: ignore lock if pool is too small
      if (pool.length < 3) pool = CTCI_PROBLEMS.filter(p => !progress[p.id]?.solved);
      // Fallback 2: include solved if nothing left
      if (pool.length === 0) pool = CTCI_PROBLEMS;
      if (speedRunDifficulty !== "All") {
        const filtered = pool.filter(p => p.difficulty === speedRunDifficulty);
        if (filtered.length > 0) pool = filtered;
      }
      const pick = pool[Math.floor(Math.random() * pool.length)];
      const updated = [{ id: pick.id, ts: now }, ...recent.filter(e => e.id !== pick.id)].slice(0, 50);
      saveRecentSpeedRunIds(updated);
      setSelectedId(pick.id);
    }

    setSpeedRunActive(true);
    setSpeedRunSecsLeft(20 * 60);
    setSpeedRunScore(null);
    setTimerRunning(false);
    timerSecsRef.current = 0;
    setHintsUsedThisRun(0);
  }, [progress, speedRunDifficulty]);

  const stopSpeedRun = useCallback((solved: boolean) => {
    if (speedRunRef.current) clearInterval(speedRunRef.current);
    const timeSec = 20 * 60 - speedRunSecsLeft;
    const timeBonus = solved ? Math.max(0, Math.round((1 - timeSec / (20 * 60)) * 50)) : 0;
    const hintPenalty = hintsUsedThisRun * 10;
    const baseScore = solved ? 50 : 0;
    const rawScore = baseScore + timeBonus;
    const score = Math.max(0, rawScore - hintPenalty);
    setSpeedRunScore({ solved, timeSec, score, baseScore, timeBonus, hintPenalty, hintsUsed: hintsUsedThisRun });
    setSpeedRunActive(false);
    recordSRStreakDay();
    // Save to leaderboard
    const entry: SpeedRunEntry = {
      id: `${Date.now()}`,
      problemId: selectedId,
      problemName: problem.name,
      difficulty: problem.difficulty,
      solved,
      timeSec,
      score,
      hintsUsed: hintsUsedThisRun,
      date: Date.now(),
    };
    const updated = [entry, ...loadLeaderboard()].sort((a, b) => b.score - a.score);
    saveLeaderboard(updated);
    setLeaderboard(updated);
    setHintsUsedThisRun(0);
  }, [speedRunSecsLeft, hintsUsedThisRun, selectedId, problem]);

  // Speed Run countdown
  useEffect(() => {
    if (speedRunActive) {
      speedRunRef.current = setInterval(() => {
        setSpeedRunSecsLeft(s => {
          if (s <= 1) {
            clearInterval(speedRunRef.current!);
            setSpeedRunActive(false);
            setSpeedRunScore({ solved: false, timeSec: 20 * 60, score: 0, baseScore: 0, timeBonus: 0, hintPenalty: 0, hintsUsed: 0 });
            recordSRStreakDay();
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      if (speedRunRef.current) clearInterval(speedRunRef.current);
    }
    return () => { if (speedRunRef.current) clearInterval(speedRunRef.current); };
  }, [speedRunActive]);

  // ─── Topic Sprint handlers ────────────────────────────────────────────────
  const startTopicSprint = useCallback((topic: string) => {
    const pool = CTCI_PROBLEMS.filter(p =>
      p.topic.toLowerCase().includes(topic.toLowerCase()) && !progress[p.id]?.solved
    );
    const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, 3);
    if (shuffled.length === 0) return;
    setSprint({
      active: true, topic, queue: shuffled.map(p => p.id),
      currentIdx: 0, secsLeft: 10 * 60, hintsUsed: 0, scores: [], done: false,
    });
    setSelectedId(shuffled[0].id);
    setHintsUsedThisRun(0);
    setTimerRunning(false);
    timerSecsRef.current = 0;
  }, [progress]);

  const advanceTopicSprint = useCallback((solved: boolean) => {
    setSprint(prev => {
      const timeSec = 10 * 60 - prev.secsLeft;
      const timeBonus = solved ? Math.max(0, Math.round((1 - timeSec / (10 * 60)) * 30)) : 0;
      const hintPenalty = hintsUsedThisRun * 10;
      const score = Math.max(0, (solved ? 40 + timeBonus : 0) - hintPenalty);
      const scores = [...prev.scores, score];
      const problemNames = prev.queue.map(id => CTCI_PROBLEMS.find(p => p.id === id)?.name ?? `#${id}`);
      const nextIdx = prev.currentIdx + 1;
      if (nextIdx >= prev.queue.length) {
        if (sprintRef.current) clearInterval(sprintRef.current);
        // Persist sprint history
        const entry: SprintHistoryEntry = {
          id: `${Date.now()}`,
          topic: prev.topic,
          totalScore: scores.reduce((a, b) => a + b, 0),
          scores,
          problemNames,
          date: Date.now(),
        };
         const updated = [entry, ...loadSprintHistory()];
        saveSprintHistory(updated);
        setSprintHistory(updated);
        // Award XP for completing a sprint
        const isFirstSprint = loadSprintHistory().length === 0;
        if (isFirstSprint) {
          addXP('first_sprint', `First sprint completed: ${prev.topic}`);
        } else {
          addXP('sprint_complete', `Topic Sprint: ${prev.topic}`);
        }
        return { ...prev, active: false, scores, done: true };
      }
      setSelectedId(prev.queue[nextIdx]);
      setHintsUsedThisRun(0);
      timerSecsRef.current = 0;
      return { ...prev, currentIdx: nextIdx, secsLeft: 10 * 60, hintsUsed: 0, scores };
    });
  }, [hintsUsedThisRun, addXP]);
  // Topic Sprint countdown
  useEffect(() => {
    if (sprint.active) {
      sprintRef.current = setInterval(() => {
        setSprint(prev => {
          if (prev.secsLeft <= 1) {
            clearInterval(sprintRef.current!);
            // Time up on this problem — advance with unsolved
            const scores = [...prev.scores, 0];
            const problemNames = prev.queue.map(id => CTCI_PROBLEMS.find(p => p.id === id)?.name ?? `#${id}`);
            const nextIdx = prev.currentIdx + 1;
            if (nextIdx >= prev.queue.length) {
              // Persist sprint history on time-out completion
              const entry: SprintHistoryEntry = {
                id: `${Date.now()}`,
                topic: prev.topic,
                totalScore: scores.reduce((a, b) => a + b, 0),
                scores,
                problemNames,
                date: Date.now(),
              };
              const updated = [entry, ...loadSprintHistory()];
              saveSprintHistory(updated);
              setSprintHistory(updated);
              return { ...prev, active: false, scores, done: true };
            }
            setSelectedId(prev.queue[nextIdx]);
            setHintsUsedThisRun(0);
            timerSecsRef.current = 0;
            return { ...prev, currentIdx: nextIdx, secsLeft: 10 * 60, scores };
          }
          return { ...prev, secsLeft: prev.secsLeft - 1 };
        });
      }, 1000);
    } else {
      if (sprintRef.current) clearInterval(sprintRef.current);
    }
    return () => { if (sprintRef.current) clearInterval(sprintRef.current); };
  }, [sprint.active]);

  const handleMarkSolved = useCallback(() => {
    toggleSolved(selectedId);
    if (!prog.solved) {
      const entry: SessionEntry = {
        problemId: selectedId, problemName: problem.name,
        difficulty: problem.difficulty, langId,
        solvedAt: Date.now(), timeSec: timerSecsRef.current,
      };
      const updated = [...session, entry];
      setSession(updated);
      saveSession(updated);
      // If Speed Run is active, score it
      if (speedRunActive) stopSpeedRun(true);
      // Trigger difficulty self-assessment
      setPendingAssessmentProblem({ id: selectedId, name: problem.name, difficulty: problem.difficulty });
      setDiffEstimatorOpen(true);
    }
  }, [selectedId, prog.solved, problem, langId, session, speedRunActive, stopSpeedRun]);

  const todaySession = useMemo(() => {
    const today = new Date().toDateString();
    return session.filter(e => new Date(e.solvedAt).toDateString() === today);
  }, [session]);

  // Sprint streak: count completed sprints today
  const sprintStreakToday = useMemo(() => {
    const today = new Date().toDateString();
    return sprintHistory.filter(e => new Date(e.date).toDateString() === today).length;
  }, [sprintHistory]);

  // Weak-topic auto-suggest: topic with lowest avg score across sprint history
  const weakTopicSuggestion = useMemo(() => {
    if (sprintHistory.length === 0) return null;
    const topicScores: Record<string, number[]> = {};
    sprintHistory.forEach(e => {
      if (!topicScores[e.topic]) topicScores[e.topic] = [];
      topicScores[e.topic].push(e.totalScore);
    });
    // Only suggest topics that have been attempted at least once
    const entries = Object.entries(topicScores)
      .map(([topic, scores]) => ({
        topic,
        avg: scores.reduce((a, b) => a + b, 0) / scores.length,
        count: scores.length,
      }))
      .filter(e => e.count >= 1)
      .sort((a, b) => a.avg - b.avg);
    return entries.length > 0 ? entries[0] : null;
  }, [sprintHistory]);

  const passCount = testCases.filter(tc => tc.result === "pass").length;
  const failCount = testCases.filter(tc => tc.result === "fail" || tc.result === "error").length;

  const diffColors: Record<string, string> = {
    Easy: "text-emerald-600 bg-emerald-50 border-emerald-200",
    Medium: "text-amber-600 bg-amber-50 border-amber-200",
    Hard: "text-red-600 bg-red-50 border-red-200"
  };

  return (
    <div className="flex h-[calc(100vh-120px)] min-h-[600px] bg-background overflow-hidden">

      {/* ── Sidebar ── */}
      <div className={`flex flex-col border-r border-border bg-card transition-all duration-200 ${sidebarOpen ? "w-72 min-w-[220px]" : "w-10"} flex-shrink-0`}>
        <div className="flex items-center justify-between px-3 py-2 border-b border-border">
          {sidebarOpen && <span className="text-xs font-bold text-foreground uppercase tracking-wide">Problems ({filtered.length})</span>}
          {sidebarOpen && sprintStreakToday >= 3 && (
            <span
              title={`${sprintStreakToday} sprints completed today — on fire! 🔥`}
              className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-300 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-700 animate-pulse ml-auto mr-1"
            >
              🔥 {sprintStreakToday}
            </span>
          )}
          <button onClick={() => setSidebarOpen(o => !o)} className="text-muted-foreground hover:text-foreground transition-colors ml-auto">
            {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>

        {sidebarOpen && (
          <>
            {/* Stats toggle */}
            <div className="px-2 pt-2 pb-1 flex gap-1">
              <button
                onClick={() => setMainView("editor")}
                className={`flex-1 text-[10px] font-semibold py-1 rounded-lg transition-colors flex items-center justify-center gap-1 ${mainView === "editor" ? "bg-blue-600 text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
              >
                <Terminal size={10} /> Editor
              </button>
              <button
                onClick={() => setMainView("stats")}
                className={`flex-1 text-[10px] font-semibold py-1 rounded-lg transition-colors flex items-center justify-center gap-1 ${mainView === "stats" ? "bg-blue-600 text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
              >
                <BarChart2 size={10} /> Stats
              </button>
            </div>

            {/* Daily goal banner */}
            <div className="px-2 pb-1">
              <div className="bg-muted/40 border border-border rounded-lg px-2.5 py-1.5">
                {editingGoal ? (
                  <form
                    className="flex items-center gap-1.5"
                    onSubmit={e => {
                      e.preventDefault();
                      const n = Math.max(1, Math.min(50, parseInt(goalInputVal, 10) || dailyGoal));
                      setDailyGoal(n);
                      saveDailyGoal(n);
                      setEditingGoal(false);
                    }}
                  >
                    <span className="text-[10px] text-muted-foreground">Goal:</span>
                    <input
                      autoFocus
                      type="number" min={1} max={50}
                      value={goalInputVal}
                      onChange={e => setGoalInputVal(e.target.value)}
                      className="w-10 text-[10px] bg-background border border-border rounded px-1 py-0.5 text-foreground text-center"
                    />
                    <span className="text-[10px] text-muted-foreground">problems</span>
                    <button type="submit" className="text-[10px] text-blue-600 font-semibold hover:underline">Save</button>
                    <button type="button" onClick={() => setEditingGoal(false)} className="text-[10px] text-muted-foreground hover:text-foreground">✕</button>
                  </form>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-semibold text-foreground">
                        {todaySession.length >= dailyGoal ? "🎉" : "🎯"} Today: {todaySession.length} / {dailyGoal}
                      </span>
                      <button
                        onClick={() => { setGoalInputVal(String(dailyGoal)); setEditingGoal(true); }}
                        className="text-[10px] text-muted-foreground hover:text-foreground"
                        title="Edit daily goal"
                      >✎</button>
                    </div>
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          todaySession.length >= dailyGoal
                            ? "bg-emerald-500"
                            : todaySession.length >= Math.ceil(dailyGoal * 0.5)
                            ? "bg-amber-500"
                            : "bg-blue-500"
                        }`}
                        style={{ width: `${Math.min(100, (todaySession.length / dailyGoal) * 100)}%` }}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Topic Sprint button */}
            <div className="px-2 pt-1 pb-1">
              {sprint.done ? (
                <div className="bg-violet-50 dark:bg-violet-900/20 border border-violet-300 dark:border-violet-700 rounded-lg px-3 py-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-violet-700 dark:text-violet-300">🏁 Sprint Complete!</span>
                    <button onClick={() => setSprint(s => ({ ...s, done: false }))} className="text-[10px] text-muted-foreground hover:text-foreground">✕</button>
                  </div>
                  <div className="text-xs text-violet-600 dark:text-violet-400">
                    Total: <span className="font-bold">{sprint.scores.reduce((a, b) => a + b, 0)}</span> pts
                    &nbsp;({sprint.scores.join(" + ")})
                  </div>
                </div>
              ) : sprint.active ? (
                <div className="bg-violet-50 dark:bg-violet-900/20 border border-violet-300 dark:border-violet-700 rounded-lg px-3 py-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-violet-700 dark:text-violet-300">⚡ Topic Sprint: {sprint.topic}</span>
                    <button onClick={() => { if (sprintRef.current) clearInterval(sprintRef.current); setSprint(s => ({ ...s, active: false })); }} className="text-[10px] text-muted-foreground hover:text-foreground">Stop</button>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>Problem {sprint.currentIdx + 1}/{sprint.queue.length}</span>
                    <span className="font-mono text-violet-600 dark:text-violet-400">{Math.floor(sprint.secsLeft / 60)}:{String(sprint.secsLeft % 60).padStart(2, "0")}</span>
                  </div>
                  <button
                    onClick={() => advanceTopicSprint(true)}
                    className="mt-1.5 w-full text-[10px] font-semibold py-1 rounded-lg bg-violet-600 text-white hover:bg-violet-700 transition-colors"
                  >✓ Mark Solved &amp; Next</button>
                </div>
              ) : (
                <div className="space-y-1">
                  {/* Weak-topic suggestion chip */}
                  {weakTopicSuggestion && (
                    <button
                      onClick={() => setSprintTopic(weakTopicSuggestion.topic)}
                      className="w-full text-left text-[10px] px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                      title={`Your weakest topic — avg ${Math.round(weakTopicSuggestion.avg)} pts over ${weakTopicSuggestion.count} sprint${weakTopicSuggestion.count > 1 ? 's' : ''}`}
                    >
                      🎯 Focus area: <span className="font-bold">{weakTopicSuggestion.topic}</span>
                      <span className="ml-1 opacity-70">(avg {Math.round(weakTopicSuggestion.avg)}pts)</span>
                    </button>
                  )}
                  {/* Topic selector */}
                  <select
                    value={sprintTopic}
                    onChange={e => setSprintTopic(e.target.value)}
                    className="w-full text-[10px] bg-background border border-border rounded-lg px-2 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-violet-500"
                  >
                    <option value="">🎲 Random Topic</option>
                    {Array.from(new Set(CTCI_PROBLEMS.map(p => p.topic.split(",")[0].trim()))).sort().map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      const topics = Array.from(new Set(CTCI_PROBLEMS.map(p => p.topic.split(",")[0].trim())));
                      const t = sprintTopic || topics[Math.floor(Math.random() * topics.length)];
                      startTopicSprint(t);
                    }}
                    className="w-full text-[10px] font-semibold py-1.5 rounded-lg bg-violet-600 text-white hover:bg-violet-700 transition-colors flex items-center justify-center gap-1"
                  >
                    ⚡ {sprintTopic ? `Sprint: ${sprintTopic.length > 14 ? sprintTopic.slice(0, 14) + '…' : sprintTopic}` : 'Random Topic Sprint'}
                  </button>
                </div>
              )}
            </div>

            {/* Study Session Planner button */}
            <div className="px-2 pt-0 pb-1">
              <button
                onClick={() => setStudyPlannerOpen(true)}
                className="w-full text-[10px] font-semibold py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1"
              >
                <BookOpen size={10} /> Plan Today's Session
              </button>
            </div>

            {/* Search */}
            <div className="px-2 pt-1 pb-1">
              <div className="relative">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text" placeholder="Search..." value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-7 pr-6 py-1.5 text-xs bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-foreground placeholder:text-muted-foreground"
                />
                {search && <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X size={10} /></button>}
              </div>
            </div>

            {/* Filters */}
            <div className="px-2 pb-2 flex gap-1 flex-wrap">
              {(["All", "Easy", "Medium", "Hard"] as const).map(d => (
                <button key={d} onClick={() => setDiffFilter(d)}
                  className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${diffFilter === d ? "bg-blue-600 text-white border-blue-600" : "bg-background border-border text-muted-foreground hover:bg-muted"}`}>
                  {d}
                </button>
              ))}
              {(["All", "Solved", "Unsolved", "Starred"] as const).map(s => (
                <button key={s} onClick={() => setStatusFilter(s)}
                  className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${statusFilter === s ? "bg-blue-600 text-white border-blue-600" : "bg-background border-border text-muted-foreground hover:bg-muted"}`}>
                  {s}
                </button>
              ))}
            </div>

            {/* Progression lock notice for Hard problems */}
            {!progressionStats.hardUnlocked && (
              <div className="mx-2 mb-1 px-2 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-[10px] text-red-700 dark:text-red-400">
                <div className="flex items-center gap-1 font-bold mb-0.5"><Lock size={9} /> Hard locked</div>
                <div className="text-[9px] text-red-600/80 dark:text-red-400/80">
                  Easy: {Math.round(progressionStats.easyPct * 100)}% / 60% needed
                  &nbsp;·&nbsp;Med: {Math.round(progressionStats.medPct * 100)}% / 40% needed
                </div>
              </div>
            )}

            {/* Problem list */}
            <div className="flex-1 overflow-y-auto">
              {filtered.map(p => {
                const pr = progress[p.id];
                const isSelected = p.id === selectedId;
                const diff = DIFFICULTY_COLORS[p.difficulty];
                const isLocked = p.difficulty === "Hard" && !progressionStats.hardUnlocked;
                return (
                  <button
                    key={p.id}
                    onClick={() => { if (!isLocked) { setSelectedId(p.id); setMainView("editor"); } }}
                    disabled={isLocked}
                    title={isLocked ? `Unlock Hard: solve ≥60% Easy (${Math.round(progressionStats.easyPct*100)}%) and ≥40% Medium (${Math.round(progressionStats.medPct*100)}%)` : undefined}
                    className={`w-full text-left px-3 py-2 border-b border-border/50 transition-colors flex items-start gap-2 group ${
                      isLocked ? "opacity-40 cursor-not-allowed bg-muted/20" :
                      isSelected ? "bg-blue-50 dark:bg-blue-900/20 border-l-2 border-l-blue-500" : "hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {isLocked
                        ? <Lock size={12} className="text-red-400" />
                        : pr?.solved
                        ? <CheckCircle2 size={12} className="text-emerald-500 fill-current" />
                        : <Circle size={12} className="text-muted-foreground" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <span className={`text-xs font-medium truncate ${isLocked ? "text-muted-foreground" : isSelected ? "text-blue-700 dark:text-blue-300" : "text-foreground"}`}>{p.name}</span>
                        {pr?.starred && !isLocked && <Star size={9} className="text-yellow-500 fill-current flex-shrink-0" />}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className={`text-[9px] font-semibold px-1.5 py-0 rounded-full ${diff.bg} ${diff.text}`}>{p.difficulty}</span>
                        <span className="text-[9px] text-muted-foreground truncate">{p.topic.split(",")[0].trim()}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Session stats */}
            <div className="border-t border-border px-3 py-2 bg-muted/30">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1"><Trophy size={11} /> Today</span>
                <span className="font-bold text-foreground">{todaySession.length} solved</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {mainView === "stats" ? (
          <StatsDashboard session={session} progress={progress} leaderboard={leaderboard} sprintHistory={sprintHistory} assessments={assessments} onClearAssessments={() => { saveAssessments([]); setAssessments([]); }} srStreak={srStreak} />
        ) : (
          <>
            {/* Toolbar */}
            <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-card flex-shrink-0 flex-wrap">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${diffColors[problem.difficulty]}`}>{problem.difficulty}</span>
                {speedRunActive ? (
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-orange-600 dark:text-orange-400">
                    <EyeOff size={14} />
                    <span className="italic text-muted-foreground">Hidden — Speed Run active</span>
                  </span>
                ) : (
                  <>
                    <span className="text-sm font-semibold text-foreground truncate">{problem.name}</span>
                    <a href={problem.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-blue-500 flex-shrink-0" title="Open on LeetCode">
                      <ExternalLink size={13} />
                    </a>
                  </>
                )}
              </div>

              <select
                value={langId}
                onChange={e => setLangId(Number(e.target.value) as LangId)}
                className="text-xs bg-background border border-border rounded-lg px-2 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {LANGUAGES.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>

              <PracticeTimer running={timerRunning} onReset={() => { timerSecsRef.current = 0; }} onTick={s => { timerSecsRef.current = s; }} />

              <button onClick={handleReset} title="Reset to boilerplate" className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-muted">
                <RotateCcw size={14} />
              </button>
              <button onClick={handleDownload} title="Download code" className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-muted">
                <Download size={14} />
              </button>
              <button onClick={handleCopyCode} title={copied ? "Copied!" : "Copy code"} className={`transition-colors p-1.5 rounded-lg hover:bg-muted ${copied ? "text-emerald-500" : "text-muted-foreground hover:text-foreground"}`}>
                <Copy size={14} />
              </button>
              {/* Speed Run group */}
              <div className="flex items-center gap-1">
                {/* Speed Run streak badge */}
                {srStreak.streak >= 2 && (
                  <div
                    className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold border transition-all ${
                      srStreak.streak >= 5
                        ? "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-400"
                        : "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400"
                    }`}
                    title={`Speed Run streak: ${srStreak.streak} consecutive days${srStreak.longestStreak > srStreak.streak ? ` (best: ${srStreak.longestStreak})` : ""}`}
                  >
                    <Flame size={9} className={srStreak.streak >= 5 ? "text-orange-500 fill-current" : "text-amber-500"} />
                    {srStreak.streak}d
                  </div>
                )}
                {!speedRunActive && (
                  <div className="flex items-center gap-0.5 bg-muted rounded-lg p-0.5">
                    {(["All", "Easy", "Med", "Hard"] as const).map(d => {
                      const val = d === "Med" ? "Medium" : d as "All" | "Easy" | "Hard";
                      const active = speedRunDifficulty === val;
                      const color = d === "Easy" ? "text-emerald-600" : d === "Med" ? "text-amber-600" : d === "Hard" ? "text-red-600" : "text-foreground";
                      return (
                        <button
                          key={d}
                          onClick={() => setSpeedRunDifficulty(val)}
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md transition-all ${
                            active ? `bg-background shadow-sm ${color}` : "text-muted-foreground hover:text-foreground"
                          }`}
                          title={`Speed Run: ${val} problems only`}
                        >
                          {d}
                        </button>
                      );
                    })}
                  </div>
                )}
                <button
                  onClick={speedRunActive ? () => stopSpeedRun(false) : () => startSpeedRun()}
                  title={speedRunActive ? "Stop Speed Run" : `Start Speed Run (20 min${speedRunDifficulty !== "All" ? `, ${speedRunDifficulty} only` : ""})`}
                  className={`flex items-center gap-1 text-xs font-semibold px-2 py-1.5 rounded-lg border transition-all ${
                    speedRunActive
                      ? "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-400 animate-pulse"
                      : "bg-background border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Timer size={13} />
                  {speedRunActive ? `${Math.floor(speedRunSecsLeft/60)}:${String(speedRunSecsLeft%60).padStart(2,"00")}` : "Speed Run"}
                </button>
              </div>
              <button
                onClick={() => toggleStarred(selectedId)}
                className={`transition-colors p-1.5 rounded-lg hover:bg-muted ${prog.starred ? "text-yellow-500" : "text-muted-foreground hover:text-yellow-400"}`}
                title={prog.starred ? "Unstar" : "Star for review"}
              >
                {prog.starred ? <Star size={14} className="fill-current" /> : <StarOff size={14} />}
              </button>
              <button
                onClick={handleMarkSolved}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${prog.solved ? "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-background border-border text-foreground hover:bg-muted"}`}
              >
                {prog.solved ? <><CheckCircle2 size={13} /> Solved</> : <><Circle size={13} /> Mark Solved</>}
              </button>
              <button
                onClick={handleRun}
                disabled={runMutation.isPending}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
              >
                {runMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
                Run
              </button>
            </div>

            {/* Speed Run score panel */}
            {speedRunScore && (
              <div className={`px-4 py-3 border-b flex-shrink-0 ${
                speedRunScore.solved
                  ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800"
                  : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
              }`}>
                {/* Header row */}
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{speedRunScore.solved ? "🏆" : "⏰"}</span>
                  <div className="flex-1">
                    <div className={`text-sm font-bold ${speedRunScore.solved ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"}`}>
                      {speedRunScore.solved ? "Speed Run Complete!" : "Time's Up!"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {speedRunScore.solved
                        ? `Solved in ${Math.floor(speedRunScore.timeSec/60)}m ${speedRunScore.timeSec%60}s`
                        : `Problem: ${problem.name}`}
                    </div>
                  </div>
                  <div className={`text-3xl font-black ${speedRunScore.solved ? "text-emerald-600" : "text-red-500"}`}>{speedRunScore.score}</div>
                  <button onClick={() => setSpeedRunScore(null)} className="text-muted-foreground hover:text-foreground p-1 rounded">
                    <X size={14} />
                  </button>
                </div>
                {/* Score breakdown + Rematch */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-muted-foreground font-medium">Score breakdown:</span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                    Base {speedRunScore.baseScore}
                  </span>
                  {speedRunScore.timeBonus > 0 && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                      +{speedRunScore.timeBonus} time bonus
                    </span>
                  )}
                  {speedRunScore.hintPenalty > 0 && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                      −{speedRunScore.hintPenalty} hints ({speedRunScore.hintsUsed}×💡)
                    </span>
                  )}
                  <span className="text-[10px] text-muted-foreground">=</span>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    speedRunScore.score >= 80 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                    speedRunScore.score >= 50 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                    "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  }`}>
                    {speedRunScore.score} pts
                  </span>
                  <button
                    onClick={() => {
                      const rematchId = selectedId;
                      setSpeedRunScore(null);
                      startSpeedRun(rematchId);
                    }}
                    className="ml-auto flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors"
                    title="Rematch: restart Speed Run on the same problem (does not count toward 24h lock)"
                  >
                    <RotateCcw size={10} /> Rematch
                  </button>
                </div>
              </div>
            )}

            {/* Topic tags */}
            <div className="px-4 py-1.5 border-b border-border bg-muted/20 flex items-center gap-1.5 flex-wrap flex-shrink-0">
              <span className="text-[10px] text-muted-foreground font-medium">Topics:</span>
              {problem.topic.split(",").map(t => (
                <span key={t} className="text-[10px] bg-background border border-border text-muted-foreground px-1.5 py-0 rounded-full">{t.trim()}</span>
              ))}
            </div>

            {/* Editor + output split */}
            <div className="flex-1 flex flex-col min-h-0">
              {/* Monaco Editor */}
              <div className="flex-1 min-h-0">
                <Editor
                  height="100%"
                  language={lang.monaco}
                  value={code}
                  onChange={(v: string | undefined) => setCode(v ?? "")}
                  theme="vs-dark"
                  options={{
                    fontSize: 13,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    wordWrap: "on",
                    tabSize: 4,
                    insertSpaces: true,
                    automaticLayout: true,
                    padding: { top: 12, bottom: 12 },
                    lineNumbers: "on",
                    renderLineHighlight: "line",
                    suggestOnTriggerCharacters: true,
                    quickSuggestions: true,
                    folding: true,
                  }}
                />
              </div>

              {/* Output panel */}
              <div className="flex-shrink-0 border-t border-border bg-card" style={{ height: "240px" }}>
                {/* Output tabs */}
                <div className="flex items-center gap-0 border-b border-border px-2 bg-muted/30 overflow-x-auto">
                  {[
                    { key: "output",      label: "Output",      icon: <Terminal size={12} /> },
                    { key: "tests",       label: `Tests${testCases.length > 0 ? ` (${testCases.length})` : ""}`, icon: <FlaskConical size={12} /> },
                    { key: "notes",       label: "Notes",       icon: <StickyNote size={12} /> },
                    { key: "history",     label: "Session",     icon: <History size={12} /> },
                    { key: "submissions", label: `Runs${submissions.length > 0 ? ` (${submissions.length})` : ""}`, icon: <GitCommit size={12} /> },
                  ].map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setOutputTab(tab.key as typeof outputTab)}
                      className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${outputTab === tab.key ? "border-blue-500 text-blue-600 dark:text-blue-400" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                    >
                      {tab.icon} {tab.label}
                    </button>
                  ))}

                  {/* Stdin toggle */}
                  <button
                    onClick={() => setShowStdin(s => !s)}
                    className={`ml-auto flex items-center gap-1 px-2 py-1.5 text-xs rounded transition-colors flex-shrink-0 ${showStdin ? "text-blue-500" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    <Zap size={11} /> stdin
                  </button>

                  {/* Hint button */}
                  <button
                    onClick={() => setHintOpen(h => !h)}
                    className={`flex items-center gap-1 px-2 py-1.5 text-xs rounded transition-colors flex-shrink-0 ${hintOpen ? "text-amber-500" : "text-muted-foreground hover:text-amber-500"}`}
                  >
                    <Lightbulb size={11} /> Hint
                  </button>
                </div>

                <div className="h-[calc(100%-36px)] overflow-y-auto">
                  {/* Output tab */}
                  {outputTab === "output" && (
                    <div className="p-3 space-y-2 font-mono text-xs">
                      {showStdin && (
                        <div>
                          <label className="text-[10px] text-muted-foreground font-sans font-semibold block mb-1">Custom stdin</label>
                          <textarea
                            value={stdin} onChange={e => setStdin(e.target.value)}
                            rows={2} placeholder="Enter test input..."
                            className="w-full text-xs bg-background border border-border rounded px-2 py-1 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none font-mono"
                          />
                        </div>
                      )}

                      {runMutation.isPending && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Loader2 size={14} className="animate-spin" /> Running code...
                        </div>
                      )}

                      {!runMutation.isPending && !output && (
                        <div className="flex items-center gap-2 text-muted-foreground text-xs font-sans">
                          <Play size={13} /> Click <strong>Run</strong> to execute your code
                        </div>
                      )}

                      {output && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 font-sans">
                            <StatusBadge statusId={output.statusId} desc={output.statusDescription} />
                            {output.time && <span className="text-[10px] text-muted-foreground">⏱ {output.time}s</span>}
                            {output.memory && <span className="text-[10px] text-muted-foreground">💾 {(output.memory / 1024).toFixed(1)} MB</span>}
                          </div>
                          {output.stdout && (
                            <div>
                              <div className="text-[10px] text-emerald-600 font-sans font-semibold mb-0.5">stdout</div>
                              <pre className="bg-gray-900 text-emerald-300 rounded p-2 text-xs overflow-x-auto whitespace-pre-wrap">{output.stdout}</pre>
                            </div>
                          )}
                          {output.stderr && (
                            <div>
                              <div className="text-[10px] text-red-500 font-sans font-semibold mb-0.5">stderr</div>
                              <pre className="bg-gray-900 text-red-300 rounded p-2 text-xs overflow-x-auto whitespace-pre-wrap">{output.stderr}</pre>
                            </div>
                          )}
                          {output.compileOutput && (
                            <div>
                              <div className="text-[10px] text-amber-500 font-sans font-semibold mb-0.5">compile output</div>
                              <pre className="bg-gray-900 text-amber-300 rounded p-2 text-xs overflow-x-auto whitespace-pre-wrap">{output.compileOutput}</pre>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Hint drawer */}
                      {hintOpen && (
                        <div className="border-t border-border pt-2 font-sans">
                          <div className="flex items-center gap-2 mb-2">
                            <Lightbulb size={12} className="text-amber-500" />
                            <span className="text-xs font-semibold text-foreground">AI Hint</span>
                            <select value={hintLevel} onChange={e => setHintLevel(e.target.value as typeof hintLevel)}
                              className="text-xs bg-background border border-border rounded px-1.5 py-0.5 text-foreground focus:outline-none ml-auto">
                              <option value="gentle">Gentle nudge</option>
                              <option value="medium">Medium hint</option>
                              <option value="strong">Full approach</option>
                            </select>
                            <button onClick={handleGetHint} disabled={hintMutation.isPending}
                              className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-60 transition-colors">
                              {hintMutation.isPending ? <Loader2 size={11} className="animate-spin" /> : <Lightbulb size={11} />}
                              Get
                            </button>
                          </div>
                          {hintText && <div className="text-xs text-foreground bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded p-2 leading-relaxed">{hintText}</div>}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tests tab */}
                  {outputTab === "tests" && (
                    <div className="p-3 space-y-2 font-sans text-xs">
                      {/* Header with summary */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-foreground flex items-center gap-1"><FlaskConical size={12} /> Custom Test Cases</span>
                        {testCases.some(tc => tc.result) && (
                          <div className="flex items-center gap-1.5 ml-auto">
                            <span className="text-emerald-600 font-bold">{passCount} ✅</span>
                            <span className="text-red-500 font-bold">{failCount} ❌</span>
                            <span className="text-muted-foreground">/ {testCases.length}</span>
                          </div>
                        )}
                        <button
                          onClick={handleRunTests}
                          disabled={runningTests || testCases.length === 0}
                          className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 transition-colors ml-auto"
                        >
                          {runningTests ? <Loader2 size={11} className="animate-spin" /> : <Play size={11} />}
                          Run All
                        </button>
                        <button
                          onClick={addTestCase}
                          className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded bg-muted text-foreground hover:bg-muted/80 border border-border transition-colors"
                        >
                          <Plus size={11} /> Add Case
                        </button>
                      </div>

                      {testCases.length === 0 && (
                        <div className="text-muted-foreground flex items-center gap-2 py-2">
                          <FlaskConical size={12} /> Add test cases to validate your solution against expected outputs.
                        </div>
                      )}

                      {testCases.map((tc, i) => (
                        <div key={tc.id} className={`rounded-lg border p-2 space-y-1.5 ${tc.result === "pass" ? "border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20" : tc.result === "fail" || tc.result === "error" ? "border-red-300 bg-red-50 dark:bg-red-900/20" : "border-border bg-background"}`}>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-muted-foreground">Case {i + 1}</span>
                            {tc.result === "pass" && <span className="text-emerald-600 font-bold text-[10px]">✅ PASS</span>}
                            {tc.result === "fail" && <span className="text-red-500 font-bold text-[10px]">❌ FAIL</span>}
                            {tc.result === "error" && <span className="text-amber-500 font-bold text-[10px]">⚠️ ERROR</span>}
                            {tc.result === "pending" && <Loader2 size={10} className="animate-spin text-blue-500" />}
                            <button onClick={() => removeTestCase(tc.id)} className="ml-auto text-muted-foreground hover:text-red-500 transition-colors"><Trash2 size={11} /></button>
                          </div>
                          <div className="grid grid-cols-2 gap-1.5">
                            <div>
                              <label className="text-[10px] text-muted-foreground font-semibold block mb-0.5">Input (stdin)</label>
                              <textarea
                                value={tc.input}
                                onChange={e => updateTestCase(tc.id, "input", e.target.value)}
                                rows={2}
                                placeholder="e.g. [2,7,11,15]\n9"
                                className="w-full text-xs bg-background border border-border rounded px-2 py-1 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none font-mono"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-muted-foreground font-semibold block mb-0.5">Expected Output</label>
                              <textarea
                                value={tc.expected}
                                onChange={e => updateTestCase(tc.id, "expected", e.target.value)}
                                rows={2}
                                placeholder="e.g. [0,1]"
                                className="w-full text-xs bg-background border border-border rounded px-2 py-1 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none font-mono"
                              />
                            </div>
                          </div>
                          {tc.result === "fail" && tc.actual !== undefined && (
                            <div className="text-[10px] text-red-600 font-mono bg-red-50 dark:bg-red-900/30 rounded px-2 py-1">
                              Got: <span className="font-bold">{tc.actual || "(empty)"}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Notes tab */}
                  {outputTab === "notes" && (
                    <div className="p-3 h-full flex flex-col">
                      <div className="text-[10px] text-muted-foreground font-semibold mb-1.5 flex items-center gap-1">
                        <StickyNote size={10} /> Notes for {problem.name}
                      </div>
                      <textarea
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        placeholder="Jot down your approach, time complexity, edge cases, or key insights..."
                        className="flex-1 text-xs bg-background border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none font-mono leading-relaxed"
                      />
                    </div>
                  )}

                  {/* Session History tab */}
                  {outputTab === "history" && (
                    <div className="p-3 space-y-1.5">
                      <div className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1 mb-2">
                        <Flame size={10} className="text-orange-500" /> Today's session — {todaySession.length} solved
                      </div>
                      {todaySession.length === 0 && (
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          <BookOpen size={12} /> No problems solved today yet. Start coding!
                        </div>
                      )}
                      {todaySession.slice().reverse().map((e, i) => {
                        const mins = Math.floor(e.timeSec / 60);
                        const secs = e.timeSec % 60;
                        const langName = LANGUAGES.find(l => l.id === e.langId)?.name ?? "?";
                        const dc = { Easy: "text-emerald-600", Medium: "text-amber-600", Hard: "text-red-600" }[e.difficulty] ?? "";
                        return (
                          <div key={i} className="flex items-center gap-2 text-xs bg-muted/30 rounded-lg px-3 py-2">
                            <CheckCircle2 size={11} className="text-emerald-500 flex-shrink-0" />
                            <span className="font-medium text-foreground truncate flex-1">{e.problemName}</span>
                            <span className={`font-semibold text-[10px] ${dc}`}>{e.difficulty}</span>
                            <span className="text-muted-foreground text-[10px]">{langName}</span>
                            {e.timeSec > 0 && <span className="text-muted-foreground text-[10px] font-mono">{mins}:{String(secs).padStart(2, "0")}</span>}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Submissions tab */}
                  {outputTab === "submissions" && (
                    <div className="p-3 space-y-2 font-sans text-xs">
                      <div className="flex items-center gap-2 mb-1">
                        <GitCommit size={12} className="text-gray-500" />
                        <span className="font-semibold text-foreground">Submission History</span>
                        <span className="text-muted-foreground ml-auto">{submissions.length} runs for this problem</span>
                      </div>

                      {viewingSubmission && (
                        <div className="border border-border rounded-lg p-2 bg-background space-y-2">
                          <div className="flex items-center gap-2">
                            <StatusBadge statusId={viewingSubmission.statusId} desc={viewingSubmission.statusDescription} />
                            <span className="text-[10px] text-muted-foreground">{LANGUAGES.find(l => l.id === viewingSubmission.langId)?.name}</span>
                            {viewingSubmission.time && <span className="text-[10px] text-muted-foreground">⏱ {viewingSubmission.time}s</span>}
                            <button onClick={() => { setCode(viewingSubmission.code); setViewingSubmission(null); }} className="ml-auto text-xs text-blue-600 hover:underline font-semibold">Restore</button>
                            <button onClick={() => setViewingSubmission(null)} className="text-muted-foreground hover:text-foreground"><X size={12} /></button>
                          </div>
                          <pre className="bg-gray-900 text-gray-200 rounded p-2 text-xs overflow-x-auto whitespace-pre-wrap max-h-24 font-mono">{viewingSubmission.code}</pre>
                          {viewingSubmission.stdout && <pre className="bg-gray-900 text-emerald-300 rounded p-1.5 text-xs overflow-x-auto whitespace-pre-wrap">{viewingSubmission.stdout}</pre>}
                          {viewingSubmission.stderr && <pre className="bg-gray-900 text-red-300 rounded p-1.5 text-xs overflow-x-auto whitespace-pre-wrap">{viewingSubmission.stderr}</pre>}
                        </div>
                      )}

                      {submissions.length === 0 && !viewingSubmission && (
                        <div className="text-muted-foreground flex items-center gap-2 py-2">
                          <GitCommit size={12} /> Run your code to start building submission history.
                        </div>
                      )}

                      {!viewingSubmission && submissions.map((sub, i) => {
                        const langName = LANGUAGES.find(l => l.id === sub.langId)?.name ?? "?";
                        const statusColor = sub.statusId === 3 ? "text-emerald-600" : sub.statusId === 6 ? "text-red-500" : "text-amber-500";
                        const statusIcon = sub.statusId === 3 ? "✅" : sub.statusId === 6 ? "❌" : "⚠️";
                        return (
                          <button
                            key={sub.id}
                            onClick={() => setViewingSubmission(sub)}
                            className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-muted/30 hover:bg-muted transition-colors"
                          >
                            <span className={`font-bold text-[10px] ${statusColor}`}>{statusIcon} {sub.statusDescription}</span>
                            <span className="text-muted-foreground text-[10px]">{langName}</span>
                            {sub.time && <span className="text-muted-foreground text-[10px]">⏱ {sub.time}s</span>}
                            <span className="text-muted-foreground text-[10px] ml-auto">{new Date(sub.timestamp).toLocaleTimeString()}</span>
                            {i === 0 && <span className="text-[9px] bg-blue-100 text-blue-600 px-1.5 py-0 rounded-full font-semibold">latest</span>}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Study Session Planner Modal ── */}
      {studyPlannerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-2 px-5 py-4 border-b border-border flex-shrink-0">
              <BookOpen size={16} className="text-indigo-500" />
              <div className="flex-1">
                <div className="text-sm font-bold text-foreground">Plan Today's Session</div>
                <div className="text-xs text-muted-foreground">AI-powered personalised study plan</div>
              </div>
              <button onClick={() => { setStudyPlannerOpen(false); setStudyPlan(null); }} className="text-muted-foreground hover:text-foreground">
                <X size={16} />
              </button>
            </div>

            {!studyPlan ? (
              <div className="p-5 space-y-4">
                {/* Duration picker */}
                <div>
                  <div className="text-xs font-semibold text-foreground mb-2">Session length</div>
                  <div className="flex gap-2">
                    {([30, 60, 90] as const).map(d => (
                      <button
                        key={d}
                        onClick={() => setStudyPlanDuration(d)}
                        className={`flex-1 py-2 rounded-xl border-2 text-sm font-bold transition-all ${
                          studyPlanDuration === d
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "bg-background border-border text-foreground hover:bg-muted"
                        }`}
                      >
                        {d} min
                      </button>
                    ))}
                  </div>
                </div>
                {/* Snapshot preview */}
                <div className="bg-muted/40 border border-border rounded-xl p-3 space-y-1.5 text-xs">
                  <div className="font-semibold text-foreground mb-1">Your snapshot</div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground w-28">Readiness:</span>
                    <span className="font-bold text-foreground">{Math.round(readinessScore)}/100</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground w-28">SR due today:</span>
                    <span className="font-bold text-foreground">{srDueToday.length} patterns</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground w-28">Unsolved CTCI:</span>
                    <span className="font-bold text-foreground">{Object.values(progress).filter(p => !p.solved).length} problems</span>
                  </div>
                  {assessments.filter(a => a.selfRating === "Hard" && a.officialDifficulty !== "Hard" || a.selfRating === "Very Hard").length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground w-28">Hard topics:</span>
                      <span className="font-bold text-red-600">{assessments.filter(a => a.selfRating === "Hard" || a.selfRating === "Very Hard").map(a => a.problemName.split(" ")[0]).slice(0, 3).join(", ")}</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={async () => {
                    const weakPatterns = getWeakestPatterns(8).map(p => ({ name: p.patternName, avg: p.avg ?? 0 }));
                    const unsolvedProblems = CTCI_PROBLEMS
                      .filter(p => !progress[p.id]?.solved)
                      .slice(0, 15)
                      .map(p => ({ name: p.name, difficulty: p.difficulty, topic: p.topic.split(",")[0].trim() }));
                    const hardTopics = assessments
                      .filter(a => a.selfRating === "Hard" || a.selfRating === "Very Hard")
                      .map(a => a.officialDifficulty + " " + a.problemName.split(" ")[0])
                      .slice(0, 5);
                    const result = await studyPlanMutation.mutateAsync({
                      durationMinutes: studyPlanDuration,
                      srDuePatterns: srDueToday.map(id => ({ id, name: id })).slice(0, 20),
                      weakPatterns,
                      unsolvedProblems,
                      hardTopics,
                      readinessScore: Math.round(readinessScore),
                    });
                    setStudyPlan(result);
                  }}
                  disabled={studyPlanMutation.isPending}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
                >
                  {studyPlanMutation.isPending ? <><Loader2 size={14} className="animate-spin" /> Generating plan…</> : <><BookOpen size={14} /> Generate {studyPlanDuration}-min Plan</>}
                </button>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {/* Plan headline */}
                <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700 rounded-xl p-3">
                  <div className="text-sm font-bold text-indigo-700 dark:text-indigo-300 mb-1">{studyPlan.headline}</div>
                  <div className="flex flex-wrap gap-1">
                    {studyPlan.focusAreas.map(f => (
                      <span key={f} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">{f}</span>
                    ))}
                  </div>
                </div>
                {/* Blocks */}
                <div className="space-y-2">
                  {studyPlan.blocks.map((block, i) => {
                    const typeColors: Record<string, string> = {
                      coding: "border-blue-300 bg-blue-50 dark:bg-blue-900/20",
                      behavioral: "border-amber-300 bg-amber-50 dark:bg-amber-900/20",
                      sr_review: "border-violet-300 bg-violet-50 dark:bg-violet-900/20",
                      system_design: "border-teal-300 bg-teal-50 dark:bg-teal-900/20",
                      break: "border-gray-200 bg-gray-50 dark:bg-gray-800/30",
                    };
                    const typeIcons: Record<string, string> = {
                      coding: "💻", behavioral: "💬", sr_review: "🔄", system_design: "🏗️", break: "☕",
                    };
                    const priorityBadge: Record<string, string> = {
                      high: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                      medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
                      low: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
                    };
                    return (
                      <div key={i} className={`border rounded-xl p-3 ${typeColors[block.type] ?? "border-border bg-card"}`}>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-base">{typeIcons[block.type] ?? "📌"}</span>
                          <span className="text-xs font-bold text-foreground flex-1">{block.title}</span>
                          <span className="text-[10px] font-bold text-muted-foreground">{block.durationMinutes}m</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0 rounded-full ${priorityBadge[block.priority] ?? ""}`}>{block.priority}</span>
                        </div>
                        <ul className="space-y-0.5">
                          {block.tasks.map((task, j) => (
                            <li key={j} className="flex items-start gap-1.5 text-[11px] text-foreground">
                              <span className="text-muted-foreground mt-0.5 flex-shrink-0">•</span>
                              {task}
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
                {/* Coaching note */}
                <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 rounded-xl p-3">
                  <div className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 mb-0.5 uppercase tracking-wide">🌱 Coach's note</div>
                  <div className="text-xs text-foreground">{studyPlan.coachingNote}</div>
                </div>
                {/* Actions */}
                <div className="space-y-2">
                  {/* Copy as Markdown */}
                  <button
                    onClick={() => {
                      if (!studyPlan) return;
                      const typeIcons: Record<string, string> = {
                        coding: "💻", behavioral: "💬", sr_review: "🔄", system_design: "🏗️", break: "☕",
                      };
                      const lines: string[] = [
                        `# ${studyPlan.headline}`,
                        ``,
                        `**Focus areas:** ${studyPlan.focusAreas.join(" · ")}`,
                        ``,
                        `## Session Blocks`,
                        ``,
                      ];
                      studyPlan.blocks.forEach(block => {
                        const icon = typeIcons[block.type] ?? "📌";
                        lines.push(`### ${icon} ${block.title} (${block.durationMinutes} min) — *${block.priority} priority*`);
                        block.tasks.forEach(t => lines.push(`- ${t}`));
                        lines.push(``);
                      });
                      lines.push(`---`);
                      lines.push(`> 🌱 **Coach's note:** ${studyPlan.coachingNote}`);
                      navigator.clipboard.writeText(lines.join("\n")).then(() => {
                        setPlanCopied(true);
                        setTimeout(() => setPlanCopied(false), 2000);
                      });
                    }}
                    className="w-full py-2 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-muted transition-colors flex items-center justify-center gap-1.5"
                  >
                    {planCopied ? <><CheckCircle2 size={12} className="text-emerald-500" /> Copied!</> : <><Copy size={12} /> Copy as Markdown</>}
                  </button>
                  {/* Add to Calendar (.ics) */}
                  <button
                    onClick={() => {
                      if (!studyPlan) return;
                      // Build ICS file: one VEVENT per block, starting from now
                      const pad = (n: number) => String(n).padStart(2, "0");
                      const toICSDate = (d: Date) =>
                        `${d.getUTCFullYear()}${pad(d.getUTCMonth()+1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
                      const typeEmoji: Record<string, string> = {
                        coding: "💻", behavioral: "💬", sr_review: "🔄", system_design: "🏗️", break: "☕",
                      };
                      let cursor = new Date();
                      // Round up to next 15-min slot
                      const mins = cursor.getMinutes();
                      const roundedMins = Math.ceil(mins / 15) * 15;
                      cursor.setMinutes(roundedMins, 0, 0);

                      // Colour map: Apple Calendar color hex + Google Calendar color name via CATEGORIES
                      const typeColor: Record<string, { hex: string; gcal: string }> = {
                        coding:        { hex: "#1a73e8", gcal: "Blueberry" },
                        behavioral:    { hex: "#f9ab00", gcal: "Banana" },
                        sr_review:     { hex: "#0f9d58", gcal: "Sage" },
                        system_design: { hex: "#9334e6", gcal: "Grape" },
                        break:         { hex: "#34a853", gcal: "Basil" },
                      };
                      const events: string[] = [];
                      studyPlan.blocks.forEach((block, i) => {
                        const start = new Date(cursor);
                        const end = new Date(cursor.getTime() + block.durationMinutes * 60 * 1000);
                        const emoji = typeEmoji[block.type] ?? "📌";
                        const description = block.tasks.map(t => `• ${t}`).join("\\n");
                        const color = typeColor[block.type];
                        events.push([
                          "BEGIN:VEVENT",
                          `UID:study-plan-${Date.now()}-${i}@meta-guide`,
                          `DTSTART:${toICSDate(start)}`,
                          `DTEND:${toICSDate(end)}`,
                          `SUMMARY:${emoji} ${block.title}`,
                          `DESCRIPTION:${description}\\n\\nPriority: ${block.priority}`,
                          // CATEGORIES drives Google Calendar colour when it matches a known colour name
                          `CATEGORIES:${color?.gcal ?? block.type.toUpperCase()}`,
                          // X-APPLE-CALENDAR-COLOR drives Apple Calendar / Outlook colour
                          ...(color ? [`X-APPLE-CALENDAR-COLOR:${color.hex}`, `COLOR:${color.hex}`] : []),
                          "END:VEVENT",
                        ].join("\r\n"));
                        cursor = end;
                      });

                      const ics = [
                        "BEGIN:VCALENDAR",
                        "VERSION:2.0",
                        "PRODID:-//Meta Interview Guide//Study Planner//EN",
                        "CALSCALE:GREGORIAN",
                        "METHOD:PUBLISH",
                        `X-WR-CALNAME:${studyPlan.headline}`,
                        ...events,
                        "END:VCALENDAR",
                      ].join("\r\n");

                      const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = "study-plan.ics";
                      a.click();
                      URL.revokeObjectURL(url);
                      setPlanIcsDownloaded(true);
                      setTimeout(() => setPlanIcsDownloaded(false), 2500);
                    }}
                    className="w-full py-2 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-muted transition-colors flex items-center justify-center gap-1.5"
                  >
                    {planIcsDownloaded
                      ? <><CheckCircle2 size={12} className="text-emerald-500" /> Downloaded!</>
                      : <><Download size={12} /> Add to Calendar (.ics)</>}
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setStudyPlan(null)}
                      className="flex-1 py-2 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-muted transition-colors"
                    >
                      ↺ Regenerate
                    </button>
                    <button
                      onClick={() => { setStudyPlannerOpen(false); setStudyPlan(null); }}
                      className="flex-1 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors"
                    >
                      Start Session →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Difficulty Estimator Modal ── */}
      {diffEstimatorOpen && pendingAssessmentProblem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">🤔</span>
              <div>
                <div className="text-sm font-bold text-foreground">How hard was it really?</div>
                <div className="text-xs text-muted-foreground truncate max-w-[220px]">{pendingAssessmentProblem.name}</div>
              </div>
              <button onClick={() => setDiffEstimatorOpen(false)} className="ml-auto text-muted-foreground hover:text-foreground">
                <X size={16} />
              </button>
            </div>
            <div className="text-xs text-muted-foreground mb-3">
              Official rating: <span className={`font-bold ${
                pendingAssessmentProblem.difficulty === "Easy" ? "text-emerald-600" :
                pendingAssessmentProblem.difficulty === "Medium" ? "text-amber-600" : "text-red-600"
              }`}>{pendingAssessmentProblem.difficulty}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(["Easy", "Medium", "Hard", "Very Hard"] as const).map(rating => {
                const colors: Record<string, string> = {
                  Easy: "bg-emerald-100 text-emerald-700 border-emerald-300 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400",
                  Medium: "bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400",
                  Hard: "bg-red-100 text-red-700 border-red-300 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400",
                  "Very Hard": "bg-purple-100 text-purple-700 border-purple-300 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-400",
                };
                return (
                  <button
                    key={rating}
                    onClick={() => {
                      const entry: DifficultyAssessment = {
                        problemId: pendingAssessmentProblem.id,
                        problemName: pendingAssessmentProblem.name,
                        officialDifficulty: pendingAssessmentProblem.difficulty,
                        selfRating: rating,
                        date: Date.now(),
                      };
                      const updated = [entry, ...loadAssessments().filter(a => a.problemId !== pendingAssessmentProblem.id)];
                      saveAssessments(updated);
                      setAssessments(updated);
                      setDiffEstimatorOpen(false);
                      setPendingAssessmentProblem(null);
                    }}
                    className={`py-2.5 rounded-xl border-2 text-sm font-bold transition-all ${colors[rating]}`}
                  >
                    {rating}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => { setDiffEstimatorOpen(false); setPendingAssessmentProblem(null); }}
              className="mt-3 w-full text-xs text-muted-foreground hover:text-foreground text-center"
            >
              Skip
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
