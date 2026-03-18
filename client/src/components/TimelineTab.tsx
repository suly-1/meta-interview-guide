// Design: Structured Clarity — timeline tab with 10-week plan, progress tracker, story bank, IC6 vs IC7 bar
import { TIMELINE_WEEKS, STORY_BANK, PATTERNS } from "@/lib/guideData";
import { CheckCircle2, Circle, RotateCcw } from "lucide-react";
import { useProgress } from "@/hooks/useProgress";
import ProgressBar from "@/components/ProgressBar";
import { motion, AnimatePresence } from "framer-motion";

const TAG_COLORS: Record<string, string> = {
  blue:    "bg-blue-100 text-blue-700",
  indigo:  "bg-indigo-100 text-indigo-700",
  teal:    "bg-teal-100 text-teal-700",
  amber:   "bg-amber-100 text-amber-700",
  emerald: "bg-emerald-100 text-emerald-700",
};

const CONNECTOR_COLORS: Record<string, string> = {
  blue:    "bg-blue-500",
  indigo:  "bg-indigo-500",
  teal:    "bg-teal-500",
  amber:   "bg-amber-500",
  emerald: "bg-emerald-500",
};

const DIFF_COLORS: Record<string, string> = {
  green: "text-emerald-600",
  amber: "text-amber-600",
  red:   "text-red-600",
};

