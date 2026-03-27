// GamificationHub — Central hub for all 7 engagement/gamification features
// Makes the platform "addictive" through daily challenges, streaks, boss fights,
// comeback plans, adaptive difficulty, typing pressure, and seasons
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { DailyChallengeCard } from "./DailyChallengeCard";
import { StreakDisplay } from "./StreakDisplay";
import { BossFightLauncher } from "./BossFightLauncher";
import { ComebackPlanCard } from "./ComebackPlanCard";
import { AdaptiveDifficultyIndicator } from "./AdaptiveDifficultyIndicator";
import { LiveTypingPressureDrill } from "./LiveTypingPressureDrill";
import { SeasonBanner } from "./SeasonBanner";
import {
  Zap,
  Flame,
  Sword,
  TrendingUp,
  Brain,
  Type,
  Trophy,
} from "lucide-react";

type Section =
  | "daily"
  | "streak"
  | "boss"
  | "comeback"
  | "adaptive"
  | "pressure"
  | "season";

const SECTIONS: Array<{
  id: Section;
  label: string;
  icon: React.ReactNode;
  desc: string;
  color: string;
}> = [
  {
    id: "daily",
    label: "Daily Challenge",
    icon: <Zap size={16} />,
    desc: "3 questions · 24h expiry",
    color: "text-amber-400",
  },
  {
    id: "streak",
    label: "Streak",
    icon: <Flame size={16} />,
    desc: "Loss aversion · Real stakes",
    color: "text-orange-400",
  },
  {
    id: "boss",
    label: "Boss Fight",
    icon: <Sword size={16} />,
    desc: "45-min The Architect mock",
    color: "text-red-400",
  },
  {
    id: "comeback",
    label: "Comeback Arc",
    icon: <TrendingUp size={16} />,
    desc: "Recovery plan for low scores",
    color: "text-amber-400",
  },
  {
    id: "adaptive",
    label: "Adaptive Difficulty",
    icon: <Brain size={16} />,
    desc: "Auto-adjusts to your level",
    color: "text-purple-400",
  },
  {
    id: "pressure",
    label: "Typing Pressure",
    icon: <Type size={16} />,
    desc: "AI interrupts mid-answer",
    color: "text-red-400",
  },
  {
    id: "season",
    label: "Season",
    icon: <Trophy size={16} />,
    desc: "4-week themed challenge",
    color: "text-blue-400",
  },
];

export function GamificationHub() {
  const [activeSection, setActiveSection] = useState<Section>("daily");
  const { data: streakData } = trpc.engagement.getStreak.useQuery(undefined, {
    retry: false,
  });

  const bossFightUnlocked = streakData?.bossFightUnlocked ?? false;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="section-title mb-1">🎮 Engagement Hub</div>
        <div className="text-sm text-muted-foreground">
          Daily challenges, streaks, boss fights, and adaptive practice to make
          interview prep addictive.
        </div>
      </div>

      {/* Season banner — always visible at top */}
      <SeasonBanner />

      {/* Section selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {SECTIONS.map(sec => (
          <button
            key={sec.id}
            onClick={() => setActiveSection(sec.id)}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all ${
              activeSection === sec.id
                ? "bg-blue-500/15 border-blue-500/30 text-blue-400"
                : "bg-white/5 border-white/10 text-muted-foreground hover:text-foreground hover:bg-white/10"
            }`}
          >
            <div
              className={activeSection === sec.id ? "text-blue-400" : sec.color}
            >
              {sec.icon}
            </div>
            <div className="text-xs font-semibold leading-tight">
              {sec.label}
            </div>
            <div className="text-xs text-muted-foreground leading-tight hidden sm:block">
              {sec.desc}
            </div>
          </button>
        ))}
      </div>

      {/* Active section content */}
      <div>
        {activeSection === "daily" && <DailyChallengeCard />}
        {activeSection === "streak" && (
          <StreakDisplay onBossFightClick={() => setActiveSection("boss")} />
        )}
        {activeSection === "boss" && (
          <BossFightLauncher unlocked={bossFightUnlocked} />
        )}
        {activeSection === "comeback" && <ComebackPlanCard />}
        {activeSection === "adaptive" && <AdaptiveDifficultyIndicator />}
        {activeSection === "pressure" && <LiveTypingPressureDrill />}
        {activeSection === "season" && (
          <div className="space-y-4">
            <SeasonBanner />
            <div className="text-sm text-muted-foreground text-center py-4">
              Complete drills and daily challenges to earn season points and
              climb the leaderboard.
            </div>
          </div>
        )}
      </div>

      {/* Quick stats row */}
      {streakData && (
        <div className="grid grid-cols-3 gap-3">
          <div className="prep-card p-3 text-center">
            <div className="text-2xl font-black text-orange-400">
              {streakData.currentStreak}
            </div>
            <div className="text-xs text-muted-foreground">day streak</div>
          </div>
          <div className="prep-card p-3 text-center">
            <div className="text-2xl font-black text-amber-400">
              {streakData.longestStreak}
            </div>
            <div className="text-xs text-muted-foreground">best streak</div>
          </div>
          <div className="prep-card p-3 text-center">
            <div
              className={`text-2xl font-black ${bossFightUnlocked ? "text-red-400" : "text-muted-foreground"}`}
            >
              {bossFightUnlocked ? "🗡️" : "🔒"}
            </div>
            <div className="text-xs text-muted-foreground">boss fight</div>
          </div>
        </div>
      )}
    </div>
  );
}
