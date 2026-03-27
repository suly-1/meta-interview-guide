// StreakDisplay — Streak System with Real Stakes
// 7-day streak unlocks Hard Mode; 30-day streak unlocks Boss Fight
// Loss aversion: shows "streak at risk" if no activity today
import { trpc } from "@/lib/trpc";
import {
  Flame,
  Shield,
  Sword,
  Trophy,
  AlertTriangle,
  Loader2,
  Lock,
} from "lucide-react";

const MILESTONES = [
  { days: 3, label: "Warm Up", icon: "🔥", color: "text-orange-400" },
  {
    days: 7,
    label: "Hard Mode Unlocked",
    icon: "⚡",
    color: "text-yellow-400",
    unlock: "hard-mode",
  },
  { days: 14, label: "Iron Discipline", icon: "🛡️", color: "text-blue-400" },
  { days: 21, label: "Elite Candidate", icon: "⭐", color: "text-purple-400" },
  {
    days: 30,
    label: "Boss Fight Unlocked",
    icon: "🗡️",
    color: "text-red-400",
    unlock: "boss-fight",
  },
];

function MilestoneNode({
  days,
  label,
  icon,
  color,
  current,
  unlocked,
}: {
  days: number;
  label: string;
  icon: string;
  color: string;
  current: number;
  unlocked: boolean;
}) {
  const reached = current >= days;
  return (
    <div
      className={`flex flex-col items-center gap-1 ${reached ? "" : "opacity-40"}`}
    >
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 transition-all ${
          reached
            ? "border-amber-500/60 bg-amber-500/20 shadow-[0_0_12px_rgba(245,158,11,0.3)]"
            : "border-white/10 bg-white/5"
        }`}
      >
        {reached ? icon : <Lock size={14} className="text-muted-foreground" />}
      </div>
      <div
        className={`text-xs font-semibold text-center leading-tight ${reached ? color : "text-muted-foreground"}`}
      >
        Day {days}
      </div>
      {unlocked && reached && (
        <div className="text-xs text-center text-emerald-400 font-bold leading-tight">
          {label}
        </div>
      )}
    </div>
  );
}

export function StreakDisplay({
  onBossFightClick,
}: {
  onBossFightClick?: () => void;
}) {
  const { data, isLoading } = trpc.engagement.getStreak.useQuery(undefined, {
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="prep-card p-5 flex items-center justify-center py-8">
        <Loader2 size={20} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="prep-card p-5">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Lock size={14} />
          Sign in to track your streak
        </div>
      </div>
    );
  }

  const {
    currentStreak,
    longestStreak,
    lastActivityDate,
    hardModeUnlocked,
    bossFightUnlocked,
  } = data;

  // Check if streak is at risk (no activity today)
  const today = new Date().toISOString().split("T")[0];
  const lastActivity = lastActivityDate
    ? new Date(lastActivityDate).toISOString().split("T")[0]
    : null;
  const streakAtRisk = lastActivity !== today && currentStreak > 0;
  const streakDead =
    !lastActivity || (lastActivity < today && currentStreak === 0);

  // Progress to next milestone
  const nextMilestone = MILESTONES.find(m => m.days > currentStreak);
  const prevMilestone = MILESTONES.filter(m => m.days <= currentStreak).pop();
  const progressPct = nextMilestone
    ? Math.round(
        ((currentStreak - (prevMilestone?.days ?? 0)) /
          (nextMilestone.days - (prevMilestone?.days ?? 0))) *
          100
      )
    : 100;

  return (
    <div className="prep-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
            <Flame size={16} className="text-orange-400" />
          </div>
          <div>
            <div className="font-bold text-foreground text-sm">
              Practice Streak
            </div>
            <div className="text-xs text-muted-foreground">
              Complete any drill to extend
            </div>
          </div>
        </div>
        {streakAtRisk && (
          <div className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-2 py-1 animate-pulse">
            <AlertTriangle size={12} />
            Streak at risk!
          </div>
        )}
      </div>

      {/* Big streak number */}
      <div className="flex items-end gap-3 mb-4">
        <div
          className={`text-5xl font-black leading-none ${currentStreak > 0 ? "text-orange-400" : "text-muted-foreground"}`}
        >
          {currentStreak}
        </div>
        <div className="pb-1">
          <div className="text-sm font-semibold text-foreground">
            day streak
          </div>
          <div className="text-xs text-muted-foreground">
            Best: {longestStreak} days
          </div>
        </div>
        {currentStreak >= 30 && (
          <div className="ml-auto pb-1">
            <div className="text-2xl">🏆</div>
          </div>
        )}
      </div>

      {/* Progress bar to next milestone */}
      {nextMilestone && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>→ {nextMilestone.label}</span>
            <span>{nextMilestone.days - currentStreak} days away</span>
          </div>
          <div className="h-2 rounded-full bg-white/10">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-700"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Milestone nodes */}
      <div className="flex items-start justify-between gap-1 mb-4">
        {MILESTONES.map(m => (
          <MilestoneNode
            key={m.days}
            {...m}
            current={currentStreak}
            unlocked={!!m.unlock}
          />
        ))}
      </div>

      {/* Unlock badges */}
      <div className="flex gap-2 flex-wrap">
        {hardModeUnlocked && (
          <div className="flex items-center gap-1.5 text-xs bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-2.5 py-1.5 text-yellow-400 font-semibold">
            <Shield size={12} />
            Hard Mode Unlocked
          </div>
        )}
        {bossFightUnlocked && (
          <button
            onClick={onBossFightClick}
            className="flex items-center gap-1.5 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-2.5 py-1.5 text-red-400 font-semibold hover:bg-red-500/20 transition-colors"
          >
            <Sword size={12} />
            Boss Fight Available →
          </button>
        )}
      </div>

      {streakAtRisk && currentStreak > 0 && (
        <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
          ⚠️ Complete any drill today to keep your {currentStreak}-day streak
          alive!
        </div>
      )}
    </div>
  );
}
