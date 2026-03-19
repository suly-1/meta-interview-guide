/**
 * DailyProblem — Feature 5
 * Each calendar day surfaces one deterministic unsolved problem seeded by date.
 * Consistent across sessions — no decision fatigue.
 */
import { useMemo } from "react";
import { CalendarDays, ExternalLink, CheckCircle2, Star } from "lucide-react";
import { CTCI_PROBLEMS } from "@/lib/ctciProblems";
import { useCTCIProgress } from "@/hooks/useCTCIProgress";
import { PATTERN_TO_CTCI_TOPICS, problemMatchesTopics } from "@/lib/ctciTopicMap";
import { getWeakestPatterns } from "@/hooks/useDrillRatings";

function dateHash(dateStr: string): number {
  let h = 0;
  for (let i = 0; i < dateStr.length; i++) {
    h = (h * 31 + dateStr.charCodeAt(i)) >>> 0;
  }
  return h;
}

const DIFF_COLORS: Record<string, string> = {
  Easy: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Medium: "bg-amber-100 text-amber-700 border-amber-200",
  Hard: "bg-red-100 text-red-700 border-red-200",
};

export default function DailyProblem() {
  const { progress, toggleSolved } = useCTCIProgress();

  const { problem, dateStr, isFromWeakTopic, weakTopicName } = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const hash = dateHash(today);

    // Prefer unsolved problems from weakest topics
    const weakPatterns = getWeakestPatterns(3);
    const weakTopics = weakPatterns.flatMap(p => PATTERN_TO_CTCI_TOPICS[p.patternId] ?? []);

    let pool = CTCI_PROBLEMS.filter(p => !progress[p.id]?.solved && problemMatchesTopics(p.topic, weakTopics));
    const isFromWeakTopic = pool.length > 0;
    const weakTopicName = isFromWeakTopic ? weakPatterns[0]?.patternName : null;

    if (pool.length === 0) pool = CTCI_PROBLEMS.filter(p => !progress[p.id]?.solved);
    if (pool.length === 0) pool = CTCI_PROBLEMS;

    const problem = pool[hash % pool.length];
    return { problem, dateStr: today, isFromWeakTopic, weakTopicName };
  }, [progress]);

  const solved = progress[problem.id]?.solved ?? false;

  const dayOfWeek = new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", { weekday: "long" });
  const dateDisplay = new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <div className={`rounded-xl border-2 p-4 transition-all ${solved ? "border-emerald-300 bg-emerald-50" : "border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50"}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <CalendarDays size={15} className={solved ? "text-emerald-600" : "text-blue-600"} />
          <span className={`text-xs font-bold uppercase tracking-widest ${solved ? "text-emerald-700" : "text-blue-700"}`}>
            Problem of the Day
          </span>
        </div>
        <span className="text-xs text-gray-500 font-medium">{dayOfWeek}, {dateDisplay}</span>
      </div>

      {isFromWeakTopic && weakTopicName && (
        <div className="flex items-center gap-1.5 mb-2">
          <Star size={11} className="text-amber-500 fill-amber-400" />
          <span className="text-[11px] font-semibold text-amber-700">From your weak area: {weakTopicName}</span>
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h4 className={`font-extrabold text-base leading-tight ${solved ? "line-through text-gray-400" : "text-gray-900"}`}
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            {problem.name}
          </h4>
          <p className="text-xs text-gray-500 mt-0.5 truncate">{problem.topic.split(",").slice(0, 2).join(", ")}</p>
        </div>
        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${DIFF_COLORS[problem.difficulty]}`}>
          {problem.difficulty}
        </span>
      </div>

      <div className="flex items-center gap-2 mt-3">
        <a
          href={problem.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors"
        >
          Solve on LeetCode <ExternalLink size={11} />
        </a>
        <button
          onClick={() => toggleSolved(problem.id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
            solved
              ? "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200"
              : "bg-white text-gray-600 border-gray-200 hover:border-emerald-400 hover:text-emerald-700"
          }`}
        >
          <CheckCircle2 size={12} className={solved ? "text-emerald-600" : "text-gray-400"} />
          {solved ? "Solved!" : "Mark solved"}
        </button>
      </div>
    </div>
  );
}
