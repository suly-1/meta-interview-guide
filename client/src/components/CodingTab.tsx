// Design: Structured Clarity — coding tab with full pattern table + filter bar + expandable cards
import { useState, useMemo } from "react";
import { useICLevel } from "@/contexts/ICLevelContext";
import InterviewTimer from "@/components/InterviewTimer";
import QuickDrill from "@/components/QuickDrill";
import PatternHeatmap from "@/components/PatternHeatmap";
import SessionLog from "@/components/SessionLog";
import { ChevronRight, ExternalLink, Star, Zap, BookOpen, Clock, CheckCircle2, Circle, SlidersHorizontal, X, StickyNote, Trash2, Search, Lock } from "lucide-react";
import { PATTERNS, PATTERN_PREREQUISITES } from "@/lib/guideData";
import { useDrillRatings } from "@/hooks/useDrillRatings";
import PatternQuickReference from "@/components/PatternQuickReference";
import PatternDependencyGraph from "@/components/PatternDependencyGraph";
import { useProgress } from "@/hooks/useProgress";
import PatternStuckHintLadder from "@/components/PatternStuckHintLadder";
import ReverseEngineeringDrill from "@/components/ReverseEngineeringDrill";
import PatternMasteryTree from "@/components/PatternMasteryTree";
import TopicBossFight from "@/components/TopicBossFight";
import { usePatternNotes } from "@/hooks/usePatternNotes";
import { motion, AnimatePresence } from "framer-motion";
import SprintMode from "@/components/SprintMode";
import ComplexityEstimator from "@/components/ComplexityEstimator";
import InterviewScorecard from "@/components/InterviewScorecard";
import ApproachAnalyzer from "@/components/ApproachAnalyzer";
import MetaRubricAssessment from "@/components/MetaRubricAssessment";
import StreakBadges from "@/components/StreakBadges";
import WeaknessHeatmap from "@/components/WeaknessHeatmap";
import SpacedRepetitionQueue from "@/components/SpacedRepetitionQueue";
import MetaCodingScreenSimulator from "@/components/MetaCodingScreenSimulator";

const DIFF_COLORS: Record<string, string> = {
  green: "bg-emerald-100 text-emerald-700",
  amber: "bg-amber-100 text-amber-700",
  red:   "bg-red-100 text-red-700",
};

function FrequencyStars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={12} className={i < count ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"} />
      ))}
    </div>
  );
}

type FilterDiff    = "all" | "green" | "amber" | "red";
type FilterFreq    = "all" | "5" | "4+" | "3+";
type FilterMastery = "all" | "todo" | "done";

