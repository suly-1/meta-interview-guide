/**
 * LearningPathTab — 4-Week Accelerated Meta IC6/IC7 Prep Path
 * Now with Hands-On Practice Sessions: each week has 3 embedded drills
 * that launch inline, track completion, and show a session summary.
 */

// Design: Bold Engineering Dashboard
// Dark charcoal base, Space Grotesk headings, Inter body
// Blue (Meta), Emerald (mastered), Amber (weak), Orange (streak)

import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  AlertTriangle,
  Target,
  Zap,
  Trophy,
  ChevronDown,
  ChevronUp,
  Star,
  BookOpen,
  Play,
  CheckCircle2,
  Circle,
  ArrowLeft,
  RotateCcw,
  Flame,
  Brain,
  Code2,
  Layers,
  X,
} from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { BEHAVIORAL_QUESTIONS } from "@/lib/data";

// ── Drill imports ──────────────────────────────────────────────────────────────
import RequirementsClarificationDrill from "@/components/training/RequirementsClarificationDrill";
import ComplexityFlashcardTrainer from "@/components/training/ComplexityFlashcardTrainer";
import RubberDuckExplainer from "@/components/training/RubberDuckExplainer";
import CheckpointPacer from "@/components/training/CheckpointPacer";
import CodeNavigationSpeedTest from "@/components/training/CodeNavigationSpeedTest";
import AIHallucinationSpotter from "@/components/training/AIHallucinationSpotter";
import VerbalExplanationScorer from "@/components/training/VerbalExplanationScorer";
import TestFirstDebugger from "@/components/training/TestFirstDebugger";
import EpistemicHumilityCoach from "@/components/ai-native/EpistemicHumilityCoach";
import FullMockScreeningCall from "@/components/ai-native/FullMockScreeningCall";

// ─── Types ─────────────────────────────────────────────────────────────────────
interface DrillDef {
  id: string;
  label: string;
  icon: string;
  description: string;
  badge: string;
  badgeColor: string;
  component: React.ComponentType;
}

interface WeekSession {
  week: number;
  title: string;
  subtitle: string;
  color: string;
  headerColor: string;
  accentColor: string;
  ringColor: string;
  icon: React.ReactNode;
  drills: DrillDef[];
  sessionGoal: string;
}

// ─── Rejection data ────────────────────────────────────────────────────────────
const REJECTION_ROUNDS = [
  {
    round: "System Design",
    share: 42,
    color: "bg-red-500",
    textColor: "text-red-400",
    rootCause:
      "Cannot handle interviewer interruptions; no back-of-envelope instinct; answers collapse under follow-up",
  },
  {
    round: "Coding",
    share: 31,
    color: "bg-amber-500",
    textColor: "text-amber-400",
    rootCause:
      "Silent coding (no verbal narration); wrong pattern identification in the first 2 minutes",
  },
  {
    round: "Behavioral",
    share: 27,
    color: "bg-blue-500",
    textColor: "text-blue-400",
    rootCause:
      "Story gaps across Meta's 9 focus areas; no quantified metrics; weak under adversarial follow-up",
  },
];

const WEAK_SIGNALS = {
  Coding: [
    {
      signal: "Complexity Analysis",
      detail:
        "Not stating time and space complexity after implementing a solution. Meta interviewers expect this unprompted.",
    },
    {
      signal: "Edge Case Coverage",
      detail:
        "Missing boundary inputs in test cases. Failure: not testing empty arrays, null input, negative numbers, or overflow.",
    },
    {
      signal: "Pattern Recognition Speed",
      detail:
        "Failing to identify the correct algorithm within the first 2 minutes. The first 2 minutes account for ~40% of the score signal.",
    },
  ],
  "System Design": [
    {
      signal: "Back-of-Envelope Instinct",
      detail:
        "Interviewers can tell within 2 minutes whether a candidate knows how to estimate. Candidates who skip BoE math are flagged immediately.",
    },
    {
      signal: "Observability & Monitoring",
      detail:
        "Never mentioning monitoring, alerting, logging, or observability. A strong IC6 differentiator.",
    },
    {
      signal: "Deep Dive Readiness",
      detail:
        "Giving high-level answers that collapse under follow-up. IC6/IC7 candidates must go 3 levels deep on any component.",
    },
    {
      signal: "Clarifying Questions",
      detail:
        "Starting to design or code before asking about scale, scope, and constraints. Meta interviewers flag candidates who assume rather than ask.",
    },
    {
      signal: "Time Management",
      detail:
        "Spending too long on requirements with no design, or jumping to optimisation before finishing the basic solution.",
    },
  ],
  Behavioral: [
    {
      signal: "STAR Answer Specificity",
      detail:
        "Giving vague answers without specific metrics, timelines, or outcomes. IC6/IC7 answers must include measurable impact.",
    },
    {
      signal: "Ownership Signals",
      detail:
        'Using "we" instead of "I" in behavioral answers. Meta interviewers need to understand your specific contribution.',
    },
    {
      signal: "Seniority Level Mismatch",
      detail:
        "22% of L6/L7 rejections happen because stories read at the wrong seniority level. L5-level stories told by L6 candidates are the most common down-leveling reason.",
    },
  ],
};

