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
import {
  Play, Send, Lightbulb, Clock, CheckCircle2, Circle, Star, StarOff,
  Search, X, ChevronLeft, ChevronRight, ExternalLink, RotateCcw,
  Terminal, AlertCircle, Loader2, StickyNote, History, Trophy,
  ChevronDown, ChevronUp, Flame, BookOpen, Zap, Plus, Trash2,
  BarChart2, FlaskConical, GitCommit, TrendingUp, Award
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
function StatsDashboard({ session, progress }: { session: SessionEntry[]; progress: Record<number, { solved: boolean; starred: boolean; notes: string }> }) {
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

  const problem = useMemo(() => CTCI_PROBLEMS.find(p => p.id === selectedId)!, [selectedId]);
  const prog = progress[selectedId] || { solved: false, starred: false, notes: "" };
  const lang = LANGUAGES.find(l => l.id === langId)!;

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
    try {
      const result = await hintMutation.mutateAsync({ problemName: problem.name, currentCode: code, hintLevel });
      const hintStr = typeof result.hint === "string" ? result.hint : String(result.hint);
      setHintText(hintStr);
    } catch { setHintText("Failed to get hint. Please try again."); }
  }, [problem.name, code, hintLevel]);

  const handleReset = useCallback(() => {
    setCode(getBoilerplate(langId, problem));
    localStorage.removeItem(CODE_KEY(selectedId, langId));
  }, [langId, problem, selectedId]);

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
    }
  }, [selectedId, prog.solved, problem, langId, session]);

  const todaySession = useMemo(() => {
    const today = new Date().toDateString();
    return session.filter(e => new Date(e.solvedAt).toDateString() === today);
  }, [session]);

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

            {/* Problem list */}
            <div className="flex-1 overflow-y-auto">
              {filtered.map(p => {
                const pr = progress[p.id];
                const isSelected = p.id === selectedId;
                const diff = DIFFICULTY_COLORS[p.difficulty];
                return (
                  <button
                    key={p.id}
                    onClick={() => { setSelectedId(p.id); setMainView("editor"); }}
                    className={`w-full text-left px-3 py-2 border-b border-border/50 transition-colors flex items-start gap-2 group ${isSelected ? "bg-blue-50 dark:bg-blue-900/20 border-l-2 border-l-blue-500" : "hover:bg-muted/50"}`}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {pr?.solved
                        ? <CheckCircle2 size={12} className="text-emerald-500 fill-current" />
                        : <Circle size={12} className="text-muted-foreground" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <span className={`text-xs font-medium truncate ${isSelected ? "text-blue-700 dark:text-blue-300" : "text-foreground"}`}>{p.name}</span>
                        {pr?.starred && <Star size={9} className="text-yellow-500 fill-current flex-shrink-0" />}
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
          <StatsDashboard session={session} progress={progress} />
        ) : (
          <>
            {/* Toolbar */}
            <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-card flex-shrink-0 flex-wrap">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${diffColors[problem.difficulty]}`}>{problem.difficulty}</span>
                <span className="text-sm font-semibold text-foreground truncate">{problem.name}</span>
                <a href={problem.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-blue-500 flex-shrink-0" title="Open on LeetCode">
                  <ExternalLink size={13} />
                </a>
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
    </div>
  );
}
