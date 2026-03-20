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
  Star, TrendingUp, TrendingDown, Target, Clock, ChevronDown, ChevronUp, ScrollText,
  ArrowUp, ArrowDown, Minus,
} from "lucide-react";
import { CTCI_PROBLEMS } from "@/lib/ctciProblems";
import { BEHAVIORAL_FOCUS_AREAS, IC7_BEHAVIORAL_FOCUS_AREAS } from "@/lib/guideData";
import { useCTCIProgress } from "@/hooks/useCTCIProgress";
import { getWeakestPatterns } from "@/hooks/useDrillRatings";
import { PATTERN_TO_CTCI_TOPICS, problemMatchesTopics } from "@/lib/ctciTopicMap";
import { trpc } from "@/lib/trpc";

// ─── Pressure Simulator ──────────────────────────────────────────────────────

const CODING_INTERJECTIONS = [
  "Can you walk me through your approach so far?",
  "What's the time complexity of your current solution?",
  "Have you considered any edge cases yet?",
  "What data structure are you using and why?",
  "Can you explain your reasoning out loud?",
  "What would happen if the input was empty?",
  "Is there a more optimal approach you can think of?",
  "What's your space complexity?",
  "Can you trace through a small example?",
  "How would you test this solution?",
];

const BEHAVIORAL_INTERJECTIONS = [
  "Can you be more specific about your role in that situation?",
  "What was the measurable impact of your actions?",
  "How did your teammates react to your decision?",
  "What would you do differently if you faced this again?",
  "Can you quantify the outcome?",
  "How did this align with the team's broader goals?",
  "What trade-offs did you consider?",
  "How did you handle disagreement from stakeholders?",
];

function usePressureSimulator({
  enabled,
  running,
  mode,
}: {
  enabled: boolean;
  running: boolean;
  mode: "coding" | "behavioral";
}) {
  const [interjection, setInterjection] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const usedRef = useRef<Set<number>>(new Set());

  const scheduleNext = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    // Random interval: 90–240 seconds
    const delay = (90 + Math.floor(Math.random() * 150)) * 1000;
    timerRef.current = setTimeout(() => {
      const pool = mode === "coding" ? CODING_INTERJECTIONS : BEHAVIORAL_INTERJECTIONS;
      // Pick a question not recently used
      let idx: number;
      let attempts = 0;
      do {
        idx = Math.floor(Math.random() * pool.length);
        attempts++;
      } while (usedRef.current.has(idx) && attempts < pool.length);
      usedRef.current.add(idx);
      if (usedRef.current.size >= Math.floor(pool.length * 0.7)) usedRef.current.clear();
      setInterjection(pool[idx]);
    }, delay);
  }, [mode]);

  useEffect(() => {
    if (!enabled || !running) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }
    scheduleNext();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [enabled, running, scheduleNext]);

  const dismiss = useCallback(() => {
    setInterjection(null);
    if (enabled && running) scheduleNext();
  }, [enabled, running, scheduleNext]);

  return { interjection, dismiss };
}

// ─── Silence Detector ──────────────────────────────────────────────────────

const SILENCE_PROMPTS = [
  "Remember to think out loud — walk me through your reasoning.",
  "What are you thinking right now? Share your approach.",
  "Don't go quiet — narrate your thought process.",
  "It's been a while — what's your current plan?",
  "Interviewers love hearing your reasoning, even if incomplete.",
];

function useSilenceDetector({
  enabled,
  running,
  thresholdSec = 45,
}: {
  enabled: boolean;
  running: boolean;
  thresholdSec?: number;
}) {
  const [prompt, setPrompt] = useState<string | null>(null);
  const [supported, setSupported] = useState(false);
  const lastSpeechRef = useRef<number>(Date.now());
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const usedPromptsRef = useRef<Set<number>>(new Set());

  const pickPrompt = useCallback(() => {
    let idx: number;
    let attempts = 0;
    do {
      idx = Math.floor(Math.random() * SILENCE_PROMPTS.length);
      attempts++;
    } while (usedPromptsRef.current.has(idx) && attempts < SILENCE_PROMPTS.length);
    usedPromptsRef.current.add(idx);
    if (usedPromptsRef.current.size >= SILENCE_PROMPTS.length) usedPromptsRef.current.clear();
    return SILENCE_PROMPTS[idx];
  }, []);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionCtor: (new () => any) | undefined =
      w.SpeechRecognition || w.webkitSpeechRecognition;
    setSupported(!!SpeechRecognitionCtor);

    if (!SpeechRecognitionCtor || !enabled || !running) return;

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognitionRef.current = recognition;

    recognition.onresult = () => {
      lastSpeechRef.current = Date.now();
      setPrompt(null); // dismiss prompt when user speaks
    };

    recognition.onend = () => {
      // Auto-restart to keep listening
      if (enabled && running) {
        try { recognition.start(); } catch { /* already started */ }
      }
    };

    try { recognition.start(); } catch { /* ignore */ }

    silenceTimerRef.current = setInterval(() => {
      const silenceSec = (Date.now() - lastSpeechRef.current) / 1000;
      if (silenceSec >= thresholdSec) {
        lastSpeechRef.current = Date.now(); // reset so it doesn't fire every tick
        setPrompt(pickPrompt());
      }
    }, 5000);

    return () => {
      if (silenceTimerRef.current) clearInterval(silenceTimerRef.current);
      try { recognition.stop(); } catch { /* ignore */ }
    };
  }, [enabled, running, thresholdSec, pickPrompt]);

  const dismiss = useCallback(() => {
    lastSpeechRef.current = Date.now();
    setPrompt(null);
  }, []);

  return { prompt, dismiss, supported };
}

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

