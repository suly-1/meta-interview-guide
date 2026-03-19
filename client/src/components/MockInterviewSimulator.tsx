/**
 * MockInterviewSimulator — Full 45-min interview loop
 *
 * Phases:
 *   1. Setup    — pick IC level, preview session structure
 *   2. Coding   — 25 min countdown, random CTCI problem from weakest topics
 *   3. Behavioral 1 — 10 min countdown, random behavioral question
 *   4. Behavioral 2 — 10 min countdown, random behavioral question
 *   5. Debrief  — LLM post-session IC-level assessment
 */
import { useState, useEffect, useCallback, useRef } from "react";
import {
  Play, Square, ChevronRight, ExternalLink, CheckCircle2, XCircle,
  Brain, MessageSquare, Code2, Trophy, RotateCcw, Loader2, AlertCircle,
  Star, TrendingUp, TrendingDown, Target, Clock,
} from "lucide-react";
import { CTCI_PROBLEMS } from "@/lib/ctciProblems";
import { BEHAVIORAL_FOCUS_AREAS, IC7_BEHAVIORAL_FOCUS_AREAS } from "@/lib/guideData";
import { useCTCIProgress } from "@/hooks/useCTCIProgress";
import { getWeakestPatterns } from "@/hooks/useDrillRatings";
import { PATTERN_TO_CTCI_TOPICS, problemMatchesTopics } from "@/lib/ctciTopicMap";
import { trpc } from "@/lib/trpc";

// ─── Types ───────────────────────────────────────────────────────────────────

type Phase = "setup" | "coding" | "behavioral1" | "behavioral2" | "debrief";
type ICLevel = "IC6" | "IC7" | "IC7_PRINCIPAL";

interface BehavioralQuestion {
  question: string;
  focusArea: string;
}

