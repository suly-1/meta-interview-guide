/**
 * XPLevelBar — compact XP level indicator for the sticky nav
 * Shows: level emoji + name, XP progress bar, and today's XP earned
 */
import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import { getLevelInfo, getTodayXP, XP_LEVELS } from "@/hooks/useXP";
import type { XPEvent } from "@/hooks/useXP";

interface XPLevelBarProps {
  totalXP: number;
  events: XPEvent[];
}

export default function XPLevelBar({ totalXP, events }: XPLevelBarProps) {
  const { current, next, progressPct, xpIntoLevel, xpToNextLevel } = getLevelInfo(totalXP);
  const todayXP = getTodayXP(events);

  return (
    <div
      className="flex items-center gap-2 px-2.5 py-1.5 rounded-full border bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 cursor-default select-none"
      title={
        next
          ? `${current.name} · ${xpIntoLevel} / ${xpToNextLevel} XP to ${next.name}`
          : `${current.name} · Max Level! ${totalXP} XP total`
      }
    >
      {/* Level emoji */}
      <span className="text-sm leading-none">{current.emoji}</span>

      {/* Progress bar + label */}
      <div className="flex flex-col gap-0.5 min-w-[60px] max-w-[80px]">
        <div className="flex items-center justify-between gap-1">
          <span className={`text-[10px] font-bold leading-none ${current.color}`}>
            {current.name.split(" ")[0]}
          </span>
          {todayXP > 0 && (
            <span className="text-[9px] font-semibold text-emerald-600 leading-none">
              +{todayXP}
            </span>
          )}
        </div>
        <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden w-full">
          <motion.div
            className={`h-full rounded-full ${
              current.name === "Distinguished Engineer"
                ? "bg-rose-500"
                : current.name === "Principal Engineer"
                ? "bg-amber-500"
                : current.name === "Staff Engineer"
                ? "bg-violet-500"
                : current.name === "Senior Engineer"
                ? "bg-indigo-500"
                : current.name === "Engineer"
                ? "bg-teal-500"
                : current.name === "Apprentice"
                ? "bg-blue-500"
                : "bg-gray-400"
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* XP icon */}
      <Zap size={11} className="text-yellow-500 flex-shrink-0" />
    </div>
  );
}
