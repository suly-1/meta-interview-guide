/**
 * RoadmapJourney — 60-Day Guided Candidate Journey
 *
 * Option A + Option C combined:
 *  - Mission Control: "What should I do today?" (3 columns)
 *  - 5-Phase 60-Day Roadmap with phase gates
 *
 * Month 1 (Days 1–30): Behavioral + Coding foundation
 *   Phase 1 (Days 1–3):   Assess — rate all patterns & behavioral questions
 *   Phase 2 (Days 4–14):  Learn  — study weakest patterns, build STAR stories
 *   Phase 3 (Days 15–30): Practice — daily drills, behavioral mocks, Speed Runs
 *
 * Month 2 (Days 31–60): Full Loop preparation
 *   Phase 4 (Days 31–50): Simulate — add System Design, full loop mocks
 *   Phase 5 (Days 51–60): Ready   — Interview Day Protocol, Last-Mile Cheat Sheet
 */
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, Circle, Lock, ChevronDown, ChevronUp,
  Target, BookOpen, Zap, Shield, Star,
  Code2, MessageSquare, Layers, Calendar, ArrowRight,
  TrendingUp, AlertTriangle, Clock, Flame
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Phase {
  id: number;
  name: string;
  subtitle: string;
  days: string;
  month: 1 | 2;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  focus: string[];
  dailyHours: number;
  gateLabel: string;
  gateKey: string;
  gateThreshold: number; // 0-100 percentage
  tasks: DailyTask[];
}

interface DailyTask {
  id: string;
  label: string;
  time: string; // e.g. "20 min"
  type: "coding" | "behavioral" | "system-design" | "mock" | "review";
  tabId: string;
  priority: "primary" | "secondary";
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch { /* ignore */ }
  return fallback;
}

function computeProgress() {
  const patternRatings = loadJSON<Record<string, number>>("meta-guide-pattern-ratings", {});
  const behavioralRatings = loadJSON<Record<string, number>>("meta-guide-behavioral-ratings", {});
  const mockHistory = loadJSON<unknown[]>("meta-guide-mock-history", []);
  const sdHistory = loadJSON<unknown[]>("sd_mock_history_v1", []);
  const aiHistory = loadJSON<unknown[]>("ai_mock_session_history", []);
  const sprintHistory = loadJSON<unknown[]>("meta-guide-sprint-history", []);
  const ctciData = loadJSON<Record<number, { solved: boolean }>>("ctci_progress_v1", {});
  const interviewDate = localStorage.getItem("meta_interview_date_v1")
    ? JSON.parse(localStorage.getItem("meta_interview_date_v1")!)
    : null;

  const patternsRated = Object.keys(patternRatings).length; // out of 14
  const behavioralRated = Object.keys(behavioralRatings).length; // out of 28
  const weakPatterns = Object.values(patternRatings).filter(v => v <= 2).length;
  const weakBehavioral = Object.values(behavioralRatings).filter(v => v <= 2).length;
  const ctciSolved = Object.values(ctciData).filter(p => p.solved).length;
  const totalMocks = mockHistory.length + sdHistory.length + aiHistory.length;
  const totalSprints = sprintHistory.length;

  // Phase gate percentages
  const phase1Pct = Math.min(100, Math.round(
    ((patternsRated / 14) * 50) + ((behavioralRated / 28) * 50)
  ));
  const phase2Pct = Math.min(100, Math.round(
    ((ctciSolved / 30) * 40) + ((totalSprints / 5) * 30) + ((behavioralRated / 20) * 30)
  ));
  const phase3Pct = Math.min(100, Math.round(
    ((ctciSolved / 60) * 40) + ((totalSprints / 10) * 30) + ((totalMocks / 3) * 30)
  ));
  const phase4Pct = Math.min(100, Math.round(
    ((sdHistory.length / 3) * 40) + ((totalMocks / 6) * 40) + ((aiHistory.length / 2) * 20)
  ));
  const phase5Pct = Math.min(100, Math.round(
    ((totalMocks / 8) * 60) + ((sdHistory.length / 4) * 40)
  ));

  // Current phase (first incomplete)
  const phases = [phase1Pct, phase2Pct, phase3Pct, phase4Pct, phase5Pct];
  let currentPhase = 0;
  for (let i = 0; i < phases.length; i++) {
    if (phases[i] >= 100) currentPhase = i + 1;
    else break;
  }
  currentPhase = Math.min(currentPhase, 4); // 0-indexed, max phase 4

  // Days since start (use interview date to compute)
  let daysLeft: number | null = null;
  let dayOfPrep: number | null = null;
  if (interviewDate) {
    const diff = Math.ceil((new Date(interviewDate).getTime() - Date.now()) / 86400000);
    if (diff >= 0) {
      daysLeft = diff;
      dayOfPrep = Math.max(1, 61 - diff);
    }
  }

  return {
    patternsRated, behavioralRated, weakPatterns, weakBehavioral,
    ctciSolved, totalMocks, totalSprints, sdHistory: sdHistory.length,
    phase1Pct, phase2Pct, phase3Pct, phase4Pct, phase5Pct,
    currentPhase, daysLeft, dayOfPrep,
    isNewUser: patternsRated < 3 && behavioralRated < 3,
  };
}

