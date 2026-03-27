/**
 * AIStudySessionPlanner — Generates a structured 30/60/90-min study session plan.
 * Automatically prepends any SRS patterns due today as the first block.
 * Uses the candidate's mastery scores and weak patterns to personalise the plan.
 */
import { useState, useMemo } from "react";
import { PATTERNS } from "@/lib/guideData";
import { Sparkles, Clock, Brain, Zap, RotateCcw, CalendarCheck, ChevronRight } from "lucide-react";

// ── SRS helpers (reads "meta-guide-srs-schedule") ────────────────────────────
interface SRSEntry {
  patternId: string;
  nextReview: string; // "YYYY-MM-DD"
  interval: number;
  lastRating: number;
  lastReviewed: string;
}

function getTodayStr(): string {
  return new Date().toISOString().split("T")[0];
}

function getDueTodayPatterns(): string[] {
  try {
    const schedule: Record<string, SRSEntry> = JSON.parse(
      localStorage.getItem("meta-guide-srs-schedule") ?? "{}"
    );
    const today = getTodayStr();
    return Object.values(schedule)
      .filter(e => e.nextReview <= today)
      .map(e => {
        // patternId may be a slug — find matching PATTERNS name
        const match = PATTERNS.find(
          p => p.id === e.patternId || p.name.toLowerCase().replace(/\s+/g, "-") === e.patternId
        );
        return match?.name ?? e.patternId;
      });
  } catch {
    return [];
  }
}

function getWeakPatterns(n: number): string[] {
  try {
    const mastery: Record<string, number> = JSON.parse(
      localStorage.getItem("meta_pattern_mastery") ?? "{}"
    );
    return PATTERNS
      .map(p => ({ name: p.name, score: mastery[p.name] ?? 0 }))
      .sort((a, b) => a.score - b.score)
      .slice(0, n)
      .map(p => p.name);
  } catch {
    return PATTERNS.slice(0, n).map(p => p.name);
  }
}

// ── Plan block types ──────────────────────────────────────────────────────────
interface PlanBlock {
  type: "srs-review" | "warm-up" | "deep-practice" | "sprint" | "mock" | "debrief";
  title: string;
  durationMin: number;
  description: string;
  patterns?: string[];
  tag: "review" | "practice" | "mock" | "meta";
}

const TAG_STYLES: Record<string, string> = {
  review:   "bg-emerald-100 text-emerald-700 border-emerald-200",
  practice: "bg-blue-100 text-blue-700 border-blue-200",
  mock:     "bg-violet-100 text-violet-700 border-violet-200",
  meta:     "bg-orange-100 text-orange-900 border-orange-200",
};

