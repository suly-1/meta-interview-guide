/**
 * MetaCodingScreenSimulator
 * Simulates a real Meta coding screen interview:
 * - Two coding questions selected in advance
 * - 30-minute countdown timer
 * - Monaco code editor per question with 6-language support
 * - Submit Solution button → Judge0 execution → pass/fail results
 * - Structured note-taking by focus area (Problem Solving, Coding, Verification, Technical Communication)
 * - 6-point Meta scale per dimension: Insufficient / Moderate / Solid / Strong / Exceptional / Can't Assess
 * - AI debrief: validates self-ratings, incorporates Judge0 results for Coding + Verification scoring
 * - Proceed / Do Not Proceed recommendation calibrated to target level (E4/E5/E6/E6+)
 * - Session history persisted in localStorage
 */
import { useState, useEffect, useRef, useCallback } from "react";
import Editor from "@monaco-editor/react";
import { trpc } from "@/lib/trpc";
import { CTCI_PROBLEMS } from "@/lib/ctciProblems";
import { getWeakestPatterns } from "@/hooks/useDrillRatings";
import { PATTERN_TO_CTCI_TOPICS, problemMatchesTopics } from "@/lib/ctciTopicMap";
import {
  Play, Square, RotateCcw, ChevronDown, ChevronUp,
  CheckCircle2, XCircle, Clock, Brain, Code2, ShieldCheck,
  MessageSquare, AlertCircle, Loader2, Trophy, ExternalLink,
  ChevronRight, History, Trash2, Send, Terminal, Sparkles, Copy, Check,
  Users, Swords
} from "lucide-react";
import { Streamdown } from "streamdown";

// ── Language config (mirrors CodePractice) ─────────────────────────────────

const LANGUAGES = [
  { id: 100, name: "Python 3",   monaco: "python",     ext: "py"   },
  { id: 102, name: "JavaScript", monaco: "javascript", ext: "js"   },
  { id: 91,  name: "Java",       monaco: "java",       ext: "java" },
  { id: 105, name: "C++",        monaco: "cpp",        ext: "cpp"  },
  { id: 95,  name: "Go",         monaco: "go",         ext: "go"   },
  { id: 83,  name: "Swift",      monaco: "swift",      ext: "swift"},
] as const;

type LangId = typeof LANGUAGES[number]["id"];

