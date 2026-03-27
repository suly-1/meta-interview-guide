/**
 * Adaptive Study Plan Generator
 * Reads the user's latest mock scores from localStorage, calls the AI to
 * generate a personalized 7-day plan, and renders it as a day-by-day timeline.
 */
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  Loader2,
  RefreshCw,
  Target,
  AlertTriangle,
  CheckCircle2,
  Clock,
  BookOpen,
  Code2,
  Users,
  Layers,
} from "lucide-react";

// ── helpers ──────────────────────────────────────────────────────────────────

function readLatestFullMockScores(): {
  codingScore: number;
  systemDesignScore: number;
  behavioralScore: number;
  xfnScore: number;
} | null {
  try {
    const raw = localStorage.getItem("meta_full_mock_history_v1");
    if (!raw) return null;
    const arr = JSON.parse(raw) as Array<{
      overallScore?: number;
      roundResults?: Array<{ label: string; overallScore: number }>;
    }>;
    if (!arr.length) return null;
    const last = arr[arr.length - 1];
    const rounds = last.roundResults ?? [];
    const get = (label: string) =>
      rounds.find(r => r.label.toLowerCase().includes(label))?.overallScore ??
      3;
    return {
      codingScore: get("coding"),
      systemDesignScore: get("system") || get("design"),
      behavioralScore: get("behavioral") || get("star"),
      xfnScore: get("xfn"),
    };
  } catch {
    return null;
  }
}

function readWeakPatterns(): string[] {
  try {
    const raw = localStorage.getItem("meta_pattern_ratings_v1");
    if (!raw) return [];
    const ratings = JSON.parse(raw) as Record<string, number>;
    return Object.entries(ratings)
      .filter(([, v]) => v <= 2)
      .map(([k]) => k)
      .slice(0, 5);
  } catch {
    return [];
  }
}

const TASK_ICONS: Record<string, React.ReactNode> = {
  coding: <Code2 size={12} />,
  sysdesign: <Layers size={12} />,
  behavioral: <BookOpen size={12} />,
  xfn: <Users size={12} />,
  review: <CheckCircle2 size={12} />,
};

const TASK_COLORS: Record<string, string> = {
  coding: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  sysdesign: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  behavioral: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  xfn: "bg-teal-500/20 text-teal-300 border-teal-500/30",
  review: "bg-amber-500/20 text-amber-300 border-amber-500/30",
};

// ── component ─────────────────────────────────────────────────────────────────

interface StudyPlan {
  overallReadiness: string;
  primaryFocus: string;
  days: {
    day: number;
    theme: string;
    tasks: {
      type: string;
      title: string;
      duration: string;
      description: string;
    }[];
    dailyGoal: string;
  }[];
  weekSummary: string;
  keyRisk: string;
}

