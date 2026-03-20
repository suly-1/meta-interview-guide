/**
 * WeaknessHeatmap — Per-pattern bar chart sorted weakest-first
 * Reads pattern mastery scores from localStorage and visualizes gaps.
 */
import { useState, useEffect } from "react";
import { PATTERNS } from "@/lib/guideData";
import { BarChart2, TrendingUp } from "lucide-react";

interface PatternScore {
  name: string;
  score: number; // 0-5
  problems: number;
}

function loadPatternScores(): PatternScore[] {
  try {
    const mastery: Record<string, number> = JSON.parse(localStorage.getItem("meta_pattern_mastery") || "{}");
    return PATTERNS.map(p => ({
      name: p.name,
      score: mastery[p.name] ?? 0,
      problems: p.problems.length,
    }));
  } catch {
    return PATTERNS.map(p => ({ name: p.name, score: 0, problems: p.problems.length }));
  }
}

const SCORE_LABELS = ["Not Started", "Beginner", "Developing", "Proficient", "Advanced", "Mastered"];
const BAR_COLORS = [
  "bg-red-400",
  "bg-orange-400",
  "bg-amber-400",
  "bg-yellow-400",
  "bg-lime-500",
  "bg-emerald-500",
];
const TEXT_COLORS = [
  "text-red-600",
  "text-orange-600",
  "text-amber-600",
  "text-yellow-600",
  "text-lime-600",
  "text-emerald-600",
];

export default function WeaknessHeatmap() {
  const [scores, setScores] = useState<PatternScore[]>(() => loadPatternScores());
  const [sortMode, setSortMode] = useState<"weakest" | "strongest">("weakest");

  useEffect(() => {
    const interval = setInterval(() => setScores(loadPatternScores()), 3000);
    return () => clearInterval(interval);
  }, []);

  const sorted = [...scores].sort((a, b) =>
    sortMode === "weakest" ? a.score - b.score : b.score - a.score
  );

  const avgScore = scores.reduce((sum, s) => sum + s.score, 0) / scores.length;
  const weakPatterns = scores.filter(s => s.score <= 1).length;
  const masteredPatterns = scores.filter(s => s.score >= 4).length;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 bg-rose-100 rounded-xl">
          <BarChart2 size={20} className="text-rose-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Weakness Heatmap
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Pattern mastery sorted by weakest areas</p>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100 tabular-nums" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            {avgScore.toFixed(1)}/5
          </p>
          <p className="text-xs text-gray-500">Avg Score</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-red-600 tabular-nums" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            {weakPatterns}
          </p>
          <p className="text-xs text-gray-500">Needs Work</p>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-emerald-600 tabular-nums" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            {masteredPatterns}
          </p>
          <p className="text-xs text-gray-500">Mastered</p>
        </div>
      </div>

      {/* Sort toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setSortMode("weakest")}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${
            sortMode === "weakest"
              ? "bg-rose-100 text-rose-700 border border-rose-200"
              : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
          }`}
        >
          Weakest First
        </button>
        <button
          onClick={() => setSortMode("strongest")}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${
            sortMode === "strongest"
              ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
              : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
          }`}
        >
          Strongest First
        </button>
      </div>

      {/* Bar chart */}
      <div className="space-y-2">
        {sorted.map(p => (
          <div key={p.name} className="flex items-center gap-3">
            <div className="w-32 flex-shrink-0">
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate" title={p.name}>{p.name}</p>
              <p className={`text-[10px] font-medium ${TEXT_COLORS[p.score]}`}>{SCORE_LABELS[p.score]}</p>
            </div>
            <div className="flex-1 h-5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${BAR_COLORS[p.score]}`}
                style={{ width: `${(p.score / 5) * 100}%` }}
              />
            </div>
            <span className="text-xs font-bold text-gray-500 tabular-nums w-6 text-right">{p.score}/5</span>
          </div>
        ))}
      </div>

      {/* Recommendation */}
      {weakPatterns > 0 && (
        <div className="mt-4 bg-rose-50 dark:bg-rose-900/20 rounded-xl p-3 flex items-start gap-2">
          <TrendingUp size={14} className="text-rose-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-rose-700 dark:text-rose-300 leading-relaxed">
            <span className="font-bold">Focus area:</span> {sorted.slice(0, 2).map(s => s.name).join(" and ")} — practice 2–3 problems in these patterns today to move the needle.
          </p>
        </div>
      )}

      <p className="text-xs text-gray-400 mt-3 text-center">
        Scores update as you practice in the Coding Interview tab
      </p>
    </div>
  );
}
