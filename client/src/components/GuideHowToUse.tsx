// Design: Structured Clarity — dynamic in-app guide showing real progress, feature map, 4-week plan, and advanced drills guide
import { useState, useMemo } from "react";
import {
  BookOpen, Code2, MessageSquare, Layers, Users, Zap, BarChart2,
  Bug, RotateCcw, Activity, ShieldCheck, CheckCircle2, Circle,
  ChevronDown, ChevronRight, Star, Target, Timer, Volume2, Expand,
  Shield, Map, Lightbulb, TrendingUp, Award, ArrowRight
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

// ─── localStorage helpers ──────────────────────────────────────────────────────

function readLS<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

function useProgress() {
  return useMemo(() => {
    // Coding
    const patternRatings = readLS<Record<string, number>>("pattern-ratings", {});
    const masteredPatterns = Object.values(patternRatings).filter(r => r >= 4).length;
    const totalPatterns = 14;

    // Behavioral
    const bqRatings = readLS<Record<string, number>>("bq-ratings", {});
    const readyBQs = Object.values(bqRatings).filter(r => r >= 3).length;
    const totalBQs = 34;

    // Mock sessions
    const mockHistory = readLS<any[]>("mock-interview-history", []);
    const sdHistory = readLS<any[]>("sd-mock-history", []);
    const aiHistory = readLS<any[]>("ai-round-mock-history", []);
    const totalMocks = mockHistory.length + sdHistory.length + aiHistory.length;

    // Streak
    const streak = readLS<number>("streak-count", 0);

    // Drill history
    const drillHistory = readLS<DrillAttempt[]>("advanced-drill-history", []);

    // Weak signals
    const weakSignals = readLS<any>(
      "weak-signal-analysis",
      null
    );

    // Verdict engine
    const verdictRatings = readLS<Record<string, number>>("verdict-engine-ratings", {});
    const hasVerdictData = Object.keys(verdictRatings).length > 0;

    // Week detection: simple heuristic
    let currentWeek = 1;
    if (masteredPatterns >= 4 && readyBQs >= 8) currentWeek = 2;
    if (masteredPatterns >= 8 && readyBQs >= 16 && totalMocks >= 2) currentWeek = 3;
    if (masteredPatterns >= 12 && readyBQs >= 24 && totalMocks >= 5) currentWeek = 4;

    return {
      masteredPatterns, totalPatterns,
      readyBQs, totalBQs,
      totalMocks, streak,
      drillHistory, weakSignals, hasVerdictData,
      currentWeek,
    };
  }, []);
}

// ─── Types ─────────────────────────────────────────────────────────────────────

interface DrillAttempt {
  drillId: string;
  drillName: string;
  score: number;
  date: number;
}

// ─── Quick Start section ───────────────────────────────────────────────────────

function QuickStart({ onNavigate, currentWeek }: { onNavigate: (tab: string) => void; currentWeek: number }) {
  const steps = [
    {
      num: "1",
      title: "Calibrate",
      subtitle: "Week 1",
      desc: "Run the Weak Signal Detector to find your 3 biggest gaps. Then set your interview date in the countdown bar. This tells the Study Planner how to pace your prep.",
      tab: "signals",
      tabLabel: "Go to Weak Signals",
      color: "blue",
      done: currentWeek > 1,
    },
    {
      num: "2",
      title: "Practice",
      subtitle: "Weeks 2–3",
      desc: "Work through Coding patterns (target ★4+), Behavioral stories (STAR format, IC6/IC7 bar), and System Design mocks. Use the Verdict Engine to track your overall readiness score.",
      tab: "coding",
      tabLabel: "Start Coding",
      color: "violet",
      done: currentWeek > 3,
    },
    {
      num: "3",
      title: "Simulate Pressure",
      subtitle: "Week 4",
      desc: "Run full mock sessions: Behavioral Mock, System Design Mock, and AI Round Mock. Then use Advanced Drills (Interruptor, Devil's Advocate, XFN Conflict) to stress-test your weakest areas.",
      tab: "collab",
      tabLabel: "Go to Mock Session",
      color: "rose",
      done: currentWeek >= 4,
    },
  ];

  return (
    <section>
      <div className="flex items-center gap-2 mb-5">
        <div className="w-1 h-5 rounded-full bg-blue-500" />
        <h2 className="text-lg font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Quick Start — 3 Steps
        </h2>
        <Badge variant="outline" className="text-xs border-blue-200 text-blue-600 bg-blue-50 ml-1">
          You are in Week {currentWeek}
        </Badge>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {steps.map((s) => (
          <div
            key={s.num}
            className={`relative rounded-2xl border p-5 space-y-3 transition-all ${
              s.done
                ? "border-emerald-200 bg-emerald-50/50"
                : currentWeek === parseInt(s.num)
                ? "border-blue-300 bg-blue-50/60 shadow-sm"
                : "border-gray-200 bg-white"
            }`}
          >
            {s.done && (
              <CheckCircle2 size={16} className="absolute top-4 right-4 text-emerald-500" />
            )}
            {!s.done && currentWeek === parseInt(s.num) && (
              <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            )}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black ${
              s.done ? "bg-emerald-100 text-emerald-700" :
              currentWeek === parseInt(s.num) ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500"
            }`}>
              {s.done ? <CheckCircle2 size={14} /> : s.num}
            </div>
            <div>
              <p className="font-bold text-gray-900">{s.title}</p>
              <p className="text-xs text-gray-400">{s.subtitle}</p>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">{s.desc}</p>
            <button
              onClick={() => onNavigate(s.tab)}
              className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${
                s.done ? "text-emerald-600 hover:text-emerald-700" :
                currentWeek === parseInt(s.num) ? "text-blue-600 hover:text-blue-700" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {s.tabLabel} <ArrowRight size={11} />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Feature Map section ───────────────────────────────────────────────────────

const FEATURE_GROUPS = [
  {
    group: "Coding",
    color: "blue",
    icon: <Code2 size={14} />,
    features: [
      { tab: "coding",    label: "Drill Patterns",       desc: "14 coding patterns with Quick Drill mode, spaced repetition, and AI hints. Target ★4+ on each.", when: "Daily — 20 min/day in Weeks 1–3." },
      { tab: "practice",  label: "Code Practice",        desc: "Full Monaco editor with Judge0 execution, Speed Run mode, Topic Sprint, and submission history.", when: "When you want to write real code, not just rate yourself." },
      { tab: "debug",     label: "Debug Drill",          desc: "AI-generated buggy code snippets. Find and fix the bug under time pressure.", when: "Week 3–4 to sharpen debugging speed." },
    ],
  },
  {
    group: "Behavioral",
    color: "amber",
    icon: <MessageSquare size={14} />,
    features: [
      { tab: "behavioral", label: "Tell Stories",        desc: "34 behavioral questions across 7 Meta value areas. STAR builder, IC7 Answer Upgrader, and Gap Analyzer.", when: "Daily — 15 min/day in Weeks 2–3." },
      { tab: "collab",     label: "Mock Interview",      desc: "Full 60-min mock: 30-min coding + 2×10-min behavioral. LLM debrief with IC-level scorecard.", when: "Once per week from Week 2 onward." },
    ],
  },
  {
    group: "System Design",
    color: "purple",
    icon: <Layers size={14} />,
    features: [
      { tab: "design",    label: "System Design",        desc: "8 patterns, Teach It Back mode, adversarial follow-up drill, and SD mock session with radar chart debrief.", when: "3× per week in Weeks 2–4." },
    ],
  },
  {
    group: "AI Round",
    color: "rose",
    icon: <Zap size={14} />,
    features: [
      { tab: "ai-round",  label: "AI Round Guide",       desc: "Full guide to Meta's AI-enabled coding round: 4 evaluation lenses, 6-step workflow, anti-patterns, and FAQ.", when: "Read once in Week 1. Review before your interview." },
      { tab: "ai-round",  label: "AI Round Mock",        desc: "Timed mock session for the AI-enabled round. Scenario picker, answer panels, LLM debrief.", when: "2× in Week 4." },
      { tab: "ai-round",  label: "Advanced Drills",      desc: "8 high-pressure drill modes (Interruptor, Devil's Advocate, Silent Skeptic, etc.) targeting the top rejection patterns.", when: "Week 3–4, 1–2 drills per session." },
    ],
  },
  {
    group: "Analytics & Readiness",
    color: "emerald",
    icon: <BarChart2 size={14} />,
    features: [
      { tab: "overview",  label: "Overview",             desc: "Overall readiness score (60% coding + 40% behavioral), stats cards, Instant Verdict, and Study Planner.", when: "Check daily. Run Instant Verdict weekly." },
      { tab: "signals",   label: "Weak Signals",         desc: "AI analysis of your 3 biggest gaps across 10 signal dimensions. Generates targeted 15-min drills.", when: "Run once in Week 1, then after each mock session." },
      { tab: "verdict",   label: "Verdict Engine",       desc: "Self-rate 12 rubric dimensions. Get a single IC-level verdict: IC5 / IC6 / IC7.", when: "Fill in Week 1, update after each mock." },
      { tab: "replay",    label: "Replay",               desc: "Full session replay of your mock interviews. Review transcript, scores, and coaching notes.", when: "After every mock session." },
    ],
  },
  {
    group: "Collaboration",
    color: "teal",
    icon: <Users size={14} />,
    features: [
      { tab: "collab",    label: "Collab",               desc: "Study Buddy Sync for peer mock scheduling, and the full Mock Interview Simulator.", when: "Week 2–4 for peer practice." },
    ],
  },
];

const COLOR_MAP: Record<string, string> = {
  blue:    "bg-blue-100 text-blue-700 border-blue-200",
  amber:   "bg-amber-100 text-amber-700 border-amber-200",
  purple:  "bg-purple-100 text-purple-700 border-purple-200",
  rose:    "bg-rose-100 text-rose-700 border-rose-200",
  emerald: "bg-emerald-100 text-emerald-700 border-emerald-200",
  teal:    "bg-teal-100 text-teal-700 border-teal-200",
};

function FeatureMap({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <section>
      <div className="flex items-center gap-2 mb-5">
        <div className="w-1 h-5 rounded-full bg-violet-500" />
        <h2 className="text-lg font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Feature Map — What Each Tool Does
        </h2>
      </div>
      <div className="space-y-3">
        {FEATURE_GROUPS.map((g) => (
          <div key={g.group} className="border border-gray-200 rounded-xl overflow-hidden">
            <button
              onClick={() => setExpanded(expanded === g.group ? null : g.group)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold border ${COLOR_MAP[g.color]}`}>
                  {g.icon} {g.group}
                </span>
                <span className="text-xs text-gray-400">{g.features.length} tool{g.features.length > 1 ? "s" : ""}</span>
              </div>
              {expanded === g.group ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
            </button>
            {expanded === g.group && (
              <div className="divide-y divide-gray-100">
                {g.features.map((f) => (
                  <div key={f.label} className="px-4 py-3 flex items-start gap-3 hover:bg-gray-50/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-semibold text-gray-900">{f.label}</span>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed">{f.desc}</p>
                      <p className="text-xs text-gray-400 mt-1 italic">When: {f.when}</p>
                    </div>
                    <button
                      onClick={() => onNavigate(f.tab)}
                      className="flex-shrink-0 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium mt-0.5"
                    >
                      Open <ArrowRight size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── 4-Week Learning Path ──────────────────────────────────────────────────────

const WEEKS = [
  {
    week: 1,
    phase: "Calibrate",
    color: "blue",
    days: [
      { day: "Day 1", task: "Read the AI Round Guide (AI Round tab → Guide view)", key: "guide-w1d1" },
      { day: "Day 2", task: "Run Weak Signal Detector — identify your 3 biggest gaps", key: "guide-w1d2" },
      { day: "Day 3", task: "Fill in Verdict Engine (12 rubric dimensions) — get your baseline IC level", key: "guide-w1d3" },
      { day: "Day 4", task: "Rate yourself on 5 coding patterns (★1–5) in Drill Patterns tab", key: "guide-w1d4" },
      { day: "Day 5", task: "Rate yourself on 10 behavioral questions in Tell Stories tab", key: "guide-w1d5" },
      { day: "Day 6", task: "Set your interview date in the countdown bar. Run the Study Planner.", key: "guide-w1d6" },
      { day: "Day 7", task: "Review the System Design tab — read all 8 pattern cards", key: "guide-w1d7" },
    ],
  },
  {
    week: 2,
    phase: "Fix Gaps",
    color: "violet",
    days: [
      { day: "Day 8",  task: "Drill your 2 weakest coding patterns (Quick Drill mode, 20 min)", key: "guide-w2d1" },
      { day: "Day 9",  task: "Write 3 STAR stories in Tell Stories tab (use STAR Builder)", key: "guide-w2d2" },
      { day: "Day 10", task: "System Design mock: pick 1 problem, write full design, run LLM debrief", key: "guide-w2d3" },
      { day: "Day 11", task: "Drill 2 more coding patterns. Run AI Hint on any you're stuck on.", key: "guide-w2d4" },
      { day: "Day 12", task: "Write 3 more STAR stories. Use IC7 Answer Upgrader on your weakest one.", key: "guide-w2d5" },
      { day: "Day 13", task: "Run Debug Drill (3 problems). Focus on reading stack traces fast.", key: "guide-w2d6" },
      { day: "Day 14", task: "First full Behavioral Mock (30 min). Review debrief + session replay.", key: "guide-w2d7" },
    ],
  },
  {
    week: 3,
    phase: "Simulate Pressure",
    color: "rose",
    days: [
      { day: "Day 15", task: "Code Practice: Speed Run mode (Easy difficulty, 20 min)", key: "guide-w3d1" },
      { day: "Day 16", task: "System Design: Teach It Back mode on your weakest pattern", key: "guide-w3d2" },
      { day: "Day 17", task: "Advanced Drill: The Interruptor (System Design)", key: "guide-w3d3" },
      { day: "Day 18", task: "Behavioral: Write remaining STAR stories to reach 20+ ready", key: "guide-w3d4" },
      { day: "Day 19", task: "Advanced Drill: XFN Conflict Simulator (Behavioral)", key: "guide-w3d5" },
      { day: "Day 20", task: "Code Practice: Topic Sprint on your weakest pattern area", key: "guide-w3d6" },
      { day: "Day 21", task: "Full Mock Interview (60 min: coding + behavioral). Debrief carefully.", key: "guide-w3d7" },
    ],
  },
  {
    week: 4,
    phase: "Final Sprint",
    color: "emerald",
    days: [
      { day: "Day 22", task: "Advanced Drill: Devil's Advocate Interviewer (System Design)", key: "guide-w4d1" },
      { day: "Day 23", task: "AI Round Mock Session — full timed mock", key: "guide-w4d2" },
      { day: "Day 24", task: "Advanced Drill: Time Pressure Mock (Coding)", key: "guide-w4d3" },
      { day: "Day 25", task: "System Design Mock #2 — different problem than Week 2", key: "guide-w4d4" },
      { day: "Day 26", task: "Advanced Drill: Gotcha Follow-Up (run on all 3 categories)", key: "guide-w4d5" },
      { day: "Day 27", task: "Run Instant Verdict — check your final IC-level estimate", key: "guide-w4d6" },
      { day: "Day 28", task: "Final Full Mock Interview. Review all session replays. Rest.", key: "guide-w4d7" },
    ],
  },
];

const WEEK_COLORS: Record<string, string> = {
  blue:    "border-blue-300 bg-blue-50",
  violet:  "border-violet-300 bg-violet-50",
  rose:    "border-rose-300 bg-rose-50",
  emerald: "border-emerald-300 bg-emerald-50",
};

const WEEK_BADGE: Record<string, string> = {
  blue:    "bg-blue-100 text-blue-700 border-blue-200",
  violet:  "bg-violet-100 text-violet-700 border-violet-200",
  rose:    "bg-rose-100 text-rose-700 border-rose-200",
  emerald: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

function LearningPath({ currentWeek }: { currentWeek: number }) {
  const [checked, setChecked] = useState<Record<string, boolean>>(() => {
    return readLS<Record<string, boolean>>("guide-checklist", {});
  });
  const [expandedWeek, setExpandedWeek] = useState<number>(currentWeek);

  const toggle = (key: string) => {
    const next = { ...checked, [key]: !checked[key] };
    setChecked(next);
    localStorage.setItem("guide-checklist", JSON.stringify(next));
  };

  const weekProgress = (w: typeof WEEKS[0]) => {
    const done = w.days.filter(d => checked[d.key]).length;
    return { done, total: w.days.length };
  };

  return (
    <section>
      <div className="flex items-center gap-2 mb-5">
        <div className="w-1 h-5 rounded-full bg-rose-500" />
        <h2 className="text-lg font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          4-Week Learning Path — 1 hr/day
        </h2>
        <span className="text-xs text-gray-400 ml-1">Tick off each day as you complete it</span>
      </div>
      <div className="space-y-3">
        {WEEKS.map((w) => {
          const { done, total } = weekProgress(w);
          const pct = Math.round((done / total) * 100);
          const isOpen = expandedWeek === w.week;
          const isCurrent = currentWeek === w.week;

          return (
            <div key={w.week} className={`border rounded-xl overflow-hidden ${isCurrent ? WEEK_COLORS[w.color] : "border-gray-200 bg-white"}`}>
              <button
                onClick={() => setExpandedWeek(isOpen ? 0 : w.week)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-black/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${WEEK_BADGE[w.color]}`}>
                    Week {w.week}
                  </span>
                  <span className="text-sm font-semibold text-gray-900">{w.phase}</span>
                  {isCurrent && <span className="text-xs text-blue-600 font-bold">← You are here</span>}
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${pct === 100 ? "bg-emerald-500" : "bg-blue-500"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">{done}/{total}</span>
                  </div>
                  {isOpen ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
                </div>
              </button>
              {isOpen && (
                <div className="divide-y divide-gray-100 border-t border-gray-200">
                  {w.days.map((d) => (
                    <label
                      key={d.key}
                      className="flex items-start gap-3 px-4 py-2.5 cursor-pointer hover:bg-black/5 transition-colors"
                    >
                      <div className="mt-0.5 flex-shrink-0">
                        {checked[d.key]
                          ? <CheckCircle2 size={15} className="text-emerald-500" />
                          : <Circle size={15} className="text-gray-300" />
                        }
                      </div>
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={!!checked[d.key]}
                        onChange={() => toggle(d.key)}
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold text-gray-400 mr-2">{d.day}</span>
                        <span className={`text-sm ${checked[d.key] ? "line-through text-gray-400" : "text-gray-800"}`}>
                          {d.task}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─── Advanced Drills Guide ─────────────────────────────────────────────────────

const DRILLS_GUIDE = [
  {
    id: "interruptor",
    num: 11,
    label: "The Interruptor",
    badge: "System Design",
    badgeColor: "blue",
    trains: "Recovery quality and thread maintenance when interrupted mid-explanation.",
    howToStart: "Go to AI Round → Advanced Drills → Interruptor. Write 3–5 sentences of a system design, then click 'Fire Interruption'. You'll be interrupted 3 times.",
    goodScore: "7+/10. Recovery score ≥ 4/5 means you answered the interruption AND resumed your original thread without losing context.",
    targetWeakness: "Non-Functional Requirements, Deep Dive Readiness",
  },
  {
    id: "clarification",
    num: 12,
    label: "Clarification Interrogator",
    badge: "System Design",
    badgeColor: "indigo",
    trains: "Requirements clarification instinct — identifying hidden constraints before designing.",
    howToStart: "Click 'Get Underspecified Prompt'. Ask 3 clarifying questions (one at a time). Then write your design. AI reveals which hidden constraints you missed.",
    goodScore: "7+/10. Assumption Coverage ≥ 4/5 means you surfaced most hidden constraints before designing.",
    targetWeakness: "Requirements Clarification, Tradeoff Articulation",
  },
  {
    id: "devils",
    num: 13,
    label: "Devil's Advocate",
    badge: "System Design",
    badgeColor: "purple",
    trains: "Defending technical decisions under sustained pushback without caving or becoming defensive.",
    howToStart: "Describe your system design. AI takes the opposite position on every decision. Defend your choices across 3 rounds.",
    goodScore: "7+/10. Defense Quality ≥ 4/5 means you held your position with evidence, not just repetition.",
    targetWeakness: "Tradeoff Articulation, Deep Dive Readiness",
  },
  {
    id: "silent",
    num: 14,
    label: "The Silent Skeptic",
    badge: "Behavioral",
    badgeColor: "amber",
    trains: "Reading silence and minimal feedback — knowing when to elaborate vs. when to stop.",
    howToStart: "Answer a behavioral question. AI responds with only 'Hmm.' or 'Okay.' across 3 exchanges. Score: did you read the silence correctly?",
    goodScore: "7+/10. Silence Reading ≥ 4/5 means you elaborated when needed and stopped when you had enough.",
    targetWeakness: "STAR Answer Specificity, Ownership Signals",
  },
  {
    id: "scopecreep",
    num: 15,
    label: "Scope Creep Challenger",
    badge: "System Design",
    badgeColor: "orange",
    trains: "Handling mid-design scope expansion — pushing back professionally while staying collaborative.",
    howToStart: "Start a system design. AI adds a major new requirement mid-design. Score: how well did you negotiate scope, adjust your design, and communicate trade-offs?",
    goodScore: "7+/10. Pushback Quality ≥ 4/5 means you set a boundary, explained the cost, and proposed a phased approach.",
    targetWeakness: "Requirements Clarification, Tradeoff Articulation",
  },
  {
    id: "timepressure",
    num: 16,
    label: "Time Pressure Mock",
    badge: "Coding",
    badgeColor: "green",
    trains: "Coding under time pressure with status updates — simulating the 20-min AI round format.",
    howToStart: "Describe your coding approach for a given problem. AI interrupts at the 10-min and 18-min marks asking for a status update.",
    goodScore: "7+/10. Time Awareness ≥ 4/5 means your status updates were honest, specific, and showed you knew where you were in the problem.",
    targetWeakness: "Time Management, Edge Case Coverage",
  },
  {
    id: "xfn",
    num: 17,
    label: "XFN Conflict Simulator",
    badge: "Behavioral",
    badgeColor: "teal",
    trains: "Navigating cross-functional conflict — PM disagrees with your technical recommendation.",
    howToStart: "Describe a technical decision. AI plays a PM who disagrees. 5-exchange roleplay. Score: did you find alignment without compromising technical integrity?",
    goodScore: "7+/10. Alignment Quality ≥ 4/5 means you acknowledged the PM's concern, reframed the trade-off, and proposed a path forward.",
    targetWeakness: "Ownership Signals, STAR Answer Specificity",
  },
  {
    id: "gotcha",
    num: 18,
    label: "Gotcha Follow-Up",
    badge: "All Rounds",
    badgeColor: "rose",
    trains: "Pre-empting the follow-up — anticipating the interviewer's next question before they ask it.",
    howToStart: "Answer any question. AI fires one targeted gotcha based on your weakest assumption. Score: did your follow-up answer pre-empt the gotcha, or did it catch you off guard?",
    goodScore: "7+/10. Pre-emption Awareness ≥ 4/5 means you addressed the weak assumption in your original answer.",
    targetWeakness: "Deep Dive Readiness, Tradeoff Articulation",
  },
];

const DRILL_BADGE_COLORS: Record<string, string> = {
  blue:    "bg-blue-100 text-blue-700 border-blue-200",
  indigo:  "bg-indigo-100 text-indigo-700 border-indigo-200",
  purple:  "bg-purple-100 text-purple-700 border-purple-200",
  amber:   "bg-amber-100 text-amber-700 border-amber-200",
  orange:  "bg-orange-100 text-orange-700 border-orange-200",
  green:   "bg-green-100 text-green-700 border-green-200",
  teal:    "bg-teal-100 text-teal-700 border-teal-200",
  rose:    "bg-rose-100 text-rose-700 border-rose-200",
};

function AdvancedDrillsGuide({ drillHistory, onNavigate }: { drillHistory: DrillAttempt[]; onNavigate: (tab: string) => void }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const bestScores = useMemo(() => {
    const map: Record<string, number> = {};
    for (const a of drillHistory) {
      if (!map[a.drillId] || a.score > map[a.drillId]) map[a.drillId] = a.score;
    }
    return map;
  }, [drillHistory]);

  const attemptCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const a of drillHistory) map[a.drillId] = (map[a.drillId] || 0) + 1;
    return map;
  }, [drillHistory]);

  return (
    <section>
      <div className="flex items-center gap-2 mb-5">
        <div className="w-1 h-5 rounded-full bg-rose-500" />
        <h2 className="text-lg font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Advanced Drills Guide — Drills 11–18
        </h2>
        <div className="ml-auto flex items-center gap-1">
          <Star size={12} className="text-amber-400 fill-amber-400" />
          <span className="text-xs font-bold text-amber-600">High Impact</span>
        </div>
      </div>
      <div className="space-y-2">
        {DRILLS_GUIDE.map((d) => {
          const best = bestScores[d.id];
          const attempts = attemptCounts[d.id] || 0;
          const isOpen = expanded === d.id;

          return (
            <div key={d.id} className="border border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setExpanded(isOpen ? null : d.id)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
              >
                <span className="text-xs font-black text-gray-300 w-5">#{d.num}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex-shrink-0 ${DRILL_BADGE_COLORS[d.badgeColor]}`}>
                  {d.badge}
                </span>
                <span className="text-sm font-semibold text-gray-900 flex-1">{d.label}</span>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {best !== undefined ? (
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${best >= 7 ? "bg-emerald-100 text-emerald-700" : best >= 5 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                      Best: {best}/10
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">Not attempted</span>
                  )}
                  {attempts > 0 && <span className="text-xs text-gray-400">{attempts}× tried</span>}
                  {isOpen ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
                </div>
              </button>
              {isOpen && (
                <div className="px-4 pb-4 pt-1 space-y-3 border-t border-gray-100 bg-gray-50/50">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-white rounded-lg border border-gray-200 p-3">
                      <p className="text-xs font-bold text-gray-500 mb-1 flex items-center gap-1"><Target size={10} /> What it trains</p>
                      <p className="text-xs text-gray-700 leading-relaxed">{d.trains}</p>
                    </div>
                    <div className="bg-white rounded-lg border border-gray-200 p-3">
                      <p className="text-xs font-bold text-gray-500 mb-1 flex items-center gap-1"><Lightbulb size={10} /> How to start</p>
                      <p className="text-xs text-gray-700 leading-relaxed">{d.howToStart}</p>
                    </div>
                    <div className="bg-white rounded-lg border border-gray-200 p-3">
                      <p className="text-xs font-bold text-gray-500 mb-1 flex items-center gap-1"><Award size={10} /> What a good score looks like</p>
                      <p className="text-xs text-gray-700 leading-relaxed">{d.goodScore}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-400">Targets: <span className="font-medium text-gray-600">{d.targetWeakness}</span></p>
                    <button
                      onClick={() => onNavigate("ai-round")}
                      className="flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700"
                    >
                      Open Drill <ArrowRight size={10} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─── Progress Summary bar ──────────────────────────────────────────────────────

function ProgressSummary({ masteredPatterns, totalPatterns, readyBQs, totalBQs, totalMocks, streak }: {
  masteredPatterns: number; totalPatterns: number;
  readyBQs: number; totalBQs: number;
  totalMocks: number; streak: number;
}) {
  const stats = [
    { label: "Patterns Mastered", value: `${masteredPatterns}/${totalPatterns}`, pct: Math.round((masteredPatterns / totalPatterns) * 100), color: "blue" },
    { label: "Stories Ready", value: `${readyBQs}/${totalBQs}`, pct: Math.round((readyBQs / totalBQs) * 100), color: "amber" },
    { label: "Mock Sessions", value: `${totalMocks}`, pct: Math.min(100, Math.round((totalMocks / 6) * 100)), color: "violet" },
    { label: "Day Streak", value: `${streak}d`, pct: Math.min(100, Math.round((streak / 28) * 100)), color: "rose" },
  ];

  const BAR_COLORS: Record<string, string> = {
    blue: "bg-blue-500", amber: "bg-amber-500", violet: "bg-violet-500", rose: "bg-rose-500",
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-200">
      {stats.map((s) => (
        <div key={s.label} className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">{s.label}</span>
            <span className="text-xs font-bold text-gray-900">{s.value}</span>
          </div>
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${BAR_COLORS[s.color]}`} style={{ width: `${s.pct}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main export ───────────────────────────────────────────────────────────────

export default function GuideHowToUse({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const {
    masteredPatterns, totalPatterns,
    readyBQs, totalBQs,
    totalMocks, streak,
    drillHistory, currentWeek,
  } = useProgress();

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="border-b border-gray-200 pb-6">
        <div className="flex items-center gap-2 mb-2">
          <Map size={18} className="text-blue-600" />
          <h1 className="text-2xl font-black text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            How to Use This Guide
          </h1>
        </div>
        <p className="text-sm text-gray-500 max-w-2xl">
          This guide has 40+ tools across 10 tabs. This page shows you exactly what each tool does, when to use it, and where you are in the 4-week plan — based on your actual progress.
        </p>
      </div>

      {/* Live progress summary */}
      <ProgressSummary
        masteredPatterns={masteredPatterns}
        totalPatterns={totalPatterns}
        readyBQs={readyBQs}
        totalBQs={totalBQs}
        totalMocks={totalMocks}
        streak={streak}
      />

      {/* Section 1: Quick Start */}
      <QuickStart onNavigate={onNavigate} currentWeek={currentWeek} />

      {/* Section 2: Feature Map */}
      <FeatureMap onNavigate={onNavigate} />

      {/* Section 3: 4-Week Learning Path */}
      <LearningPath currentWeek={currentWeek} />

      {/* Section 4: Advanced Drills Guide */}
      <AdvancedDrillsGuide drillHistory={drillHistory} onNavigate={onNavigate} />
    </div>
  );
}
