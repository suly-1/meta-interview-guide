// AdaptiveDifficultyIndicator — Adaptive Difficulty Engine
// Shows current difficulty level per drill and recent score trend
// getDifficulty takes a drillId, so we show overall summary from recent scores
import { trpc } from "@/lib/trpc";
import {
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
  Zap,
  Lock,
} from "lucide-react";

const LEVEL_CONFIG = {
  easy: {
    label: "Easy",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    bar: "bg-emerald-500",
    pct: 25,
    desc: "Foundational questions · Building confidence",
  },
  normal: {
    label: "Medium",
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
    bar: "bg-blue-500",
    pct: 50,
    desc: "Standard L5/L6 questions · Core competency",
  },
  hard: {
    label: "Hard",
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
    bar: "bg-amber-500",
    pct: 75,
    desc: "L6/L7 depth required · Unlocked at 7-day streak",
  },
  expert: {
    label: "Expert",
    color: "text-red-400",
    bg: "bg-red-500/10 border-red-500/20",
    bar: "bg-red-500",
    pct: 100,
    desc: "L7+ caliber · Boss Fight territory",
  },
};

const SAMPLE_DRILLS = [
  { id: "nfr-ambush", label: "NFR Ambush" },
  { id: "bottleneck-autopsy", label: "Bottleneck Autopsy" },
  { id: "scale-jump", label: "Scale Jump" },
];

function DrillDifficultyRow({
  drillId,
  label,
}: {
  drillId: string;
  label: string;
}) {
  const { data, isLoading } = trpc.engagement.getDifficulty.useQuery(
    { drillId },
    { retry: false }
  );

  if (isLoading) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-3 animate-pulse">
        <div className="h-4 bg-white/10 rounded w-1/2" />
      </div>
    );
  }

  const level = (data?.difficulty ?? "normal") as keyof typeof LEVEL_CONFIG;
  const cfg = LEVEL_CONFIG[level] ?? LEVEL_CONFIG.normal;
  const recentScores: number[] = data?.recentScores ?? [];
  const avg =
    recentScores.length > 0
      ? Math.round(
          recentScores.reduce((a, b) => a + b, 0) / recentScores.length
        )
      : null;
  const trend =
    recentScores.length >= 2
      ? recentScores[recentScores.length - 1] >
        recentScores[recentScores.length - 2]
        ? "up"
        : recentScores[recentScores.length - 1] <
            recentScores[recentScores.length - 2]
          ? "down"
          : "stable"
      : "stable";

  const TrendIcon =
    trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor =
    trend === "up"
      ? "text-emerald-400"
      : trend === "down"
        ? "text-red-400"
        : "text-muted-foreground";

  return (
    <div className={`rounded-xl border p-3 ${cfg.bg}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground">
            {label}
          </span>
          <TrendIcon size={12} className={trendColor} />
        </div>
        <span className={`text-sm font-black ${cfg.color}`}>{cfg.label}</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/10 mb-2">
        <div
          className={`h-1.5 rounded-full transition-all duration-700 ${cfg.bar}`}
          style={{ width: `${cfg.pct}%` }}
        />
      </div>
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">{cfg.desc}</div>
        {recentScores.length > 0 && (
          <div className="flex items-center gap-1">
            {recentScores.slice(-3).map((s, i) => (
              <span
                key={i}
                className={`text-xs font-bold px-1 rounded ${
                  s >= 80
                    ? "text-emerald-400"
                    : s >= 60
                      ? "text-blue-400"
                      : "text-amber-400"
                }`}
              >
                {s}
              </span>
            ))}
            {avg !== null && (
              <span className="text-xs text-muted-foreground ml-1">
                avg:{avg}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function AdaptiveDifficultyIndicator() {
  return (
    <div className="prep-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
          <Zap size={16} className="text-purple-400" />
        </div>
        <div>
          <div className="font-bold text-foreground text-sm">
            Adaptive Difficulty
          </div>
          <div className="text-xs text-muted-foreground">
            Auto-adjusts based on your last 3 scores per drill
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {SAMPLE_DRILLS.map(drill => (
          <DrillDifficultyRow
            key={drill.id}
            drillId={drill.id}
            label={drill.label}
          />
        ))}
      </div>

      <div className="mt-3 text-xs text-muted-foreground text-center">
        Score ≥80 three times → difficulty increases · Score &lt;50 → difficulty
        decreases
      </div>
    </div>
  );
}
