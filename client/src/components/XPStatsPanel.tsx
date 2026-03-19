/**
 * XPStatsPanel — shows the user's XP level, progress, and recent XP events
 * Used in the Readiness tab alongside the Achievement Badge Wall
 */
import { useState } from "react";
import { motion } from "framer-motion";
import { Zap, TrendingUp, ChevronDown, ChevronUp } from "lucide-react";
import { getLevelInfo, getTodayXP, XP_LEVELS } from "@/hooks/useXP";
import type { XPEvent } from "@/hooks/useXP";

interface XPStatsPanelProps {
  totalXP: number;
  events: XPEvent[];
}

const EVENT_LABELS: Record<XPEvent["type"], string> = {
  ctci_solve:         "Solved a CTCI problem",
  sprint_complete:    "Completed a Topic Sprint",
  behavioral_session: "Behavioral practice session",
  ai_mock:            "AI Mock session",
  sd_mock:            "System Design Mock session",
  streak_bonus:       "Daily streak bonus",
  first_solve:        "First solve milestone",
  first_sprint:       "First sprint milestone",
  first_mock:         "First mock milestone",
};

const EVENT_COLORS: Record<XPEvent["type"], string> = {
  ctci_solve:         "text-emerald-600 bg-emerald-50 border-emerald-200",
  sprint_complete:    "text-violet-600 bg-violet-50 border-violet-200",
  behavioral_session: "text-amber-600 bg-amber-50 border-amber-200",
  ai_mock:            "text-teal-600 bg-teal-50 border-teal-200",
  sd_mock:            "text-indigo-600 bg-indigo-50 border-indigo-200",
  streak_bonus:       "text-orange-600 bg-orange-50 border-orange-200",
  first_solve:        "text-rose-600 bg-rose-50 border-rose-200",
  first_sprint:       "text-rose-600 bg-rose-50 border-rose-200",
  first_mock:         "text-rose-600 bg-rose-50 border-rose-200",
};

export default function XPStatsPanel({ totalXP, events }: XPStatsPanelProps) {
  const { current, next, progressPct, xpIntoLevel, xpToNextLevel } = getLevelInfo(totalXP);
  const todayXP = getTodayXP(events);
  const [showHistory, setShowHistory] = useState(false);

  const recentEvents = [...events].reverse().slice(0, 20);

  return (
    <div className="space-y-5">
      {/* Level card */}
      <div className={`rounded-2xl border p-5 ${current.bgColor} ${current.borderColor}`}>
        <div className="flex items-center gap-4">
          <div className="text-5xl leading-none">{current.emoji}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xl font-bold ${current.color}`}>{current.name}</span>
              {todayXP > 0 && (
                <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full">
                  <Zap size={10} className="fill-emerald-600" />
                  +{todayXP} today
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
              <span className="font-bold">{totalXP.toLocaleString()} XP</span>
              {next && (
                <>
                  <span className="text-gray-400">·</span>
                  <span>{xpIntoLevel} / {xpToNextLevel} XP to <strong>{next.name}</strong></span>
                </>
              )}
              {!next && <span className="text-amber-600 font-semibold">Max Level!</span>}
            </div>
            {next && (
              <div className="h-2.5 bg-white/60 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${
                    current.name === "Staff Engineer"     ? "bg-violet-500" :
                    current.name === "Senior Engineer"    ? "bg-indigo-500" :
                    current.name === "Engineer"           ? "bg-teal-500"   :
                    current.name === "Apprentice"         ? "bg-blue-500"   :
                    current.name === "Principal Engineer" ? "bg-amber-500"  :
                    "bg-gray-500"
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Level roadmap */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={14} className="text-indigo-500" />
          <span className="text-xs font-bold text-gray-700 dark:text-gray-300">XP Level Roadmap</span>
        </div>
        <div className="flex items-center gap-0 overflow-x-auto pb-1">
          {XP_LEVELS.map((level, i) => {
            const isReached = totalXP >= level.minXP;
            const isCurrent = level.name === current.name;
            return (
              <div key={level.name} className="flex items-center flex-shrink-0">
                <div
                  className={`flex flex-col items-center gap-1 px-2 py-1 rounded-lg transition-all ${
                    isCurrent ? `${level.bgColor} ${level.borderColor} border` : ""
                  }`}
                  title={`${level.name}: ${level.minXP.toLocaleString()} XP`}
                >
                  <span className={`text-lg leading-none ${!isReached ? "grayscale opacity-40" : ""}`}>
                    {level.emoji}
                  </span>
                  <span className={`text-[9px] font-semibold text-center leading-tight ${
                    isCurrent ? level.color : isReached ? "text-gray-600 dark:text-gray-400" : "text-gray-300 dark:text-gray-600"
                  }`}>
                    {level.name.split(" ").map((w, j) => <span key={j} className="block">{w}</span>)}
                  </span>
                  <span className={`text-[8px] font-mono ${isReached ? "text-gray-500" : "text-gray-300 dark:text-gray-600"}`}>
                    {level.minXP === 0 ? "0" : `${level.minXP >= 1000 ? `${level.minXP / 1000}k` : level.minXP}`}
                  </span>
                </div>
                {i < XP_LEVELS.length - 1 && (
                  <div className={`h-0.5 w-4 flex-shrink-0 ${totalXP >= XP_LEVELS[i + 1].minXP ? "bg-gray-400" : "bg-gray-200 dark:bg-gray-700"}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* XP earning guide */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Zap size={14} className="text-yellow-500" />
          <span className="text-xs font-bold text-gray-700 dark:text-gray-300">How to Earn XP</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            { label: "Solve CTCI problem",      xp: 10, emoji: "💻" },
            { label: "Complete Topic Sprint",    xp: 25, emoji: "⚡" },
            { label: "Behavioral session",       xp: 15, emoji: "🎤" },
            { label: "AI Mock session",          xp: 40, emoji: "🤖" },
            { label: "System Design Mock",       xp: 40, emoji: "🏗️" },
            { label: "Daily streak bonus",       xp: 5,  emoji: "🔥" },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-2 text-xs bg-gray-50 dark:bg-gray-800 rounded-lg px-2.5 py-2">
              <span className="text-base leading-none">{item.emoji}</span>
              <div>
                <div className="font-semibold text-gray-700 dark:text-gray-300 leading-tight">{item.label}</div>
                <div className="text-yellow-600 font-bold">+{item.xp} XP</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent XP events */}
      {events.length > 0 && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
          <button
            onClick={() => setShowHistory(v => !v)}
            className="flex items-center gap-2 w-full text-left"
          >
            <Zap size={14} className="text-yellow-500" />
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300 flex-1">Recent XP Events</span>
            <span className="text-xs text-gray-400">{events.length} events</span>
            {showHistory ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
          </button>
          {showHistory && (
            <div className="mt-3 space-y-1.5 max-h-48 overflow-y-auto">
              {recentEvents.map(event => (
                <div key={event.id} className={`flex items-center gap-2 text-xs border rounded-lg px-2.5 py-1.5 ${EVENT_COLORS[event.type]}`}>
                  <span className="font-bold">+{event.amount}</span>
                  <span className="flex-1 truncate">{event.label || EVENT_LABELS[event.type]}</span>
                  <span className="text-[10px] opacity-60 flex-shrink-0">
                    {new Date(event.ts).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
