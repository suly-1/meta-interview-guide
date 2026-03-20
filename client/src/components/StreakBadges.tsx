/**
 * StreakBadges — Daily streak tracker + 6 achievement badge types
 * Reads from localStorage and awards badges based on activity.
 */
import { useState, useEffect } from "react";
import { Flame, Trophy, Zap, Target, Star, Award, BookOpen, Lock } from "lucide-react";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
  check: (stats: Stats) => boolean;
}

interface Stats {
  streak: number;
  totalSolved: number;
  sprintCompleted: number;
  patternsAtMastery: number;
  storiesWritten: number;
  readinessScore: number;
}

function loadStats(): Stats {
  try {
    const streak = parseInt(localStorage.getItem("meta_streak") || "0");
    const totalSolved = parseInt(localStorage.getItem("meta_total_solved") || "0");
    const sprintCompleted = parseInt(localStorage.getItem("meta_sprint_completed") || "0");
    const patternMastery: Record<string, number> = JSON.parse(localStorage.getItem("meta_pattern_mastery") || "{}");
    const patternsAtMastery = Object.values(patternMastery).filter(v => v >= 4).length;
    const stories: any[] = JSON.parse(localStorage.getItem("meta_star_stories") || "[]");
    const storiesWritten = stories.length;
    const readinessScore = parseInt(localStorage.getItem("meta_readiness_score") || "0");
    return { streak, totalSolved, sprintCompleted, patternsAtMastery, storiesWritten, readinessScore };
  } catch {
    return { streak: 0, totalSolved: 0, sprintCompleted: 0, patternsAtMastery: 0, storiesWritten: 0, readinessScore: 0 };
  }
}

const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first_solve",
    name: "First Blood",
    description: "Solve your first problem",
    icon: <Target size={20} />,
    color: "text-blue-600",
    bg: "bg-blue-50 border-blue-200",
    check: s => s.totalSolved >= 1,
  },
  {
    id: "streak_3",
    name: "On Fire",
    description: "Maintain a 3-day streak",
    icon: <Flame size={20} />,
    color: "text-orange-600",
    bg: "bg-orange-50 border-orange-200",
    check: s => s.streak >= 3,
  },
  {
    id: "streak_7",
    name: "Week Warrior",
    description: "Maintain a 7-day streak",
    icon: <Flame size={20} />,
    color: "text-red-600",
    bg: "bg-red-50 border-red-200",
    check: s => s.streak >= 7,
  },
  {
    id: "sprint_master",
    name: "Sprint Master",
    description: "Complete a Sprint Mode session",
    icon: <Zap size={20} />,
    color: "text-yellow-600",
    bg: "bg-yellow-50 border-yellow-200",
    check: s => s.sprintCompleted >= 1,
  },
  {
    id: "pattern_master",
    name: "Pattern Master",
    description: "Master 3 patterns (score ≥ 4)",
    icon: <Star size={20} />,
    color: "text-purple-600",
    bg: "bg-purple-50 border-purple-200",
    check: s => s.patternsAtMastery >= 3,
  },
  {
    id: "storyteller",
    name: "Storyteller",
    description: "Write 5 STAR behavioral stories",
    icon: <BookOpen size={20} />,
    color: "text-emerald-600",
    bg: "bg-emerald-50 border-emerald-200",
    check: s => s.storiesWritten >= 5,
  },
  {
    id: "ready",
    name: "Interview Ready",
    description: "Reach 80%+ readiness score",
    icon: <Trophy size={20} />,
    color: "text-amber-600",
    bg: "bg-amber-50 border-amber-200",
    check: s => s.readinessScore >= 80,
  },
  {
    id: "grind_50",
    name: "Grinder",
    description: "Solve 50 problems",
    icon: <Award size={20} />,
    color: "text-indigo-600",
    bg: "bg-indigo-50 border-indigo-200",
    check: s => s.totalSolved >= 50,
  },
];

export default function StreakBadges() {
  const [stats, setStats] = useState<Stats>(() => loadStats());

  useEffect(() => {
    const interval = setInterval(() => setStats(loadStats()), 3000);
    return () => clearInterval(interval);
  }, []);

  const earned = ACHIEVEMENTS.filter(a => a.check(stats));
  const locked = ACHIEVEMENTS.filter(a => !a.check(stats));

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 bg-amber-100 rounded-xl">
          <Trophy size={20} className="text-amber-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Streak & Achievements
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{earned.length}/{ACHIEVEMENTS.length} badges earned</p>
        </div>
      </div>

      {/* Streak banner */}
      <div className={`rounded-xl p-4 mb-5 flex items-center gap-4 ${
        stats.streak >= 7 ? "bg-red-50 border border-red-200" :
        stats.streak >= 3 ? "bg-orange-50 border border-orange-200" :
        stats.streak >= 1 ? "bg-amber-50 border border-amber-200" :
        "bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
      }`}>
        <div className="relative">
          <Flame
            size={36}
            className={stats.streak >= 3 ? "text-orange-500" : stats.streak >= 1 ? "text-amber-400" : "text-gray-300"}
            fill={stats.streak >= 3 ? "currentColor" : "none"}
          />
          {stats.streak >= 7 && (
            <span className="absolute -top-1 -right-1 text-xs">🔥</span>
          )}
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 tabular-nums" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            {stats.streak} day{stats.streak !== 1 ? "s" : ""}
          </p>
          <p className="text-xs text-gray-500">
            {stats.streak === 0 ? "Start practicing to begin your streak!" :
             stats.streak < 3 ? "Keep going — 3 days for the On Fire badge!" :
             stats.streak < 7 ? "Almost at Week Warrior! Keep it up." :
             "Week Warrior achieved! You're on a roll."}
          </p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-xs text-gray-400">Problems</p>
          <p className="text-lg font-bold text-gray-700 dark:text-gray-300 tabular-nums">{stats.totalSolved}</p>
        </div>
      </div>

      {/* Earned badges */}
      {earned.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Earned</p>
          <div className="grid grid-cols-2 gap-2">
            {earned.map(a => (
              <div key={a.id} className={`flex items-center gap-3 p-3 rounded-xl border ${a.bg}`}>
                <div className={a.color}>{a.icon}</div>
                <div>
                  <p className="text-sm font-bold text-gray-800">{a.name}</p>
                  <p className="text-xs text-gray-500">{a.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Locked badges */}
      {locked.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Locked</p>
          <div className="grid grid-cols-2 gap-2">
            {locked.map(a => (
              <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 opacity-60">
                <Lock size={16} className="text-gray-300 dark:text-gray-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">{a.name}</p>
                  <p className="text-xs text-gray-400">{a.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
