/**
 * AchievementBadgeWall — displays all badges with unlock status
 * Unlocked badges are shown in full color; locked ones are greyed out
 * Grouped by category with progress bars for partially-unlocked badges
 */
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Trophy, Code2, MessageSquare, ClipboardList, Flame, Star, Lock, Filter } from "lucide-react";
import { useAchievements } from "@/hooks/useAchievements";
import type { Badge } from "@/hooks/useAchievements";

const CATEGORY_META: Record<Badge["category"], { label: string; icon: React.ReactNode; color: string }> = {
  coding:     { label: "Coding",         icon: <Code2 size={14} />,        color: "text-blue-600" },
  behavioral: { label: "Behavioral",     icon: <MessageSquare size={14} />, color: "text-amber-800" },
  mock:       { label: "Mock Interviews", icon: <ClipboardList size={14} />, color: "text-indigo-600" },
  streak:     { label: "Streaks",         icon: <Flame size={14} />,         color: "text-orange-800" },
  milestone:  { label: "Milestones",      icon: <Star size={14} />,          color: "text-violet-600" },
};

const RARITY_META: Record<Badge["rarity"], { label: string; color: string; border: string; glow: string }> = {
  common:    { label: "Common",    color: "text-gray-600",   border: "border-gray-200",   glow: "" },
  rare:      { label: "Rare",      color: "text-blue-600",   border: "border-blue-300",   glow: "shadow-blue-100" },
  epic:      { label: "Epic",      color: "text-violet-600", border: "border-violet-300", glow: "shadow-violet-100" },
  legendary: { label: "Legendary", color: "text-amber-800",  border: "border-amber-300",  glow: "shadow-amber-100" },
};

function BadgeCard({ badge }: { badge: Badge }) {
  const rarity = RARITY_META[badge.rarity];
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      whileHover={{ scale: badge.unlocked ? 1.04 : 1.01 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className={`relative flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
        badge.unlocked
          ? `bg-white dark:bg-gray-900 ${rarity.border} ${rarity.glow} shadow-sm`
          : "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 opacity-60"
      }`}
    >
      {/* Rarity indicator */}
      {badge.unlocked && badge.rarity !== "common" && (
        <div className={`absolute top-1.5 right-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
          badge.rarity === "legendary" ? "bg-amber-100 text-amber-900" :
          badge.rarity === "epic"      ? "bg-violet-100 text-violet-700" :
          "bg-blue-100 text-blue-700"
        }`}>
          {rarity.label}
        </div>
      )}

      {/* Lock overlay for locked badges */}
      {!badge.unlocked && (
        <div className="absolute top-1.5 right-1.5 text-gray-600">
          <Lock size={11} />
        </div>
      )}

      {/* Emoji */}
      <div className={`text-3xl leading-none ${!badge.unlocked ? "grayscale" : ""}`}>
        {badge.emoji}
      </div>

      {/* Name */}
      <div className={`text-[11px] font-bold text-center leading-tight ${
        badge.unlocked ? "text-gray-900 dark:text-gray-100" : "text-gray-600 dark:text-gray-200"
      }`}>
        {badge.name}
      </div>

      {/* Description (on hover or always for unlocked) */}
      <div className={`text-[10px] text-center leading-tight transition-all ${
        badge.unlocked ? "text-gray-700 dark:text-gray-300" : "text-gray-600 dark:text-gray-200"
      } ${hovered ? "opacity-100" : "opacity-0 h-0 overflow-hidden"}`}>
        {badge.description}
      </div>

      {/* Progress bar for locked badges with progress */}
      {!badge.unlocked && badge.progress && (
        <div className="w-full">
          <div className="flex justify-between text-[9px] text-gray-600 mb-0.5">
            <span>{badge.progress.current}</span>
            <span>{badge.progress.target}</span>
          </div>
          <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gray-400 dark:bg-gray-500 rounded-full transition-all"
              style={{ width: `${Math.min(100, (badge.progress.current / badge.progress.target) * 100)}%` }}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
}

type CategoryFilter = Badge["category"] | "all";

export default function AchievementBadgeWall() {
  const badges = useAchievements();
  const [filter, setFilter] = useState<CategoryFilter>("all");
  const [showLocked, setShowLocked] = useState(true);

  const unlockedCount = useMemo(() => badges.filter(b => b.unlocked).length, [badges]);
  const totalCount = badges.length;

  const filtered = useMemo(() => {
    let result = badges;
    if (filter !== "all") result = result.filter(b => b.category === filter);
    if (!showLocked) result = result.filter(b => b.unlocked);
    return result;
  }, [badges, filter, showLocked]);

  // Group by category for display
  const grouped = useMemo(() => {
    if (filter !== "all") return { [filter]: filtered };
    const groups: Record<string, Badge[]> = {};
    for (const badge of filtered) {
      if (!groups[badge.category]) groups[badge.category] = [];
      groups[badge.category].push(badge);
    }
    return groups;
  }, [filter, filtered]);

  const categoryOrder: Badge["category"][] = ["coding", "behavioral", "mock", "streak", "milestone"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Trophy size={18} className="text-amber-500" />
          <div>
            <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
              {unlockedCount} / {totalCount} Badges Unlocked
            </span>
            <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mt-1 w-48">
              <motion.div
                className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(unlockedCount / totalCount) * 100}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowLocked(v => !v)}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
              !showLocked
                ? "bg-gray-900 text-white border-gray-900 dark:bg-gray-100 dark:text-gray-900"
                : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-400"
            }`}
          >
            <Filter size={10} />
            {showLocked ? "Show All" : "Unlocked Only"}
          </button>
        </div>
      </div>

      {/* Category filter pills */}
      <div className="flex flex-wrap gap-2">
        {(["all", ...categoryOrder] as (CategoryFilter)[]).map(cat => {
          const meta = cat === "all" ? null : CATEGORY_META[cat];
          const catBadges = cat === "all" ? badges : badges.filter(b => b.category === cat);
          const catUnlocked = catBadges.filter(b => b.unlocked).length;
          return (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                filter === cat
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-indigo-300"
              }`}
            >
              {meta && <span className={filter === cat ? "text-white" : meta.color}>{meta.icon}</span>}
              {cat === "all" ? "All" : meta!.label}
              <span className={`text-[10px] font-bold px-1 py-0 rounded-full ${
                filter === cat ? "bg-white/20 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-700"
              }`}>
                {catUnlocked}/{catBadges.length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Badge grid by category */}
      {categoryOrder
        .filter(cat => grouped[cat] && grouped[cat].length > 0)
        .map(cat => (
          <div key={cat}>
            <div className={`flex items-center gap-2 mb-3 ${CATEGORY_META[cat].color}`}>
              {CATEGORY_META[cat].icon}
              <span className="text-sm font-bold">{CATEGORY_META[cat].label}</span>
              <span className="text-xs text-gray-600 font-normal">
                {grouped[cat].filter(b => b.unlocked).length}/{grouped[cat].length} unlocked
              </span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
              {grouped[cat].map(badge => (
                <BadgeCard key={badge.id} badge={badge} />
              ))}
            </div>
          </div>
        ))}

      {filtered.length === 0 && (
        <div className="text-center py-10 text-gray-600 dark:text-gray-200">
          <Trophy size={32} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">No badges to show. Start practicing to earn your first badge!</p>
        </div>
      )}
    </div>
  );
}
