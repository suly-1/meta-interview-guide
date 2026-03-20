import { useState, useEffect, useRef, useCallback } from "react";
import { Sword, Shield, CheckCircle2, XCircle, Clock, Trophy, ChevronRight, RotateCcw, X } from "lucide-react";
import { CTCI_PROBLEMS } from "@/lib/ctciProblems";
import { BEHAVIORAL_FOCUS_AREAS } from "@/lib/guideData";

// ─── Types ────────────────────────────────────────────────────────────────────
export type GauntletTabId = "ctci" | "coding" | "ai-round" | "behavioral" | "timeline" | "readiness" | "sysdesign";

interface GauntletChallenge {
  tabId: GauntletTabId;
  tabLabel: string;
  emoji: string;
  description: string;
  taskCount: number; // how many tasks to complete
  color: string;
}

interface GauntletRound {
  tabId: GauntletTabId;
  tabLabel: string;
  emoji: string;
  completed: boolean;
  failed: boolean;
  timeSec: number;
}

export interface GauntletState {
  active: boolean;
  currentIdx: number;
  rounds: GauntletRound[];
  done: boolean;
  failed: boolean;
  startTime: number;
  totalSec: number;
}

const GAUNTLET_KEY = "gauntlet_history";
const GAUNTLET_BADGE_KEY = "gauntlet_cleared_badge";

interface GauntletRecord {
  id: string;
  date: number;
  cleared: boolean;
  failedAt?: string;
  totalSec: number;
}

function loadGauntletHistory(): GauntletRecord[] {
  try { return JSON.parse(localStorage.getItem(GAUNTLET_KEY) ?? "[]"); } catch { return []; }
}
function saveGauntletHistory(entries: GauntletRecord[]) {
  localStorage.setItem(GAUNTLET_KEY, JSON.stringify(entries.slice(0, 20)));
}
export function hasGauntletBadge(): boolean {
  return localStorage.getItem(GAUNTLET_BADGE_KEY) === "true";
}
function awardGauntletBadge() {
  localStorage.setItem(GAUNTLET_BADGE_KEY, "true");
}

// ─── Challenge definitions ────────────────────────────────────────────────────
const CHALLENGES: GauntletChallenge[] = [
  {
    tabId: "ctci",
    tabLabel: "Practice Tracker",
    emoji: "📋",
    description: "Mark 2 CTCI problems as solved (any difficulty)",
    taskCount: 2,
    color: "violet",
  },
  {
    tabId: "coding",
    tabLabel: "Coding Interview",
    emoji: "💻",
    description: "Complete a Quick Drill session on any pattern (rate ≥3 stars)",
    taskCount: 1,
    color: "blue",
  },
  {
    tabId: "ai-round",
    tabLabel: "AI-Enabled Round",
    emoji: "🤖",
    description: "Read through the AI Round workflow and answer the reflection prompt",
    taskCount: 1,
    color: "teal",
  },
  {
    tabId: "behavioral",
    tabLabel: "Behavioral Interview",
    emoji: "🗣️",
    description: "Review 3 behavioral questions and mark them as practiced",
    taskCount: 3,
    color: "amber",
  },
  {
    tabId: "timeline",
    tabLabel: "Study Timeline",
    emoji: "📅",
    description: "Review your current week's study plan and check off 1 milestone",
    taskCount: 1,
    color: "emerald",
  },
  {
    tabId: "readiness",
    tabLabel: "Readiness",
    emoji: "📊",
    description: "Run a Fix My Weaknesses sprint (complete at least 1 problem)",
    taskCount: 1,
    color: "rose",
  },
  {
    tabId: "sysdesign",
    tabLabel: "System Design",
    emoji: "🏗️",
    description: "Work through 1 system design prompt (outline key components)",
    taskCount: 1,
    color: "slate",
  },
];

const COLOR_MAP: Record<string, string> = {
  violet: "bg-violet-100 text-violet-700 border-violet-300 dark:bg-violet-900/30 dark:text-violet-400 dark:border-violet-700",
  blue:   "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700",
  teal:   "bg-teal-100 text-teal-700 border-teal-300 dark:bg-teal-900/30 dark:text-teal-400 dark:border-teal-700",
  amber:  "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700",
  emerald:"bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700",
  rose:   "bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-700",
  slate:  "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-900/30 dark:text-slate-400 dark:border-slate-700",
};

// ─── GauntletMode component ───────────────────────────────────────────────────
interface Props {
  gauntlet: GauntletState;
  onStart: () => void;
  onAdvance: (completed: boolean) => void;
  onStop: () => void;
  onNavigateTab: (tabId: string) => void;
}