// ── Phase Definitions ─────────────────────────────────────────────────────────
const PHASES: Phase[] = [
  {
    id: 1,
    name: "Assess",
    subtitle: "Know your gaps before you study",
    days: "Days 1–3",
    month: 1,
    icon: <Target size={18} />,
    color: "text-blue-400",
    bgColor: "bg-blue-950/40",
    borderColor: "border-blue-700/50",
    focus: ["Rate all 14 coding patterns", "Rate all 28 behavioral questions", "Set your interview date"],
    dailyHours: 1,
    gateLabel: "Rate ≥10 patterns + ≥15 behavioral questions",
    gateKey: "phase1",
    gateThreshold: 70,
    tasks: [
      { id: "rate-patterns", label: "Rate all 14 coding patterns (1–5 confidence)", time: "20 min", type: "coding", tabId: "coding", priority: "primary" },
      { id: "rate-behavioral", label: "Rate all 28 behavioral questions (1–5 confidence)", time: "25 min", type: "behavioral", tabId: "behavioral", priority: "primary" },
      { id: "set-date", label: "Set your interview date in the countdown widget", time: "2 min", type: "review", tabId: "overview", priority: "secondary" },
      { id: "read-ic-diff", label: "Read the IC6 vs IC7 difference guide", time: "10 min", type: "review", tabId: "overview", priority: "secondary" },
    ],
  },
  {
    id: 2,
    name: "Learn",
    subtitle: "Behavioral + Coding foundation",
    days: "Days 4–14",
    month: 1,
    icon: <BookOpen size={18} />,
    color: "text-emerald-400",
    bgColor: "bg-emerald-950/40",
    borderColor: "border-emerald-700/50",
    focus: ["Study your 3 weakest coding patterns", "Build your first 5 STAR stories", "Solve 3 CTCI problems per day"],
    dailyHours: 1,
    gateLabel: "Solve ≥30 CTCI problems + rate ≥20 behavioral questions",
    gateKey: "phase2",
    gateThreshold: 60,
    tasks: [
      { id: "ctci-daily", label: "Solve 3 CTCI problems (focus on your weakest pattern)", time: "30 min", type: "coding", tabId: "ctci", priority: "primary" },
      { id: "star-story", label: "Write 1 STAR story using the Story Builder", time: "20 min", type: "behavioral", tabId: "behavioral", priority: "primary" },
      { id: "pattern-drill", label: "Quick Drill on your weakest pattern (5 questions)", time: "10 min", type: "coding", tabId: "coding", priority: "secondary" },
    ],
  },
  {
    id: 3,
    name: "Practice",
    subtitle: "Behavioral + Coding daily reps",
    days: "Days 15–30",
    month: 1,
    icon: <Zap size={18} />,
    color: "text-amber-400",
    bgColor: "bg-amber-950/40",
    borderColor: "border-amber-700/50",
    focus: ["1 behavioral mock per day", "1 Speed Run per week", "Solve 3 CTCI problems per day"],
    dailyHours: 1,
    gateLabel: "Complete ≥3 mock sessions + ≥60 CTCI problems",
    gateKey: "phase3",
    gateThreshold: 70,
    tasks: [
      { id: "behavioral-mock", label: "Run a 30-min Behavioral Mock Interview", time: "30 min", type: "behavioral", tabId: "mock", priority: "primary" },
      { id: "ctci-daily-2", label: "Solve 3 CTCI problems (mixed difficulty)", time: "20 min", type: "coding", tabId: "ctci", priority: "primary" },
      { id: "speed-run", label: "Speed Run — 20-min timed coding challenge", time: "20 min", type: "coding", tabId: "practice", priority: "secondary" },
    ],
  },
  {
    id: 4,
    name: "Simulate",
    subtitle: "Full Loop — add System Design",
    days: "Days 31–50",
    month: 2,
    icon: <Layers size={18} />,
    color: "text-violet-400",
    bgColor: "bg-violet-950/40",
    borderColor: "border-violet-700/50",
    focus: ["2 full loop mocks per week (Coding + Behavioral + System Design)", "1 System Design mock per week", "AI-Enabled Round simulator"],
    dailyHours: 1,
    gateLabel: "Complete ≥3 System Design mocks + ≥6 full loop mocks",
    gateKey: "phase4",
    gateThreshold: 70,
    tasks: [
      { id: "full-loop-mock", label: "Full Loop Mock (Coding + Behavioral, 60 min)", time: "60 min", type: "mock", tabId: "mock", priority: "primary" },
      { id: "sd-mock", label: "System Design Mock (45 min)", time: "45 min", type: "system-design", tabId: "sysdesign", priority: "primary" },
      { id: "ai-round", label: "AI-Enabled Round Simulator (30 min)", time: "30 min", type: "mock", tabId: "ai-round", priority: "secondary" },
    ],
  },
  {
    id: 5,
    name: "Ready",
    subtitle: "Final polish + Interview Day",
    days: "Days 51–60",
    month: 2,
    icon: <Star size={18} />,
    color: "text-rose-400",
    bgColor: "bg-rose-950/40",
    borderColor: "border-rose-700/50",
    focus: ["Review Last-Mile Cheat Sheet daily", "Confidence Calibration Quiz", "Interview Day Protocol checklist"],
    dailyHours: 1,
    gateLabel: "Complete ≥8 total mocks + Interview Day Protocol",
    gateKey: "phase5",
    gateThreshold: 80,
    tasks: [
      { id: "last-mile", label: "Review Last-Mile Cheat Sheet (top patterns + stories)", time: "20 min", type: "review", tabId: "overview", priority: "primary" },
      { id: "confidence-quiz", label: "Confidence Calibration Quiz", time: "15 min", type: "review", tabId: "overview", priority: "primary" },
      { id: "interview-day", label: "Run through Interview Day Protocol checklist", time: "10 min", type: "review", tabId: "overview", priority: "secondary" },
    ],
  },
];