// ─── Mock session history ───────────────────────────────────────────────────

const MOCK_HISTORY_KEY = "meta-mock-interview-history";

interface MockSessionRecord {
  id: string;
  ts: number;
  targetLevel: ICLevel;
  icLevelVerdict: string;
  codingScore: number;
  behavioralScore: number;
}

function loadMockHistory(): MockSessionRecord[] {
  try { return JSON.parse(localStorage.getItem(MOCK_HISTORY_KEY) ?? "[]"); }
  catch { return []; }
}

function saveMockSession(record: MockSessionRecord) {
  const history = loadMockHistory();
  history.unshift(record);
  localStorage.setItem(MOCK_HISTORY_KEY, JSON.stringify(history.slice(0, 50)));
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
  const [previousSession, setPreviousSession] = useState<MockSessionRecord | null>(null);

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
      // Load the most recent previous session for comparison
      const history = loadMockHistory();
      setPreviousSession(history.length > 0 ? history[0] : null);
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

  // Save completed session to history when debrief data arrives
  useEffect(() => {
    if (debrief.data) {
      saveMockSession({
        id: `mock-${Date.now()}`,
        ts: Date.now(),
        targetLevel: session.targetLevel,
        icLevelVerdict: debrief.data.icLevelVerdict,
        codingScore: debrief.data.codingScore,
        behavioralScore: debrief.data.behavioralScore,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debrief.data]);

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
            previousSession={previousSession}
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
  const [pressureEnabled, setPressureEnabled] = useState(() =>
    localStorage.getItem("meta-guide-pressure-sim") !== "off"
  );
  const { interjection, dismiss } = usePressureSimulator({ enabled: pressureEnabled, running, mode: "coding" });
  const [silenceEnabled, setSilenceEnabled] = useState(() =>
    localStorage.getItem("meta-guide-silence-detect") === "on"
  );
  const { prompt: silencePrompt, dismiss: dismissSilence, supported: silenceSupported } = useSilenceDetector({
    enabled: silenceEnabled,
    running,
  });

  const toggleSilence = () => {
    setSilenceEnabled(v => {
      localStorage.setItem("meta-guide-silence-detect", !v ? "on" : "off");
      return !v;
    });
  };

  const togglePressure = () => {
    setPressureEnabled(v => {
      localStorage.setItem("meta-guide-pressure-sim", !v ? "on" : "off");
      return !v;
    });
  };

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
        <div className="ml-auto flex items-center gap-1.5">
          {silenceSupported && (
            <button
              onClick={toggleSilence}
              title={silenceEnabled ? "Silence Detector ON — click to disable" : "Enable Silence Detector (45s)"}
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-bold border transition-all ${
                silenceEnabled
                  ? "bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
                  : "bg-gray-100 text-gray-400 border-gray-200 hover:bg-gray-200"
              }`}
            >
              👂 {silenceEnabled ? "Silence ON" : "Silence"}
            </button>
          )}
          <button
            onClick={togglePressure}
            title={pressureEnabled ? "Pressure Simulator ON — click to disable" : "Enable Pressure Simulator"}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all ${
              pressureEnabled
                ? "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                : "bg-gray-100 text-gray-400 border-gray-200 hover:bg-gray-200"
            }`}
          >
            🎤 {pressureEnabled ? "Pressure ON" : "Pressure OFF"}
          </button>
        </div>
      </div>

      {/* Silence Detector prompt banner */}
      {silencePrompt && (
        <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
          <span className="text-lg shrink-0">👂</span>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold text-blue-600 uppercase tracking-wide mb-0.5">Silence Detector</p>
            <p className="text-sm font-semibold text-gray-800 leading-relaxed">{silencePrompt}</p>
          </div>
          <button onClick={dismissSilence} className="shrink-0 text-[11px] font-bold text-blue-500 hover:text-blue-700 bg-blue-100 hover:bg-blue-200 px-2 py-1 rounded-lg transition-colors">
            Got it
          </button>
        </div>
      )}

      {/* Pressure Simulator interjection banner */}
      {interjection && (
        <div className="flex items-start gap-3 p-3 bg-orange-50 border border-orange-200 rounded-xl animate-pulse">
          <span className="text-lg shrink-0">🎤</span>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold text-orange-600 uppercase tracking-wide mb-0.5">Interviewer</p>
            <p className="text-sm font-semibold text-gray-800 leading-relaxed">{interjection}</p>
          </div>
          <button
            onClick={dismiss}
            className="shrink-0 text-[11px] font-bold text-orange-500 hover:text-orange-700 bg-orange-100 hover:bg-orange-200 px-2 py-1 rounded-lg transition-colors"
          >
            Got it
          </button>
        </div>
      )}

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
  const pressureEnabled = localStorage.getItem("meta-guide-pressure-sim") !== "off";
  const { interjection, dismiss } = usePressureSimulator({ enabled: pressureEnabled, running, mode: "behavioral" });

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
        {pressureEnabled && (
          <span className="ml-auto text-[10px] font-bold text-orange-500 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full">
            🎤 Pressure ON
          </span>
        )}
      </div>

      {/* Pressure interjection banner */}
      {interjection && (
        <div className="flex items-start gap-3 p-3 bg-orange-50 border border-orange-200 rounded-xl animate-pulse">
          <span className="text-lg shrink-0">🎤</span>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold text-orange-600 uppercase tracking-wide mb-0.5">Interviewer</p>
            <p className="text-sm font-semibold text-gray-800 leading-relaxed">{interjection}</p>
          </div>
          <button onClick={dismiss} className="shrink-0 text-[11px] font-bold text-orange-500 hover:text-orange-700 bg-orange-100 hover:bg-orange-200 px-2 py-1 rounded-lg transition-colors">
            Got it
          </button>
        </div>
      )}

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

// ─── Follow-up Question Bank ─────────────────────────────────────────────────

const FOLLOWUP_QUEUE_KEY = "meta-mock-followup-queue";

interface FollowUpItem {
  id: string;
  ts: number;
  sessionDate: string;
  question: string;
  targetArea: string;
  coachingNote: string;
  reviewed: boolean;
}

function loadFollowUpQueue(): FollowUpItem[] {
  try { return JSON.parse(localStorage.getItem(FOLLOWUP_QUEUE_KEY) ?? "[]"); }
  catch { return []; }
}

function saveFollowUpQueue(items: FollowUpItem[]) {
  localStorage.setItem(FOLLOWUP_QUEUE_KEY, JSON.stringify(items.slice(0, 100)));
}

// ─── DebriefPhase ─────────────────────────────────────────────────────────────────

function DebriefPhase({
  isLoading, error, result, session, onReset, previousSession,
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
  previousSession?: MockSessionRecord | null;
}) {
  const followUps = trpc.mockInterview.followUps.useMutation();
  const [savedFollowUps, setSavedFollowUps] = useState(false);

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

      {/* Session comparison delta card */}
      {previousSession && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={13} className="text-slate-500" />
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">vs. Previous Session</span>
            <span className="ml-auto text-[11px] text-slate-400">
              {new Date(previousSession.ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Coding", current: result.codingScore, prev: previousSession.codingScore, color: "blue" },
              { label: "Behavioral", current: result.behavioralScore, prev: previousSession.behavioralScore, color: "amber" },
            ].map(({ label, current, prev, color }) => {
              const delta = current - prev;
              const isUp = delta > 0;
              const isDown = delta < 0;
              return (
                <div key={label} className={`rounded-lg p-3 border ${
                  color === 'blue' ? 'bg-blue-50 border-blue-100' : 'bg-amber-50 border-amber-100'
                }`}>
                  <p className={`text-[11px] font-bold uppercase tracking-wide mb-1 ${
                    color === 'blue' ? 'text-blue-600' : 'text-amber-600'
                  }`}>{label}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-extrabold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                      {current}
                    </span>
                    <div className={`flex items-center gap-0.5 text-xs font-bold ${
                      isUp ? 'text-emerald-600' : isDown ? 'text-red-500' : 'text-gray-400'
                    }`}>
                      {isUp ? <ArrowUp size={11} /> : isDown ? <ArrowDown size={11} /> : <Minus size={11} />}
                      {isUp ? '+' : ''}{delta}
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5">prev: {prev}</p>
                </div>
              );
            })}
          </div>
          {previousSession.icLevelVerdict !== result.icLevelVerdict && (
            <p className="text-[11px] text-slate-500 mt-2">
              Verdict changed: <span className="font-semibold">{previousSession.icLevelVerdict}</span> → <span className="font-semibold">{result.icLevelVerdict}</span>
            </p>
          )}
        </div>
      )}

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

      {/* Follow-up Question Bank */}
      <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-indigo-700 uppercase tracking-wide">Follow-up Question Bank</p>
            <p className="text-[11px] text-indigo-500 mt-0.5">3 targeted questions based on your weakest areas</p>
          </div>
          {!followUps.data && (
            <button
              onClick={() => followUps.mutate({
                targetLevel: session.targetLevel,
                behavioralFeedback: result.behavioralFeedback,
                codingFeedback: result.codingFeedback,
                topImprovements: result.topImprovements,
                behavioralAnswers: session.behavioralQuestions.map((q, i) => ({
                  question: q.question,
                  answer: session.behavioralAnswers[i] ?? "",
                })),
              })}
              disabled={followUps.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 disabled:opacity-60 transition-colors shrink-0"
            >
              {followUps.isPending ? <Loader2 size={11} className="animate-spin" /> : <Brain size={11} />}
              {followUps.isPending ? "Generating…" : "Generate 3 Questions"}
            </button>
          )}
        </div>

        {followUps.data && (
          <div className="space-y-2">
            {followUps.data.questions.map((q, i) => (
              <details key={i} className="rounded-lg border border-indigo-200 bg-white overflow-hidden">
                <summary className="flex items-start gap-2 px-3 py-2.5 cursor-pointer text-xs font-semibold text-indigo-900 select-none">
                  <span className="shrink-0 w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[9px] font-bold mt-0.5">{i + 1}</span>
                  <span className="flex-1 leading-relaxed">{q.question}</span>
                  <span className="text-[9px] font-bold text-indigo-500 shrink-0 mt-0.5 ml-1">{q.targetArea}</span>
                </summary>
                <div className="px-3 pb-3 pt-1 border-t border-indigo-100">
                  <p className="text-[11px] text-indigo-700 leading-relaxed"><span className="font-bold">Coach: </span>{q.coachingNote}</p>
                </div>
              </details>
            ))}
            {!savedFollowUps && (
              <button
                onClick={() => {
                  const queue = loadFollowUpQueue();
                  const now = Date.now();
                  const dateStr = new Date(now).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
                  const newItems: FollowUpItem[] = followUps.data!.questions.map((q, i) => ({
                    id: `${now}-${i}`,
                    ts: now,
                    sessionDate: dateStr,
                    question: q.question,
                    targetArea: q.targetArea,
                    coachingNote: q.coachingNote,
                    reviewed: false,
                  }));
                  saveFollowUpQueue([...newItems, ...queue]);
                  setSavedFollowUps(true);
                }}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
              >
                ➕ Save to Review Queue
              </button>
            )}
            {savedFollowUps && (
              <p className="text-[11px] text-emerald-600 font-semibold text-center">✓ Saved to review queue</p>
            )}
          </div>
        )}
        {followUps.isError && <p className="text-xs text-red-500">Failed to generate questions. Please try again.</p>}
      </div>

      {/* Session Transcript */}
      <SessionTranscript session={session} />

      <button
        onClick={onReset}
        className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-colors"
      >
        <RotateCcw size={14} /> Start New Session
      </button>
    </div>
  );
}

// ─── SessionTranscript ────────────────────────────────────────────────────────

function SessionTranscript({ session }: { session: SessionState }) {
  const [open, setOpen] = useState(false);
  const hasBehavioral = session.behavioralQuestions.length > 0 && session.behavioralAnswers.some(a => a.trim().length > 0);
  if (!hasBehavioral) return null;

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <ScrollText size={13} className="text-gray-500 shrink-0" />
        <span className="text-xs font-semibold text-gray-700 flex-1">Session Transcript</span>
        <span className="text-[10px] text-gray-400 mr-1">{session.behavioralQuestions.length} behavioral Q&amp;As</span>
        {open ? <ChevronUp size={13} className="text-gray-400" /> : <ChevronDown size={13} className="text-gray-400" />}
      </button>
      {open && (
        <div className="divide-y divide-gray-100">
          {session.behavioralQuestions.map((bq, i) => (
            <div key={i} className="px-4 py-3 space-y-2">
              <div className="flex items-start gap-2">
                <span className="shrink-0 w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold flex items-center justify-center mt-0.5">Q</span>
                <p className="text-xs font-semibold text-gray-800 leading-relaxed">{bq.question}</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center mt-0.5">A</span>
                {session.behavioralAnswers[i]?.trim() ? (
                  <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">{session.behavioralAnswers[i]}</p>
                ) : (
                  <p className="text-xs text-gray-400 italic">No answer recorded</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