export default function GauntletMode({ gauntlet, onStart, onAdvance, onStop, onNavigateTab }: Props) {
  const [tasksDone, setTasksDone] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [history] = useState<GauntletRecord[]>(() => loadGauntletHistory());
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Elapsed timer
  useEffect(() => {
    if (gauntlet.active) {
      timerRef.current = setInterval(() => {
        setElapsed(Math.round((Date.now() - gauntlet.startTime) / 1000));
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [gauntlet.active, gauntlet.startTime]);

  // Reset task counter when round advances
  useEffect(() => {
    setTasksDone(0);
  }, [gauntlet.currentIdx]);

  const currentChallenge = CHALLENGES[gauntlet.currentIdx];
  const hasBadge = hasGauntletBadge();
  const fmt = (s: number) => `${Math.floor(s / 60)}m ${s % 60}s`;

  if (!gauntlet.active && !gauntlet.done && !gauntlet.failed) {
    return (
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sword size={16} className="text-orange-500" />
          <span className="text-sm font-bold text-foreground">Gauntlet Mode</span>
          {hasBadge && (
            <span className="ml-auto text-xs font-black bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-0.5 rounded-full">
              🏅 Gauntlet Cleared
            </span>
          )}
          {history.length > 0 && (
            <button
              onClick={() => setShowHistory(h => !h)}
              className="ml-auto text-[10px] text-muted-foreground hover:text-foreground underline"
            >
              {showHistory ? "Hide" : "History"}
            </button>
          )}
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          An unbroken run through all 7 topic tabs in sequence. Each tab has a mini-challenge.
          One failure ends the run. Complete all 7 to earn the <strong>Gauntlet Cleared</strong> badge.
        </p>

        {/* Challenge preview */}
        <div className="grid grid-cols-7 gap-1 mb-3">
          {CHALLENGES.map((c, i) => (
            <div key={c.tabId} className="flex flex-col items-center gap-0.5">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm border ${COLOR_MAP[c.color]}`}>
                {c.emoji}
              </div>
              <div className="text-[8px] text-muted-foreground text-center leading-tight">{c.tabLabel.split(" ")[0]}</div>
            </div>
          ))}
        </div>

        {showHistory && history.length > 0 && (
          <div className="mb-3 rounded-lg border border-border bg-muted/30 p-2">
            <div className="text-[10px] font-bold text-muted-foreground mb-1.5 uppercase tracking-wide">Recent Runs</div>
            <div className="space-y-1">
              {history.slice(0, 5).map(r => (
                <div key={r.id} className="flex items-center gap-2 text-[10px]">
                  <span>{r.cleared ? "✅" : "❌"}</span>
                  <span className="text-muted-foreground">{new Date(r.date).toLocaleDateString()}</span>
                  <span className={r.cleared ? "text-emerald-600 font-semibold" : "text-red-500"}>
                    {r.cleared ? "Cleared" : `Failed at ${r.failedAt}`}
                  </span>
                  <span className="ml-auto text-muted-foreground">{fmt(r.totalSec)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={onStart}
          className="w-full py-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-bold hover:from-orange-600 hover:to-red-600 transition-all flex items-center justify-center gap-2"
        >
          <Sword size={14} />
          Begin Gauntlet
        </button>
      </div>
    );
  }

  if (gauntlet.done || gauntlet.failed) {
    const cleared = gauntlet.done && !gauntlet.failed;
    const totalSec = gauntlet.totalSec;
    return (
      <div className={`rounded-xl border p-4 ${
        cleared
          ? "bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-300 dark:border-yellow-700"
          : "bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700"
      }`}>
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">{cleared ? "🏅" : "💀"}</span>
          <div className="flex-1">
            <div className={`text-base font-black ${cleared ? "text-yellow-700 dark:text-yellow-400" : "text-red-700 dark:text-red-400"}`}>
              {cleared ? "Gauntlet Cleared!" : "Gauntlet Failed"}
            </div>
            <div className="text-xs text-muted-foreground">
              {cleared ? `All 7 tabs completed in ${fmt(totalSec)}` : `Failed at: ${gauntlet.rounds.find(r => r.failed)?.tabLabel ?? "?"}`}
            </div>
          </div>
          {cleared && hasBadge && (
            <span className="text-xs font-black bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-0.5 rounded-full">Badge Earned!</span>
          )}
        </div>

        {/* Round breakdown */}
        <div className="grid grid-cols-7 gap-1 mb-3">
          {CHALLENGES.map((c, i) => {
            const round = gauntlet.rounds[i];
            const status = !round ? "pending" : round.completed ? "done" : round.failed ? "fail" : "pending";
            return (
              <div key={c.tabId} className="flex flex-col items-center gap-0.5">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm border ${
                  status === "done" ? "bg-emerald-100 border-emerald-300 dark:bg-emerald-900/30 dark:border-emerald-700" :
                  status === "fail" ? "bg-red-100 border-red-300 dark:bg-red-900/30 dark:border-red-700" :
                  "bg-muted border-border opacity-40"
                }`}>
                  {status === "done" ? "✅" : status === "fail" ? "❌" : c.emoji}
                </div>
                <div className="text-[8px] text-muted-foreground text-center leading-tight">{c.tabLabel.split(" ")[0]}</div>
                {round && round.completed && (
                  <div className="text-[8px] text-emerald-600 font-semibold">{fmt(round.timeSec)}</div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex gap-2">
          <button
            onClick={onStart}
            className="flex-1 py-1.5 rounded-lg bg-orange-500 text-white text-xs font-bold hover:bg-orange-600 transition-colors flex items-center justify-center gap-1"
          >
            <RotateCcw size={12} /> Try Again
          </button>
          <button
            onClick={onStop}
            className="px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // Active state
  return (
    <div className="rounded-xl border border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/20 p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Sword size={14} className="text-orange-600 dark:text-orange-400" />
        <span className="text-xs font-bold text-orange-700 dark:text-orange-400">
          Gauntlet — Tab {gauntlet.currentIdx + 1} of {CHALLENGES.length}
        </span>
        <span className="ml-auto text-[10px] font-mono text-orange-600 dark:text-orange-400 flex items-center gap-1">
          <Clock size={10} /> {fmt(elapsed)}
        </span>
        <button onClick={onStop} className="text-muted-foreground hover:text-foreground p-0.5 rounded">
          <X size={12} />
        </button>
      </div>

      {/* Progress rail */}
      <div className="flex items-center gap-1 mb-3">
        {CHALLENGES.map((c, i) => {
          const round = gauntlet.rounds[i];
          const isCurrent = i === gauntlet.currentIdx;
          const isPast = i < gauntlet.currentIdx;
          return (
            <div key={c.tabId} className="flex flex-col items-center gap-0.5 flex-1">
              <div className={`w-full h-1.5 rounded-full transition-all ${
                isPast ? (round?.completed ? "bg-emerald-500" : "bg-red-400") :
                isCurrent ? "bg-orange-500 animate-pulse" : "bg-orange-200 dark:bg-orange-800"
              }`} />
              <span className="text-[7px] text-muted-foreground">{c.emoji}</span>
            </div>
          );
        })}
      </div>

      {/* Current challenge */}
      {currentChallenge && (
        <div className={`rounded-lg border p-3 mb-3 ${COLOR_MAP[currentChallenge.color]}`}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{currentChallenge.emoji}</span>
            <div>
              <div className="text-xs font-bold">{currentChallenge.tabLabel}</div>
              <div className="text-[10px] opacity-80">{currentChallenge.description}</div>
            </div>
          </div>
          {/* Task counter */}
          {currentChallenge.taskCount > 1 && (
            <div className="flex items-center gap-1 mt-2">
              {Array.from({ length: currentChallenge.taskCount }).map((_, i) => (
                <div key={i} className={`flex-1 h-1.5 rounded-full ${
                  i < tasksDone ? "bg-current opacity-80" : "bg-current opacity-20"
                }`} />
              ))}
              <span className="text-[10px] ml-1 font-semibold">{tasksDone}/{currentChallenge.taskCount}</span>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => onNavigateTab(currentChallenge.tabId)}
          className="flex-1 py-1.5 rounded-lg bg-orange-500 text-white text-xs font-bold hover:bg-orange-600 transition-colors flex items-center justify-center gap-1"
        >
          Go to {currentChallenge?.tabLabel} <ChevronRight size={12} />
        </button>
        {currentChallenge?.taskCount > 1 && tasksDone < currentChallenge.taskCount && (
          <button
            onClick={() => setTasksDone(n => Math.min(n + 1, currentChallenge.taskCount))}
            className="px-3 py-1.5 rounded-lg border border-orange-300 dark:border-orange-700 text-xs font-semibold text-orange-700 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
          >
            +1 Task
          </button>
        )}
        <button
          onClick={() => onAdvance(true)}
          className="px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 transition-colors flex items-center gap-1"
          title="Mark this tab's challenge as completed"
        >
          <CheckCircle2 size={12} /> Done
        </button>
        <button
          onClick={() => onAdvance(false)}
          className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition-colors flex items-center gap-1"
          title="Mark as failed — this ends the Gauntlet run"
        >
          <XCircle size={12} /> Fail
        </button>
      </div>
    </div>
  );
}