const BOILERPLATE: Record<LangId, string> = {
  100: `# Python 3 — {name} ({difficulty})
# Topics: {topic}
# LeetCode: {url}

from typing import List, Optional

class Solution:
    def solve(self) -> None:
        # Write your solution here
        pass

# ── Test your solution ──
sol = Solution()
# print(sol.solve())
`,
  102: `// JavaScript — {name} ({difficulty})
// Topics: {topic}

/**
 * @return {*}
 */
var solve = function() {
    // Write your solution here
};

// console.log(solve());
`,
  91: `// Java — {name} ({difficulty})
// Topics: {topic}

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
  105: `// C++ — {name} ({difficulty})
// Topics: {topic}

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
  95: `// Go — {name} ({difficulty})
// Topics: {topic}

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
  83: `// Swift — {name} ({difficulty})
// Topics: {topic}

class Solution {
    func solve() {
        // Write your solution here
    }
}

let sol = Solution()
// sol.solve()
`,
};

function getBoilerplate(langId: LangId, p: typeof CTCI_PROBLEMS[0]): string {
  return BOILERPLATE[langId]
    .replace("{name}", p.name)
    .replace("{topic}", p.topic)
    .replace("{difficulty}", p.difficulty)
    .replace("{url}", p.url);
}

// ── Types ──────────────────────────────────────────────────────────────────

type MetaRating = "Insufficient" | "Moderate" | "Solid" | "Strong" | "Exceptional" | "Can't Assess" | "";

interface FocusAreaState {
  rating: MetaRating;
  cantAssessReason: string;
  notes: string;
}

interface ExecutionResult {
  statusId: number;
  statusDescription: string;
  stdout: string;
  stderr: string;
  compileOutput: string;
  time: string | null;
  memory: number | null;
  passed: boolean;
  testCasesPassed?: number;
  testCasesTotal?: number;
  testCaseDetails?: Array<{ label: string; passed: boolean; expected: string; actual: string }>;
}

interface RunHistoryEntry {
  timestamp: number;
  language: string;
  passed: boolean;
  statusDescription: string;
  time: string | null;
  testCasesPassed?: number;
  testCasesTotal?: number;
}

interface QuestionState {
  problemId: number;
  problemName: string;
  difficulty: string;
  url: string;
  topic: string;
  focusAreas: {
    problemSolving: FocusAreaState;
    coding: FocusAreaState;
    verification: FocusAreaState;
    communication: FocusAreaState;
  };
  code: Record<LangId, string>;
  langId: LangId;
  execResult: ExecutionResult | null;
  executing: boolean;
  runHistory: RunHistoryEntry[]; // last 3 submissions
}

interface ScreenSession {
  id: string;
  date: number;
  durationSec: number;
  questions: QuestionState[];
  overallRating: MetaRating | "";
  recommendation: "Proceed" | "Do Not Proceed" | "";
  aiDebrief: string;
  targetLevel: "E4" | "E5" | "E6" | "E6+";
}

// ── E6+ Behavioral Focus Areas ────────────────────────────────────────────

const E6_BEHAVIORAL_AREAS = [
  {
    key: "xfn" as const,
    label: "XFN Collaboration",
    icon: <Users size={13} />,
    color: "text-cyan-600",
    description: "Cross-functional partnership, stakeholder alignment, influencing without authority",
  },
  {
    key: "conflict" as const,
    label: "Scope & Conflict Resolution",
    icon: <Swords size={13} />,
    color: "text-orange-600",
    description: "Navigating ambiguity, resolving technical/team conflicts, setting scope boundaries",
  },
];

// ── Constants ──────────────────────────────────────────────────────────────

const SCREEN_DURATION = 30 * 60;
const STORAGE_KEY = "meta-coding-screen-sessions-v2";

const RATINGS: MetaRating[] = [
  "Insufficient", "Moderate", "Solid", "Strong", "Exceptional", "Can't Assess"
];

const RATING_COLORS: Record<string, string> = {
  "Insufficient": "bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400",
  "Moderate": "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400",
  "Solid": "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400",
  "Strong": "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400",
  "Exceptional": "bg-violet-100 text-violet-700 border-violet-300 dark:bg-violet-900/30 dark:text-violet-400",
  "Can't Assess": "bg-gray-100 text-gray-500 border-gray-300 dark:bg-gray-800 dark:text-gray-400",
};

const FOCUS_AREAS = [
  {
    key: "problemSolving" as const,
    label: "Problem Solving",
    icon: <Brain size={13} />,
    color: "text-blue-600",
    description: "Clarify & refine problem statements, generate solutions, analyze solution quality",
  },
  {
    key: "coding" as const,
    label: "Coding",
    icon: <Code2 size={13} />,
    color: "text-emerald-600",
    description: "Implementation correctness, code organization, quality, maintainability, readability",
  },
  {
    key: "verification" as const,
    label: "Verification & Debugging",
    icon: <ShieldCheck size={13} />,
    color: "text-amber-600",
    description: "Find & fix errors, use test cases, handle edge cases, ensure code meets requirements",
  },
  {
    key: "communication" as const,
    label: "Technical Communication",
    icon: <MessageSquare size={13} />,
    color: "text-violet-600",
    description: "Clarity in explaining reasoning, thoughtful questions, discussing approaches & trade-offs",
  },
];

const DIFF_COLORS: Record<string, string> = {
  Easy: "text-emerald-600 bg-emerald-50 border-emerald-200",
  Medium: "text-amber-600 bg-amber-50 border-amber-200",
  Hard: "text-red-600 bg-red-50 border-red-200",
};

// ── Sub-components ───────────────────────────────────────────────────────

function RunHistoryPanel({ runs }: { runs: RunHistoryEntry[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-4 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors"
      >
        <History size={11} />
        <span className="font-semibold">Previous Runs ({runs.length})</span>
        {open ? <ChevronUp size={11} className="ml-auto" /> : <ChevronDown size={11} className="ml-auto" />}
      </button>
      {open && (
        <div className="px-4 pb-3 space-y-1.5">
          {runs.map((r, i) => (
            <div key={i} className={`flex items-center gap-2 rounded p-1.5 text-[10px] ${r.passed ? "bg-emerald-50 dark:bg-emerald-900/20" : "bg-red-50 dark:bg-red-900/20"}`}>
              {r.passed ? <CheckCircle2 size={10} className="text-emerald-600 shrink-0" /> : <XCircle size={10} className="text-red-600 shrink-0" />}
              <span className="font-mono text-muted-foreground shrink-0">{new Date(r.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
              <span className="font-semibold truncate flex-1">{r.statusDescription}</span>
              <span className="text-muted-foreground shrink-0">{r.language}</span>
              {r.time && <span className="text-muted-foreground shrink-0">{r.time}s</span>}
              {r.testCasesTotal != null && (
                <span className={`shrink-0 font-bold ${r.testCasesPassed === r.testCasesTotal ? "text-emerald-600" : "text-red-600"}`}>
                  {r.testCasesPassed}/{r.testCasesTotal} TC
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

function makeFocusArea(): FocusAreaState {
  return { rating: "", cantAssessReason: "", notes: "" };
}

function makeQuestion(p: typeof CTCI_PROBLEMS[0]): QuestionState {
  const code = {} as Record<LangId, string>;
  for (const l of LANGUAGES) code[l.id] = getBoilerplate(l.id, p);
  return {
    problemId: p.id,
    problemName: p.name,
    difficulty: p.difficulty,
    url: p.url,
    topic: p.topic,
    runHistory: [],
    focusAreas: {
      problemSolving: makeFocusArea(),
      coding: makeFocusArea(),
      verification: makeFocusArea(),
      communication: makeFocusArea(),
    },
    code,
    langId: 100,
    execResult: null,
    executing: false,
  };
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60).toString().padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function loadSessions(): ScreenSession[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
}

function saveSessions(s: ScreenSession[]) {
  // Strip code blobs before saving to keep localStorage lean
  const lean = s.slice(0, 15).map(sess => ({
    ...sess,
    questions: sess.questions.map(q => ({ ...q, code: {} as Record<LangId, string>, executing: false })),
  }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lean));
}

function ratingScore(r: MetaRating): number {
  const map: Partial<Record<MetaRating, number>> = {
    "Insufficient": 1, "Moderate": 2, "Solid": 3, "Strong": 4, "Exceptional": 5, "Can't Assess": 0, "": 0
  };
  return map[r] ?? 0;
}

function overallFromQuestions(qs: QuestionState[]): MetaRating {
  const allRatings: MetaRating[] = [];
  for (const q of qs) {
    for (const fa of Object.values(q.focusAreas)) {
      if (fa.rating && fa.rating !== "Can't Assess") allRatings.push(fa.rating);
    }
  }
  if (!allRatings.length) return "";
  const avg = allRatings.reduce((a, r) => a + ratingScore(r), 0) / allRatings.length;
  if (avg >= 4.5) return "Exceptional";
  if (avg >= 3.5) return "Strong";
  if (avg >= 2.5) return "Solid";
  if (avg >= 1.5) return "Moderate";
  return "Insufficient";
}

function proceedFromOverall(r: MetaRating): "Proceed" | "Do Not Proceed" | "" {
  if (!r) return "";
  if (r === "Insufficient") return "Do Not Proceed";
  return "Proceed";
}

// ── Sub-components ─────────────────────────────────────────────────────────

function RatingButton({ rating, selected, onClick }: { rating: MetaRating; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
        selected
          ? RATING_COLORS[rating] + " ring-2 ring-offset-1 ring-current"
          : "bg-background border-border text-muted-foreground hover:border-current " + (RATING_COLORS[rating] || "")
      }`}
    >
      {rating}
    </button>
  );
}