export function AdaptiveStudyPlan() {
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [expanded, setExpanded] = useState<number | null>(0);
  const [targetLevel, setTargetLevel] = useState("L6");
  const [daysUntil, setDaysUntil] = useState(14);
  const [isOpen, setIsOpen] = useState(false);

  const mutation = trpc.ai.adaptiveStudyPlan.useMutation({
    onSuccess: data => {
      setPlan(data);
      setExpanded(0);
      toast.success("7-day study plan generated!");
    },
    onError: () => toast.error("Failed to generate plan. Try again."),
  });

  const latestScores = readLatestFullMockScores();
  const weakPatterns = readWeakPatterns();

  const handleGenerate = () => {
    mutation.mutate({
      codingScore: latestScores?.codingScore ?? 3,
      systemDesignScore: latestScores?.systemDesignScore ?? 3,
      behavioralScore: latestScores?.behavioralScore ?? 3,
      xfnScore: latestScores?.xfnScore ?? 3,
      targetLevel,
      daysUntilInterview: daysUntil,
      weakPatterns,
    });
  };

  const readiness = plan ? parseInt(plan.overallReadiness) : null;

  return (
    <div className="prep-card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-blue-400" />
          <span className="section-title text-sm mb-0 pb-0 border-0">
            Adaptive Study Plan
          </span>
        </div>
        <button
          onClick={() => setIsOpen(o => !o)}
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
        >
          {isOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          {isOpen ? "Collapse" : "Configure & Generate"}
        </button>
      </div>

      {/* Config panel */}
      {isOpen && (
        <div className="rounded-lg bg-secondary border border-border p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Target Level
              </label>
              <select
                value={targetLevel}
                onChange={e => setTargetLevel(e.target.value)}
                className="w-full text-xs rounded-lg bg-background border border-border px-3 py-2 text-foreground"
              >
                {["L4", "L5", "L6", "L7"].map(l => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Days Until Interview
              </label>
              <input
                type="number"
                min={1}
                max={90}
                value={daysUntil}
                onChange={e => setDaysUntil(Number(e.target.value))}
                className="w-full text-xs rounded-lg bg-background border border-border px-3 py-2 text-foreground"
              />
            </div>
          </div>

          {latestScores ? (
            <div className="text-xs text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 size={11} />
              Using your latest Full Mock Day scores as baseline
            </div>
          ) : (
            <div className="text-xs text-amber-400 flex items-center gap-1.5">
              <AlertTriangle size={11} />
              No mock scores found — using default 3/5 baseline. Complete a Full
              Mock Day first for a personalized plan.
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={mutation.isPending}
            className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-sm font-semibold text-white transition-all flex items-center justify-center gap-2"
          >
            {mutation.isPending ? (
              <>
                <Loader2 size={13} className="animate-spin" /> Generating
                plan...
              </>
            ) : (
              <>
                <Calendar size={13} /> Generate 7-Day Plan
              </>
            )}
          </button>
        </div>
      )}

      {/* Plan output */}
      {plan && (
        <div className="space-y-3">
          {/* Summary bar */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg bg-secondary border border-border p-3 text-center">
              <div className="text-xs text-muted-foreground mb-0.5">
                Readiness
              </div>
              <div
                className={`text-xl font-bold ${
                  (readiness ?? 0) >= 75
                    ? "text-emerald-400"
                    : (readiness ?? 0) >= 50
                      ? "text-amber-400"
                      : "text-red-400"
                }`}
              >
                {plan.overallReadiness}%
              </div>
            </div>
            <div className="rounded-lg bg-secondary border border-border p-3 col-span-2">
              <div className="text-xs text-muted-foreground mb-0.5">
                Primary Focus
              </div>
              <div className="text-xs font-semibold text-foreground leading-snug">
                {plan.primaryFocus}
              </div>
            </div>
          </div>

          {/* Week summary */}
          <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3">
            <div className="text-xs text-blue-300 font-semibold mb-1">
              📅 This Week
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {plan.weekSummary}
            </p>
          </div>

          {/* Day-by-day */}
          <div className="space-y-2">
            {plan.days.map((day, i) => (
              <div
                key={day.day}
                className="rounded-lg border border-border overflow-hidden"
              >
                <button
                  onClick={() => setExpanded(expanded === i ? null : i)}
                  className="w-full flex items-center justify-between px-3 py-2.5 bg-secondary hover:bg-secondary transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-blue-400 w-12">
                      Day {day.day}
                    </span>
                    <span className="text-xs font-semibold text-foreground">
                      {day.theme}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {day.tasks.length} tasks
                    </span>
                    {expanded === i ? (
                      <ChevronUp size={12} />
                    ) : (
                      <ChevronDown size={12} />
                    )}
                  </div>
                </button>

                {expanded === i && (
                  <div className="p-3 space-y-2 bg-background">
                    {day.tasks.map((task, j) => (
                      <div
                        key={j}
                        className={`rounded-lg border p-2.5 ${TASK_COLORS[task.type] ?? TASK_COLORS.review}`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5 text-xs font-semibold">
                            {TASK_ICONS[task.type] ?? <Target size={12} />}
                            {task.title}
                          </div>
                          <div className="flex items-center gap-1 text-xs opacity-70">
                            <Clock size={10} />
                            {task.duration}
                          </div>
                        </div>
                        <p className="text-xs opacity-80 leading-relaxed">
                          {task.description}
                        </p>
                      </div>
                    ))}
                    <div className="text-xs text-emerald-400 font-medium pt-1">
                      ✓ Goal: {day.dailyGoal}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Key risk */}
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 flex items-start gap-2">
            <AlertTriangle size={12} className="text-red-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs text-red-400 font-semibold mb-0.5">
                Key Risk
              </div>
              <p className="text-xs text-muted-foreground">{plan.keyRisk}</p>
            </div>
          </div>

          {/* Regenerate */}
          <button
            onClick={handleGenerate}
            disabled={mutation.isPending}
            className="w-full py-1.5 rounded-lg bg-secondary hover:bg-slate-600 disabled:opacity-50 text-xs text-muted-foreground transition-all flex items-center justify-center gap-1.5"
          >
            <RefreshCw size={11} /> Regenerate Plan
          </button>
        </div>
      )}

      {!plan && !isOpen && (
        <div className="text-center py-6 text-muted-foreground">
          <Calendar size={28} className="mx-auto mb-2 opacity-30" />
          <p className="text-xs">
            Generate a personalized 7-day plan based on your mock scores.
          </p>
          <button
            onClick={() => setIsOpen(true)}
            className="mt-3 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white transition-all"
          >
            Get My Plan
          </button>
        </div>
      )}
    </div>
  );
}
