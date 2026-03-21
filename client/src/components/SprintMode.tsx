/**
 * SprintMode — 8 problems, 30 seconds each
 * Candidates identify the pattern by clicking. Instant scored results with per-problem breakdown.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { PATTERNS } from "@/lib/guideData";
import { Zap, CheckCircle2, XCircle, RotateCcw, Trophy, Clock, ChevronRight } from "lucide-react";

const SPRINT_COUNT = 8;
const TIME_PER_PROBLEM = 30;

export interface SprintModeProps {
  /** If provided, problems are drawn only from these pattern names */
  focusPatterns?: string[];
  /** If true, the sprint starts immediately without showing the idle screen */
  autoStart?: boolean;
  /** Called when the sprint finishes — receives score and total */
  onComplete?: (score?: number, total?: number) => void;
}

interface SprintProblem {
  problem: string;
  correctPattern: string;
  choices: string[];
}

function buildSprintProblems(focusPatterns?: string[]): SprintProblem[] {
  // Flatten all problems with their pattern
  const allProblems: { problem: string; patternName: string }[] = [];
  const sourcePatterns = focusPatterns && focusPatterns.length > 0
    ? PATTERNS.filter(p => focusPatterns.includes(p.name))
    : PATTERNS;
  sourcePatterns.forEach(p => {
    p.problems.forEach(prob => {
      allProblems.push({ problem: prob, patternName: p.name });
    });
  });

  // Shuffle and take SPRINT_COUNT
  const shuffled = [...allProblems].sort(() => Math.random() - 0.5).slice(0, SPRINT_COUNT);

  return shuffled.map(({ problem, patternName }) => {
    // Pick 3 wrong answers
    const otherPatterns = PATTERNS
      .filter(p => p.name !== patternName)
      .map(p => p.name)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    const choices = [...otherPatterns, patternName].sort(() => Math.random() - 0.5);
    return { problem, correctPattern: patternName, choices };
  });
}

interface SprintResult {
  problem: string;
  correctPattern: string;
  chosen: string | null;
  timeUsed: number;
  correct: boolean;
}

type Phase = "idle" | "running" | "done";