interface SessionState {
  targetLevel: ICLevel;
  codingProblem: typeof CTCI_PROBLEMS[0] | null;
  codingSolved: boolean | null;
  codingDurationSec: number;
  codingNotes: string;
  behavioralQuestions: BehavioralQuestion[];
  behavioralAnswers: string[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60).toString().padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

const PHASE_DURATIONS: Record<Exclude<Phase, "setup" | "debrief">, number> = {
  coding: 30 * 60,
  behavioral1: 10 * 60,
  behavioral2: 10 * 60,
};

const PHASE_LABELS: Record<Phase, string> = {
  setup: "Setup",
  coding: "Coding Round",
  behavioral1: "Behavioral Round 1",
  behavioral2: "Behavioral Round 2",
  debrief: "Debrief",
};

const PHASE_ORDER: Phase[] = ["setup", "coding", "behavioral1", "behavioral2", "debrief"];

const VERDICT_STYLES: Record<string, { bg: string; text: string; border: string; icon: React.ReactNode }> = {
  "Strong Hire": { bg: "bg-emerald-50", text: "text-emerald-800", border: "border-emerald-300", icon: <Trophy size={20} className="text-emerald-600" /> },
  "Hire":        { bg: "bg-blue-50",    text: "text-blue-800",    border: "border-blue-300",    icon: <CheckCircle2 size={20} className="text-blue-600" /> },
  "Borderline":  { bg: "bg-amber-50",   text: "text-amber-800",   border: "border-amber-300",   icon: <AlertCircle size={20} className="text-amber-600" /> },
  "No Hire":     { bg: "bg-red-50",     text: "text-red-800",     border: "border-red-300",     icon: <XCircle size={20} className="text-red-600" /> },
};

function pickCodingProblem(progress: Record<number, { solved?: boolean }>): typeof CTCI_PROBLEMS[0] {
  const weakPatterns = getWeakestPatterns(3);
  const weakTopics = weakPatterns.flatMap(p => PATTERN_TO_CTCI_TOPICS[p.patternId] ?? []);
  // Prefer medium difficulty unsolved problems from weak topics
  let pool = CTCI_PROBLEMS.filter(
    p => !progress[p.id]?.solved && p.difficulty === "Medium" && problemMatchesTopics(p.topic, weakTopics)
  );
  if (pool.length === 0) pool = CTCI_PROBLEMS.filter(p => !progress[p.id]?.solved && p.difficulty === "Medium");
  if (pool.length === 0) pool = CTCI_PROBLEMS.filter(p => !progress[p.id]?.solved);
  if (pool.length === 0) pool = CTCI_PROBLEMS;
  return pool[Math.floor(Math.random() * pool.length)];
}

function pickBehavioralQuestions(level: ICLevel = "IC6"): BehavioralQuestion[] {
  const pool = level === "IC7_PRINCIPAL" ? IC7_BEHAVIORAL_FOCUS_AREAS : BEHAVIORAL_FOCUS_AREAS;
  const allAreas = pool.filter(a => a.questions && a.questions.length > 0);
  // Shuffle and pick 2 from different focus areas
  const shuffled = [...allAreas].sort(() => Math.random() - 0.5);
  const picked: BehavioralQuestion[] = [];
  for (const area of shuffled) {
    if (picked.length >= 2) break;
    const q = area.questions[Math.floor(Math.random() * area.questions.length)];
    picked.push({ question: q.question, focusArea: area.title });
  }
  return picked;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function PhaseProgress({ phase, isPrincipal }: { phase: Phase; isPrincipal?: boolean }) {
  const order = isPrincipal ? (["setup", "behavioral1", "behavioral2", "debrief"] as Phase[]) : PHASE_ORDER;
  const currentIdx = order.indexOf(phase);
  return (
    <div className="flex items-center gap-1 mb-6">
      {order.map((p, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        return (
          <div key={p} className="flex items-center gap-1">
            <div className={`flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold transition-all ${
              done ? "bg-emerald-500 text-white" : active ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"
            }`}>
              {done ? "✓" : i + 1}
            </div>
            <span className={`text-[11px] font-medium hidden sm:inline ${active ? "text-blue-700" : done ? "text-emerald-600" : "text-gray-400"}`}>
              {PHASE_LABELS[p]}
            </span>
            {i < order.length - 1 && (
              <div className={`w-6 h-0.5 rounded-full mx-0.5 ${i < currentIdx ? "bg-emerald-400" : "bg-gray-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function CountdownTimer({
  duration, onComplete, autoStart = false,
}: {
  duration: number;
  onComplete?: () => void;
  autoStart?: boolean;
}) {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(autoStart);
  const completedRef = useRef(false);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setElapsed(e => {
        if (e >= duration - 1) {
          setRunning(false);
          if (!completedRef.current) {
            completedRef.current = true;
            onComplete?.();
          }
          return duration;
        }
        return e + 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, duration, onComplete]);

  const timeLeft = duration - elapsed;
  const pct = (elapsed / duration) * 100;
  const urgent = timeLeft < 2 * 60;
  const warning = timeLeft < 5 * 60;

  return (
    <div className="text-center">
      <div className={`text-5xl font-extrabold tabular-nums transition-colors ${
        urgent && running ? "text-red-500" : warning && running ? "text-amber-500" : "text-gray-900"
      }`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
        {formatTime(timeLeft)}
      </div>
      <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${urgent ? "bg-red-500" : warning ? "bg-amber-500" : "bg-blue-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-gray-400 mt-2">
        {running ? (urgent ? "⚠ Less than 2 minutes left!" : "Session in progress…") : elapsed === 0 ? "Ready to start" : "Paused"}
      </p>
      <div className="flex gap-2 justify-center mt-3">
        {!running && elapsed < duration && (
          <button
            onClick={() => setRunning(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-colors"
          >
            <Play size={13} /> {elapsed === 0 ? "Start Timer" : "Resume"}
          </button>
        )}
        {running && (
          <button
            onClick={() => setRunning(false)}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-bold transition-colors"
          >
            <Square size={13} /> Pause
          </button>
        )}
      </div>
    </div>
  );
}

function ScoreBar({ score, label }: { score: number; label: string }) {
  const pct = (score / 5) * 100;
  const color = score >= 4 ? "bg-emerald-500" : score >= 3 ? "bg-blue-500" : score >= 2 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-600 w-20 text-right shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-bold text-gray-700 w-6">{score}/5</span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MockInterviewSimulator() {
  const { progress, toggleSolved } = useCTCIProgress();
  const [phase, setPhase] = useState<Phase>("setup");
  const [session, setSession] = useState<SessionState>({
    targetLevel: "IC6",
    codingProblem: null,
    codingSolved: null,
    codingDurationSec: 0,
    codingNotes: "",
    behavioralQuestions: [],
    behavioralAnswers: ["", ""],
  });
  const [codingElapsed, setCodingElapsed] = useState(0);
  const [behavioralIdx, setBehavioralIdx] = useState(0); // 0 = behavioral1, 1 = behavioral2

  const debrief = trpc.mockInterview.debrief.useMutation();

  // ── Setup → Coding (or Behavioral for IC7_PRINCIPAL) ──
  const startSession = useCallback(() => {
    const isPrincipal = session.targetLevel === "IC7_PRINCIPAL";
    const codingProblem = isPrincipal ? null : pickCodingProblem(progress);
    const behavioralQuestions = pickBehavioralQuestions(session.targetLevel);
    setSession(s => ({ ...s, codingProblem, behavioralQuestions, behavioralAnswers: ["", ""] }));
    setCodingElapsed(0);
    // IC7_PRINCIPAL skips coding and goes straight to behavioral
    setPhase(isPrincipal ? "behavioral1" : "coding");
  }, [progress, session.targetLevel]);

  // ── Coding done ──
  const finishCoding = useCallback((solved: boolean, elapsed: number) => {
    if (session.codingProblem && solved) toggleSolved(session.codingProblem.id);
    setSession(s => ({ ...s, codingSolved: solved, codingDurationSec: elapsed }));
    setBehavioralIdx(0);
    setPhase("behavioral1");
  }, [session.codingProblem, toggleSolved]);

  // ── Behavioral done ──
  const finishBehavioral = useCallback((idx: number) => {
    if (idx === 0) {
      setBehavioralIdx(1);
      setPhase("behavioral2");
    } else {
      setPhase("debrief");
      // Trigger LLM debrief
      const bqs = session.behavioralQuestions;
      const bas = session.behavioralAnswers;
      const isPrincipal = session.targetLevel === "IC7_PRINCIPAL";
      debrief.mutate({
        targetLevel: "IC7", // both IC7 and IC7_PRINCIPAL use IC7 bar
        coding: isPrincipal
          ? { problemName: "N/A (Behavioral-only session)", difficulty: "N/A", solved: false, durationSec: 0, notes: "" }
          : {
              problemName: session.codingProblem?.name ?? "Unknown",
              difficulty: session.codingProblem?.difficulty ?? "Medium",
              solved: session.codingSolved ?? false,
              durationSec: session.codingDurationSec,
              notes: session.codingNotes,
            },
        behavioral: [
          { question: bqs[0]?.question ?? "", answer: bas[0] || "(No answer provided)" },
          { question: bqs[1]?.question ?? "", answer: bas[1] || "(No answer provided)" },
        ],
      });
    }
  }, [session, debrief]);

  const resetSimulator = () => {
    setPhase("setup");
    setSession({
      targetLevel: "IC6",
      codingProblem: null,
      codingSolved: null,
      codingDurationSec: 0,
      codingNotes: "",
      behavioralQuestions: [],
      behavioralAnswers: ["", ""],
    });
    debrief.reset();
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-indigo-900 to-blue-800">
        <div className="flex items-center gap-2">
          <Brain size={16} className="text-indigo-300" />
          <span className="text-sm font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Mock Interview Simulator
          </span>
          <span className="text-[11px] bg-indigo-700 text-indigo-200 px-2 py-0.5 rounded-full font-medium">
            60 min loop
          </span>
        </div>
        {phase !== "setup" && (
          <button onClick={resetSimulator} className="text-xs text-indigo-300 hover:text-white transition-colors flex items-center gap-1">
            <RotateCcw size={11} /> Reset
          </button>
        )}
      </div>

      <div className="p-5">
        <PhaseProgress phase={phase} isPrincipal={session.targetLevel === "IC7_PRINCIPAL"} />

        {/* ── SETUP ── */}
        {phase === "setup" && (
          <div className="space-y-5">
            <div>
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                The total interview is <strong>60 minutes</strong>: <strong>30 minutes for coding</strong>, <strong>10 min behavioral × 2</strong>, followed by an <strong>LLM-powered IC-level debrief</strong>. Problems are chosen from your weakest patterns.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                {[
                  { icon: <Code2 size={15} className="text-blue-600" />, label: "Coding Round", desc: "30 min · 1 LeetCode problem", bg: "bg-blue-50 border-blue-200" },
                  { icon: <MessageSquare size={15} className="text-amber-600" />, label: "Behavioral × 2", desc: "10 min each · STAR format", bg: "bg-amber-50 border-amber-200" },
                  { icon: <Brain size={15} className="text-violet-600" />, label: "AI Debrief", desc: "IC-level verdict + feedback", bg: "bg-violet-50 border-violet-200" },
                ].map(item => (
                  <div key={item.label} className={`flex gap-3 p-3 rounded-xl border ${item.bg}`}>
                    <div className="mt-0.5">{item.icon}</div>
                    <div>
                      <p className="text-xs font-bold text-gray-800">{item.label}</p>
                      <p className="text-[11px] text-gray-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* IC Level picker */}
            <div>
              <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Target Level</p>
              <div className="flex gap-2 flex-wrap">
                {([
                  { level: "IC6" as ICLevel, label: "IC6", sub: "Staff Engineer" },
                  { level: "IC7" as ICLevel, label: "IC7", sub: "Principal/Senior Staff" },
                  { level: "IC7_PRINCIPAL" as ICLevel, label: "IC7+", sub: "Senior Staff/Principal\n(Behavioral only)" },
                ] as { level: ICLevel; label: string; sub: string }[]).map(({ level, label, sub }) => (
                  <button
                    key={level}
                    onClick={() => setSession(s => ({ ...s, targetLevel: level }))}
                    className={`px-4 py-2.5 rounded-xl text-sm font-bold border-2 transition-all text-left ${
                      session.targetLevel === level
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
                    }`}
                  >
                    {label}
                    <span className="block text-[10px] font-normal opacity-70 whitespace-pre-line">
                      {sub}
                    </span>
                  </button>
                ))}
              </div>
              {session.targetLevel === "IC7_PRINCIPAL" && (
                <div className="mt-2 flex gap-2 p-3 bg-purple-50 border border-purple-200 rounded-xl">
                  <div className="w-1 rounded-full bg-purple-400 flex-shrink-0" />
                  <p className="text-xs text-purple-800 leading-relaxed">
                    <strong>60-minute behavioral-only interview</strong> — no coding round. Questions are drawn from IC7 Cross-Functional Partnership and Retrospective Partnership Preparation material. The AI debrief evaluates org-level scope, upward influence, and outcome ownership.
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={startSession}
              className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-colors"
            >
              <Play size={15} /> Start Mock Interview
            </button>
          </div>
        )}

        {/* ── CODING PHASE ── */}
        {phase === "coding" && session.codingProblem && (
          <CodingPhase
            problem={session.codingProblem}
            notes={session.codingNotes}
            onNotesChange={notes => setSession(s => ({ ...s, codingNotes: notes }))}
            onFinish={finishCoding}
            onElapsedChange={setCodingElapsed}
          />
        )}

        {/* ── BEHAVIORAL PHASES ── */}
        {(phase === "behavioral1" || phase === "behavioral2") && (
          <BehavioralPhase
            key={phase}
            phaseLabel={phase === "behavioral1" ? "Behavioral Round 1 of 2" : "Behavioral Round 2 of 2"}
            question={session.behavioralQuestions[behavioralIdx]}
            answer={session.behavioralAnswers[behavioralIdx]}
            onAnswerChange={val => setSession(s => {
              const next = [...s.behavioralAnswers];
              next[behavioralIdx] = val;
              return { ...s, behavioralAnswers: next };
            })}
            onFinish={() => finishBehavioral(behavioralIdx)}
          />
        )}

        {/* ── DEBRIEF ── */}
        {phase === "debrief" && (
          <DebriefPhase
            isLoading={debrief.isPending}
            error={debrief.error?.message}
            result={debrief.data}
            session={session}
            onReset={resetSimulator}
          />
        )}
      </div>
    </div>
  );
}

// ─── CodingPhase ─────────────────────────────────────────────────────────────

function CodingPhase({
  problem, notes, onNotesChange, onFinish, onElapsedChange,
}: {
  problem: typeof CTCI_PROBLEMS[0];
  notes: string;
  onNotesChange: (v: string) => void;
  onFinish: (solved: boolean, elapsed: number) => void;
  onElapsedChange: (e: number) => void;
}) {
  const DURATION = 30 * 60;
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    onElapsedChange(elapsed);
  }, [elapsed, onElapsedChange]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setElapsed(e => {
        if (e >= DURATION - 1) { setRunning(false); setFinished(true); return DURATION; }
        return e + 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  const timeLeft = DURATION - elapsed;
  const pct = (elapsed / DURATION) * 100;
  const urgent = timeLeft < 3 * 60;
  const warning = timeLeft < 7 * 60;

  const DIFF_COLORS: Record<string, string> = {
    Easy: "bg-emerald-100 text-emerald-700 border-emerald-200",
    Medium: "bg-amber-100 text-amber-700 border-amber-200",
    Hard: "bg-red-100 text-red-700 border-red-200",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <Code2 size={15} className="text-blue-600" />
        <span className="text-sm font-bold text-blue-700">Coding Round — 30 minutes</span>
      </div>

      {/* Problem card */}
      <div className="border border-gray-200 rounded-xl p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h4 className="font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{problem.name}</h4>
            <p className="text-xs text-gray-400 mt-0.5">{problem.topic.split(",").slice(0, 3).join(", ")}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${DIFF_COLORS[problem.difficulty]}`}>
              {problem.difficulty}
            </span>
            <a href={problem.url} target="_blank" rel="noopener noreferrer"
              className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors" title="Open on LeetCode">
              <ExternalLink size={13} />
            </a>
          </div>
        </div>
      </div>

      {/* Timer */}
      <div className="text-center py-2">
        <div className={`text-5xl font-extrabold tabular-nums transition-colors ${
          urgent && running ? "text-red-500" : warning && running ? "text-amber-500" : "text-gray-900"
        }`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          {formatTime(timeLeft)}
        </div>
        <p className="text-xs text-gray-400 mt-1">
          {running ? (urgent ? "⚠ Less than 3 minutes left!" : "Coding in progress…") : finished ? "Time's up!" : "Ready to start"}
        </p>
        <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-1000 ${urgent ? "bg-red-500" : warning ? "bg-amber-500" : "bg-blue-500"}`}
            style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1">
          Approach notes (optional — included in debrief)
        </label>
        <textarea
          value={notes}
          onChange={e => onNotesChange(e.target.value)}
          rows={2}
          placeholder="e.g. Used sliding window, O(n) time, handled edge case of empty array…"
          className="w-full text-sm text-gray-700 bg-blue-50/50 border border-blue-100 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-300 placeholder:text-gray-400 font-mono leading-relaxed"
        />
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-2 justify-center">
        {!running && !finished && (
          <button onClick={() => setRunning(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-colors">
            <Play size={13} /> {elapsed === 0 ? "Start Timer" : "Resume"}
          </button>
        )}
        {running && (
          <button onClick={() => setRunning(false)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-bold transition-colors">
            <Square size={13} /> Pause
          </button>
        )}
        {(running || elapsed > 0 || finished) && (
          <>
            <button onClick={() => onFinish(true, elapsed)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-colors">
              <CheckCircle2 size={13} /> Solved — Next
            </button>
            <button onClick={() => onFinish(false, elapsed)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl text-sm font-bold transition-colors">
              <ChevronRight size={13} /> Skip — Next
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── BehavioralPhase ─────────────────────────────────────────────────────────

function BehavioralPhase({
  phaseLabel, question, answer, onAnswerChange, onFinish,
}: {
  phaseLabel: string;
  question: BehavioralQuestion | undefined;
  answer: string;
  onAnswerChange: (v: string) => void;
  onFinish: () => void;
}) {
  const DURATION = 10 * 60;
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setElapsed(e => e >= DURATION - 1 ? (setRunning(false), DURATION) : e + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  const timeLeft = DURATION - elapsed;
  const pct = (elapsed / DURATION) * 100;
  const urgent = timeLeft < 90;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <MessageSquare size={15} className="text-amber-600" />
        <span className="text-sm font-bold text-amber-700">{phaseLabel} — 10 minutes</span>
      </div>

      {question && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wide mb-1">{question.focusArea}</p>
          <p className="text-sm font-semibold text-gray-800 leading-relaxed">{question.question}</p>
        </div>
      )}

      {/* Timer */}
      <div className="text-center py-1">
        <div className={`text-4xl font-extrabold tabular-nums transition-colors ${urgent && running ? "text-red-500" : "text-gray-900"}`}
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          {formatTime(timeLeft)}
        </div>
        <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-1000 ${urgent ? "bg-red-500" : "bg-amber-500"}`}
            style={{ width: `${pct}%` }} />
        </div>
        <div className="flex gap-2 justify-center mt-2">
          {!running && elapsed < DURATION && (
            <button onClick={() => setRunning(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-colors">
              <Play size={11} /> {elapsed === 0 ? "Start Timer" : "Resume"}
            </button>
          )}
          {running && (
            <button onClick={() => setRunning(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg text-xs font-bold transition-colors">
              <Square size={11} /> Pause
            </button>
          )}
        </div>
      </div>

      {/* Answer textarea */}
      <div>
        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1">
          Your STAR answer (used in AI debrief)
        </label>
        <textarea
          value={answer}
          onChange={e => onAnswerChange(e.target.value)}
          rows={5}
          placeholder="Situation: …&#10;Task: …&#10;Action: …&#10;Result: …"
          className="w-full text-sm text-gray-700 bg-amber-50/40 border border-amber-100 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-amber-300 placeholder:text-gray-400 leading-relaxed"
        />
        <p className="text-[11px] text-gray-400 mt-1">
          Tip: Include specific metrics, team size, and business impact for a higher IC-level score.
        </p>
      </div>

      <button
        onClick={onFinish}
        className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-sm transition-colors"
      >
        <ChevronRight size={15} /> Finish & Continue
      </button>
    </div>
  );
}

// ─── DebriefPhase ─────────────────────────────────────────────────────────────

function DebriefPhase({
  isLoading, error, result, session, onReset,
}: {
  isLoading: boolean;
  error?: string;
  result?: {
    icLevelVerdict: string; overallSummary: string;
    codingScore: number; codingFeedback: string;
    behavioralScore: number; behavioralFeedback: string;
    topStrengths: string[]; topImprovements: string[]; nextSteps: string[];
  };
  session: SessionState;
  onReset: () => void;
}) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <Loader2 size={32} className="text-blue-500 animate-spin" />
        <p className="text-sm font-semibold text-gray-700">Generating your IC-level debrief…</p>
        <p className="text-xs text-gray-400">This takes 10–20 seconds</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-3">
        <AlertCircle size={28} className="text-red-400" />
        <p className="text-sm text-red-600 font-medium">Debrief failed: {error}</p>
        <button onClick={onReset} className="text-xs text-blue-600 hover:underline">Start a new session</button>
      </div>
    );
  }

  if (!result) return null;

  const verdictStyle = VERDICT_STYLES[result.icLevelVerdict] ?? VERDICT_STYLES["Borderline"];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 mb-1">
        <Brain size={15} className="text-violet-600" />
        <span className="text-sm font-bold text-violet-700">AI Debrief — {session.targetLevel} Assessment</span>
      </div>

      {/* Verdict hero */}
      <div className={`flex items-center gap-3 p-4 rounded-xl border-2 ${verdictStyle.bg} ${verdictStyle.border}`}>
        {verdictStyle.icon}
        <div>
          <p className={`text-lg font-extrabold ${verdictStyle.text}`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            {result.icLevelVerdict}
          </p>
          <p className={`text-xs ${verdictStyle.text} opacity-80`}>
            {session.targetLevel === "IC7_PRINCIPAL"
              ? "IC7 Principal/Senior Staff — Behavioral-only bar"
              : `${session.targetLevel} (${session.targetLevel === "IC7" ? "Principal/Senior Staff" : "Staff Engineer"}) bar`}
          </p>
        </div>
      </div>

      {/* Summary */}
      <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-xl p-4 border border-gray-100">
        {result.overallSummary}
      </p>

      {/* Scores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Code2 size={13} className="text-blue-600" />
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wide">Coding</span>
          </div>
          <ScoreBar score={result.codingScore} label="Score" />
          <p className="text-xs text-gray-600 mt-2 leading-relaxed">{result.codingFeedback}</p>
          <p className="text-[11px] text-gray-400 mt-1">
            {session.targetLevel === "IC7_PRINCIPAL"
              ? "Behavioral-only session — no coding round"
              : `Problem: ${session.codingProblem?.name} · ${session.codingSolved ? "✓ Solved" : "✗ Not solved"} · ${formatTime(session.codingDurationSec)}`}
          </p>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare size={13} className="text-amber-600" />
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wide">Behavioral</span>
          </div>
          <ScoreBar score={result.behavioralScore} label="Score" />
          <p className="text-xs text-gray-600 mt-2 leading-relaxed">{result.behavioralFeedback}</p>
        </div>
      </div>

      {/* Strengths & Improvements */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {result.topStrengths.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingUp size={13} className="text-emerald-600" />
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide">Top Strengths</span>
            </div>
            <ul className="space-y-1.5">
              {result.topStrengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-gray-700">
                  <Star size={10} className="text-emerald-500 mt-0.5 shrink-0 fill-emerald-500" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}
        {result.topImprovements.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingDown size={13} className="text-amber-600" />
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wide">Areas to Improve</span>
            </div>
            <ul className="space-y-1.5">
              {result.topImprovements.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-gray-700">
                  <Target size={10} className="text-amber-500 mt-0.5 shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Next steps */}
      {result.nextSteps.length > 0 && (
        <div className="bg-violet-50 border border-violet-100 rounded-xl p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <Clock size={13} className="text-violet-600" />
            <span className="text-xs font-bold text-violet-700 uppercase tracking-wide">Recommended Next Steps</span>
          </div>
          <ol className="space-y-1.5">
            {result.nextSteps.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-gray-700">
                <span className="w-4 h-4 rounded-full bg-violet-200 text-violet-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                {s}
              </li>
            ))}
          </ol>
        </div>
      )}

      <button
        onClick={onReset}
        className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-colors"
      >
        <RotateCcw size={14} /> Start New Session
      </button>
    </div>
  );
}