// ─── 4-week path ───────────────────────────────────────────────────────────────
const FOUR_WEEK_PATH = [
  {
    week: 1,
    title: "Foundation",
    goal: "Build core pattern fluency and establish daily habits.",
    color: "border-blue-500/40 bg-blue-500/5",
    headerColor: "text-blue-400",
    days: [
      {
        day: "Mon",
        task: "Master Arrays & Hashing — solve 10 CTCI problems in this topic",
        type: "CTCI",
      },
      {
        day: "Tue",
        task: "Master Two Pointers — solve 8 CTCI problems in this topic",
        type: "CTCI",
      },
      {
        day: "Wed",
        task: "Master Sliding Window — solve 8 CTCI problems in this topic",
        type: "CTCI",
      },
      {
        day: "Thu",
        task: "Complete Quick Drill for Arrays/Hashing, Two Pointers, Sliding Window",
        type: "Coding",
      },
      {
        day: "Fri",
        task: "Write 3 STAR stories for XFN Collaboration & Scope questions",
        type: "Behavioral",
      },
      {
        day: "Sat",
        task: "Set up CoderPad practice environment · Read the full AI-Enabled Round guide",
        type: "Meta-specific",
      },
      {
        day: "Sun",
        task: "Establish daily streak — practice every day this week",
        type: "Meta-specific",
      },
    ],
  },
  {
    week: 2,
    title: "Core Patterns",
    goal: "Tackle the highest-frequency Meta patterns.",
    color: "border-emerald-500/40 bg-emerald-500/5",
    headerColor: "text-emerald-400",
    days: [
      {
        day: "Mon",
        task: "Master Trees (BFS/DFS) — solve 12 CTCI problems. Know Vertical Order Traversal cold.",
        type: "CTCI",
      },
      {
        day: "Tue",
        task: "Master Graphs — solve 10 CTCI problems. Focus on Number of Islands variants.",
        type: "CTCI",
      },
      {
        day: "Wed",
        task: "Master Heaps — solve 8 CTCI problems. Know Find Median from Data Stream.",
        type: "CTCI",
      },
      {
        day: "Thu",
        task: "Complete Quick Drill for Trees, Graphs, Heaps",
        type: "Coding",
      },
      {
        day: "Fri",
        task: "Write 3 STAR stories for Analytical Leadership & Execution questions",
        type: "Behavioral",
      },
      {
        day: "Sat",
        task: "Practice one full timed mock session (45 min) using the Timed Mock feature",
        type: "Coding",
      },
      {
        day: "Sun",
        task: "Rate all behavioral questions in the Behavioral tab — identify weak areas · Practice reading and extending an unfamiliar codebase (AI-round prep)",
        type: "Behavioral / Meta",
      },
    ],
  },
  {
    week: 3,
    title: "Advanced Patterns",
    goal: "Cover remaining patterns and start mock interview practice.",
    color: "border-purple-500/40 bg-purple-500/5",
    headerColor: "text-purple-400",
    days: [
      {
        day: "Mon",
        task: "Master Binary Search Variations — solve 8 CTCI problems. Know rotated array variants.",
        type: "CTCI",
      },
      {
        day: "Tue",
        task: "Master Backtracking — solve 8 CTCI problems. Know Word Search.",
        type: "CTCI",
      },
      {
        day: "Wed",
        task: "Master Intervals, Linked Lists, Tries — solve 6 CTCI problems each",
        type: "CTCI",
      },
      {
        day: "Thu",
        task: "Complete Quick Drill for Binary Search, Backtracking, Intervals, Linked Lists, Tries",
        type: "Coding",
      },
      {
        day: "Fri",
        task: "Write 3 STAR stories for Navigating Ambiguity & Adaptability questions",
        type: "Behavioral",
      },
      {
        day: "Sat",
        task: "Complete 3 full timed mock sessions — one per day on Mon/Wed/Fri",
        type: "Coding",
      },
      {
        day: "Sun",
        task: "Practice one full AI-enabled mock: 60 min, multi-file codebase, 3 phases · Review Pattern Dependency Graph",
        type: "Meta / Coding",
      },
    ],
  },
  {
    week: 4,
    title: "Integration & Polish",
    goal: "Mixed practice, mock interviews, and final refinement.",
    color: "border-orange-500/40 bg-orange-500/5",
    headerColor: "text-orange-400",
    days: [
      {
        day: "Mon–Fri",
        task: "Solve 20 mixed-difficulty CTCI problems — no topic filtering",
        type: "CTCI",
      },
      {
        day: "Mon",
        task: "Complete Quick Drill for Monotonic Stack, Prefix Sum, Union-Find",
        type: "Coding",
      },
      {
        day: "Tue",
        task: "Finalize all 6 STAR story areas — practice out loud with a timer",
        type: "Behavioral",
      },
      {
        day: "Wed–Sun",
        task: "Complete 5 full timed mock sessions across the week",
        type: "Coding",
      },
      {
        day: "Thu",
        task: "Run the Blind Spot Detector — drill any pattern rated below 3★",
        type: "Coding",
      },
      {
        day: "Fri",
        task: "Review the Interview Day Checklist and prepare logistics",
        type: "Meta-specific",
      },
      {
        day: "Sat",
        task: "Print or save the Recruiter-Ready Summary",
        type: "Meta-specific",
      },
      {
        day: "Sun",
        task: "Day before: light review only — no new problems. Sleep 8 hours.",
        type: "Meta-specific",
      },
    ],
  },
];

