// Design: Structured Clarity — timeline tab with countdown, progress tracker, story notes, IC6 vs IC7 bar
import { useState, useCallback } from "react";
import { TIMELINE_WEEKS, STORY_BANK, PATTERNS } from "@/lib/guideData";
import { CheckCircle2, Circle, RotateCcw, CalendarDays, ChevronDown, ChevronUp, FileText, Copy, Check, PartyPopper } from "lucide-react";
import WeeklyDigest from "@/components/WeeklyDigest";
import WeakSpotDashboard from "@/components/WeakSpotDashboard";
import ShareableLink from "@/components/ShareableLink";
import InterviewDayChecklist from "@/components/InterviewDayChecklist";
import ProgressExport from "@/components/ProgressExport";
import { useProgress } from "@/hooks/useProgress";
import { useInterviewCountdown } from "@/hooks/useInterviewCountdown";
import { useStoryNotes } from "@/hooks/useStoryNotes";
import { useConfetti } from "@/hooks/useConfetti";
import ProgressBar from "@/components/ProgressBar";
import PatternHeatmap from "@/components/PatternHeatmap";
import { motion, AnimatePresence } from "framer-motion";
import ReadinessScoreCard from "@/components/ReadinessScoreCard";
import RecommendedToday from "@/components/RecommendedToday";
import DailyProblem from "@/components/DailyProblem";
import WeeklyReportCard from "@/components/WeeklyReportCard";
import SolveVelocityChart from "@/components/SolveVelocityChart";
import StreakCalendar from "@/components/StreakCalendar";
import TopicRadarChart from "@/components/TopicRadarChart";
import TimedMockSession from "@/components/TimedMockSession";
import CustomStudyPlan from "@/components/CustomStudyPlan";
import RecruiterPDF from "@/components/RecruiterPDF";
import StudyBuddySync from "@/components/StudyBuddySync";
import BlindSpotDetector from "@/components/BlindSpotDetector";
import ActivityCalendar60 from "@/components/ActivityCalendar60";
import PrepTimeline4Week from "@/components/PrepTimeline4Week";
import PatternDependencyGraph from "@/components/PatternDependencyGraph";
import DailyNotificationReminder from "@/components/DailyNotificationReminder";
import MilestoneNotifications from "@/components/MilestoneNotifications";
import CodingSessionDebriefLog from "@/components/CodingSessionDebriefLog";

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

