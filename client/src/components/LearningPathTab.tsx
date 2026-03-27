// Learning Path Tab
// Audience: Engineers preparing for Meta IC6/IC7 loops.
// Content: Rejection stats, 4-week accelerated path, Apex Picks, High Impact features.
// 4-week path only — 8-week path excluded per user instruction.

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  Target,
  Zap,
  Trophy,
  ChevronDown,
  ChevronUp,
  Star,
  Flame,
  BookOpen,
  Brain,
  Code2,
  Layers,
} from "lucide-react";

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

      {/* Part 4 — Apex Picks */}
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

      {/* Part 5 — High Impact Features */}
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