// ─── Apex Picks ────────────────────────────────────────────────────────────────
const APEX_PICKS = [
  {
    rank: 1,
    title: "Weekly AI Readiness Report",
    badge: "Start Here",
    tab: "Overview",
    badgeColor: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    icon: "📊",
    description:
      "Your personalised AI-generated snapshot: top 3 action items, weak spots, and a readiness score. Start here before anything else. Every Sunday, get an honest AI assessment of where you stand — not cheerleading, but a direct grade, trajectory, and your top 3 priorities for the week ahead.",
    quote: "The coach you don't have.",
  },
  {
    rank: 2,
    title: "7-Day Sprint Plan",
    badge: "High Impact",
    tab: "Overview",
    badgeColor: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    icon: "⚡",
    description:
      "Auto-generates a day-by-day study schedule from your Readiness Report. Day 1 through Day 7 — no guesswork, just execution. The plan reads your actual performance data and builds a targeted schedule for your weakest areas.",
    quote: null,
  },
  {
    rank: 3,
    title: "Think Out Loud Coach",
    badge: "L6+ Critical",
    tab: "Coding",
    badgeColor: "bg-red-500/15 text-red-400 border-red-500/30",
    icon: "🎙️",
    description:
      "At L6+, communication IS the interview. Record your verbal narration while coding — AI scores clarity, pattern naming, and edge-case coverage. Silence during coding is the single most common rejection signal. This is the only tool that trains you to eliminate it.",
    quote: null,
  },
  {
    rank: 4,
    title: "Story Coverage Matrix",
    badge: "Must Do",
    tab: "Behavioral",
    badgeColor: "bg-purple-500/15 text-purple-400 border-purple-500/30",
    icon: "🗺️",
    description:
      "Visual matrix of your STAR stories vs Meta's 9 behavioral focus areas. Red cells = gaps you haven't covered. Fix them before your loop. You need a story for every Meta value, not just 2–3.",
    quote: null,
  },
  {
    rank: 5,
    title: "Tear Down My Design",
    badge: "Apex Favourite",
    tab: "System Design",
    badgeColor: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    icon: "🔥",
    description:
      "AI attacks your system design from 3 angles — scalability, consistency, cost. Scores your defense. The closest thing to a real L7 interviewer. Interviewers probe your weakest design point every time; this is the only tool that trains you to defend under fire.",
    quote: null,
  },
];

// ─── High Impact features ──────────────────────────────────────────────────────
const HIGH_IMPACT_FEATURES = [
  {
    title: "AI Interviewer Interrupt Mode",
    category: "System Design",
    stat: "Doesn't Exist Anywhere Else",
    statColor: "text-red-400",
    description:
      "Real Meta interviewers interrupt every 3–5 minutes. This is the only tool that simulates that. Design freely — then defend your choices under fire. The 42% system design rejection rate is driven primarily by candidates who have never practiced defending an interrupted design.",
  },
  {
    title: "Adversarial Design Review",
    category: "System Design",
    stat: "Simulates Real Design Reviews",
    statColor: "text-orange-400",
    description:
      "Paste your system design and the AI will attack its 3 weakest points — just like a senior Meta engineer in a design review. Defend each attack to build resilience. Covers scalability, consistency, and cost attack vectors.",
  },
  {
    title: "Back-of-Envelope Calculator & Grader",
    category: "System Design",
    stat: "2 Min = Pass or Fail",
    statColor: "text-amber-400",
    description:
      "Interviewers at Meta can tell within 2 minutes whether a candidate knows how to estimate. This tool grades your math accuracy, assumption quality, and whether your numbers connect to your architecture.",
  },
  {
    title: "Pattern Recognition Speed Drill",
    category: "Coding",
    stat: "First 2 Min = 40% of Score",
    statColor: "text-blue-400",
    description:
      "The first 2 minutes of a Meta coding interview are pattern identification. Train your instinct to recognise the right algorithm in under 30 seconds. Candidates who misidentify the pattern in the first 2 minutes rarely recover within the allotted time.",
  },
  {
    title: "Interviewer Persona Stress Test",
    category: "Behavioral",
    stat: "Simulates Real Interview",
    statColor: "text-purple-400",
    description:
      "The real Meta interview is 3 turns, not 1. Pick a persona (skeptical, impatient, detail-oriented), give your answer, then defend it under pressure. Scored on composure, depth, and metrics. Skeptical and impatient interviewers derail ~40% of otherwise-prepared candidates.",
  },
  {
    title: "Personalized Remediation Plan",
    category: "Coding",
    stat: "Targets Your Gaps",
    statColor: "text-emerald-400",
    description:
      "Stop studying what you already know. This plan reads your actual drill performance and builds a targeted 7-day schedule for your weakest patterns. 5 problems per weak pattern, ordered by difficulty, with dependency awareness.",
  },
  {
    title: "Weekly AI Readiness Report",
    category: "Overview / Readiness",
    stat: "The Coach You Don't Have",
    statColor: "text-violet-400",
    description:
      "Every Sunday, get an honest AI assessment of where you stand. Not cheerleading — a direct grade, trajectory, and your top 3 priorities for the week ahead. The report synthesises pattern ratings, behavioral story coverage, mock scores, and streak data into a single actionable snapshot.",
  },
];