function FocusAreaPanel({
  area,
  state,
  onChange,
  questionIdx,
}: {
  area: typeof FOCUS_AREAS[0];
  state: FocusAreaState;
  onChange: (updated: FocusAreaState) => void;
  questionIdx: number;
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-2 px-3 py-2.5 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
      >
        <span className={area.color}>{area.icon}</span>
        <span className="text-xs font-semibold text-foreground flex-1">{area.label}</span>
        {state.rating && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${RATING_COLORS[state.rating]}`}>
            {state.rating}
          </span>
        )}
        {expanded ? <ChevronUp size={12} className="text-muted-foreground" /> : <ChevronDown size={12} className="text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="p-3 space-y-3">
          <p className="text-[10px] text-muted-foreground italic">{area.description}</p>

          <div>
            <p className="text-[10px] font-semibold text-muted-foreground mb-1.5 uppercase tracking-widest">Rating</p>
            <div className="flex flex-wrap gap-1.5">
              {RATINGS.map(r => (
                <RatingButton
                  key={r}
                  rating={r}
                  selected={state.rating === r}
                  onClick={() => onChange({ ...state, rating: r })}
                />
              ))}
            </div>
          </div>

          {state.rating === "Can't Assess" && (
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground mb-1 uppercase tracking-widest">Reason</p>
              <input
                type="text"
                value={state.cantAssessReason}
                onChange={e => onChange({ ...state, cantAssessReason: e.target.value })}
                placeholder="e.g. didn't ask questions, limited observations…"
                className="w-full text-xs bg-background border border-border rounded-lg px-3 py-1.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-violet-400"
              />
            </div>
          )}

          <div>
            <p className="text-[10px] font-semibold text-muted-foreground mb-1 uppercase tracking-widest">Interviewer Notes</p>
            <textarea
              value={state.notes}
              onChange={e => onChange({ ...state, notes: e.target.value })}
              placeholder={`Notes on ${area.label.toLowerCase()} signals observed during Q${questionIdx + 1}…`}
              rows={2}
              className="w-full text-xs bg-background border border-border rounded-lg px-3 py-1.5 text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-violet-400"
            />
          </div>
        </div>
      )}
    </div>
  );
}// E6BehavioralPanel — self-contained local state panel for E6+ behavioral areas
function E6BehavioralPanel({
  area,
  questionIdx,
}: {
  area: typeof E6_BEHAVIORAL_AREAS[0];
  questionIdx: number;
}) {
  const [state, setState] = useState<FocusAreaState>({ rating: "", cantAssessReason: "", notes: "" });
  return (
    <FocusAreaPanel
      area={area as unknown as typeof FOCUS_AREAS[0]}
      state={state}
      onChange={setState}
      questionIdx={questionIdx}
    />
  );
}

// ── Main Component ──────────────────────────────────────────────────────────────

export default function MetaCodingScreenSimulator() {
  const [phase, setPhase] = useState<"setup" | "active" | "debrief" | "history">("setup");
  const [targetLevel, setTargetLevel] = useState<"E4" | "E5" | "E6" | "E6+">("E6");
  const [durationMin, setDurationMin] = useState<30 | 35 | 40 | 45>(30);
  const [questions, setQuestions] = useState<QuestionState[]>([]);
  const [activeQ, setActiveQ] = useState(0);
  const [activePanel, setActivePanel] = useState<"editor" | "notes">("editor");
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [aiDebrief, setAiDebrief] = useState("");
  const [debriefLoading, setDebriefLoading] = useState(false);
  const [sessions, setSessions] = useState<ScreenSession[]>(() => loadSessions());
  const [selectedSession, setSelectedSession] = useState<ScreenSession | null>(null);
  const [aiPickLoading, setAiPickLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const generateDebrief = trpc.metaScreenDebrief.useMutation();
  const runCode = trpc.codeExec.run.useMutation();

  // Random pick (Medium + Hard)
  const pickProblems = useCallback(() => {
    const pool = CTCI_PROBLEMS.filter(p => p.difficulty === "Medium" || p.difficulty === "Hard");
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    setQuestions(shuffled.slice(0, 2).map(makeQuestion));
  }, []);

  // AI Pick — calibrated to weakest patterns
  const aiPickProblems = useCallback(async () => {
    setAiPickLoading(true);
    try {
      const weakPatterns = getWeakestPatterns(3);
      const weakTopics = weakPatterns.flatMap(p => PATTERN_TO_CTCI_TOPICS[p.patternId] ?? []);
      // Q1: Medium from weakest topics
      let pool1 = CTCI_PROBLEMS.filter(p => p.difficulty === "Medium" && problemMatchesTopics(p.topic, weakTopics));
      if (!pool1.length) pool1 = CTCI_PROBLEMS.filter(p => p.difficulty === "Medium");
      const q1 = pool1[Math.floor(Math.random() * pool1.length)];
      // Q2: Hard from weakest topics (different problem)
      let pool2 = CTCI_PROBLEMS.filter(p => p.difficulty === "Hard" && problemMatchesTopics(p.topic, weakTopics) && p.id !== q1.id);
      if (!pool2.length) pool2 = CTCI_PROBLEMS.filter(p => p.difficulty === "Hard" && p.id !== q1.id);
      if (!pool2.length) pool2 = CTCI_PROBLEMS.filter(p => p.id !== q1.id);
      const q2 = pool2[Math.floor(Math.random() * pool2.length)];
      setQuestions([makeQuestion(q1), makeQuestion(q2)]);
    } finally {
      setAiPickLoading(false);
    }
  }, []);

  // Copy shareable debrief summary to clipboard
  const copyDebrief = useCallback(() => {
    const overall = overallFromQuestions(questions);
    const recommendation = proceedFromOverall(overall);
    const lines: string[] = [
      `Meta Coding Screen Simulation — ${new Date().toLocaleDateString()}`,
      `Target Level: ${targetLevel}  |  Recommendation: ${recommendation || "Pending"}  |  Overall: ${overall || "—"}`,
      "",
      ...questions.map((q, i) => {
        const ratings = FOCUS_AREAS.map(fa => {
          const s = q.focusAreas[fa.key];
          return `  ${fa.label}: ${s.rating || "—"}${s.notes ? ` (${s.notes.slice(0, 80)})` : ""}`;
        }).join("\n");
        const exec = q.execResult ? `  Code: ${q.execResult.statusDescription}` : "  Code: Not submitted";
        return `Q${i + 1}: ${q.problemName} (${q.difficulty})\n${exec}\n${ratings}`;
      }),
      "",
      "── AI Coaching Notes ──",
      aiDebrief.replace(/[#*`]/g, "").trim(),
    ];
    const text = lines.join("\n");
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }, [questions, targetLevel, aiDebrief]);

  // Timer
  useEffect(() => {
    if (running) {
      timerRef.current = setInterval(() => {
        setElapsed(e => {
          if (e >= durationMin * 60 - 1) { setRunning(false); return durationMin * 60; }
          return e + 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [running]);

  const screenDuration = durationMin * 60;
  const timeLeft = screenDuration - elapsed;
  const urgent = timeLeft < 5 * 60;
  const pct = (elapsed / screenDuration) * 100;

  const updateFocusArea = (qIdx: number, areaKey: keyof QuestionState["focusAreas"], updated: FocusAreaState) => {
    setQuestions(prev => prev.map((q, i) =>
      i === qIdx ? { ...q, focusAreas: { ...q.focusAreas, [areaKey]: updated } } : q
    ));
  };

  const updateCode = (qIdx: number, code: string) => {
    setQuestions(prev => prev.map((q, i) =>
      i === qIdx ? { ...q, code: { ...q.code, [q.langId]: code } } : q
    ));
  };

  const updateLang = (qIdx: number, langId: LangId) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i !== qIdx) return q;
      const existing = q.code[langId];
      const code = existing || getBoilerplate(langId, { id: q.problemId, name: q.problemName, difficulty: q.difficulty as "Easy" | "Medium" | "Hard", url: q.url, topic: q.topic });
      return { ...q, langId, code: { ...q.code, [langId]: code } };
    }));
  };

  const handleSubmit = async (qIdx: number) => {
    const q = questions[qIdx];
    if (!q) return;
    setQuestions(prev => prev.map((item, i) => i === qIdx ? { ...item, executing: true, execResult: null } : item));

    const { getTestCasesForProblem } = await import("@/lib/ctciTestCases");
    const testCases = getTestCasesForProblem(q.problemId);
    const sourceCode = q.code[q.langId] || getBoilerplate(q.langId, { id: q.problemId, name: q.problemName, difficulty: q.difficulty as "Easy" | "Medium" | "Hard", url: q.url, topic: q.topic });
    const langName = LANGUAGES.find(l => l.id === q.langId)?.name ?? "Unknown";

    try {
      if (testCases.length > 0) {
        // Run each test case sequentially and collect results
        const caseResults: Array<{ label: string; passed: boolean; expected: string; actual: string }> = [];
        let lastResult: Awaited<ReturnType<typeof runCode.mutateAsync>> | null = null;

        for (const tc of testCases) {
          const res = await runCode.mutateAsync({
            sourceCode,
            languageId: q.langId,
            stdin: tc.stdin,
          });
          lastResult = res;
          const actual = (res.stdout ?? "").trim();
          const expected = tc.expectedOutput.trim();
          const tcPassed = res.statusId === 3 && actual === expected;
          caseResults.push({ label: tc.label, passed: tcPassed, expected, actual });
          // Stop on compile error — all subsequent cases will also fail
          if (res.compileOutput || res.statusId === 6) break;
        }

        const passedCount = caseResults.filter(r => r.passed).length;
        const allPassed = passedCount === caseResults.length;
        const execResult: ExecutionResult = {
          statusId: lastResult?.statusId ?? 0,
          statusDescription: allPassed ? "Accepted" : `${passedCount}/${caseResults.length} test cases passed`,
          stdout: lastResult?.stdout ?? "",
          stderr: lastResult?.stderr ?? "",
          compileOutput: lastResult?.compileOutput ?? "",
          time: lastResult?.time ?? null,
          memory: lastResult?.memory ?? null,
          passed: allPassed,
          testCasesPassed: passedCount,
          testCasesTotal: caseResults.length,
          testCaseDetails: caseResults,
        };

        const historyEntry: RunHistoryEntry = {
          timestamp: Date.now(),
          language: langName,
          passed: allPassed,
          statusDescription: execResult.statusDescription,
          time: execResult.time,
          testCasesPassed: passedCount,
          testCasesTotal: caseResults.length,
        };

        setQuestions(prev => prev.map((item, i) =>
          i === qIdx ? {
            ...item,
            executing: false,
            execResult,
            runHistory: [historyEntry, ...item.runHistory].slice(0, 3),
          } : item
        ));
      } else {
        // No test cases defined — run with empty stdin as before
        const result = await runCode.mutateAsync({
          sourceCode,
          languageId: q.langId,
          stdin: "",
        });
        const passed = result.statusId === 3 || (result.statusId !== 6 && result.statusId !== 5 && !result.stderr && !result.compileOutput);
        const historyEntry: RunHistoryEntry = {
          timestamp: Date.now(),
          language: langName,
          passed,
          statusDescription: result.statusDescription,
          time: result.time,
        };
        setQuestions(prev => prev.map((item, i) =>
          i === qIdx ? {
            ...item,
            executing: false,
            execResult: { ...result, passed },
            runHistory: [historyEntry, ...item.runHistory].slice(0, 3),
          } : item
        ));
      }
    } catch {
      setQuestions(prev => prev.map((item, i) =>
        i === qIdx ? { ...item, executing: false, execResult: { statusId: 0, statusDescription: "Error", stdout: "", stderr: "Execution failed. Check your code.", compileOutput: "", time: null, memory: null, passed: false } } : item
      ));
    }
  };

  const handleFinish = async () => {
    setRunning(false);
    setPhase("debrief");
    setDebriefLoading(true);

    const overall = overallFromQuestions(questions);
    const recommendation = proceedFromOverall(overall);

    // Build structured summary for AI — include execution results
    const summary = questions.map((q, i) => {
      const fas = Object.entries(q.focusAreas).map(([k, v]) => {
        const label = FOCUS_AREAS.find(f => f.key === k)?.label ?? k;
        return `  ${label}: ${v.rating || "Not rated"}${v.cantAssessReason ? ` (${v.cantAssessReason})` : ""}${v.notes ? ` — Notes: ${v.notes}` : ""}`;
      }).join("\n");
      const langName = LANGUAGES.find(l => l.id === q.langId)?.name ?? "Unknown";
      const exec = q.execResult
        ? `  Execution: ${q.execResult.statusDescription} (${q.execResult.passed ? "PASSED" : "FAILED"})${q.execResult.time ? ` in ${q.execResult.time}s` : ""}${q.execResult.stderr ? ` — Stderr: ${q.execResult.stderr.slice(0, 200)}` : ""}${q.execResult.compileOutput ? ` — Compile: ${q.execResult.compileOutput.slice(0, 200)}` : ""}`
        : "  Execution: Not submitted";
      return `Question ${i + 1}: ${q.problemName} (${q.difficulty})\n  Language: ${langName}\n${exec}\n${fas}`;
    }).join("\n\n");

    // Build test results summary for the procedure
    const testResults = questions.map((q, i) => ({
      questionIndex: i + 1,
      problemName: q.problemName,
      difficulty: q.difficulty,
      language: LANGUAGES.find(l => l.id === q.langId)?.name ?? "Unknown",
      submitted: !!q.execResult,
      passed: q.execResult?.passed ?? false,
      statusDescription: q.execResult?.statusDescription ?? "Not submitted",
      executionTime: q.execResult?.time ?? null,
      hasCompileError: !!(q.execResult?.compileOutput),
      hasRuntimeError: !!(q.execResult?.stderr),
    }));

    try {
      const result = await generateDebrief.mutateAsync({
        summary,
        targetLevel,
        overallRating: overall,
        recommendation,
        testResults: JSON.stringify(testResults),
      });
      setAiDebrief(result.debrief);

      const session: ScreenSession = {
        id: Date.now().toString(),
        date: Date.now(),
        durationSec: elapsed,
        questions,
        overallRating: overall,
        recommendation,
        aiDebrief: result.debrief,
        targetLevel,
      };
      const updated = [session, ...sessions];
      setSessions(updated);
      saveSessions(updated);
    } catch {
      setAiDebrief("AI debrief unavailable. Review your notes and execution results above.");
    } finally {
      setDebriefLoading(false);
    }
  };

  const handleReset = () => {
    setPhase("setup");
    setQuestions([]);
    setElapsed(0);
    setRunning(false);
    setAiDebrief("");
    setActiveQ(0);
    setActivePanel("editor");
  };

  // ── Setup ──────────────────────────────────────────────────────────────

  if (phase === "setup") {
    return (
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-indigo-900 to-indigo-700">
          <div className="flex items-center gap-2">
            <Code2 size={16} className="text-indigo-200" />
            <span className="text-sm font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Meta Coding Screen Simulator
            </span>
          </div>
          <button onClick={() => setPhase("history")} className="flex items-center gap-1.5 text-xs text-indigo-200 hover:text-white transition-colors">
            <History size={13} /> {sessions.length} sessions
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Interview structure explainer */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-400 dark:border-amber-600 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-base">⏰</span>
              <p className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wide">Real Interview Timing — Read This First</p>
            </div>
            <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
              A real Meta coding screen is <strong>45 minutes total</strong>, but the first ~15 minutes are spent on:
            </p>
            <ul className="text-xs text-amber-700 dark:text-amber-400 space-y-1 list-disc list-inside">
              <li>Interviewer introduction and rapport building (~5 min)</li>
              <li>Problem explanation and setup (~5 min)</li>
              <li><strong>Your clarification questions</strong> — you must ask these! (~5 min)</li>
            </ul>
            <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed mt-1">
              That leaves you <strong>~30 minutes to actually code and solve the problem</strong>. We strongly recommend practising at <strong>30 minutes</strong> to build the right muscle memory for the real screen.
            </p>
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700 rounded-xl p-4 space-y-2">
            <p className="text-xs font-semibold text-indigo-800 dark:text-indigo-300">How it works</p>
            <ul className="text-xs text-indigo-700 dark:text-indigo-400 space-y-1 list-disc list-inside">
              <li>Two coding questions auto-selected (Medium + Hard)</li>
              <li>Countdown timer — choose your practice duration below</li>
              <li>Write code in the built-in editor (Python, JS, Java, C++, Go, Swift)</li>
              <li><strong>Submit Solution</strong> → Judge0 executes your code and returns pass/fail</li>
              <li>Take structured notes per focus area as you code</li>
              <li>AI debrief uses your code execution results to score Coding &amp; Verification accurately</li>
            </ul>
          </div>

          {/* Duration selector */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <p className="text-xs font-semibold text-foreground">Practice Duration</p>
              <span className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-300">⭐ 30 min recommended</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {([30, 35, 40, 45] as const).map(d => (
                <button
                  key={d}
                  onClick={() => setDurationMin(d)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all relative ${
                    durationMin === d
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-background border-border text-muted-foreground hover:border-indigo-400"
                  }`}
                >
                  {d} min
                  {d === 30 && <span className="absolute -top-1.5 -right-1.5 text-[8px] bg-emerald-500 text-white rounded-full px-1 font-bold leading-4">✓</span>}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5">
              {durationMin === 30 && "✅ Matches real coding time after intro — best for realistic practice"}
              {durationMin === 35 && "Slightly more buffer — good for building confidence"}
              {durationMin === 40 && "Extended practice — useful for learning new patterns"}
              {durationMin === 45 && "Full interview length — includes intro time; not realistic for coding-only practice"}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold text-foreground mb-2">Target Level</p>
            <div className="flex gap-2 flex-wrap">
              {(["E4", "E5", "E6", "E6+"] as const).map(l => (
                <button
                  key={l}
                  onClick={() => setTargetLevel(l)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                    targetLevel === l
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-background border-border text-muted-foreground hover:border-indigo-400"
                  }`}
                >
                  {l === "E6+" ? "E6+ (Senior Staff)" : l === "E6" ? "E6 (Staff)" : l === "E5" ? "E5 (Senior)" : "E4 (SWE)"}
                </button>
              ))}
            </div>
            {(targetLevel === "E6" || targetLevel === "E6+") && (
              <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1.5 flex items-center gap-1">
                <AlertCircle size={10} /> Senior screens may also assess XFN Collaboration and Scope & Conflict Resolution.
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => { pickProblems(); setPhase("active"); setRunning(true); }}
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
            >
              <Play size={14} /> Start — {durationMin} min ({targetLevel})
            </button>
            <button
              onClick={async () => { await aiPickProblems(); setPhase("active"); setRunning(true); }}
              disabled={aiPickLoading}
              title="AI picks 2 problems calibrated to your weakest patterns"
              className="px-4 py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
            >
              {aiPickLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              AI Pick
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground text-center">
            <strong>AI Pick</strong> selects problems calibrated to your 3 weakest patterns from the Weakness Heatmap.
          </p>
        </div>
      </div>
    );
  }

  // ── History ────────────────────────────────────────────────────────────

  if (phase === "history") {
    if (selectedSession) {
      return (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-indigo-900 to-indigo-700">
            <button onClick={() => setSelectedSession(null)} className="text-indigo-200 hover:text-white text-xs">← Back</button>
            <span className="text-sm font-bold text-white">{new Date(selectedSession.date).toLocaleDateString()} — {selectedSession.targetLevel}</span>
            <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${selectedSession.recommendation === "Proceed" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`}>
              {selectedSession.recommendation}
            </span>
          </div>
          <div className="p-5 space-y-4 max-h-[600px] overflow-y-auto">
            {selectedSession.questions.map((q, i) => (
              <div key={i} className="border border-border rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-foreground">Q{i + 1}: {q.problemName}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${DIFF_COLORS[q.difficulty]}`}>{q.difficulty}</span>
                  {q.execResult && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-auto ${q.execResult.passed ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                      {q.execResult.passed ? "✓ Passed" : "✗ Failed"}
                    </span>
                  )}
                </div>
                {FOCUS_AREAS.map(fa => {
                  const state = q.focusAreas[fa.key];
                  return (
                    <div key={fa.key} className="flex items-center gap-2 text-xs">
                      <span className={fa.color}>{fa.icon}</span>
                      <span className="text-muted-foreground w-32 shrink-0">{fa.label}</span>
                      {state.rating ? (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${RATING_COLORS[state.rating]}`}>{state.rating}</span>
                      ) : <span className="text-muted-foreground text-[10px]">Not rated</span>}
                    </div>
                  );
                })}
              </div>
            ))}
            {selectedSession.aiDebrief && (
              <div className="border border-indigo-200 dark:border-indigo-700 rounded-xl p-4 bg-indigo-50 dark:bg-indigo-900/20">
                <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 mb-2">AI Debrief</p>
                <div className="text-xs text-foreground prose prose-sm max-w-none">
                  <Streamdown>{selectedSession.aiDebrief}</Streamdown>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-indigo-900 to-indigo-700">
          <span className="text-sm font-bold text-white">Screen Session History</span>
          <button onClick={() => setPhase("setup")} className="text-xs text-indigo-200 hover:text-white">← Back</button>
        </div>
        <div className="p-4 space-y-2 max-h-[500px] overflow-y-auto">
          {sessions.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-8">No sessions yet. Complete a coding screen to see history.</p>
          )}
          {sessions.map(s => (
            <button key={s.id} onClick={() => setSelectedSession(s)}
              className="w-full flex items-center gap-3 p-3 border border-border rounded-xl hover:bg-muted/40 transition-colors text-left"
            >
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-foreground">{new Date(s.date).toLocaleDateString()} — {s.targetLevel}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  {s.questions.map(q => q.problemName).join(" · ")} · {formatTime(s.durationSec)}
                </div>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${s.recommendation === "Proceed" ? "bg-emerald-100 text-emerald-700 border border-emerald-300" : "bg-red-100 text-red-700 border border-red-300"}`}>
                {s.recommendation || "—"}
              </span>
              {s.overallRating && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${RATING_COLORS[s.overallRating]}`}>
                  {s.overallRating}
                </span>
              )}
              <ChevronRight size={12} className="text-muted-foreground shrink-0" />
            </button>
          ))}
          {sessions.length > 0 && (
            <button onClick={() => { setSessions([]); saveSessions([]); }}
              className="w-full text-[10px] text-muted-foreground hover:text-red-500 flex items-center justify-center gap-1 py-2 transition-colors"
            >
              <Trash2 size={10} /> Clear all history
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Active ─────────────────────────────────────────────────────────────

  if (phase === "active") {
    const q = questions[activeQ];
    if (!q) return null;
    const lang = LANGUAGES.find(l => l.id === q.langId)!;

    return (
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        {/* Header */}
        <div className={`flex items-center justify-between px-4 py-3 ${urgent ? "bg-gradient-to-r from-red-800 to-red-600" : "bg-gradient-to-r from-indigo-900 to-indigo-700"}`}>
          <div className="flex items-center gap-2">
            <Code2 size={14} className="text-white/80" />
            <span className="text-xs font-bold text-white">Meta Coding Screen — {targetLevel}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-1.5 text-sm font-extrabold tabular-nums ${urgent ? "text-red-200 animate-pulse" : "text-white"}`}>
              <Clock size={13} />{formatTime(timeLeft)}
            </div>
            {running
              ? <button onClick={() => setRunning(false)} className="text-white/70 hover:text-white p-1"><Square size={13} /></button>
              : <button onClick={() => setRunning(true)} className="text-white/70 hover:text-white p-1"><Play size={13} /></button>
            }
          </div>
        </div>

        {/* Timer bar */}
        <div className="h-1 bg-indigo-900/30">
          <div className={`h-full transition-all ${urgent ? "bg-red-500" : "bg-indigo-400"}`} style={{ width: `${100 - pct}%` }} />
        </div>

        {/* Question tabs */}
        <div className="flex border-b border-border bg-muted/20">
          {questions.map((q2, i) => (
            <button key={i} onClick={() => setActiveQ(i)}
              className={`flex-1 px-4 py-2.5 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${activeQ === i ? "border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-background" : "text-muted-foreground hover:text-foreground"}`}
            >
              Q{i + 1}: {q2.problemName.length > 18 ? q2.problemName.slice(0, 18) + "…" : q2.problemName}
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${DIFF_COLORS[q2.difficulty]}`}>{q2.difficulty}</span>
              {q2.execResult && (
                <span className={`w-2 h-2 rounded-full ${q2.execResult.passed ? "bg-emerald-500" : "bg-red-500"}`} title={q2.execResult.passed ? "Passed" : "Failed"} />
              )}
            </button>
          ))}
        </div>

        {/* Panel toggle */}
        <div className="flex border-b border-border bg-muted/10">
          <button onClick={() => setActivePanel("editor")}
            className={`flex-1 py-2 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${activePanel === "editor" ? "text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-500 bg-background" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Terminal size={11} /> Code Editor
          </button>
          <button onClick={() => setActivePanel("notes")}
            className={`flex-1 py-2 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${activePanel === "notes" ? "text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-500 bg-background" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Brain size={11} /> Focus Area Notes
          </button>
        </div>

        {/* Problem link bar */}
        <div className="flex items-center gap-2 px-4 py-2 bg-muted/20 border-b border-border">
          <span className="text-xs font-semibold text-foreground truncate flex-1">{q.problemName}</span>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border shrink-0 ${DIFF_COLORS[q.difficulty]}`}>{q.difficulty}</span>
          <a href={q.url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-[10px] text-indigo-600 hover:text-indigo-800 shrink-0"
          >
            <ExternalLink size={10} /> LeetCode
          </a>
        </div>

        {/* Editor panel */}
        {activePanel === "editor" && (
          <div className="flex flex-col">
            {/* Language selector + Submit */}
            <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-muted/10">
              <select
                value={q.langId}
                onChange={e => updateLang(activeQ, Number(e.target.value) as LangId)}
                className="text-xs bg-background border border-border rounded-lg px-2 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {LANGUAGES.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>

              <button
                onClick={() => handleSubmit(activeQ)}
                disabled={q.executing}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors ml-auto"
              >
                {q.executing ? <Loader2 size={11} className="animate-spin" /> : <Send size={11} />}
                {q.executing ? "Running…" : "Submit Solution"}
              </button>
            </div>

            {/* Monaco editor */}
            <div className="h-64 border-b border-border">
              <Editor
                height="100%"
                language={lang.monaco}
                value={q.code[q.langId] || getBoilerplate(q.langId, { id: q.problemId, name: q.problemName, difficulty: q.difficulty as "Easy" | "Medium" | "Hard", url: q.url, topic: q.topic })}
                onChange={v => updateCode(activeQ, v ?? "")}
                theme="vs-dark"
                options={{
                  fontSize: 12,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  lineNumbers: "on",
                  wordWrap: "on",
                  tabSize: 4,
                  padding: { top: 8 },
                }}
              />
            </div>

            {/* Execution result */}
            {q.execResult && (
              <div className={`px-4 py-3 border-b border-border text-xs ${q.execResult.passed ? "bg-emerald-50 dark:bg-emerald-900/20" : "bg-red-50 dark:bg-red-900/20"}`}>
                <div className="flex items-center gap-2 mb-1">
                  {q.execResult.passed
                    ? <CheckCircle2 size={13} className="text-emerald-600" />
                    : <XCircle size={13} className="text-red-600" />
                  }
                  <span className={`font-bold ${q.execResult.passed ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"}`}>
                    {q.execResult.statusDescription}
                  </span>
                  {q.execResult.time && <span className="text-muted-foreground ml-auto">{q.execResult.time}s</span>}
                  {q.execResult.memory && <span className="text-muted-foreground">{Math.round(q.execResult.memory / 1024)}KB</span>}
                </div>
                {/* Per-test-case breakdown */}
                {q.execResult.testCaseDetails && q.execResult.testCaseDetails.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {q.execResult.testCaseDetails.map((tc, i) => (
                      <div key={i} className={`flex items-start gap-2 rounded p-1.5 ${tc.passed ? "bg-emerald-100/60 dark:bg-emerald-900/30" : "bg-red-100/60 dark:bg-red-900/30"}`}>
                        {tc.passed ? <CheckCircle2 size={11} className="text-emerald-600 mt-0.5 shrink-0" /> : <XCircle size={11} className="text-red-600 mt-0.5 shrink-0" />}
                        <div className="min-w-0">
                          <p className="font-semibold text-[10px] truncate">{tc.label}</p>
                          {!tc.passed && (
                            <p className="text-[10px] text-muted-foreground">
                              Expected: <code className="font-mono">{tc.expected.slice(0, 40)}</code>
                              {" | "}Got: <code className="font-mono">{tc.actual.slice(0, 40) || "(empty)"}</code>
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {q.execResult.stdout && !q.execResult.testCaseDetails?.length && (
                  <pre className="text-[10px] font-mono text-foreground bg-background/60 rounded p-2 mt-1 max-h-24 overflow-y-auto whitespace-pre-wrap">{q.execResult.stdout}</pre>
                )}
                {(q.execResult.stderr || q.execResult.compileOutput) && (
                  <pre className="text-[10px] font-mono text-red-600 dark:text-red-400 bg-background/60 rounded p-2 mt-1 max-h-24 overflow-y-auto whitespace-pre-wrap">
                    {q.execResult.compileOutput || q.execResult.stderr}
                  </pre>
                )}
              </div>
            )}

            {/* Previous Runs — collapsible history of last 3 submissions */}
            {q.runHistory.length > 0 && (
              <RunHistoryPanel runs={q.runHistory} />
            )}
          </div>
        )}

        {/* Notes panel */}
        {activePanel === "notes" && (
          <div className="p-4 space-y-2 max-h-[500px] overflow-y-auto">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Focus Area Assessment — Q{activeQ + 1}</p>
            {FOCUS_AREAS.map(fa => (
              <FocusAreaPanel
                key={fa.key}
                area={fa}
                state={q.focusAreas[fa.key]}
                onChange={updated => updateFocusArea(activeQ, fa.key, updated)}
                questionIdx={activeQ}
              />
            ))}
            {/* E6+ Behavioral Focus Areas */}
            {(targetLevel === "E6" || targetLevel === "E6+") && (
              <>
                <div className="flex items-center gap-2 pt-2">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest whitespace-nowrap">E6+ Senior Focus Areas</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                {E6_BEHAVIORAL_AREAS.map(fa => {
                  // E6+ behavioral areas use a separate state bucket stored in a local map
                  // We reuse FocusAreaPanel with a local state to avoid polluting QuestionState
                  return (
                    <E6BehavioralPanel
                      key={fa.key}
                      area={fa}
                      questionIdx={activeQ}
                    />
                  );
                })}
              </>
            )}
          </div>
        )}

        {/* Finish button */}
        <div className="flex gap-2 p-4 border-t border-border">
          <button
            onClick={handleFinish}
            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
          >
            <CheckCircle2 size={14} /> Finish Screen & Get AI Debrief
          </button>
          <button onClick={handleReset} className="px-4 py-2.5 border border-border rounded-xl text-xs text-muted-foreground hover:text-foreground transition-colors">
            <RotateCcw size={13} />
          </button>
        </div>
      </div>
    );
  }

  // ── Debrief ────────────────────────────────────────────────────────────

  const overall = overallFromQuestions(questions);
  const recommendation = proceedFromOverall(overall);

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
      <div className={`flex items-center justify-between px-5 py-4 ${recommendation === "Proceed" ? "bg-gradient-to-r from-emerald-800 to-emerald-600" : recommendation === "Do Not Proceed" ? "bg-gradient-to-r from-red-800 to-red-600" : "bg-gradient-to-r from-indigo-900 to-indigo-700"}`}>
        <div className="flex items-center gap-2">
          {recommendation === "Proceed" ? <CheckCircle2 size={16} className="text-white" /> : recommendation === "Do Not Proceed" ? <XCircle size={16} className="text-white" /> : <Trophy size={16} className="text-white" />}
          <span className="text-sm font-bold text-white">
            {recommendation === "Proceed" ? "✓ Proceed to Full Loop" : recommendation === "Do Not Proceed" ? "✗ Do Not Proceed" : "Screen Complete"}
          </span>
        </div>
        {overall && (
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${RATING_COLORS[overall]}`}>
            Overall: {overall}
          </span>
        )}
      </div>

      <div className="p-5 space-y-5 max-h-[700px] overflow-y-auto">
        {/* Per-question summary */}
        {questions.map((q, i) => (
          <div key={i} className="border border-border rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-foreground">Q{i + 1}: {q.problemName}</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${DIFF_COLORS[q.difficulty]}`}>{q.difficulty}</span>
              {q.execResult && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ml-auto ${q.execResult.passed ? "bg-emerald-100 text-emerald-700 border border-emerald-300" : "bg-red-100 text-red-700 border border-red-300"}`}>
                  {q.execResult.passed ? "✓ Code Passed" : "✗ Code Failed"} — {q.execResult.statusDescription}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {FOCUS_AREAS.map(fa => {
                const state = q.focusAreas[fa.key];
                return (
                  <div key={fa.key} className="flex items-center gap-1.5">
                    <span className={fa.color}>{fa.icon}</span>
                    <span className="text-[10px] text-muted-foreground flex-1 truncate">{fa.label}</span>
                    {state.rating
                      ? <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${RATING_COLORS[state.rating]}`}>{state.rating}</span>
                      : <span className="text-[10px] text-muted-foreground">—</span>
                    }
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* AI Debrief */}
        <div className="border border-indigo-200 dark:border-indigo-700 rounded-xl p-4 bg-indigo-50 dark:bg-indigo-900/20">
          <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-3">AI Debrief & Coaching Notes</p>
          {debriefLoading ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground py-4">
              <Loader2 size={14} className="animate-spin" /> Analyzing execution results and generating debrief…
            </div>
          ) : (
            <div className="text-xs text-foreground prose prose-sm max-w-none">
              <Streamdown>{aiDebrief}</Streamdown>
            </div>
          )}
        </div>

        <div className="flex gap-2 flex-wrap">
          <button onClick={handleReset}
            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
          >
            <RotateCcw size={13} /> New Screen
          </button>
          <button
            onClick={copyDebrief}
            disabled={!aiDebrief || debriefLoading}
            className="px-4 py-2.5 border border-border rounded-xl text-xs text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors flex items-center gap-1.5"
            title="Copy shareable debrief summary to clipboard"
          >
            {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
            {copied ? "Copied!" : "Copy Summary"}
          </button>
          <button onClick={() => setPhase("history")}
            className="px-4 py-2.5 border border-border rounded-xl text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
          >
            <History size={13} /> History
          </button>
        </div>
      </div>
    </div>
  );
}