function PatternRow({
  p, onExpand, expanded, done, onToggleDone, note, onNoteChange, onNoteClear,
  isLocked, prereqNames,
}: {
  p: typeof PATTERNS[0];
  onExpand: () => void;
  expanded: boolean;
  done: boolean;
  onToggleDone: (e: React.MouseEvent) => void;
  note: string;
  onNoteChange: (text: string) => void;
  onNoteClear: () => void;
  isLocked: boolean;
  prereqNames: string[];
}) {
  return (
    <>
      <tr
        className={`border-b border-gray-100 transition-colors cursor-pointer group ${
          isLocked ? "opacity-60 bg-gray-50 hover:bg-gray-100" :
          done ? "bg-emerald-50/40 hover:bg-emerald-50/60" : "hover:bg-blue-50/40"
        }`}
        onClick={isLocked ? undefined : onExpand}
        title={isLocked ? `Unlock by rating ${prereqNames.join(" and ")} ≥3 in Quick Drill` : undefined}
      >
        <td className="py-3 px-4">
          <div className="flex items-center gap-2">
            <ChevronRight size={14} className={`text-gray-400 transition-transform flex-shrink-0 ${expanded ? "rotate-90" : ""}`} />
            <span className={`font-semibold text-sm ${done ? "text-emerald-700 line-through decoration-emerald-400" : "text-gray-900"}`}
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {p.name}
            </span>
          </div>
        </td>
        <td className="py-3 px-4"><FrequencyStars count={p.frequency} /></td>
        <td className="py-3 px-4 hidden md:table-cell">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${DIFF_COLORS[p.difficultyColor]}`}>{p.difficulty}</span>
        </td>
        <td className="py-3 px-4 hidden lg:table-cell">
          <p className="text-xs text-gray-600 leading-relaxed max-w-xs">{p.summary}</p>
        </td>
        <td className="py-3 px-4 hidden xl:table-cell">
          <div className="flex flex-wrap gap-1">
            {p.problems.slice(0, 3).map((prob) => (
              <span key={prob} className="text-[11px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{prob}</span>
            ))}
            {p.problems.length > 3 && (
              <span className="text-[11px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">+{p.problems.length - 3}</span>
            )}
          </div>
        </td>
        {/* Mastery toggle */}
        <td className="py-3 px-4 text-right">
          <button
            onClick={onToggleDone}
            className="flex items-center gap-1 ml-auto text-xs font-medium transition-colors"
            title={done ? "Mark as not mastered" : "Mark as mastered"}
          >
            {done
              ? <CheckCircle2 size={16} className="text-emerald-500" />
              : <Circle size={16} className="text-gray-300 hover:text-blue-400 transition-colors" />
            }
            <span className={`hidden sm:inline ${done ? "text-emerald-600" : "text-gray-400"}`}>
              {done ? "Mastered" : "Mark"}
            </span>
          </button>
        </td>
      </tr>
      {expanded && (
        <tr className="bg-blue-50/30">
          <td colSpan={6} className="px-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl border border-blue-100 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Zap size={14} className="text-blue-600" />
                  <span className="text-xs font-bold text-blue-700 uppercase tracking-wide">Key Idea</span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{p.keyIdea}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Clock size={14} className="text-gray-500" />
                  <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">Complexity</span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-14">Time</span>
                    <code className="text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded font-mono">{p.timeComplexity}</code>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-14">Space</span>
                    <code className="text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded font-mono">{p.spaceComplexity}</code>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-amber-100 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen size={14} className="text-amber-600" />
                  <span className="text-xs font-bold text-amber-700 uppercase tracking-wide">Meta Note</span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{p.metaNote}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-4 md:col-span-2 lg:col-span-3">
                <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">Practice Problems</span>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {p.problems.map((prob) => (
                    <span key={prob} className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full font-medium">{prob}</span>
                  ))}
                </div>
              </div>
              {/* Stuck? Hint Ladder */}
              <div className="md:col-span-2 lg:col-span-3">
                <PatternStuckHintLadder patternName={p.name} keyIdea={p.keyIdea} />
              </div>

              {/* Pattern Notes */}
              <div className="bg-white rounded-xl border border-purple-100 p-4 md:col-span-2 lg:col-span-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <StickyNote size={13} className="text-purple-500" />
                    <span className="text-xs font-bold text-purple-700 uppercase tracking-wide">My Notes</span>
                    <span className="text-[11px] text-gray-400">mnemonics, edge cases, personal reminders</span>
                  </div>
                  {note && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onNoteClear(); }}
                      className="flex items-center gap-1 text-[11px] text-red-400 hover:text-red-600 transition-colors"
                      title="Clear notes"
                    >
                      <Trash2 size={11} /> Clear
                    </button>
                  )}
                </div>
                <textarea
                  value={note}
                  onChange={(e) => onNoteChange(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="Jot down your mnemonic, a tricky edge case, or a reminder for next time..."
                  rows={3}
                  className="w-full text-sm text-gray-700 bg-purple-50/50 border border-purple-100 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-purple-300 placeholder:text-gray-400 font-mono leading-relaxed"
                />
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function CodingTab() {
  const { isSenior, isMidOrAbove } = useICLevel();
  const [expandedPattern, setExpandedPattern] = useState<string | null>(null);
  const patterns = useProgress("patterns", PATTERNS.length);
  const drillRatings = useDrillRatings();
  const ratingMap = Object.fromEntries(drillRatings.map(r => [r.patternId, r.latest ?? 0]));

  // Filter state
  const [diffFilter,    setDiffFilter]    = useState<FilterDiff>("all");
  const [freqFilter,    setFreqFilter]    = useState<FilterFreq>("all");
  const [masteryFilter, setMasteryFilter] = useState<FilterMastery>("all");
  const [searchQuery,   setSearchQuery]   = useState("");

  const toggle = (id: string) => setExpandedPattern((prev) => (prev === id ? null : id));
  const { getNote, setNote, clearNote } = usePatternNotes();

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return PATTERNS.filter((p) => {
      if (diffFilter !== "all" && p.difficultyColor !== diffFilter) return false;
      if (freqFilter === "5"  && p.frequency !== 5) return false;
      if (freqFilter === "4+" && p.frequency < 4)   return false;
      if (freqFilter === "3+" && p.frequency < 3)   return false;
      if (masteryFilter === "done" && !patterns.checked.has(p.id))  return false;
      if (masteryFilter === "todo" &&  patterns.checked.has(p.id))  return false;
      if (q) {
        const haystack = [
          p.name,
          p.keyIdea,
          p.summary,
          p.metaNote,
          ...p.problems,
        ].join(" ").toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [diffFilter, freqFilter, masteryFilter, searchQuery, patterns.checked]);

  const hasActiveFilter = diffFilter !== "all" || freqFilter !== "all" || masteryFilter !== "all";
  const hasSearch = searchQuery.trim().length > 0;

  const clearFilters = () => {
    setDiffFilter("all");
    setFreqFilter("all");
    setMasteryFilter("all");
  };

  return (
    <div className="space-y-10">

      {/* ★ META CODING SCREEN SIMULATOR — MUST DO HERO BANNER ★ */}
      <section>
        {/* Gradient hero card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-1 shadow-2xl">
          {/* Animated shimmer overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse pointer-events-none" />
          <div className="relative rounded-xl bg-gradient-to-br from-indigo-950/90 via-violet-950/90 to-fuchsia-950/90 p-6 md:p-8">
            {/* MUST DO badge */}
            <div className="flex items-center gap-3 mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500 text-white text-xs font-black uppercase tracking-widest shadow-lg animate-bounce">
                🚨 MUST DO
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-amber-950 text-xs font-black uppercase tracking-widest shadow-lg">
                ⭐ #1 PRIORITY
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-black uppercase tracking-widest shadow-lg">
                🤖 AI SCORED
              </span>
            </div>

            {/* Title */}
            <h2 className="text-3xl md:text-4xl font-black text-white mb-2 leading-tight">
              🖥️ FAANG-Style Coding Screen Simulator
            </h2>
            <p className="text-violet-200 text-base md:text-lg font-semibold mb-5">
              The closest thing to the real Meta coding screen — without being in the room.
            </p>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-2 mb-6">
              {[
                { emoji: "⏱️", text: "30-min timer" },
                { emoji: "📝", text: "2 real questions" },
                { emoji: "⚡", text: "Monaco editor" },
                { emoji: "✅", text: "Hidden test cases" },
                { emoji: "🧠", text: "AI debrief" },
                { emoji: "🎯", text: "4 Meta focus areas" },
                { emoji: "✨", text: "AI question pick" },
                { emoji: "📄", text: "Copy debrief" },
                { emoji: "📈", text: "Session history" },
              ].map(f => (
                <span key={f.text} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 text-white text-xs font-semibold border border-white/20">
                  {f.emoji} {f.text}
                </span>
              ))}
            </div>

            {/* Why it matters callout */}
            <div className="flex gap-3 p-4 rounded-xl bg-amber-400/20 border border-amber-400/40 mb-6">
              <span className="text-2xl flex-shrink-0">💡</span>
              <div>
                <p className="text-amber-200 font-black text-sm uppercase tracking-wide mb-1">Why this matters for your Meta screen</p>
                <p className="text-amber-100 text-sm leading-relaxed">
                  Meta screens are scored on <strong className="text-white">Problem Solving, Coding, Verification &amp; Debugging, and Technical Communication</strong> — each rated Insufficient / Moderate / Solid / Strong / Exceptional. This simulator replicates that exact format. The AI debrief tells you your likely rating on all 4 dimensions and whether you would <strong className="text-white">Proceed</strong> or <strong className="text-white">Do Not Proceed</strong>.
                </p>
              </div>
            </div>

            {/* E6+ note — only shown for L6/L7 level */}
            {isSenior && (
            <div className="flex gap-3 p-3 rounded-xl bg-cyan-400/20 border border-cyan-400/40">
              <span className="text-xl flex-shrink-0">👑</span>
              <p className="text-cyan-100 text-sm leading-relaxed">
                <strong className="text-white">E6+ candidates:</strong> Select the <strong className="text-white">E6+</strong> target level to unlock two additional senior focus areas — <strong className="text-white">XFN Collaboration</strong> and <strong className="text-white">Scope &amp; Conflict Resolution</strong> — which are assessed in senior screens to determine L5 vs L6 level fit.
              </p>
            </div>
            )}
          </div>
        </div>

        {/* Simulator component */}
        <div className="mt-6">
          <MetaCodingScreenSimulator />
        </div>
      </section>

      {/* Overview */}
      <section>
        <div className="border-b border-gray-200 pb-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            The Coding Interview L6/L7
          </h2>
          <p className="text-sm text-gray-500 mt-1">What to expect, how you are evaluated, and what separates a pass from a fail</p>
        </div>
        <p className="text-gray-700 leading-relaxed mb-4">
          Meta's coding screen rounds are 30-minute sessions conducted in CoderPad. For L6 and L7 candidates, the problem difficulty is typically LeetCode medium, but the bar for code quality, communication, and handling follow-up questions is significantly higher than for junior roles. Interviewers expect clean, production-quality code, proactive edge case handling, and the ability to discuss time and space complexity without prompting.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="w-1 rounded-full bg-blue-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-blue-800 mb-1">Two Coding Rounds in 2026</p>
              <p className="text-sm text-blue-700 leading-relaxed">
                Meta's full loop now includes <strong>two coding rounds</strong>. One is the traditional LeetCode-style session; the other is the new AI-enabled coding round (introduced October 2025) using CoderPad with an AI assistant.
              </p>
            </div>
          </div>
          <div className="flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="w-1 rounded-full bg-amber-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-amber-800 mb-1">Meta's Stance on Dynamic Programming</p>
              <p className="text-sm text-amber-700 leading-relaxed">
                Meta has officially instructed interviewers <strong>not</strong> to ask pure DP problems. Focus on core patterns, not DP-heavy problems. Recursion + memoization may still appear.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mock Interview Timer */}
      <section>
        <div className="border-b border-gray-200 pb-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Mock Interview Timer
          </h2>
          <p className="text-sm text-gray-500 mt-1">Simulate real interview pressure — start the timer before you begin a practice problem</p>
        </div>
        <div className="max-w-sm">
          <InterviewTimer />
        </div>
      </section>

      {/* Quick Drill */}
      <section>
        <div className="border-b border-gray-200 pb-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Quick Drill — Pattern Flash Cards
          </h2>
          <p className="text-sm text-gray-500 mt-1">30 seconds to recall the key idea and complexity — then reveal and rate yourself. Spaced-repetition style.</p>
        </div>
        <QuickDrill />
      </section>

      {/* Session Log */}
      <section>
        <div className="border-b border-gray-200 pb-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Session History
          </h2>
          <p className="text-sm text-gray-500 mt-1">A log of all your mock interview timer sessions — date, duration, and self-rating</p>
        </div>
        <SessionLog />
      </section>

       {/* 7-Step Approach */}
      <section>
        <div className="border-b border-gray-200 pb-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            How to Approach a Problem
          </h2>
          <p className="text-sm text-gray-500 mt-1">A repeatable 7-step process to maximize your score on every problem</p>
        </div>
        <div className="space-y-3">
          {[
            "Clarify constraints: input size, edge cases, expected output format, null handling",
            "Restate the problem in your own words to confirm understanding",
            "Identify the pattern (sliding window? BFS? DP?) — think out loud",
            "State your approach and time/space complexity before coding",
            "Code cleanly with meaningful variable names — no single-letter variables",
            "Test with provided examples, then edge cases (empty input, single element, duplicates)",
            "Optimize if time allows — discuss trade-offs explicitly with the interviewer",
          ].map((step, i) => (
            <div key={i} className="flex gap-3 items-start bg-white border border-gray-100 rounded-xl p-3.5 shadow-sm">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">{i + 1}</span>
              <p className="text-sm text-gray-700 leading-relaxed pt-0.5">{step}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pattern Table */}
      <section>
        <div className="border-b border-gray-200 pb-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            14 LeetCode Patterns — Frequency &amp; Summary
          </h2>
          <p className="text-sm text-gray-500 mt-1">Click any row to expand details · Use the filters below to focus your study session</p>
        </div>

        {/* ── Search Bar ── */}
        <div className="relative mb-3">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search patterns, key ideas, or practice problems…"
            className="w-full pl-9 pr-9 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300 placeholder:text-gray-400 transition-all"
          />
          {hasSearch && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* ── Filter Bar ── */}
        <div className="flex flex-wrap items-center gap-2 mb-4 p-3 bg-gray-50 border border-gray-200 rounded-xl">
          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 mr-1">
            <SlidersHorizontal size={13} />
            <span>Filter:</span>
          </div>

          {/* Difficulty */}
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide mr-0.5">Difficulty</span>
            {(["all", "green", "amber", "red"] as FilterDiff[]).map((v) => {
              const labels: Record<FilterDiff, string> = { all: "All", green: "Easy", amber: "Medium", red: "Hard" };
              const active = diffFilter === v;
              return (
                <button key={v} onClick={() => setDiffFilter(v)}
                  className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all border ${
                    active
                      ? v === "green" ? "bg-emerald-500 text-white border-emerald-500"
                        : v === "amber" ? "bg-amber-500 text-white border-amber-500"
                        : v === "red"   ? "bg-red-500 text-white border-red-500"
                        : "bg-gray-800 text-white border-gray-800"
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                  }`}>
                  {labels[v]}
                </button>
              );
            })}
          </div>

          <div className="w-px h-5 bg-gray-200 mx-1 hidden sm:block" />

          {/* Frequency */}
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide mr-0.5">Frequency</span>
            {(["all", "5", "4+", "3+"] as FilterFreq[]).map((v) => {
              const labels: Record<FilterFreq, string> = { all: "All", "5": "★★★★★", "4+": "★★★★+", "3+": "★★★+" };
              const active = freqFilter === v;
              return (
                <button key={v} onClick={() => setFreqFilter(v)}
                  className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all border ${
                    active ? "bg-amber-500 text-white border-amber-500" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                  }`}>
                  {labels[v]}
                </button>
              );
            })}
          </div>

          <div className="w-px h-5 bg-gray-200 mx-1 hidden sm:block" />

          {/* Mastery */}
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide mr-0.5">Mastery</span>
            {(["all", "todo", "done"] as FilterMastery[]).map((v) => {
              const labels: Record<FilterMastery, string> = { all: "All", todo: "To Study", done: "Mastered" };
              const active = masteryFilter === v;
              return (
                <button key={v} onClick={() => setMasteryFilter(v)}
                  className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all border ${
                    active
                      ? v === "done" ? "bg-emerald-500 text-white border-emerald-500"
                        : v === "todo" ? "bg-blue-500 text-white border-blue-500"
                        : "bg-gray-800 text-white border-gray-800"
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                  }`}>
                  {labels[v]}
                </button>
              );
            })}
          </div>

          {/* Clear + count */}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-gray-500 font-medium">
              {filtered.length} of {PATTERNS.length} shown
              {hasSearch && <span className="text-blue-500 ml-1">for "{searchQuery.trim()}"</span>}
            </span>
            {hasActiveFilter && (
              <button onClick={clearFilters}
                className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-medium transition-colors">
                <X size={11} /> Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Progress mini-bar */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xs text-gray-500 whitespace-nowrap">{patterns.count}/{patterns.total} mastered</span>
          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <motion.div className="h-full bg-emerald-500 rounded-full"
              animate={{ width: `${patterns.pct}%` }} transition={{ duration: 0.4 }} />
          </div>
          <span className="text-xs font-bold text-emerald-600">{patterns.pct}%</span>
        </div>

        <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-900 text-white">
                  <th className="text-left py-3 px-4 font-semibold text-xs tracking-wide">Pattern</th>
                  <th className="text-left py-3 px-4 font-semibold text-xs tracking-wide">Frequency</th>
                  <th className="text-left py-3 px-4 font-semibold text-xs tracking-wide hidden md:table-cell">Difficulty</th>
                  <th className="text-left py-3 px-4 font-semibold text-xs tracking-wide hidden lg:table-cell">Summary</th>
                  <th className="text-left py-3 px-4 font-semibold text-xs tracking-wide hidden xl:table-cell">Key Problems</th>
                  <th className="text-right py-3 px-4 font-semibold text-xs tracking-wide">Mastered</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-sm text-gray-400">
                        No patterns match the current filters.{" "}
                        <button onClick={clearFilters} className="text-blue-500 underline">Clear filters</button>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((p) => {
                      const prereqIds = PATTERN_PREREQUISITES[p.id] ?? [];
                      const isLocked = prereqIds.some(pid => (ratingMap[pid] ?? 0) < 3);
                      const prereqNames = prereqIds
                        .filter(pid => (ratingMap[pid] ?? 0) < 3)
                        .map(pid => PATTERNS.find(pat => pat.id === pid)?.name ?? pid);
                      return (
                        <PatternRow
                          key={p.id}
                          p={p}
                          expanded={expandedPattern === p.id}
                          onExpand={() => toggle(p.id)}
                          done={patterns.checked.has(p.id)}
                          onToggleDone={(e) => { e.stopPropagation(); patterns.toggle(p.id); }}
                          note={getNote(p.id)}
                          onNoteChange={(text) => setNote(p.id, text)}
                          onNoteClear={() => clearNote(p.id)}
                          isLocked={isLocked}
                          prereqNames={prereqNames}
                        />
                      );
                    })
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2">Click any row to expand details. Mark patterns as mastered to track your progress — synced with the Study Timeline tab.</p>
      </section>

      {/* Pattern Mastery Heatmap */}
      <section>
        <div className="border-b border-gray-200 pb-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            🟥 Pattern Mastery Heatmap
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            All {PATTERNS.length} patterns color-coded by Quick Drill ratings — click any card to see drill history, rating trend, and prerequisite chain
          </p>
        </div>
        <PatternHeatmap />
      </section>

      {/* Reverse Engineering Drill */}
      <section>
        <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            🔍 Reverse Engineering Drill
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Read a working solution and identify the pattern, time complexity, and a key edge case — all within 3 minutes.
          </p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
          <ReverseEngineeringDrill />
        </div>
      </section>

      {/* Resources */}
      <section>
        <div className="border-b border-gray-200 pb-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Coding Prep Resources
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { tag: "Platform",       tagColor: "blue",   title: "NeetCode.io — Meta Practice List",       desc: "The NeetCode 150 and 300 lists are the gold standard for Meta prep. Excellent video explanations for every problem, organized by pattern.", url: "https://neetcode.io/practice/company/Meta" },
            { tag: "Platform",       tagColor: "amber",  title: "LeetCode Premium — Meta Tag",            desc: "Filter by 'Meta' company tag to see the most frequently asked problems. Focus on the top 100 Meta-tagged questions.", url: "https://leetcode.com" },
            { tag: "Mock Interviews",tagColor: "emerald",title: "interviewing.io",                        desc: "Practice anonymous mock interviews with real engineers from Meta and other top companies. Excellent for phone screen prep.", url: "https://interviewing.io" },
            { tag: "AI Coding",      tagColor: "teal",   title: "Coditioning — AI-Enabled Mocks",         desc: "Offers AI-enabled mock interviews that simulate the new Meta coding format, with real practice questions for the AI-assisted round.", url: "https://www.coditioning.com" },
            { tag: "Blog",           tagColor: "purple", title: "David Qorashi — Meta SWE Guide",         desc: "A Meta engineer's personal prep journey: CLRS → Programming Pearls → EPIP. Includes a day-by-day study plan and mindset advice.", url: "https://daqo.medium.com/facebook-senior-software-engineer-interview-the-only-post-youll-need-to-read-e4604ff2336d" },
            { tag: "Spreadsheet",    tagColor: "indigo", title: "500 LeetCode Problems — Dinesh Varyani", desc: "Curated spreadsheet of the top 500 LeetCode problems organized by topic. Tackle at least 30–50 mediums for Meta's standard.", url: "https://docs.google.com/spreadsheets/d/1pnI8HmSMPcfwrCCu7wYETCXaKDig4VucZDpcjVRuYrE/edit" },
          ].map((r) => (
            <a key={r.title} href={r.url} target="_blank" rel="noopener noreferrer"
              className="group flex flex-col gap-2 bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-md transition-all">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className={`text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full mb-1.5 inline-block bg-${r.tagColor}-100 text-${r.tagColor}-700`}>{r.tag}</span>
                  <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors leading-snug">{r.title}</p>
                </div>
                <ExternalLink size={13} className="text-gray-300 group-hover:text-blue-400 transition-colors flex-shrink-0 mt-1" />
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">{r.desc}</p>
            </a>
          ))}
        </div>
      </section>

      {/* Pattern Quick Reference */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 rounded-full bg-indigo-500" />
          <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Pattern Quick Reference
          </h2>
        </div>
        <PatternQuickReference />
      </section>

      {/* Pattern Dependency Graph */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 rounded-full bg-violet-500" />
          <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Pattern Dependency Graph
          </h2>
          <p className="text-sm text-gray-500">Click any node to view the pattern card. Drag to reposition. Scroll to zoom. Green glow = mastered (★4+)</p>
        </div>
        <PatternDependencyGraph />
      </section>

      {/* Pattern Mastery Tree */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 rounded-full bg-amber-500" />
          <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Pattern Mastery Tree
          </h2>
          <p className="text-sm text-gray-500">Unlock nodes by rating each pattern 4+/5 in Quick Drill three times. Complete all 14 to earn the Pattern Master badge.</p>
        </div>
        <PatternMasteryTree />
      </section>

      {/* Topic Boss Fight */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 rounded-full bg-red-500" />
          <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Topic Boss Fight
          </h2>
          <p className="text-sm text-gray-500">Defeat each boss by solving all 3 hard problems. Resets every Monday. Crown = cleared this week.</p>
        </div>
        <TopicBossFight />
      </section>

      {/* Sprint Mode */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 rounded-full bg-yellow-500" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            ⚡ Sprint Mode
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">8 problems · 30 seconds each · Identify the pattern before time runs out</p>
        </div>
        <SprintMode />
      </section>

      {/* Approach Analyzer + Voice Recorder */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 rounded-full bg-teal-500" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            🎙️ Approach Analyzer
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Type or speak your approach — scored on 4 IC dimensions: pattern, complexity, edge cases, trade-offs</p>
        </div>
        <ApproachAnalyzer />
      </section>

      {/* Interview Scorecard */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 rounded-full bg-indigo-500" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            📋 Interview Scorecard
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">7-criterion self-assessment after each practice session — get a Strong Hire / Hire / No Hire verdict</p>
        </div>
        <InterviewScorecard />
      </section>

      {/* Staff Engineer Focus Area Rubric */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 rounded-full bg-violet-500" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            ⭐ Staff Engineer Rubric
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Official Meta focus areas — Problem Solving, Coding, Verification, Communication — rated on the 6-point Meta scale</p>
        </div>
        <MetaRubricAssessment
          problemName="Your current practice problem"
          approachText=""
          selfAssessMode
          targetLevel="L6"
        />
      </section>

      {/* Complexity Estimator */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 rounded-full bg-cyan-500" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            🧮 Complexity Estimator
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Guess time and space complexity before the reveal — builds the habit of stating complexity first</p>
        </div>
        <ComplexityEstimator />
      </section>

      {/* Weakness Heatmap */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 rounded-full bg-rose-500" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            🔥 Weakness Heatmap
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">All patterns sorted by mastery score — focus your next session on the weakest areas</p>
        </div>
        <WeaknessHeatmap />
      </section>

      {/* Streak & Badges */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 rounded-full bg-amber-500" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            🏆 Streak &amp; Achievements
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Daily streak tracker and 8 achievement badges — earned automatically from your progress</p>
        </div>
        <StreakBadges />
      </section>

      {/* Spaced Repetition Queue */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 rounded-full bg-violet-500" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            🧠 Spaced Repetition Queue
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">SM-2 algorithm schedules problem reviews based on recall quality — add problems and review daily</p>
        </div>
        <SpacedRepetitionQueue />
      </section>

    </div>
  );
}