// ─── Type badge ────────────────────────────────────────────────────────────────
const TYPE_COLOR: Record<string, string> = {
  CTCI: "bg-blue-500/10 text-blue-400",
  Coding: "bg-emerald-500/10 text-emerald-400",
  Behavioral: "bg-purple-500/10 text-purple-400",
  "Meta-specific": "bg-amber-500/10 text-amber-400",
  "Behavioral / Meta": "bg-purple-500/10 text-purple-400",
  "Meta / Coding": "bg-emerald-500/10 text-emerald-400",
};

// ─── Week session definitions ──────────────────────────────────────────────────
const WEEK_SESSIONS: WeekSession[] = [
  {
    week: 1,
    title: "Foundation",
    subtitle: "Clarify → Analyze → Narrate",
    color: "border-blue-500/40 bg-blue-500/5",
    headerColor: "text-blue-400",
    accentColor: "bg-blue-500",
    ringColor: "stroke-blue-400",
    icon: <Target size={16} className="text-blue-400" />,
    sessionGoal:
      "Train the 3 most-penalised early-interview skills: asking the right questions, stating complexity unprompted, and narrating your thinking.",
    drills: [
      {
        id: "clarification",
        label: "Requirements Clarification",
        icon: "❓",
        description:
          "2-minute timed drill. Ask the right clarifying questions before coding. Meta interviewers explicitly score this.",
        badge: "Phase 1",
        badgeColor: "bg-blue-500/15 text-blue-400 border-blue-500/30",
        component: RequirementsClarificationDrill,
      },
      {
        id: "complexity",
        label: "Complexity Flashcards",
        icon: "📊",
        description:
          "Identify Big-O time & space complexity in under 10 seconds per card. Meta Phase 3 always asks unprompted.",
        badge: "Speed Drill",
        badgeColor: "bg-purple-500/15 text-purple-400 border-purple-500/30",
        component: ComplexityFlashcardTrainer,
      },
      {
        id: "rubber-duck",
        label: "Rubber Duck Explainer",
        icon: "🦆",
        description:
          "Explain your approach out loud before writing any code. Technical Communication = 25% of Meta's rubric.",
        badge: "Communication",
        badgeColor: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
        component: RubberDuckExplainer,
      },
    ],
  },
  {
    week: 2,
    title: "Core Patterns",
    subtitle: "Pace → Explain → Debug",
    color: "border-emerald-500/40 bg-emerald-500/5",
    headerColor: "text-emerald-400",
    accentColor: "bg-emerald-500",
    ringColor: "stroke-emerald-400",
    icon: <Zap size={16} className="text-emerald-400" />,
    sessionGoal:
      "Build time-management discipline and communication under the 15/25/15 phase structure while practicing verbal explanation.",
    drills: [
      {
        id: "pacer",
        label: "Checkpoint Pacer",
        icon: "⏱",
        description:
          "Train the 15/25/15 phase rhythm with checkpoint milestones. Time management is the #2 failure mode.",
        badge: "Time Mgmt",
        badgeColor: "bg-orange-500/15 text-orange-400 border-orange-500/30",
        component: CheckpointPacer,
      },
      {
        id: "verbal",
        label: "Verbal Explanation Scorer",
        icon: "🎙",
        description:
          "Type a 90-second explanation; AI scores your Technical Communication dimension against the Meta rubric.",
        badge: "Communication",
        badgeColor: "bg-teal-500/15 text-teal-400 border-teal-500/30",
        component: VerbalExplanationScorer,
      },
      {
        id: "test-first",
        label: "Test-First Debugger",
        icon: "🧪",
        description:
          "Given only failing test output, write the fix. Meta provides failing tests in Phase 1 — most candidates ignore them.",
        badge: "Phase 1",
        badgeColor: "bg-red-500/15 text-red-400 border-red-500/30",
        component: TestFirstDebugger,
      },
    ],
  },
  {
    week: 3,
    title: "Advanced Patterns",
    subtitle: "Navigate → Spot → Explain AI",
    color: "border-purple-500/40 bg-purple-500/5",
    headerColor: "text-purple-400",
    accentColor: "bg-purple-500",
    ringColor: "stroke-purple-400",
    icon: <Brain size={16} className="text-purple-400" />,
    sessionGoal:
      "Master multi-file codebase navigation, AI output verification, and explaining AI concepts — all critical for Meta's AI-enabled round.",
    drills: [
      {
        id: "navigation",
        label: "Code Navigation Speed Test",
        icon: "🗺",
        description:
          "Navigate 3-file codebases and answer questions in 5 minutes. Meta's CoderPad has 6–10 files.",
        badge: "Phase 1",
        badgeColor: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
        component: CodeNavigationSpeedTest,
      },
      {
        id: "hallucination",
        label: "AI Hallucination Spotter",
        icon: "🧠",
        description:
          "AI gives subtly wrong code — spot the bug before the AI admits it. Critical for Meta's AI-enabled round.",
        badge: "Critical",
        badgeColor: "bg-amber-500/15 text-amber-400 border-amber-500/30",
        component: AIHallucinationSpotter,
      },
      {
        id: "epistemic",
        label: "Epistemic Humility Coach",
        icon: "🎓",
        description:
          "Answer AI philosophy questions scored by LLM on genuine learning velocity. IC7 signal for AI fluency.",
        badge: "AI Fluency",
        badgeColor: "bg-violet-500/15 text-violet-400 border-violet-500/30",
        component: EpistemicHumilityCoach,
      },
    ],
  },
  {
    week: 4,
    title: "Integration & Polish",
    subtitle: "Explain → Debug → Full Mock",
    color: "border-orange-500/40 bg-orange-500/5",
    headerColor: "text-orange-400",
    accentColor: "bg-orange-500",
    ringColor: "stroke-orange-400",
    icon: <Trophy size={16} className="text-orange-400" />,
    sessionGoal:
      "Integrate all skills under pressure. The Full Mock Screening Call is the closest simulation of a real Meta recruiter screen.",
    drills: [
      {
        id: "hallucination-2",
        label: "AI Hallucination Spotter (Hard)",
        icon: "🧠",
        description:
          "Advanced round: harder subtly-wrong AI code. Spot the bug under time pressure. Week 4 difficulty.",
        badge: "Critical",
        badgeColor: "bg-amber-500/15 text-amber-400 border-amber-500/30",
        component: AIHallucinationSpotter,
      },
      {
        id: "verbal-2",
        label: "Verbal Explanation (Advanced)",
        icon: "🎙",
        description:
          "Harder scenarios: optimization trade-offs, system-level explanations. Full rubric scoring.",
        badge: "Communication",
        badgeColor: "bg-teal-500/15 text-teal-400 border-teal-500/30",
        component: VerbalExplanationScorer,
      },
      {
        id: "full-mock",
        label: "Full Mock Screening Call",
        icon: "📞",
        description:
          "4-phase AI recruiter screen: intro, coding signal, AI fluency, behavioral. Scored on all dimensions.",
        badge: "Full Mock",
        badgeColor: "bg-rose-500/15 text-rose-400 border-rose-500/30",
        component: FullMockScreeningCall,
      },
    ],
  },
];

