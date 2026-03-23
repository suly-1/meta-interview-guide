/**
 * ArchitectPicks — "The Architect's Picks" homepage section.
 * A curated 3-step starting path for new visitors, placed between the Hero
 * and the main tab navigation. Visually distinct with an amber/orange gradient
 * and a pulsing "Start Here" badge.
 */
import { motion } from "framer-motion";
import { ArrowRight, Zap, BookOpen, Target, ChevronRight } from "lucide-react";

interface Pick {
  step: number;
  emoji: string;
  title: string;
  description: string;
  tabId: string;
  cta: string;
  icon: React.ReactNode;
  accentColor: string;
  borderColor: string;
  bgColor: string;
}

const PICKS: Pick[] = [
  {
    step: 1,
    emoji: "📈",
    title: "Readiness Report",
    description:
      "Before anything else, get your baseline score across all three domains. The AI will tell you exactly where you are and what to fix first.",
    tabId: "readiness",
    cta: "Get your score",
    icon: <Target size={18} />,
    accentColor: "text-emerald-700 dark:text-emerald-400",
    borderColor: "border-emerald-300 dark:border-emerald-700",
    bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
  },
  {
    step: 2,
    emoji: "🗂️",
    title: "Story Coverage Matrix",
    description:
      "Most behavioral failures happen because candidates reuse the same 2 stories. Map your STAR stories to all 8 Meta values — gaps will be obvious.",
    tabId: "behavioral",
    cta: "Map your stories",
    icon: <BookOpen size={18} />,
    accentColor: "text-amber-700 dark:text-amber-400",
    borderColor: "border-amber-300 dark:border-amber-700",
    bgColor: "bg-amber-50 dark:bg-amber-900/20",
  },
  {
    step: 3,
    emoji: "🤖",
    title: "AI Interrupt Mode",
    description:
      "System design failures are rarely about knowledge — they're about handling pressure. Practice getting interrupted mid-design and recovering gracefully.",
    tabId: "sysdesign",
    cta: "Start a session",
    icon: <Zap size={18} />,
    accentColor: "text-violet-700 dark:text-violet-400",
    borderColor: "border-violet-300 dark:border-violet-700",
    bgColor: "bg-violet-50 dark:bg-violet-900/20",
  },
];

interface ArchitectPicksProps {
  onTabChange: (tabId: string) => void;
}

export default function ArchitectPicks({ onTabChange }: ArchitectPicksProps) {
  return (
    <div className="bg-gradient-to-b from-[#0d1b2a] to-gray-50 dark:to-gray-950 pt-0 pb-6 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5 pt-6"
        >
          <div className="flex items-center gap-3">
            {/* Pulsing badge */}
            <div className="relative flex-shrink-0">
              <span className="absolute inset-0 rounded-full bg-orange-400 animate-ping opacity-30" />
              <span className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500 text-white text-xs font-black tracking-wide shadow-lg">
                ★ START HERE
              </span>
            </div>
            <div>
              <h2 className="text-base font-black text-white leading-tight">
                The Architect's Picks
              </h2>
              <p className="text-xs text-white/60 mt-0.5">
                3 tools that move the needle most — do these first, in order.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {PICKS.map((pick, i) => (
            <motion.button
              key={pick.tabId}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: i * 0.08 }}
              onClick={() => onTabChange(pick.tabId)}
              className={`group text-left rounded-2xl border-2 ${pick.borderColor} ${pick.bgColor} p-4 transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2`}
            >
              {/* Step indicator + emoji */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-xs font-black text-gray-600 dark:text-gray-300 shadow-sm">
                    {pick.step}
                  </span>
                  <span className="text-xl">{pick.emoji}</span>
                </div>
                <ChevronRight
                  size={16}
                  className={`${pick.accentColor} opacity-0 group-hover:opacity-100 transition-opacity -translate-x-1 group-hover:translate-x-0 transition-transform`}
                />
              </div>

              {/* Title */}
              <h3 className={`text-sm font-black mb-1.5 ${pick.accentColor}`}>
                {pick.title}
              </h3>

              {/* Description */}
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
                {pick.description}
              </p>

              {/* CTA */}
              <div className={`flex items-center gap-1.5 text-xs font-bold ${pick.accentColor}`}>
                {pick.icon}
                {pick.cta}
                <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.button>
          ))}
        </div>

        {/* Subtle divider note */}
        <p className="text-center text-xs text-white/30 mt-4">
          Curated by The Architect · Based on analysis of the most common failure patterns at Meta IC6/IC7
        </p>
      </div>
    </div>
  );
}