export default function SprintMode({ focusPatterns, autoStart, onComplete }: SprintModeProps = {}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [problems, setProblems] = useState<SprintProblem[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_PROBLEM);
  const [results, setResults] = useState<SprintResult[]>([]);
  const [chosen, setChosen] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const startTimeRef = useRef<number>(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const advanceOrFinish = useCallback((result: SprintResult, nextIdx: number) => {
    const newResults = [...results, result];
    if (nextIdx >= problems.length) {
      setResults(newResults);
      setPhase("done");
      stopTimer();
      const finalScore = newResults.filter(r => r.correct).length;
      onComplete?.(finalScore, newResults.length);
    } else {
      setResults(newResults);
      setCurrentIdx(nextIdx);
      setTimeLeft(TIME_PER_PROBLEM);
      setChosen(null);
      setAnswered(false);
      startTimeRef.current = Date.now();
    }
  }, [results, problems.length, stopTimer]);

  useEffect(() => {
    if (phase !== "running" || answered) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          stopTimer();
          const timeUsed = TIME_PER_PROBLEM;
          const result: SprintResult = {
            problem: problems[currentIdx].problem,
            correctPattern: problems[currentIdx].correctPattern,
            chosen: null,
            timeUsed,
            correct: false,
          };
          setAnswered(true);
          setTimeout(() => advanceOrFinish(result, currentIdx + 1), 1200);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => stopTimer();
  }, [phase, currentIdx, answered, problems, stopTimer, advanceOrFinish]);

  // Auto-start if requested
  useEffect(() => {
    if (autoStart && phase === "idle") {
      handleStart();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  const handleStart = () => {
    const probs = buildSprintProblems(focusPatterns);
    setProblems(probs);
    setCurrentIdx(0);
    setTimeLeft(TIME_PER_PROBLEM);
    setResults([]);
    setChosen(null);
    setAnswered(false);
    startTimeRef.current = Date.now();
    setPhase("running");
  };

  const handleChoose = (choice: string) => {
    if (answered) return;
    stopTimer();
    const timeUsed = TIME_PER_PROBLEM - timeLeft;
    setChosen(choice);
    setAnswered(true);
    const correct = choice === problems[currentIdx].correctPattern;
    const result: SprintResult = {
      problem: problems[currentIdx].problem,
      correctPattern: problems[currentIdx].correctPattern,
      chosen: choice,
      timeUsed,
      correct,
    };
    setTimeout(() => advanceOrFinish(result, currentIdx + 1), 900);
  };

  const score = results.filter(r => r.correct).length;
  const totalTime = results.reduce((sum, r) => sum + r.timeUsed, 0);
  const avgTime = results.length > 0 ? (totalTime / results.length).toFixed(1) : "0";

  const getVerdict = (s: number) => {
    if (s >= 7) return { label: "Strong Hire", color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" };
    if (s >= 5) return { label: "Hire", color: "text-blue-600", bg: "bg-blue-50 border-blue-200" };
    if (s >= 3) return { label: "Lean Hire", color: "text-amber-600", bg: "bg-amber-50 border-amber-200" };
    return { label: "No Hire", color: "text-red-600", bg: "bg-red-50 border-red-200" };
  };

  // IDLE
  if (phase === "idle") {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-yellow-100 rounded-xl">
            <Zap size={20} className="text-yellow-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Sprint Mode
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">8 problems · 30 seconds each · Pattern identification</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: "Problems", value: "8" },
            { label: "Time each", value: "30s" },
            { label: "Scoring", value: "Speed + Accuracy" },
          ].map(item => (
            <div key={item.label} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center">
              <div className="text-lg font-bold text-gray-900 dark:text-gray-100">{item.value}</div>
              <div className="text-xs text-gray-500">{item.label}</div>
            </div>
          ))}
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">
          You'll see a LeetCode problem name and must identify which pattern it belongs to from 4 choices.
          The faster and more accurately you answer, the higher your score.
        </p>
        <button
          onClick={handleStart}
          className="w-full py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <Zap size={16} /> Start Sprint
        </button>
      </div>
    );
  }

  // RUNNING
  if (phase === "running" && problems.length > 0) {
    const current = problems[currentIdx];
    const progress = (currentIdx / SPRINT_COUNT) * 100;
    const timerPct = (timeLeft / TIME_PER_PROBLEM) * 100;
    const timerColor = timeLeft <= 5 ? "bg-red-500" : timeLeft <= 10 ? "bg-amber-500" : "bg-emerald-500";

    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-yellow-500" />
            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Problem {currentIdx + 1} of {SPRINT_COUNT}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={14} className={timeLeft <= 5 ? "text-red-500 animate-pulse" : "text-gray-400"} />
            <span className={`text-lg font-bold tabular-nums ${timeLeft <= 5 ? "text-red-600" : "text-gray-700 dark:text-gray-300"}`}>
              {timeLeft}s
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-gray-100 rounded-full mb-1">
          <div className="h-full bg-yellow-400 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
        {/* Timer bar */}
        <div className="h-1 bg-gray-100 rounded-full mb-5">
          <div className={`h-full ${timerColor} rounded-full transition-all`} style={{ width: `${timerPct}%` }} />
        </div>

        {/* Problem */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-5 text-center">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Identify the pattern</p>
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            {current.problem}
          </h3>
        </div>

        {/* Choices */}
        <div className="grid grid-cols-2 gap-3">
          {current.choices.map(choice => {
            let cls = "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20";
            if (answered) {
              if (choice === current.correctPattern) cls = "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20";
              else if (choice === chosen) cls = "border-red-400 bg-red-50 dark:bg-red-900/20";
              else cls = "border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 opacity-50";
            }
            return (
              <button
                key={choice}
                onClick={() => handleChoose(choice)}
                disabled={answered}
                className={`rounded-xl border-2 p-3 text-sm font-semibold text-gray-800 dark:text-gray-200 transition-all text-left ${cls}`}
              >
                {choice}
              </button>
            );
          })}
        </div>

        {answered && (
          <div className={`mt-4 text-center text-sm font-bold ${chosen === current.correctPattern ? "text-emerald-600" : "text-red-600"}`}>
            {chosen === null ? "⏱ Time's up!" : chosen === current.correctPattern ? "✓ Correct!" : `✗ It was: ${current.correctPattern}`}
          </div>
        )}
      </div>
    );
  }

  // DONE
  const verdict = getVerdict(score);
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
      <div className="text-center mb-6">
        <Trophy size={32} className="mx-auto mb-2 text-yellow-500" />
        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Sprint Complete!
        </h3>
        <div className={`inline-block mt-2 px-4 py-1.5 rounded-full border font-bold text-sm ${verdict.bg} ${verdict.color}`}>
          {verdict.label}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{score}/{SPRINT_COUNT}</div>
          <div className="text-xs text-gray-500">Correct</div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{Math.round((score / SPRINT_COUNT) * 100)}%</div>
          <div className="text-xs text-gray-500">Accuracy</div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{avgTime}s</div>
          <div className="text-xs text-gray-500">Avg Time</div>
        </div>
      </div>

      {/* Per-problem breakdown */}
      <div className="space-y-2 mb-6">
        {results.map((r, i) => (
          <div key={i} className={`flex items-center gap-3 p-2.5 rounded-lg text-sm ${r.correct ? "bg-emerald-50 dark:bg-emerald-900/20" : "bg-red-50 dark:bg-red-900/20"}`}>
            {r.correct
              ? <CheckCircle2 size={15} className="text-emerald-500 flex-shrink-0" />
              : <XCircle size={15} className="text-red-500 flex-shrink-0" />}
            <span className="flex-1 font-medium text-gray-800 dark:text-gray-200 truncate">{r.problem}</span>
            <span className="text-xs text-gray-500 flex-shrink-0">{r.correct ? r.correctPattern : `→ ${r.correctPattern}`}</span>
            <span className="text-xs text-gray-400 flex-shrink-0 tabular-nums">{r.timeUsed}s</span>
          </div>
        ))}
      </div>

      <button
        onClick={handleStart}
        className="w-full py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
      >
        <RotateCcw size={15} /> New Sprint <ChevronRight size={15} />
      </button>
    </div>
  );
}