function buildPlan(durationMin: 30 | 60 | 90): PlanBlock[] {
  const dueToday = getDueTodayPatterns();
  const weakPatterns = getWeakPatterns(3);
  const blocks: PlanBlock[] = [];

  // ── Always prepend SRS reviews if due today ──
  if (dueToday.length > 0) {
    const reviewMin = Math.min(durationMin === 30 ? 8 : durationMin === 60 ? 12 : 15, dueToday.length * 4);
    blocks.push({
      type: "srs-review",
      title: "📅 SRS Reviews Due Today",
      durationMin: reviewMin,
      description: `Review ${dueToday.length} pattern${dueToday.length > 1 ? "s" : ""} scheduled for today. Rate each one after reviewing to reschedule.`,
      patterns: dueToday.slice(0, 5),
      tag: "review",
    });
  }

  const remaining = durationMin - blocks.reduce((s, b) => s + b.durationMin, 0);

  if (durationMin === 30) {
    // 30-min plan: warm-up sprint + one deep problem
    blocks.push({
      type: "warm-up",
      title: "⚡ Pattern Sprint Warm-up",
      durationMin: Math.min(10, remaining - 10),
      description: "Run a quick Sprint Mode session to activate pattern recognition. Aim for ≥ 6/8 correct.",
      tag: "practice",
    });
    blocks.push({
      type: "deep-practice",
      title: `🧠 Deep Practice — ${weakPatterns[0] ?? "Weak Pattern"}`,
      durationMin: remaining - Math.min(10, remaining - 10),
      description: `Pick one medium problem from your weakest pattern (${weakPatterns[0] ?? "N/A"}). Write a full approach before coding. Aim for optimal complexity.`,
      patterns: weakPatterns.slice(0, 1),
      tag: "practice",
    });
  } else if (durationMin === 60) {
    // 60-min plan: sprint + two deep problems + debrief
    blocks.push({
      type: "warm-up",
      title: "⚡ Pattern Sprint Warm-up",
      durationMin: 10,
      description: "Sprint Mode — 8 problems, 30 seconds each. Focus on pattern recognition speed.",
      tag: "practice",
    });
    blocks.push({
      type: "deep-practice",
      title: `🧠 Deep Practice — ${weakPatterns[0] ?? "Weak Pattern 1"}`,
      durationMin: 20,
      description: `Solve one medium/hard problem from ${weakPatterns[0] ?? "your weakest pattern"}. Verbalise your approach out loud before writing code.`,
      patterns: weakPatterns.slice(0, 1),
      tag: "practice",
    });
    blocks.push({
      type: "deep-practice",
      title: `🧠 Deep Practice — ${weakPatterns[1] ?? "Weak Pattern 2"}`,
      durationMin: 20,
      description: `Solve one medium problem from ${weakPatterns[1] ?? "your second weakest pattern"}. Focus on clean code and edge cases.`,
      patterns: weakPatterns.slice(1, 2),
      tag: "practice",
    });
    const debriefMin = remaining - 50;
    if (debriefMin > 0) {
      blocks.push({
        type: "debrief",
        title: "📝 Session Debrief",
        durationMin: debriefMin,
        description: "Log the session in the Coding Session Debrief. Note what clicked, what didn't, and one thing to improve tomorrow.",
        tag: "meta",
      });
    }
  } else {
    // 90-min plan: sprint + three deep problems + mock + debrief
    blocks.push({
      type: "warm-up",
      title: "⚡ Pattern Sprint Warm-up",
      durationMin: 10,
      description: "Sprint Mode — 8 problems, 30 seconds each. Activate pattern recognition before deep work.",
      tag: "practice",
    });
    weakPatterns.slice(0, 3).forEach((pattern, i) => {
      blocks.push({
        type: "deep-practice",
        title: `🧠 Deep Practice — ${pattern}`,
        durationMin: 20,
        description: `Problem ${i + 1}: Solve one medium/hard problem from ${pattern}. Verbalise approach, write clean code, walk through test cases.`,
        patterns: [pattern],
        tag: "practice",
      });
    });
    blocks.push({
      type: "mock",
      title: "🎯 Timed Mock Problem",
      durationMin: 20,
      description: "Pick a random hard problem. Set a 20-minute timer. No hints. Simulate real interview conditions — approach first, then code.",
      tag: "mock",
    });
    const debriefMin = remaining - 90;
    if (debriefMin > 0) {
      blocks.push({
        type: "debrief",
        title: "📝 Session Debrief",
        durationMin: debriefMin,
        description: "Log the session. Rate your performance on each block. Identify the one pattern to focus on tomorrow.",
        tag: "meta",
      });
    }
  }

  return blocks;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function AIStudySessionPlanner() {
  const [duration, setDuration] = useState<30 | 60 | 90 | null>(null);
  const [generated, setGenerated] = useState(false);

  const dueToday = useMemo(() => getDueTodayPatterns(), []);

  const plan = useMemo(() => {
    if (!generated || !duration) return [];
    return buildPlan(duration);
  }, [generated, duration]);

  const totalMin = plan.reduce((s, b) => s + b.durationMin, 0);

  const handleGenerate = () => {
    if (!duration) return;
    setGenerated(true);
  };

  const handleReset = () => {
    setGenerated(false);
    setDuration(null);
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 bg-violet-100 rounded-xl">
          <Sparkles size={20} className="text-violet-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            AI Study Session Planner
          </h3>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Generates a personalised plan based on your weak patterns and SRS reviews
          </p>
        </div>
      </div>

      {/* SRS due-today banner */}
      {dueToday.length > 0 && (
        <div className="flex items-start gap-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3 mb-4">
          <CalendarCheck size={14} className="text-emerald-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-emerald-700 dark:text-emerald-300 leading-relaxed">
            <span className="font-bold">{dueToday.length} SRS review{dueToday.length > 1 ? "s" : ""} due today</span> — will be automatically prepended to your plan as the first block.
          </p>
        </div>
      )}

      {!generated ? (
        <>
          {/* Duration picker */}
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">How much time do you have?</p>
          <div className="grid grid-cols-3 gap-3 mb-5">
            {([30, 60, 90] as const).map(d => (
              <button
                key={d}
                onClick={() => setDuration(d)}
                className={`flex flex-col items-center gap-1.5 py-4 rounded-xl border-2 font-bold transition-all ${
                  duration === d
                    ? "border-violet-500 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300"
                    : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-violet-300"
                }`}
              >
                <Clock size={18} className={duration === d ? "text-violet-600" : "text-gray-600"} />
                <span className="text-lg">{d}</span>
                <span className="text-xs font-normal">minutes</span>
              </button>
            ))}
          </div>

          <button
            onClick={handleGenerate}
            disabled={!duration}
            className="w-full flex items-center justify-center gap-2 py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors shadow-sm"
          >
            <Sparkles size={15} /> Generate My Plan
          </button>
        </>
      ) : (
        <>
          {/* Plan header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Brain size={16} className="text-violet-600" />
              <span className="text-sm font-bold text-gray-700 dark:text-gray-200">
                {duration}-minute session plan
              </span>
              <span className="text-xs text-gray-600">({totalMin} min total)</span>
            </div>
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <RotateCcw size={12} /> New Plan
            </button>
          </div>

          {/* Timeline */}
          <div className="space-y-3">
            {plan.map((block, i) => (
              <div key={i} className="flex gap-3">
                {/* Timeline dot + line */}
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                    block.type === "srs-review"
                      ? "bg-emerald-100 border-emerald-400 text-emerald-700"
                      : block.type === "warm-up"
                      ? "bg-yellow-100 border-yellow-400 text-yellow-700"
                      : block.type === "mock"
                      ? "bg-violet-100 border-violet-400 text-violet-700"
                      : block.type === "debrief"
                      ? "bg-orange-100 border-orange-400 text-orange-900"
                      : "bg-blue-100 border-blue-400 text-blue-700"
                  }`}>
                    {i + 1}
                  </div>
                  {i < plan.length - 1 && (
                    <div className="w-0.5 flex-1 bg-gray-200 dark:bg-gray-700 mt-1" style={{ minHeight: "1.5rem" }} />
                  )}
                </div>

                {/* Block content */}
                <div className="flex-1 pb-3">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 leading-tight">
                      {block.title}
                    </h4>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${TAG_STYLES[block.tag]}`}>
                        {block.tag}
                      </span>
                      <span className="text-xs text-gray-600 font-semibold whitespace-nowrap">{block.durationMin} min</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">{block.description}</p>
                  {block.patterns && block.patterns.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {block.patterns.map(p => (
                        <span key={p} className="text-[10px] px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-200 rounded-full font-medium">
                          {p}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Start session CTA */}
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center gap-2">
            <Zap size={14} className="text-violet-500" />
            <p className="text-xs text-gray-700 dark:text-gray-300 flex-1">
              Start your Pomodoro timer, then work through each block in order. Log the session in the Debrief panel when done.
            </p>
            <ChevronRight size={14} className="text-gray-700" />
          </div>
        </>
      )}
    </div>
  );
}
