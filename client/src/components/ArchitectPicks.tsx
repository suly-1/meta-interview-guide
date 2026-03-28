/**
 * ArchitectPicks — Smart "Start Here" entry point.
 * Detects new users (no ratings) vs returning users (has data) and shows
 * a different, personalized CTA for each.
 *
 * New user:    "Start with the Overview → Rate your first 5 patterns."
 * Returning:   "You have N weak patterns. Drill them now →"
 */
import { useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Zap, BookOpen, Target, ChevronRight, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";

interface ArchitectPicksProps {
  onTabChange: (tabId: string) => void;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch { /* ignore */ }
  return fallback;
}

function useUserState() {
  return useMemo(() => {
    const patternRatings = loadJSON<Record<string, number>>("meta-guide-pattern-ratings", {});
    const behavioralRatings = loadJSON<Record<string, number>>("meta-guide-behavioral-ratings", {});
    const mockHistory = loadJSON<unknown[]>("meta-guide-mock-history", []);
    const interviewDate = localStorage.getItem("meta-guide-interview-date") ?? null;

    const ratedCount = Object.keys(patternRatings).length + Object.keys(behavioralRatings).length;
    const isNewUser = ratedCount < 5;

    // Weak patterns = rated 1 or 2
    const weakPatterns = Object.values(patternRatings).filter(v => v <= 2).length;
    const weakBehavioral = Object.values(behavioralRatings).filter(v => v <= 2).length;
    const totalWeak = weakPatterns + weakBehavioral;

    // Days until interview
    let daysLeft: number | null = null;
    if (interviewDate) {
      const diff = Math.ceil((new Date(interviewDate).getTime() - Date.now()) / 86400000);
      if (diff >= 0) daysLeft = diff;
    }

    return { isNewUser, ratedCount, weakPatterns, weakBehavioral, totalWeak, mockHistory: mockHistory.length, daysLeft };
  }, []);
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ArchitectPicks({ onTabChange }: ArchitectPicksProps) {
  const { isNewUser, ratedCount, totalWeak, mockHistory, daysLeft } = useUserState();

  const urgencyColor =
    daysLeft !== null && daysLeft <= 3 ? "from-red-900 to-red-800" :
    daysLeft !== null && daysLeft <= 14 ? "from-amber-900 to-[#0d1b2a]" :
    "from-[#0d1b2a] to-[#0d1b2a]";

  return (
    <div className={`bg-gradient-to-b ${urgencyColor} to-gray-50 dark:to-gray-950 pt-0 pb-6 px-4`}>
      <div className="max-w-5xl mx-auto">

        {/* ── Header ─────────────────────────────────────────────────────── */}
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
              {isNewUser ? (
                <>
                  <h2 className="text-base font-black text-white leading-tight">
                    Welcome — here's your first move
                  </h2>
                  <p className="text-xs text-white/90 mt-0.5">
                    New here? Do these 3 steps in order. Takes 10 minutes. Sets up everything else.
                  </p>
                </>
              ) : (
                <>
                  <h2 className="text-base font-black text-white leading-tight">
                    {totalWeak > 0
                      ? `You have ${totalWeak} weak area${totalWeak > 1 ? "s" : ""} — drill them now`
                      : `${ratedCount} areas rated · ${mockHistory} mock${mockHistory !== 1 ? "s" : ""} done`}
                  </h2>
                  <p className="text-xs text-white/90 mt-0.5">
                    {daysLeft !== null
                      ? daysLeft === 0
                        ? "🔴 Interview day — use the Day-Of Protocol"
                        : daysLeft <= 3
                        ? `🔴 ${daysLeft} day${daysLeft > 1 ? "s" : ""} left — final sprint mode`
                        : daysLeft <= 14
                        ? `🟡 ${daysLeft} days left — focus on weak areas`
                        : `🟢 ${daysLeft} days left — steady pace`
                      : "Set your interview date for a personalized countdown"}
                  </p>
                </>
              )}
            </div>
          </div>
        </motion.div>

        {/* ── Cards ──────────────────────────────────────────────────────── */}
        {isNewUser ? (
          /* New user: 3-step onboarding path */
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                step: 1, emoji: "📈", title: "Get Your Baseline",
                description: "Rate yourself on 10 coding patterns and 5 behavioral areas. Takes 3 minutes. The AI will tell you exactly where to start.",
                tabId: "readiness", cta: "Get your score",
                icon: <Target size={18} />,
                accent: "text-emerald-700 dark:text-emerald-400",
                border: "border-emerald-300 dark:border-emerald-700",
                bg: "bg-emerald-50 dark:bg-emerald-900/20",
              },
              {
                step: 2, emoji: "🗂️", title: "Map Your Stories",
                description: "Most behavioral failures happen because candidates reuse the same 2 stories. Map your STAR stories to all 8 Meta values — gaps will be obvious.",
                tabId: "behavioral", cta: "Map your stories",
                icon: <BookOpen size={18} />,
                accent: "text-amber-900 dark:text-amber-900",
                border: "border-amber-300 dark:border-amber-700",
                bg: "bg-amber-100 dark:bg-amber-900/20",
              },
              {
                step: 3, emoji: "🤖", title: "Simulate Pressure",
                description: "System design failures are rarely about knowledge — they're about handling pressure. Practice getting interrupted mid-design and recovering.",
                tabId: "sysdesign", cta: "Start a session",
                icon: <Zap size={18} />,
                accent: "text-violet-700 dark:text-violet-400",
                border: "border-violet-300 dark:border-violet-700",
                bg: "bg-violet-50 dark:bg-violet-900/20",
              },
            ].map((pick, i) => (
              <motion.button
                key={pick.tabId}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.08 }}
                onClick={() => onTabChange(pick.tabId)}
                className={`group text-left rounded-2xl border-2 ${pick.border} ${pick.bg} p-4 transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-xs font-black text-gray-600 dark:text-gray-200 shadow-sm">
                      {pick.step}
                    </span>
                    <span className="text-xl">{pick.emoji}</span>
                  </div>
                  <ChevronRight size={16} className={`${pick.accent} opacity-0 group-hover:opacity-100 transition-opacity`} />
                </div>
                <h3 className={`text-sm font-black mb-1.5 ${pick.accent}`}>{pick.title}</h3>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-3">{pick.description}</p>
                <div className={`flex items-center gap-1.5 text-xs font-bold ${pick.accent}`}>
                  {pick.icon}
                  {pick.cta}
                  <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.button>
            ))}
          </div>
        ) : (
          /* Returning user: personalized action cards based on their data */
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Card 1: Weak areas drill */}
            <motion.button
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0 }}
              onClick={() => onTabChange(totalWeak > 0 ? "coding" : "readiness")}
              className={`group text-left rounded-2xl border-2 p-4 transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 ${
                totalWeak > 0
                  ? "border-red-300 dark:border-red-700 bg-red-100 dark:bg-red-900/20"
                  : "border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xl">{totalWeak > 0 ? "⚠️" : "✅"}</span>
                <ChevronRight size={16} className={`${totalWeak > 0 ? "text-red-600" : "text-emerald-600"} opacity-0 group-hover:opacity-100 transition-opacity`} />
              </div>
              <h3 className={`text-sm font-black mb-1.5 ${totalWeak > 0 ? "text-red-700 dark:text-red-400" : "text-emerald-700 dark:text-emerald-400"}`}>
                {totalWeak > 0 ? `${totalWeak} Weak Area${totalWeak > 1 ? "s" : ""}` : "All Areas Strong"}
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
                {totalWeak > 0
                  ? "Drill your weakest patterns first — these are the highest-leverage minutes you can spend."
                  : "Your ratings look solid. Keep drilling to maintain sharpness before the interview."}
              </p>
              <div className={`flex items-center gap-1.5 text-xs font-bold ${totalWeak > 0 ? "text-red-700 dark:text-red-400" : "text-emerald-700 dark:text-emerald-400"}`}>
                {totalWeak > 0 ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />}
                {totalWeak > 0 ? "Drill weak patterns" : "Review readiness"}
                <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.button>

            {/* Card 2: Mock interview */}
            <motion.button
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.08 }}
              onClick={() => onTabChange("mock")}
              className="group text-left rounded-2xl border-2 border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/20 p-4 transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xl">🎯</span>
                <ChevronRight size={16} className="text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <h3 className="text-sm font-black mb-1.5 text-indigo-700 dark:text-indigo-400">
                {mockHistory === 0 ? "First Mock Interview" : `Mock #${mockHistory + 1}`}
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
                {mockHistory === 0
                  ? "You haven't done a mock yet. This is the single highest-ROI activity — start one now."
                  : `You've done ${mockHistory} mock${mockHistory > 1 ? "s" : ""}. Consistency beats intensity — do another one today.`}
              </p>
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-400">
                <Target size={14} />
                Start mock interview
                <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.button>

            {/* Card 3: IC7 signals / readiness */}
            <motion.button
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.16 }}
              onClick={() => onTabChange(daysLeft !== null && daysLeft <= 1 ? "overview" : "readiness")}
              className="group text-left rounded-2xl border-2 border-violet-300 dark:border-violet-700 bg-violet-50 dark:bg-violet-900/20 p-4 transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xl">{daysLeft !== null && daysLeft <= 1 ? "🔴" : "📊"}</span>
                <ChevronRight size={16} className="text-violet-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <h3 className="text-sm font-black mb-1.5 text-violet-700 dark:text-violet-400">
                {daysLeft !== null && daysLeft <= 1 ? "Day-Of Protocol" : "IC7 Signal Check"}
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
                {daysLeft !== null && daysLeft <= 1
                  ? "Interview is today or tomorrow. Use the Day-Of Protocol — morning warmup, STAR review, breathing."
                  : "Check which IC7 signals you have stories for. Missing even one critical signal is a downlevel risk."}
              </p>
              <div className="flex items-center gap-1.5 text-xs font-bold text-violet-700 dark:text-violet-400">
                <TrendingUp size={14} />
                {daysLeft !== null && daysLeft <= 1 ? "Open Day-Of Protocol" : "Check IC7 signals"}
                <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.button>
          </div>
        )}

        {/* Subtle divider note */}
        <p className="text-center text-xs text-white/30 mt-4">
          {isNewUser
            ? "Curated by The Architect · Based on analysis of the most common failure patterns at L4–L7"
            : "Personalized based on your ratings and progress · Data stored locally in your browser"}
        </p>
      </div>
    </div>
  );
}