// ─── Progress ring SVG ─────────────────────────────────────────────────────────
function ProgressRing({
  done,
  total,
  color,
}: {
  done: number;
  total: number;
  color: string;
}) {
  const r = 20;
  const circ = 2 * Math.PI * r;
  const pct = total === 0 ? 0 : done / total;
  const offset = circ * (1 - pct);
  return (
    <svg width="52" height="52" className="shrink-0">
      <circle
        cx="26"
        cy="26"
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        className="text-muted/30"
      />
      <circle
        cx="26"
        cy="26"
        r={r}
        fill="none"
        strokeWidth="3"
        className={color}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 26 26)"
        style={{ transition: "stroke-dashoffset 0.5s ease" }}
      />
      <text
        x="26"
        y="30"
        textAnchor="middle"
        fontSize="11"
        fontWeight="700"
        className="fill-foreground"
      >
        {done}/{total}
      </text>
    </svg>
  );
}

// ─── STAR Story Prompt (inline behavioral practice) ────────────────────────────
function STARStoryPrompt({ onDone }: { onDone: () => void }) {
  const bq = BEHAVIORAL_QUESTIONS[Math.floor(Math.random() * 5)]; // Conflict & Influence area
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [wordCount, setWordCount] = useState(0);

  const handleChange = (v: string) => {
    setAnswer(v);
    setWordCount(v.trim() ? v.trim().split(/\s+/).length : 0);
  };

  const hasEnough = wordCount >= 80;

  return (
    <div className="space-y-3">
      <div className="p-3 rounded-lg border border-purple-500/30 bg-purple-500/5">
        <p className="text-xs font-semibold text-purple-400 mb-1">
          Behavioral Question — {bq.area}
        </p>
        <p className="text-sm text-foreground font-medium">{bq.q}</p>
        <p className="text-xs text-muted-foreground mt-1">Hint: {bq.hint}</p>
      </div>
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">
          Write your STAR answer. Aim for 80+ words with specific metrics.
        </p>
        <textarea
          className="w-full h-32 text-xs p-3 rounded-lg border border-border bg-card text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-blue-500/50"
          placeholder="Situation: ...\nTask: ...\nAction: ...\nResult: ..."
          value={answer}
          onChange={e => handleChange(e.target.value)}
          disabled={submitted}
        />
        <div className="flex items-center justify-between">
          <span
            className={`text-xs ${hasEnough ? "text-emerald-400" : "text-muted-foreground"}`}
          >
            {wordCount} words{" "}
            {hasEnough ? "✓" : `(need ${80 - wordCount} more)`}
          </span>
          {!submitted ? (
            <Button
              size="sm"
              disabled={!hasEnough}
              onClick={() => setSubmitted(true)}
              className="text-xs h-7"
            >
              Submit Answer
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={onDone}
              className="text-xs h-7 text-emerald-400 border-emerald-500/30"
            >
              <CheckCircle2 size={12} className="mr-1" /> Mark Complete
            </Button>
          )}
        </div>
      </div>
      {submitted && (
        <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 text-xs text-emerald-400">
          ✓ Answer recorded. Review: Does it have a specific metric? Does it use
          "I" not "we"? Does it signal the right seniority level?
        </div>
      )}
    </div>
  );
}

