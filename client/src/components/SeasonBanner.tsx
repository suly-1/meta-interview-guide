// SeasonBanner — Interview Seasons: 4-week themed challenges with leaderboards
// Shows active season, progress, and top performers
// getActiveSeason returns { season, userScore, leaderboard, daysLeft }
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Trophy, ChevronDown, ChevronUp, Loader2 } from "lucide-react";

const SEASON_THEMES: Record<
  string,
  { color: string; bg: string; icon: string }
> = {
  "system-design": {
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
    icon: "🏗️",
  },
  coding: {
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    icon: "💻",
  },
  behavioral: {
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
    icon: "🎯",
  },
  "ai-native": {
    color: "text-purple-400",
    bg: "bg-purple-500/10 border-purple-500/20",
    icon: "✦",
  },
  "full-stack": {
    color: "text-red-400",
    bg: "bg-red-500/10 border-red-500/20",
    icon: "⚡",
  },
};

function ProgressRing({ pct, size = 48 }: { pct: number; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct / 100);
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.1)"
        strokeWidth={4}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="rgb(59,130,246)"
        strokeWidth={4}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-700"
      />
    </svg>
  );
}

export function SeasonBanner() {
  const { data, isLoading } = trpc.engagement.getActiveSeason.useQuery(
    undefined,
    { retry: false }
  );
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  if (isLoading) {
    return (
      <div className="prep-card p-4 flex items-center justify-center py-6">
        <Loader2 size={18} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="prep-card p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Trophy size={14} className="text-amber-400" />
          No active season right now — check back soon
        </div>
      </div>
    );
  }

  const { season, userScore, leaderboard, daysLeft } = data;
  const theme = SEASON_THEMES[season.theme] ?? SEASON_THEMES["full-stack"];

  const startDate = new Date(season.startDate);
  const endDate = new Date(season.endDate);
  const totalDays = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / 86400000
  );
  const elapsedDays = Math.min(totalDays, totalDays - daysLeft);
  const pct = Math.round((elapsedDays / totalDays) * 100);

  return (
    <div className={`prep-card p-5 ${theme.bg}`}>
      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
          <ProgressRing pct={pct} size={52} />
          <div className="absolute inset-0 flex items-center justify-center text-lg">
            {theme.icon}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span
                  className={`text-xs font-bold uppercase tracking-wide ${theme.color}`}
                >
                  Season {season.seasonNumber}
                </span>
                <span className="text-xs text-muted-foreground bg-white/5 rounded px-1.5 py-0.5">
                  {daysLeft}d left
                </span>
              </div>
              <div className="font-bold text-foreground text-sm">
                {season.theme}
              </div>
              {season.description && (
                <div className="text-xs text-muted-foreground mt-0.5">
                  {season.description}
                </div>
              )}
            </div>
            {userScore && (userScore.totalScore ?? 0) > 0 && (
              <div className="text-right shrink-0">
                <div className={`text-xl font-black ${theme.color}`}>
                  {userScore.totalScore}
                </div>
                <div className="text-xs text-muted-foreground">pts</div>
              </div>
            )}
          </div>

          <div className="mt-2 h-1.5 rounded-full bg-white/10">
            <div
              className={`h-1.5 rounded-full transition-all duration-700 ${theme.color
                .replace("text-", "bg-")
                .replace("-400", "-500")}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>
              Week {Math.ceil(elapsedDays / 7)} of {Math.ceil(totalDays / 7)}
            </span>
            <span>{userScore?.drillsCompleted ?? 0} drills completed</span>
          </div>
        </div>
      </div>

      {leaderboard && leaderboard.length > 0 && (
        <div className="mt-3">
          <button
            onClick={() => setShowLeaderboard(s => !s)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Trophy size={12} className="text-amber-400" />
            Season Leaderboard ({leaderboard.length})
            {showLeaderboard ? (
              <ChevronUp size={12} />
            ) : (
              <ChevronDown size={12} />
            )}
          </button>
          {showLeaderboard && (
            <div className="mt-2 space-y-1">
              {leaderboard.slice(0, 5).map(
                (
                  entry: {
                    totalScore: number;
                    drillsCompleted: number;
                    isChampion: boolean | null;
                  },
                  i: number
                ) => (
                  <div
                    key={i}
                    className={`flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg ${
                      entry.isChampion
                        ? "bg-amber-500/20 border border-amber-500/30"
                        : "bg-white/5"
                    }`}
                  >
                    <span className="w-4 text-center font-bold text-muted-foreground">
                      #{i + 1}
                    </span>
                    <span className="flex-1 text-muted-foreground">
                      {entry.drillsCompleted} drills
                    </span>
                    <span
                      className={`font-bold ${entry.isChampion ? "text-amber-400" : "text-muted-foreground"}`}
                    >
                      {entry.totalScore}pts
                    </span>
                    {entry.isChampion && (
                      <span className="text-amber-400">👑</span>
                    )}
                  </div>
                )
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