export default function TimelineTab() {
  const patterns = useProgress("patterns", PATTERNS.length);
  const stories  = useProgress("stories",  STORY_BANK.length);

  // Combined overall progress
  const totalItems = PATTERNS.length + STORY_BANK.length;
  const totalDone  = patterns.count + stories.count;
  const overallPct = Math.round((totalDone / totalItems) * 100);

  return (
    <div className="space-y-10">

      {/* ── Overall Progress Dashboard ── */}
      <section>
        <div className="border-b border-gray-200 pb-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Your Prep Progress
          </h2>
          <p className="text-sm text-gray-500 mt-1">Track your patterns and STAR stories — saved automatically in your browser</p>
        </div>

        {/* Overall bar */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-5 text-white mb-4 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-blue-200 mb-0.5">Overall Readiness</p>
              <p className="text-3xl font-extrabold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {overallPct}%
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-200">{totalDone} of {totalItems} items</p>
              <p className="text-xs text-blue-300 mt-0.5">Patterns + Stories</p>
            </div>
          </div>
          <div className="h-3 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-white rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${overallPct}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Sub-bars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ProgressBar
            count={patterns.count}
            total={patterns.total}
            pct={patterns.pct}
            label="LeetCode Patterns"
            color="bg-blue-500"
            onReset={patterns.reset}
          />
          <ProgressBar
            count={stories.count}
            total={stories.total}
            pct={stories.pct}
            label="STAR Story Bank"
            color="bg-amber-500"
            onReset={stories.reset}
          />
        </div>
      </section>

      {/* ── Pattern Checklist ── */}
      <section>
        <div className="border-b border-gray-200 pb-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                LeetCode Pattern Checklist
              </h2>
              <p className="text-sm text-gray-500 mt-1">Check off each pattern as you master it</p>
            </div>
            {patterns.count > 0 && (
              <button
                onClick={patterns.reset}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors"
              >
                <RotateCcw size={12} />
                Reset all
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {PATTERNS.map((p) => {
            const done = patterns.checked.has(p.id);
            return (
              <motion.button
                key={p.id}
                onClick={() => patterns.toggle(p.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all ${
                  done
                    ? "bg-emerald-50 border-emerald-300 shadow-sm"
                    : "bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm"
                }`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  <AnimatePresence mode="wait" initial={false}>
                    {done ? (
                      <motion.div
                        key="checked"
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.5, opacity: 0 }}
                        transition={{ duration: 0.15 }}
                      >
                        <CheckCircle2 size={18} className="text-emerald-500" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="unchecked"
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.5, opacity: 0 }}
                        transition={{ duration: 0.15 }}
                      >
                        <Circle size={18} className="text-gray-300" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div className="min-w-0">
                  <p className={`text-sm font-semibold leading-snug ${done ? "text-emerald-800 line-through decoration-emerald-400" : "text-gray-900"}`}
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    {p.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[11px] font-medium ${DIFF_COLORS[p.difficultyColor]}`}>{p.difficulty}</span>
                    <span className="text-gray-300">·</span>
                    <span className="text-[11px] text-gray-400">{"★".repeat(p.frequency)}{"☆".repeat(5 - p.frequency)}</span>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </section>

      {/* ── STAR Story Bank Checklist ── */}
      <section>
        <div className="border-b border-gray-200 pb-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                STAR Story Bank Checklist
              </h2>
              <p className="text-sm text-gray-500 mt-1">Check off each story type once you have a polished, metrics-backed STAR answer ready</p>
            </div>
            {stories.count > 0 && (
              <button
                onClick={stories.reset}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors"
              >
                <RotateCcw size={12} />
                Reset all
              </button>
            )}
          </div>
        </div>

        <div className="space-y-2">
          {STORY_BANK.map((s, i) => {
            const id   = `story-${i}`;
            const done = stories.checked.has(id);
            return (
              <motion.button
                key={id}
                onClick={() => stories.toggle(id)}
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.99 }}
                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border text-left transition-all ${
                  done
                    ? "bg-amber-50 border-amber-300"
                    : "bg-white border-gray-200 hover:border-amber-300 hover:shadow-sm"
                }`}
              >
                {/* Number */}
                <span className={`flex-shrink-0 w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                  done ? "bg-amber-400 text-white" : "bg-gray-100 text-gray-500"
                }`}>
                  {i + 1}
                </span>

                {/* Icon */}
                <div className="flex-shrink-0">
                  <AnimatePresence mode="wait" initial={false}>
                    {done ? (
                      <motion.div key="checked" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} transition={{ duration: 0.15 }}>
                        <CheckCircle2 size={16} className="text-amber-500" />
                      </motion.div>
                    ) : (
                      <motion.div key="unchecked" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} transition={{ duration: 0.15 }}>
                        <Circle size={16} className="text-gray-300" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${done ? "text-amber-800 line-through decoration-amber-400" : "text-gray-900"}`}
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    {s.type}
                  </p>
                  <div className="flex flex-wrap gap-x-4 mt-0.5">
                    <p className="text-xs text-gray-500 truncate">Focus: {s.focusAreas}</p>
                    <p className="text-xs text-gray-400 truncate hidden md:block">Values: {s.values}</p>
                  </div>
                </div>

                {done && (
                  <span className="flex-shrink-0 text-[11px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full hidden sm:block">
                    Ready
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      </section>

      {/* ── 10-Week Plan ── */}
      <section>
        <div className="border-b border-gray-200 pb-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            10-Week Study Timeline
          </h2>
          <p className="text-sm text-gray-500 mt-1">A structured preparation plan focused on Coding and Behavioral — from foundations to interview-ready</p>
        </div>
        <div className="flex gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl mb-6">
          <div className="w-1 rounded-full bg-blue-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-blue-800 mb-1">How to Use This Timeline</p>
            <p className="text-sm text-blue-700 leading-relaxed">
              This plan assumes roughly 2–3 hours of focused study per day. The most important principle: <strong>active recall beats passive reading</strong>. Solve problems under timed conditions, practice speaking your solutions out loud, and do mock interviews from Week 6 onward.
            </p>
          </div>
        </div>

        <div className="relative">
          <div className="absolute left-[88px] top-0 bottom-0 w-0.5 bg-gray-200 hidden sm:block" />
          <div className="space-y-4">
            {TIMELINE_WEEKS.map((w, i) => (
              <div key={i} className="flex gap-4 sm:gap-6 items-start">
                <div className="flex-shrink-0 w-[80px] text-right hidden sm:block">
                  <span className="text-xs font-bold text-blue-600 leading-tight">{w.weeks}</span>
                </div>
                <div className={`hidden sm:flex flex-shrink-0 w-4 h-4 rounded-full ${CONNECTOR_COLORS[w.tagColor]} border-2 border-white shadow-sm mt-1 z-10`} />
                <div className="flex-1 bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <span className="text-xs font-bold text-blue-600 sm:hidden block mb-1">{w.weeks}</span>
                      <h4 className="font-bold text-gray-900 text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                        {w.focus}
                      </h4>
                    </div>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${TAG_COLORS[w.tagColor]}`}>
                      {w.tag}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{w.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── IC6 vs IC7 Bar ── */}
      <section>
        <div className="border-b border-gray-200 pb-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            IC6 vs. IC7 Behavioral Bar
          </h2>
          <p className="text-sm text-gray-500 mt-1">What distinguishes a Senior Engineer answer from a Staff Engineer answer</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
            <h3 className="font-bold text-blue-900 text-base mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              IC6 — Senior Engineer
            </h3>
            <ul className="space-y-2.5">
              {[
                "Owns a significant technical scope within a team",
                "Drives cross-functional alignment on a project level",
                "Resolves ambiguous problems independently",
                "Mentors junior engineers on the team",
                "Communicates technical decisions clearly to stakeholders",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-blue-800">
                  <CheckCircle2 size={14} className="text-blue-500 flex-shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5">
            <h3 className="font-bold text-indigo-900 text-base mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              IC7 — Staff Engineer
            </h3>
            <ul className="space-y-2.5">
              {[
                "Defines technical strategy for an entire product surface",
                "Drives org-wide architecture decisions across teams",
                "Influences engineering culture and practices",
                "Mentors senior engineers across multiple teams",
                "Justifies architectural decisions with business impact at the org level",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-indigo-800">
                  <CheckCircle2 size={14} className="text-indigo-500 flex-shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