// ── Countdown Card ──────────────────────────────────────────────────────────
function CountdownCard() {
  const { dateStr, setDateStr, daysLeft, activeWeekIndex } = useInterviewCountdown();

  const urgencyColor =
    daysLeft === null ? "from-blue-600 to-indigo-600"
    : daysLeft <= 7   ? "from-red-600 to-rose-600"
    : daysLeft <= 21  ? "from-amber-500 to-orange-500"
    : "from-blue-600 to-indigo-600";

  const urgencyLabel =
    daysLeft === null ? null
    : daysLeft <= 0   ? "Interview day — good luck! 🎉"
    : daysLeft <= 7   ? "Final stretch — focus on weak areas"
    : daysLeft <= 21  ? "Getting close — ramp up mock interviews"
    : daysLeft <= 42  ? "On track — keep the daily cadence"
    : "Plenty of time — build strong foundations";

  return (
    <div className={`bg-gradient-to-r ${urgencyColor} rounded-xl p-5 text-white shadow-md`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CalendarDays size={16} className="text-white/80" />
            <p className="text-xs font-bold uppercase tracking-widest text-white/80">Interview Countdown</p>
          </div>
          {daysLeft !== null ? (
            <>
              <p className="text-4xl font-extrabold leading-none" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {daysLeft <= 0 ? "Today!" : `${daysLeft}d`}
              </p>
              {daysLeft > 0 && <p className="text-sm text-white/80 mt-1">days until your interview</p>}
              {urgencyLabel && (
                <p className="text-xs font-semibold mt-2 bg-white/20 px-2.5 py-1 rounded-full inline-block">
                  {urgencyLabel}
                </p>
              )}
            </>
          ) : (
            <p className="text-lg font-semibold text-white/80 mt-1">Set your interview date to see your countdown</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5 sm:items-end">
          <label className="text-xs font-bold text-white/70 uppercase tracking-wide">Interview Date</label>
          <input
            type="date"
            value={dateStr}
            onChange={(e) => setDateStr(e.target.value)}
            min={new Date().toISOString().split("T")[0]}
            className="bg-white/20 border border-white/30 text-white placeholder-white/50 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-white/50 [color-scheme:dark]"
          />
          {dateStr && (
            <button onClick={() => setDateStr("")}
              className="text-[11px] text-white/60 hover:text-white underline underline-offset-2 transition-colors text-right">
              Clear date
            </button>
          )}
        </div>
      </div>

      {/* Active week indicator */}
      {daysLeft !== null && daysLeft > 0 && activeWeekIndex >= 0 && (
        <div className="mt-4 pt-4 border-t border-white/20 flex items-center gap-2">
          <span className="text-xs text-white/70">You should be on:</span>
          <span className="text-xs font-bold bg-white/25 text-white px-2.5 py-1 rounded-full">
            {TIMELINE_WEEKS[activeWeekIndex].weeks} — {TIMELINE_WEEKS[activeWeekIndex].focus}
          </span>
        </div>
      )}
    </div>
  );
}

// ── Story Row with Notes ────────────────────────────────────────────────────
function StoryRow({
  s, index, done, onToggle, note, onNoteChange,
}: {
  s: typeof STORY_BANK[0];
  index: number;
  done: boolean;
  onToggle: () => void;
  note: string;
  onNoteChange: (v: string) => void;
}) {
  const [notesOpen, setNotesOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const id = `story-${index}`;
  const hasNote = note.trim().length > 0;

  const handleCopySTAR = useCallback(() => {
    const template = [
      `STAR Story: ${s.type}`,
      `Focus Areas: ${s.focusAreas}`,
      `Meta Values: ${s.values}`,
      ``,
      `SITUATION`,
      `----------`,
      ``,
      `TASK`,
      `----------`,
      ``,
      `ACTION`,
      `----------`,
      ``,
      `RESULT (include metrics)`,
      `----------`,
      ``,
    ].join("\n");

    // If the user has notes, append them below the template
    const content = note.trim()
      ? `${template}\n--- Your Notes ---\n${note.trim()}`
      : template;

    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      // fallback: select textarea
    });
  }, [s, note]);

  return (
    <div className={`rounded-xl border transition-all ${done ? "bg-amber-50 border-amber-300" : "bg-white border-gray-200 hover:border-amber-300"}`}>
      {/* Main row */}
      <div className="flex items-center gap-4 px-4 py-3.5">
        {/* Number */}
        <span className={`flex-shrink-0 w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${done ? "bg-amber-400 text-white" : "bg-gray-100 text-gray-500"}`}>
          {index + 1}
        </span>

        {/* Check toggle */}
        <button onClick={onToggle} className="flex-shrink-0">
          <AnimatePresence mode="wait" initial={false}>
            {done ? (
              <motion.div key="checked" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} transition={{ duration: 0.15 }}>
                <CheckCircle2 size={16} className="text-amber-500" />
              </motion.div>
            ) : (
              <motion.div key="unchecked" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} transition={{ duration: 0.15 }}>
                <Circle size={16} className="text-gray-300 hover:text-amber-400 transition-colors" />
              </motion.div>
            )}
          </AnimatePresence>
        </button>

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

        {/* Badges + notes toggle */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {done && (
            <span className="text-[11px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full hidden sm:block">
              Ready
            </span>
          )}
          <button
            onClick={() => setNotesOpen((v) => !v)}
            className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg transition-all ${
              notesOpen
                ? "bg-blue-100 text-blue-700"
                : hasNote
                ? "bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600"
                : "text-gray-400 hover:text-blue-500 hover:bg-blue-50"
            }`}
            title="Toggle notes"
          >
            <FileText size={12} />
            <span className="hidden sm:inline">{hasNote ? "Notes" : "Add notes"}</span>
            {notesOpen ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </button>
        </div>
      </div>

      {/* Notes panel */}
      <AnimatePresence initial={false}>
        {notesOpen && (
          <motion.div
            key={`notes-${id}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 border-t border-gray-100">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">
                STAR Notes — {s.type}
              </label>
              <textarea
                value={note}
                onChange={(e) => onNoteChange(e.target.value)}
                placeholder={`Jot down bullet points for your STAR answer:\n• Situation: ...\n• Task: ...\n• Action: ...\n• Result: (include metrics)`}
                rows={5}
                className="w-full text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 resize-y focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300 placeholder-gray-400 leading-relaxed font-mono"
              />
              <div className="flex items-center justify-between mt-1.5">
                <p className="text-[11px] text-gray-400">Saved automatically as you type</p>
                <div className="flex items-center gap-3">
                  {/* Copy STAR template button */}
                  <button
                    onClick={handleCopySTAR}
                    className={`flex items-center gap-1 text-[11px] font-semibold transition-colors ${
                      copied ? "text-emerald-600" : "text-blue-500 hover:text-blue-700"
                    }`}
                  >
                    {copied ? <Check size={11} /> : <Copy size={11} />}
                    {copied ? "Copied!" : "Copy STAR template"}
                  </button>
                  {note.trim() && (
                    <button onClick={() => onNoteChange("")}
                      className="text-[11px] text-red-400 hover:text-red-600 transition-colors">
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────
export default function TimelineTab() {
  const patterns = useProgress("patterns", PATTERNS.length);
  const stories  = useProgress("stories",  STORY_BANK.length);
  const { getNote, setNote } = useStoryNotes();
  const { activeWeekIndex } = useInterviewCountdown();

  const totalItems = PATTERNS.length + STORY_BANK.length;
  const totalDone  = patterns.count + stories.count;
  const overallPct = Math.round((totalDone / totalItems) * 100);
  const isComplete = totalDone === totalItems && totalItems > 0;

  // Fire confetti when user reaches 100%
  useConfetti(isComplete);

  return (
    <div className="space-y-10">
      {/* ── Weak-Spot Dashboard ── */}
      <section>
        <div className="border-b border-gray-200 pb-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Weak-Spot Dashboard
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Your 3 lowest-rated coding patterns and behavioral questions — based on your Quick Drill and Practice Mode sessions
          </p>
        </div>
        <WeakSpotDashboard />
      </section>

      {/* ── Countdown ── */}
      <section>
        <div className="border-b border-gray-200 pb-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Interview Countdown
          </h2>
          <p className="text-sm text-gray-500 mt-1">Set your interview date to see how many days you have and which week of the plan you should be on</p>
        </div>
        <CountdownCard />
      </section>

      {/* ── Overall Progress Dashboard ── */}
      <section>
        <div className="border-b border-gray-200 pb-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Your Prep Progress
          </h2>
          <p className="text-sm text-gray-500 mt-1">Track your patterns and STAR stories — saved automatically in your browser</p>
        </div>

        <div className={`bg-gradient-to-r ${isComplete ? "from-emerald-500 to-teal-500" : "from-blue-600 to-indigo-600"} rounded-xl p-5 text-white mb-4 shadow-md transition-all duration-700`}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-white/70 mb-0.5">
                {isComplete ? "🎉 100% Ready!" : "Overall Readiness"}
              </p>
              <p className="text-3xl font-extrabold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{overallPct}%</p>
            </div>
            <div className="text-right">
              {isComplete ? (
                <div className="flex items-center gap-2 justify-end">
                  <PartyPopper size={20} className="text-white" />
                  <p className="text-sm font-bold">All done — good luck!</p>
                </div>
              ) : (
                <>
                  <p className="text-sm text-white/80">{totalDone} of {totalItems} items</p>
                  <p className="text-xs text-white/60 mt-0.5">Patterns + Stories</p>
                </>
              )}
            </div>
          </div>
          <div className="h-3 bg-white/20 rounded-full overflow-hidden">
            <motion.div className="h-full bg-white rounded-full"
              initial={{ width: 0 }} animate={{ width: `${overallPct}%` }} transition={{ duration: 0.5, ease: "easeOut" }} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ProgressBar count={patterns.count} total={patterns.total} pct={patterns.pct} label="LeetCode Patterns" color="bg-blue-500" onReset={patterns.reset} />
          <ProgressBar count={stories.count}  total={stories.total}  pct={stories.pct}  label="STAR Story Bank"  color="bg-amber-500" onReset={stories.reset} />
        </div>
      </section>

      {/* ── Pattern Mastery Heatmap ── */}
      <section>
        <div className="border-b border-gray-200 pb-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Pattern Mastery Heatmap
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            All 14 patterns color-coded by your Quick Drill ratings — red is weak, green is strong
          </p>
        </div>
        <PatternHeatmap />
      </section>

      {/* ── Pattern Checklist ── */}
      <section>
        <div className="border-b border-gray-200 pb-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>LeetCode Pattern Checklist</h2>
              <p className="text-sm text-gray-500 mt-1">Check off each pattern as you master it — also synced with the Coding tab filter</p>
            </div>
            {patterns.count > 0 && (
              <button onClick={patterns.reset} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors">
                <RotateCcw size={12} /> Reset all
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {PATTERNS.map((p) => {
            const done = patterns.checked.has(p.id);
            return (
              <motion.button key={p.id} onClick={() => patterns.toggle(p.id)}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all ${done ? "bg-emerald-50 border-emerald-300 shadow-sm" : "bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm"}`}>
                <div className="flex-shrink-0 mt-0.5">
                  <AnimatePresence mode="wait" initial={false}>
                    {done ? (
                      <motion.div key="checked" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} transition={{ duration: 0.15 }}>
                        <CheckCircle2 size={18} className="text-emerald-500" />
                      </motion.div>
                    ) : (
                      <motion.div key="unchecked" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} transition={{ duration: 0.15 }}>
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

      {/* ── STAR Story Bank with Notes ── */}
      <section>
        <div className="border-b border-gray-200 pb-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>STAR Story Bank</h2>
              <p className="text-sm text-gray-500 mt-1">Mark stories as ready and add private notes for each — saved in your browser</p>
            </div>
            {stories.count > 0 && (
              <button onClick={stories.reset} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors">
                <RotateCcw size={12} /> Reset all
              </button>
            )}
          </div>
        </div>

        <div className="space-y-2">
          {STORY_BANK.map((s, i) => (
            <StoryRow
              key={i}
              s={s}
              index={i}
              done={stories.checked.has(`story-${i}`)}
              onToggle={() => stories.toggle(`story-${i}`)}
              note={getNote(`story-${i}`)}
              onNoteChange={(v) => setNote(`story-${i}`, v)}
            />
          ))}
        </div>
      </section>

      {/* ── Weekly Digest ── */}
      <section>
        <div className="border-b border-gray-200 pb-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Weekly Prep Digest
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Enter your email and interview date to generate a personalized week-by-week checklist you can copy into a doc or email to yourself
          </p>
        </div>
        <WeeklyDigest />
      </section>

      {/* ── Shareable Link ── */}
      <section>
        <div className="border-b border-gray-200 pb-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Share Your Prep State
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Bookmark or share a link that restores your interview date and checklist progress on any device
          </p>
        </div>
        <ShareableLink />
      </section>

      {/* ── 4-Week Plan ── */}
      <section>
        <div className="border-b border-gray-200 pb-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>4-Week Study Timeline</h2>
          <p className="text-sm text-gray-500 mt-1">
            {activeWeekIndex >= 0
              ? `Based on your interview date, you should currently be on ${TIMELINE_WEEKS[activeWeekIndex].weeks}.`
              : "Set your interview date above to highlight which week you should be on."}
          </p>
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
            {TIMELINE_WEEKS.map((w, i) => {
              const isActive = activeWeekIndex === i;
              return (
                <div key={i} className="flex gap-4 sm:gap-6 items-start">
                  <div className="flex-shrink-0 w-[80px] text-right hidden sm:block">
                    <span className={`text-xs font-bold leading-tight ${isActive ? "text-blue-600" : "text-gray-400"}`}>{w.weeks}</span>
                  </div>
                  <div className={`hidden sm:flex flex-shrink-0 w-4 h-4 rounded-full border-2 border-white shadow-sm mt-1 z-10 transition-all ${
                    isActive ? "bg-blue-600 ring-2 ring-blue-300 ring-offset-1 scale-125" : CONNECTOR_COLORS[w.tagColor]
                  }`} />
                  <div className={`flex-1 rounded-xl p-4 transition-all ${
                    isActive
                      ? "bg-blue-50 border-2 border-blue-400 shadow-md"
                      : "bg-white border border-gray-200 shadow-sm hover:shadow-md"
                  }`}>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <span className={`text-xs font-bold sm:hidden block mb-1 ${isActive ? "text-blue-600" : "text-gray-400"}`}>{w.weeks}</span>
                        <h4 className={`font-bold text-sm ${isActive ? "text-blue-900" : "text-gray-900"}`}
                          style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                          {w.focus}
                          {isActive && <span className="ml-2 text-[11px] font-bold bg-blue-600 text-white px-2 py-0.5 rounded-full align-middle">← You are here</span>}
                        </h4>
                      </div>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${TAG_COLORS[w.tagColor]}`}>{w.tag}</span>
                    </div>
                    <p className={`text-sm leading-relaxed ${isActive ? "text-blue-800" : "text-gray-600"}`}>{w.detail}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 60-Day Activity Calendar ── */}
      <section>
        <div className="border-b border-gray-200 pb-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            60-Day Activity Calendar
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            GitHub-style heatmap of your daily practice activity across drills, CTCI solves, and behavioral sessions
          </p>
        </div>
        <ActivityCalendar60 />
      </section>

      {/* ── 4-Week Prep Checklist ── */}
      <section>
        <div className="border-b border-gray-200 pb-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            4-Week Prep Checklist
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            A week-by-week action plan with checkable tasks — coding, CTCI problems, behavioral, and Meta-specific prep
          </p>
        </div>
        <PrepTimeline4Week />
      </section>

      {/* ── Pattern Dependency Graph ── */}
      <section>
        <div className="border-b border-gray-200 pb-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Pattern Dependency Graph
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Understand which patterns are prerequisites for others — learn in the right order to avoid foundational gaps
          </p>
        </div>
        <PatternDependencyGraph />
      </section>

      {/* ── Interview Day Checklist ── */}
      <section>
        <div className="border-b border-gray-200 pb-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Interview Day Checklist
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            A short, printable day-of checklist — from the night before to right after the interview
          </p>
        </div>
        <InterviewDayChecklist />
      </section>

      {/* ── Progress Export ── */}
      <section>
        <div className="border-b border-gray-200 pb-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Export Progress Report
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Download or copy a full summary of your readiness, patterns, stories, weak spots, and session history
          </p>
        </div>
        <ProgressExport />
      </section>

      {/* ── IC6 vs IC7 Bar ── */}
      <section>
        <div className="border-b border-gray-200 pb-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>IC6 vs. IC7 Behavioral Bar</h2>
          <p className="text-sm text-gray-500 mt-1">What distinguishes a Senior Engineer answer from a Staff Engineer answer</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
            <h3 className="font-bold text-blue-900 text-base mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>IC6 — Senior Engineer</h3>
            <ul className="space-y-2.5">
              {[
                "Owns a significant technical scope within a team",
                "Drives cross-functional alignment on a project level",
                "Resolves ambiguous problems independently",
                "Mentors junior engineers on the team",
                "Communicates technical decisions clearly to stakeholders",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-blue-800">
                  <CheckCircle2 size={14} className="text-blue-500 flex-shrink-0 mt-0.5" />{item}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5">
            <h3 className="font-bold text-indigo-900 text-base mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>IC7 — Staff Engineer</h3>
            <ul className="space-y-2.5">
              {[
                "Defines technical strategy for an entire product surface",
                "Drives org-wide architecture decisions across teams",
                "Influences engineering culture and practices",
                "Mentors senior engineers across multiple teams",
                "Justifies architectural decisions with business impact at the org level",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-indigo-800">
                  <CheckCircle2 size={14} className="text-indigo-500 flex-shrink-0 mt-0.5" />{item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Coding Session Debrief Log */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 rounded-full bg-indigo-500" />
          <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Coding Session Debrief Log
          </h2>
        </div>
        <p className="text-sm text-gray-500">
          After each coding session, log a structured debrief: what pattern you used, where you got stuck, and what you’d do differently. Stored in your browser and searchable over time.
        </p>
        <CodingSessionDebriefLog />
      </section>

      {/* Daily Notification Reminder */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 rounded-full bg-green-500" />
          <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Daily Practice Reminder
          </h2>
        </div>
        <p className="text-sm text-gray-500">
          Set a browser notification to fire daily with your personalized recommended problems — keeping your streak alive without manually opening the guide.
        </p>
        <DailyNotificationReminder />
      </section>

      {/* ── Milestone Notifications ── */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 rounded-full bg-blue-500" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            🔔 Interview Milestone Alerts
          </h2>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Set your interview date and get D-14, D-7, D-3, and D-1 browser push notifications with targeted prep advice for each milestone.
        </p>
        <MilestoneNotifications />
      </section>
    </div>
  );
}