const TYPE_COLORS: Record<string, string> = {
  coding: "bg-blue-900/60 text-blue-300 border-blue-700/40",
  behavioral: "bg-emerald-900/60 text-emerald-300 border-emerald-700/40",
  "system-design": "bg-violet-900/60 text-violet-300 border-violet-700/40",
  mock: "bg-amber-900/60 text-amber-300 border-amber-700/40",
  review: "bg-gray-800/60 text-gray-300 border-gray-600/40",
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  coding: <Code2 size={11} />,
  behavioral: <MessageSquare size={11} />,
  "system-design": <Layers size={11} />,
  mock: <Target size={11} />,
  review: <BookOpen size={11} />,
};

// ── Mission Control ───────────────────────────────────────────────────────────
function MissionControl({ progress, onTabChange }: {
  progress: ReturnType<typeof computeProgress>;
  onTabChange: (tabId: string) => void;
}) {
  const phase = PHASES[progress.currentPhase];
  const primaryTasks = phase.tasks.filter(t => t.priority === "primary");
  const secondaryTasks = phase.tasks.filter(t => t.priority === "secondary");

  const phaseProgress = [
    progress.phase1Pct, progress.phase2Pct, progress.phase3Pct,
    progress.phase4Pct, progress.phase5Pct,
  ][progress.currentPhase];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* Column 1: Where You Are */}
      <div className="bg-gray-900/80 border border-gray-700/50 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={14} className="text-blue-400" />
          <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">Where You Are</span>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${phase.bgColor} ${phase.color} ${phase.borderColor}`}>
            {phase.icon}
            Phase {phase.id}: {phase.name}
          </span>
        </div>
        <p className="text-xs text-gray-400 mb-3">{phase.days} · {phase.subtitle}</p>
        {/* Phase progress bar */}
        <div className="mb-2">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Phase progress</span>
            <span className={phase.color}>{phaseProgress}%</span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${
                progress.currentPhase === 0 ? "bg-blue-500" :
                progress.currentPhase === 1 ? "bg-emerald-500" :
                progress.currentPhase === 2 ? "bg-amber-500" :
                progress.currentPhase === 3 ? "bg-violet-500" : "bg-rose-500"
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${phaseProgress}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </div>
        {progress.daysLeft !== null && (
          <div className="flex items-center gap-1.5 mt-3 text-xs">
            <Calendar size={11} className="text-amber-400" />
            <span className="text-amber-300 font-semibold">{progress.daysLeft} days</span>
            <span className="text-gray-500">until interview</span>
          </div>
        )}
        {progress.dayOfPrep !== null && (
          <div className="flex items-center gap-1.5 mt-1 text-xs">
            <Flame size={11} className="text-orange-400" />
            <span className="text-gray-400">Day <span className="text-white font-semibold">{progress.dayOfPrep}</span> of 60</span>
          </div>
        )}
      </div>

      {/* Column 2: Today's Mission */}
      <div className="bg-gray-900/80 border border-gray-700/50 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Target size={14} className="text-amber-400" />
          <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">Today's Mission</span>
          <span className="ml-auto text-xs text-gray-500">{phase.dailyHours}h/day</span>
        </div>
        <div className="space-y-2">
          {primaryTasks.map((task, i) => (
            <button
              key={task.id}
              onClick={() => onTabChange(task.tabId)}
              className="w-full text-left flex items-start gap-2.5 p-2.5 rounded-lg bg-gray-800/60 hover:bg-gray-800 border border-gray-700/40 hover:border-gray-600 transition-all group"
            >
              <div className={`flex-shrink-0 mt-0.5 flex items-center justify-center w-5 h-5 rounded-full border text-[10px] font-bold ${
                i === 0 ? "bg-amber-500/20 border-amber-500/50 text-amber-400" : "bg-gray-700/50 border-gray-600 text-gray-400"
              }`}>
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-200 leading-tight">{task.label}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] border ${TYPE_COLORS[task.type]}`}>
                    {TYPE_ICONS[task.type]} {task.type.replace("-", " ")}
                  </span>
                  <span className="text-[10px] text-gray-500 flex items-center gap-0.5">
                    <Clock size={9} /> {task.time}
                  </span>
                </div>
              </div>
              <ArrowRight size={12} className="flex-shrink-0 text-gray-600 group-hover:text-gray-400 transition-colors mt-1" />
            </button>
          ))}
        </div>
      </div>

      {/* Column 3: What's Next */}
      <div className="bg-gray-900/80 border border-gray-700/50 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <ArrowRight size={14} className="text-emerald-400" />
          <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">Also Today</span>
        </div>
        <div className="space-y-2 mb-4">
          {secondaryTasks.map((task) => (
            <button
              key={task.id}
              onClick={() => onTabChange(task.tabId)}
              className="w-full text-left flex items-start gap-2 p-2 rounded-lg bg-gray-800/40 hover:bg-gray-800/70 border border-gray-700/30 hover:border-gray-600 transition-all group"
            >
              <Circle size={12} className="flex-shrink-0 text-gray-600 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 group-hover:text-gray-300 leading-tight">{task.label}</p>
                <span className="text-[10px] text-gray-600 flex items-center gap-0.5 mt-0.5">
                  <Clock size={9} /> {task.time}
                </span>
              </div>
            </button>
          ))}
        </div>
        {/* Weak area alert */}
        {(progress.weakPatterns > 0 || progress.weakBehavioral > 0) && (
          <div className="flex items-start gap-2 p-2 rounded-lg bg-red-950/30 border border-red-800/30">
            <AlertTriangle size={12} className="flex-shrink-0 text-red-400 mt-0.5" />
            <p className="text-[10px] text-red-300 leading-tight">
              {progress.weakPatterns > 0 && `${progress.weakPatterns} weak coding pattern${progress.weakPatterns > 1 ? "s" : ""}`}
              {progress.weakPatterns > 0 && progress.weakBehavioral > 0 && " · "}
              {progress.weakBehavioral > 0 && `${progress.weakBehavioral} weak behavioral question${progress.weakBehavioral > 1 ? "s" : ""}`}
              {" — prioritize these today"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Phase Card ────────────────────────────────────────────────────────────────
function PhaseCard({
  phase,
  phasePct,
  isActive,
  isLocked,
  isComplete,
  onTabChange,
}: {
  phase: Phase;
  phasePct: number;
  isActive: boolean;
  isLocked: boolean;
  isComplete: boolean;
  onTabChange: (tabId: string) => void;
}) {
  const [expanded, setExpanded] = useState(isActive);

  return (
    <motion.div
      layout
      className={`rounded-xl border transition-all ${
        isActive ? `${phase.bgColor} ${phase.borderColor} shadow-lg` :
        isComplete ? "bg-gray-900/40 border-gray-700/30" :
        isLocked ? "bg-gray-900/20 border-gray-800/30 opacity-60" :
        "bg-gray-900/40 border-gray-700/30"
      }`}
    >
      {/* Header */}
      <button
        onClick={() => !isLocked && setExpanded(e => !e)}
        className="w-full flex items-center gap-3 p-4 text-left"
        disabled={isLocked}
      >
        {/* Status icon */}
        <div className={`flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full border ${
          isComplete ? "bg-emerald-900/50 border-emerald-600/50 text-emerald-400" :
          isActive ? `${phase.bgColor} ${phase.borderColor} ${phase.color}` :
          isLocked ? "bg-gray-800/50 border-gray-700/50 text-gray-600" :
          "bg-gray-800/50 border-gray-700/50 text-gray-400"
        }`}>
          {isComplete ? <CheckCircle2 size={16} /> : isLocked ? <Lock size={14} /> : phase.icon}
        </div>

        {/* Title */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-sm font-bold ${isLocked ? "text-gray-600" : isComplete ? "text-gray-300" : "text-white"}`}>
              Phase {phase.id}: {phase.name}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full border ${
              phase.month === 1
                ? "bg-blue-950/40 text-blue-400 border-blue-700/40"
                : "bg-violet-950/40 text-violet-400 border-violet-700/40"
            }`}>
              Month {phase.month}
            </span>
            <span className="text-xs text-gray-500">{phase.days}</span>
          </div>
          <p className={`text-xs mt-0.5 ${isLocked ? "text-gray-700" : "text-gray-400"}`}>{phase.subtitle}</p>
        </div>

        {/* Progress */}
        {!isLocked && (
          <div className="flex-shrink-0 flex items-center gap-2">
            <div className="hidden sm:block w-20">
              <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${
                    isComplete ? "bg-emerald-500" :
                    phase.id === 1 ? "bg-blue-500" :
                    phase.id === 2 ? "bg-emerald-500" :
                    phase.id === 3 ? "bg-amber-500" :
                    phase.id === 4 ? "bg-violet-500" : "bg-rose-500"
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${phasePct}%` }}
                  transition={{ duration: 0.6 }}
                />
              </div>
            </div>
            <span className={`text-xs font-semibold ${isComplete ? "text-emerald-400" : phase.color}`}>
              {isComplete ? "✓" : `${phasePct}%`}
            </span>
            {!isLocked && (
              <div className="text-gray-500">
                {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </div>
            )}
          </div>
        )}
      </button>

      {/* Expanded content */}
      <AnimatePresence initial={false}>
        {expanded && !isLocked && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-gray-700/30 pt-3">
              {/* Focus areas */}
              <div className="mb-3">
                <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Daily Focus ({phase.dailyHours}h/day)</p>
                <ul className="space-y-1">
                  {phase.focus.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-gray-300">
                      <CheckCircle2 size={11} className={`flex-shrink-0 mt-0.5 ${phase.color}`} />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Tasks */}
              <div className="mb-3">
                <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Daily Tasks</p>
                <div className="space-y-1.5">
                  {phase.tasks.map((task) => (
                    <button
                      key={task.id}
                      onClick={() => onTabChange(task.tabId)}
                      className="w-full text-left flex items-center gap-2 px-2.5 py-2 rounded-lg bg-gray-800/50 hover:bg-gray-800 border border-gray-700/30 hover:border-gray-600 transition-all group"
                    >
                      <span className={`flex-shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] border ${TYPE_COLORS[task.type]}`}>
                        {TYPE_ICONS[task.type]}
                      </span>
                      <span className="flex-1 text-xs text-gray-300 group-hover:text-white">{task.label}</span>
                      <span className="text-[10px] text-gray-500 flex-shrink-0 flex items-center gap-0.5">
                        <Clock size={9} /> {task.time}
                      </span>
                      <ArrowRight size={11} className="flex-shrink-0 text-gray-600 group-hover:text-gray-400" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Gate */}
              <div className={`flex items-start gap-2 p-2.5 rounded-lg border ${
                phasePct >= phase.gateThreshold
                  ? "bg-emerald-950/30 border-emerald-800/30"
                  : "bg-gray-800/40 border-gray-700/30"
              }`}>
                {phasePct >= phase.gateThreshold
                  ? <CheckCircle2 size={12} className="flex-shrink-0 text-emerald-400 mt-0.5" />
                  : <Lock size={12} className="flex-shrink-0 text-gray-500 mt-0.5" />
                }
                <p className="text-[10px] text-gray-400">
                  <span className="font-semibold text-gray-300">Unlock next phase: </span>
                  {phase.gateLabel}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Roadmap Strip (compact, shown at top of every tab) ────────────────────────
export function RoadmapStrip({ onTabChange }: { onTabChange?: (tabId: string) => void }) {
  const progress = useMemo(() => computeProgress(), []);
  const phaseProgress = [
    progress.phase1Pct, progress.phase2Pct, progress.phase3Pct,
    progress.phase4Pct, progress.phase5Pct,
  ];

  return (
    <div className="flex items-center gap-1.5 px-3 py-2 bg-gray-900/60 border border-gray-700/40 rounded-xl mb-4 overflow-x-auto scrollbar-hide">
      <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide flex-shrink-0 mr-1">60-Day Path:</span>
      {PHASES.map((phase, i) => {
        const pct = phaseProgress[i];
        const isActive = i === progress.currentPhase;
        const isComplete = pct >= 100 || i < progress.currentPhase;
        const isLocked = i > progress.currentPhase + 1;
        return (
          <div key={phase.id} className="flex items-center gap-1 flex-shrink-0">
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold border transition-all ${
              isComplete ? "bg-emerald-950/50 border-emerald-700/50 text-emerald-400" :
              isActive ? `${phase.bgColor} ${phase.borderColor} ${phase.color}` :
              isLocked ? "bg-gray-800/30 border-gray-700/30 text-gray-600" :
              "bg-gray-800/50 border-gray-700/40 text-gray-400"
            }`}>
              {isComplete ? <CheckCircle2 size={9} /> : isLocked ? <Lock size={9} /> : phase.icon}
              <span className="hidden sm:inline">{phase.name}</span>
              {isActive && <span className="text-[9px] opacity-70">({pct}%)</span>}
            </div>
            {i < PHASES.length - 1 && (
              <div className={`w-3 h-px flex-shrink-0 ${isComplete ? "bg-emerald-600/50" : "bg-gray-700/50"}`} />
            )}
          </div>
        );
      })}
      {progress.daysLeft !== null && (
        <div className="ml-auto flex-shrink-0 flex items-center gap-1 text-[10px] text-amber-400">
          <Calendar size={9} />
          <span className="font-semibold">{progress.daysLeft}d left</span>
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
interface RoadmapJourneyProps {
  onTabChange: (tabId: string) => void;
}

export default function RoadmapJourney({ onTabChange }: RoadmapJourneyProps) {
  const progress = useMemo(() => computeProgress(), []);
  const [showAllPhases, setShowAllPhases] = useState(false);

  const phaseProgress = [
    progress.phase1Pct, progress.phase2Pct, progress.phase3Pct,
    progress.phase4Pct, progress.phase5Pct,
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Shield size={16} className="text-blue-400" />
            Your 60-Day Interview Roadmap
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Month 1 (Days 1–30): Behavioral + Coding · Month 2 (Days 31–60): Full Loop
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">1h/day recommended</span>
        </div>
      </div>

      {/* Mission Control */}
      <MissionControl progress={progress} onTabChange={onTabChange} />

      {/* Month labels */}
      <div className="grid grid-cols-2 gap-3 mb-2">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-950/30 border border-blue-800/30">
          <Code2 size={13} className="text-blue-400" />
          <div>
            <p className="text-xs font-bold text-blue-300">Month 1 · Days 1–30</p>
            <p className="text-[10px] text-blue-400/70">Behavioral + Coding Foundation</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-violet-950/30 border border-violet-800/30">
          <Layers size={13} className="text-violet-400" />
          <div>
            <p className="text-xs font-bold text-violet-300">Month 2 · Days 31–60</p>
            <p className="text-[10px] text-violet-400/70">Full Loop: + System Design</p>
          </div>
        </div>
      </div>

      {/* Phase cards */}
      <div className="space-y-2">
        {PHASES.map((phase, i) => {
          const isActive = i === progress.currentPhase;
          const isComplete = phaseProgress[i] >= 100 || i < progress.currentPhase;
          const isLocked = i > progress.currentPhase + 1;
          const show = showAllPhases || isActive || isComplete || i === progress.currentPhase + 1;

          if (!show) return null;

          return (
            <PhaseCard
              key={phase.id}
              phase={phase}
              phasePct={phaseProgress[i]}
              isActive={isActive}
              isLocked={isLocked}
              isComplete={isComplete}
              onTabChange={onTabChange}
            />
          );
        })}
      </div>

      {/* Show all phases toggle */}
      {!showAllPhases && progress.currentPhase < 3 && (
        <button
          onClick={() => setShowAllPhases(true)}
          className="w-full flex items-center justify-center gap-2 py-2 text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          <ChevronDown size={13} />
          Show all 5 phases
        </button>
      )}

      {/* Disclaimer */}
      <p className="text-[10px] text-gray-600 text-center pt-2">
        This roadmap is based on candidate reports and community feedback. Results may vary. Consistent daily practice is the most reliable predictor of improvement.
      </p>
    </div>
  );
}