// ─── Session state type ────────────────────────────────────────────────────────
interface SessionState {
  completedDrills: string[]; // drill IDs completed this session
  sessionDone: boolean;
}

// ─── Week Session Card ─────────────────────────────────────────────────────────
function WeekSessionCard({
  session,
  sessionState,
  onDrillComplete,
  onResetSession,
  bestScore,
}: {
  session: WeekSession;
  sessionState: SessionState;
  onDrillComplete: (drillId: string) => void;
  onResetSession: () => void;
  bestScore?: number;
}) {
  const [activeDrill, setActiveDrill] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const done = sessionState.completedDrills.length;
  const total = session.drills.length;
  const allDone = done >= total;

  const drill = session.drills.find(d => d.id === activeDrill);
  const DrillComponent = drill?.component;

  const handleDrillDone = useCallback(
    (drillId: string) => {
      onDrillComplete(drillId);
      setActiveDrill(null);
    },
    [onDrillComplete]
  );

  // If a drill is active, show it full-width
  if (activeDrill && DrillComponent) {
    return (
      <div className={`rounded-xl border ${session.color} overflow-hidden`}>
        {/* Drill header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
          <button
            onClick={() => setActiveDrill(null)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={13} />
            Back to Week {session.week}
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm">{drill.icon}</span>
            <span className="text-xs font-semibold text-foreground">
              {drill.label}
            </span>
            <Badge className={`text-xs border ${drill.badgeColor}`}>
              {drill.badge}
            </Badge>
          </div>
          <button
            onClick={() => handleDrillDone(activeDrill)}
            className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <CheckCircle2 size={13} />
            Mark Done
          </button>
        </div>

        {/* Drill content */}
        <div className="p-4">
          <DrillComponent />
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border ${session.color} overflow-hidden`}>
      {/* Card header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <ProgressRing done={done} total={total} color={session.ringColor} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-sm font-bold ${session.headerColor}`}>
              Week {session.week} — {session.title}
            </span>
            {allDone && (
              <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-xs">
                ✓ Complete
              </Badge>
            )}
            {bestScore !== undefined && bestScore > 0 && (
              <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 text-xs">
                <Star size={10} className="mr-0.5" />
                Best: {bestScore}%
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {session.subtitle}
          </p>
        </div>
        <button
          onClick={() => setExpanded(e => !e)}
          className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
      </div>

      {/* Session goal */}
      {expanded && (
        <div className="px-4 pb-3 space-y-3">
          <p className="text-xs text-muted-foreground border-t border-border/40 pt-3">
            {session.sessionGoal}
          </p>

          {/* Drill list */}
          <div className="space-y-2">
            {session.drills.map((d, i) => {
              const isDone = sessionState.completedDrills.includes(d.id);
              return (
                <div
                  key={d.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                    isDone
                      ? "border-emerald-500/30 bg-emerald-500/5 opacity-75"
                      : "border-border bg-card hover:border-border/80"
                  }`}
                >
                  {/* Step number / check */}
                  <div
                    className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      isDone
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isDone ? <CheckCircle2 size={13} /> : i + 1}
                  </div>

                  {/* Drill info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="text-sm">{d.icon}</span>
                      <span className="text-xs font-semibold text-foreground">
                        {d.label}
                      </span>
                      <Badge className={`text-xs border ${d.badgeColor}`}>
                        {d.badge}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {d.description}
                    </p>
                  </div>

                  {/* Action */}
                  <div className="shrink-0 flex flex-col gap-1">
                    {!isDone ? (
                      <Button
                        size="sm"
                        onClick={() => setActiveDrill(d.id)}
                        className={`text-xs h-7 gap-1 ${session.accentColor} hover:opacity-90 text-white border-0`}
                      >
                        <Play size={11} />
                        Start
                      </Button>
                    ) : (
                      <button
                        onClick={() => {
                          // Allow re-doing a completed drill
                          setActiveDrill(d.id);
                        }}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Redo
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Session summary */}
          {allDone && (
            <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 space-y-2">
              <div className="flex items-center gap-2">
                <Trophy size={14} className="text-emerald-400" />
                <span className="text-xs font-semibold text-emerald-400">
                  Week {session.week} Session Complete!
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                You've completed all 3 drills for this week. Keep your streak
                going — come back tomorrow for the next session.
              </p>
              <button
                onClick={onResetSession}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <RotateCcw size={11} />
                Reset session (practice again)
              </button>
            </div>
          )}

          {/* Progress bar */}
          {!allDone && done > 0 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Session progress</span>
                <span>
                  {done}/{total} drills
                </span>
              </div>
              <Progress value={(done / total) * 100} className="h-1.5" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Section toggle ────────────────────────────────────────────────────────────
function Section({
  title,
  icon,
  children,
  defaultOpen = true,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="prep-card overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-semibold text-sm text-foreground">{title}</span>
        </div>
        {open ? (
          <ChevronUp size={15} className="text-muted-foreground" />
        ) : (
          <ChevronDown size={15} className="text-muted-foreground" />
        )}
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function LearningPathTab() {
  const [activeWeek, setActiveWeek] = useState<number | null>(null);

  // Per-week session state persisted to localStorage
  const [week1State, setWeek1State] = useLocalStorage<SessionState>(
    "meta_lp_session_w1_v1",
    { completedDrills: [], sessionDone: false }
  );
  const [week2State, setWeek2State] = useLocalStorage<SessionState>(
    "meta_lp_session_w2_v1",
    { completedDrills: [], sessionDone: false }
  );
  const [week3State, setWeek3State] = useLocalStorage<SessionState>(
    "meta_lp_session_w3_v1",
    { completedDrills: [], sessionDone: false }
  );
  const [week4State, setWeek4State] = useLocalStorage<SessionState>(
    "meta_lp_session_w4_v1",
    { completedDrills: [], sessionDone: false }
  );

  const sessionStates = [week1State, week2State, week3State, week4State];
  const setters = [setWeek1State, setWeek2State, setWeek3State, setWeek4State];

  // Server-side best scores per week
  const { data: bestScoresByWeek = {} } =
    trpc.drillSessions.getBestScoresByWeek.useQuery();
  const saveSession = trpc.drillSessions.saveSession.useMutation();

  const handleDrillComplete = useCallback(
    (weekIdx: number, drillId: string) => {
      setters[weekIdx](prev => {
        if (prev.completedDrills.includes(drillId)) return prev;
        const next = [...prev.completedDrills, drillId];
        const session = WEEK_SESSIONS[weekIdx];
        const allDone = next.length >= session.drills.length;
        // Persist to DB when all drills in the week are done
        if (allDone) {
          const drillScores = next.map(id => ({
            drillId: id,
            score: 80, // default score; individual drills can pass a real score later
            completedAt: Date.now(),
          }));
          saveSession.mutate({
            weekNumber: session.week,
            sessionScore: 80,
            drillScores,
          });
        }
        return {
          completedDrills: next,
          sessionDone: allDone,
        };
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const handleResetSession = useCallback(
    (weekIdx: number) => {
      setters[weekIdx]({ completedDrills: [], sessionDone: false });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // Overall progress
  const totalDrills = WEEK_SESSIONS.reduce((s, w) => s + w.drills.length, 0);
  const completedDrills = sessionStates.reduce(
    (s, st) => s + st.completedDrills.length,
    0
  );
  const overallPct = Math.round((completedDrills / totalDrills) * 100);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-xs font-bold tracking-wide">
            <BookOpen size={12} />
            <span>LEARNING PATH</span>
          </div>
          <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/30 text-xs">
            4-Week Accelerated
          </Badge>
          <Badge className="bg-muted text-muted-foreground border text-xs">
            1 hr / day
          </Badge>
        </div>
        <h2 className="text-lg font-bold text-foreground">
          Meta IC6/IC7 Guided Prep Path
        </h2>
        <p className="text-xs text-muted-foreground max-w-xl">
          Targets the most common Meta rejection patterns. 1 hour per day · 4
          weeks accelerated path. Always refer first to any official preparation
          materials you have received.
        </p>
      </div>

      {/* ── Hands-On Practice Sessions ─────────────────────────────────────── */}
      <div className="prep-card overflow-hidden">
        <div className="p-4 border-b border-border/50">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold">
                <Play size={10} />
                HANDS-ON PRACTICE
              </div>
              <span className="text-sm font-semibold text-foreground">
                Weekly Drill Sessions
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-xs text-muted-foreground">
                {completedDrills}/{totalDrills} drills done
              </div>
              <div className="w-24">
                <Progress value={overallPct} className="h-1.5" />
              </div>
              <span className="text-xs font-bold text-foreground">
                {overallPct}%
              </span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Each week has 3 targeted drills that address that week's core skill
            gaps. Launch a drill, complete it, and mark it done. Progress is
            saved locally.
          </p>
        </div>

        <div className="p-4 space-y-3">
          {WEEK_SESSIONS.map((session, i) => (
            <WeekSessionCard
              key={session.week}
              session={session}
              sessionState={sessionStates[i]}
              onDrillComplete={drillId => handleDrillComplete(i, drillId)}
              onResetSession={() => handleResetSession(i)}
              bestScore={bestScoresByWeek[session.week]}
            />
          ))}
        </div>
      </div>

      {/* Part 1 — Why Candidates Fail */}
      <Section
        title="Part 1 — Why Candidates Fail at Meta"
        icon={<AlertTriangle size={15} className="text-red-400" />}
      >
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Three areas account for 80% of rejections, according to candidate
            report analysis synthesised in this guide.
          </p>

          {/* Rejection bar chart */}
          <div className="space-y-3">
            {REJECTION_ROUNDS.map(r => (
              <div key={r.round}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-semibold ${r.textColor}`}>
                    {r.round}
                  </span>
                  <span className={`text-xs font-bold ${r.textColor}`}>
                    {r.share}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden mb-1">
                  <div
                    className={`h-full rounded-full ${r.color}`}
                    style={{ width: `${r.share}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">{r.rootCause}</p>
              </div>
            ))}
          </div>

          {/* Weak signal catalogue */}
          <div className="mt-4 space-y-4">
            <p className="text-xs font-semibold text-foreground">
              Weak Signal Catalogue
            </p>
            {(
              Object.entries(WEAK_SIGNALS) as [
                keyof typeof WEAK_SIGNALS,
                { signal: string; detail: string }[],
              ][]
            ).map(([category, signals]) => (
              <div key={category}>
                <p className="text-xs font-semibold text-muted-foreground mb-2">
                  {category}
                </p>
                <div className="space-y-2">
                  {signals.map(s => (
                    <div
                      key={s.signal}
                      className="pl-3 border-l-2 border-border"
                    >
                      <p className="text-xs font-semibold text-foreground">
                        {s.signal}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {s.detail}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Part 2 — 4-Week Path */}
      <Section
        title="Part 2 — The 4-Week Accelerated Learning Path (1 Hour/Day)"
        icon={<Target size={15} className="text-blue-400" />}
      >
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Each week maps to one phase of the guided learning path. One hour
            per day, every day.
          </p>

          {/* Week selector */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {FOUR_WEEK_PATH.map(w => (
              <button
                key={w.week}
                onClick={() =>
                  setActiveWeek(activeWeek === w.week ? null : w.week)
                }
                className={`p-3 rounded-lg border text-left transition-all ${
                  activeWeek === w.week
                    ? w.color + " border-opacity-80"
                    : "border-border bg-card hover:border-border/80"
                }`}
              >
                <div
                  className={`text-xs font-bold mb-0.5 ${activeWeek === w.week ? w.headerColor : "text-muted-foreground"}`}
                >
                  Week {w.week}
                </div>
                <div className="text-xs font-semibold text-foreground">
                  {w.title}
                </div>
              </button>
            ))}
          </div>

          {/* Active week detail */}
          {activeWeek !== null &&
            (() => {
              const w = FOUR_WEEK_PATH.find(x => x.week === activeWeek)!;
              return (
                <div className={`rounded-xl border p-4 ${w.color}`}>
                  <p className={`text-xs font-semibold mb-3 ${w.headerColor}`}>
                    Week {w.week} — {w.title}
                  </p>
                  <p className="text-xs text-muted-foreground mb-3">{w.goal}</p>
                  <div className="space-y-2">
                    {w.days.map((d, i) => (
                      <div
                        key={i}
                        className="grid grid-cols-[48px_1fr_auto] gap-2 items-start"
                      >
                        <span className="text-xs font-semibold text-muted-foreground pt-0.5">
                          {d.day}
                        </span>
                        <span className="text-xs text-foreground">
                          {d.task}
                        </span>
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded whitespace-nowrap ${TYPE_COLOR[d.type] ?? "bg-muted text-muted-foreground"}`}
                        >
                          {d.type}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

          {activeWeek === null && (
            <p className="text-xs text-muted-foreground text-center py-2">
              Select a week above to see the day-by-day schedule.
            </p>
          )}
        </div>
      </Section>

      {/* Part 3 — Apex Picks */}
      <Section
        title="Part 3 — Apex Picks: The 5 Features That Move the Needle Most"
        icon={<Trophy size={15} className="text-amber-400" />}
      >
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            These are the five tools with the highest return on time invested.
            If a candidate only uses five features, these are the ones.
          </p>
          <div className="space-y-3">
            {APEX_PICKS.map(p => (
              <div
                key={p.rank}
                className="flex gap-3 p-3 rounded-lg border border-border bg-card"
              >
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-amber-500/15 flex items-center justify-center text-xs font-bold text-amber-400">
                  {p.rank}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-sm font-semibold text-foreground">
                      {p.icon} {p.title}
                    </span>
                    <Badge className={`text-xs border ${p.badgeColor}`}>
                      {p.badge}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Tab: {p.tab}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {p.description}
                  </p>
                  {p.quote && (
                    <p className="text-xs text-amber-400 italic mt-1.5">
                      "{p.quote}"
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Part 4 — High Impact Features */}
      <Section
        title="Part 4 — All High Impact Features"
        icon={<Zap size={15} className="text-violet-400" />}
        defaultOpen={false}
      >
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Each feature carries the High Impact banner and targets a specific,
            quantified failure mode.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {HIGH_IMPACT_FEATURES.map((f, i) => (
              <div
                key={i}
                className="p-3 rounded-lg border border-border bg-card space-y-1.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-semibold text-foreground">
                    {f.title}
                  </span>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {f.category}
                  </span>
                </div>
                <p className={`text-xs font-semibold ${f.statColor}`}>
                  {f.stat}
                </p>
                <p className="text-xs text-muted-foreground">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>
    </div>
  );
}
