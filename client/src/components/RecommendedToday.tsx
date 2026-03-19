/**
 * RecommendedToday — Smart queue surfacing 5–10 unsolved problems from weakest topics
 * Cross-references Quick Drill pattern ratings with CTCI practice tracker data.
 */
import { useMemo, useState } from "react";
import { Sparkles, ExternalLink, CheckCircle2, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { CTCI_PROBLEMS } from "@/lib/ctciProblems";
import { useCTCIProgress } from "@/hooks/useCTCIProgress";
import { PATTERNS } from "@/lib/guideData";
import { PATTERN_TO_CTCI_TOPICS, problemMatchesTopics } from "@/lib/ctciTopicMap";

const DRILL_KEY = "meta-guide-drill-ratings";

function loadDrillRatings(): Record<string, { rating: number; ts: number }[]> {
  try { return JSON.parse(localStorage.getItem(DRILL_KEY) ?? "{}"); } catch { return {}; }
}

const DIFF_COLORS: Record<string, string> = {
  Easy:   "bg-emerald-100 text-emerald-700 border-emerald-200",
  Medium: "bg-amber-100 text-amber-700 border-amber-200",
  Hard:   "bg-red-100 text-red-700 border-red-200",
};

interface RecommendedProblem {
  id: number;
  name: string;
  url: string;
  topic: string;
  difficulty: "Easy" | "Medium" | "Hard";
  patternName: string;
  patternAvg: number | null;
}

export default function RecommendedToday() {
  const { progress, toggleSolved } = useCTCIProgress();
  const [expanded, setExpanded] = useState(true);
  const [seed, setSeed] = useState(0); // bump to refresh

  const { recommendations, weakPatterns } = useMemo(() => {
    const drillData = loadDrillRatings();

    // Score each pattern: unrated = 0, else avg rating (lower = weaker)
    const patternScores = PATTERNS.map(p => {
      const entries = drillData[p.id] ?? [];
      const avg = entries.length ? entries.reduce((s, e) => s + e.rating, 0) / entries.length : null;
      return { patternId: p.id, patternName: p.name, avg, score: avg ?? 0 };
    }).sort((a, b) => a.score - b.score); // weakest first

    const weakPatterns = patternScores.slice(0, 5);

    // Collect unsolved problems from weak topics
    const seen = new Set<number>();
    const recs: RecommendedProblem[] = [];

    for (const pat of weakPatterns) {
      if (recs.length >= 10) break;
      const keywords = PATTERN_TO_CTCI_TOPICS[pat.patternId] ?? [];
      const pool = CTCI_PROBLEMS.filter(p =>
        !progress[p.id]?.solved &&
        !seen.has(p.id) &&
        problemMatchesTopics(p.topic, keywords)
      );
      // Shuffle pool deterministically with seed
      const shuffled = [...pool].sort((a, b) => ((a.id * 7 + seed * 13) % 97) - ((b.id * 7 + seed * 13) % 97));
      for (const p of shuffled.slice(0, 3)) {
        if (recs.length >= 10) break;
        seen.add(p.id);
        recs.push({ ...p, patternName: pat.patternName, patternAvg: pat.avg });
      }
    }

    // Pad with general unsolved if < 5
    if (recs.length < 5) {
      const fallback = CTCI_PROBLEMS.filter(p => !progress[p.id]?.solved && !seen.has(p.id));
      const shuffled = [...fallback].sort((a, b) => ((a.id * 11 + seed * 7) % 89) - ((b.id * 11 + seed * 7) % 89));
      for (const p of shuffled.slice(0, 5 - recs.length)) {
        seen.add(p.id);
        recs.push({ ...p, patternName: "General", patternAvg: null });
      }
    }

    return { recommendations: recs, weakPatterns: weakPatterns.slice(0, 3) };
  }, [progress, seed]);

  const solvedCount = recommendations.filter(p => progress[p.id]?.solved).length;

  return (
    <div className="rounded-2xl border border-indigo-200 overflow-hidden shadow-sm">
      {/* Header */}
      <button
        className="w-full flex items-center justify-between px-5 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-3">
          <Sparkles size={18} />
          <div className="text-left">
            <p className="font-bold text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Recommended Today
            </p>
            <p className="text-xs text-indigo-200">
              {recommendations.length} problems from your {weakPatterns.length} weakest topics
              {solvedCount > 0 && ` · ${solvedCount} done`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={e => { e.stopPropagation(); setSeed(s => s + 1); }}
            className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            title="Refresh recommendations"
          >
            <RefreshCw size={13} />
          </button>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {expanded && (
        <div className="bg-white">
          {/* Weak pattern badges */}
          {weakPatterns.length > 0 && (
            <div className="px-5 py-3 bg-indigo-50 border-b border-indigo-100 flex flex-wrap gap-2 items-center">
              <span className="text-[11px] font-bold uppercase tracking-widest text-indigo-500">Weak areas:</span>
              {weakPatterns.map(p => (
                <span key={p.patternId} className="text-[11px] font-semibold px-2 py-0.5 bg-white border border-indigo-200 rounded-full text-indigo-700">
                  {p.patternName} {p.avg !== null ? `(${p.avg.toFixed(1)}★)` : "(undrilled)"}
                </span>
              ))}
            </div>
          )}

          {/* Problem list */}
          <div className="divide-y divide-gray-100">
            {recommendations.map((p, i) => {
              const solved = progress[p.id]?.solved ?? false;
              return (
                <div key={p.id} className={`flex items-center gap-3 px-5 py-3 transition-colors ${solved ? "bg-emerald-50" : "hover:bg-gray-50"}`}>
                  <span className="text-xs font-bold text-gray-300 w-5 flex-shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${solved ? "line-through text-gray-400" : "text-gray-800"}`}>
                      {p.name}
                    </p>
                    <p className="text-[11px] text-gray-400 truncate">{p.patternName} · {p.topic.split(",")[0].trim()}</p>
                  </div>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${DIFF_COLORS[p.difficulty]}`}>
                    {p.difficulty}
                  </span>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Open on LeetCode"
                    >
                      <ExternalLink size={13} />
                    </a>
                    <button
                      onClick={() => toggleSolved(p.id)}
                      className={`p-1.5 transition-colors ${solved ? "text-emerald-500" : "text-gray-300 hover:text-emerald-500"}`}
                      title={solved ? "Mark unsolved" : "Mark solved"}
                    >
                      <CheckCircle2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {recommendations.length === 0 && (
            <div className="px-5 py-8 text-center text-gray-400 text-sm">
              All recommended problems solved! Refresh for more.
            </div>
          )}

          <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-400">
              {solvedCount}/{recommendations.length} completed today
            </p>
            <div className="flex-1 mx-4 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all"
                style={{ width: `${recommendations.length ? (solvedCount / recommendations.length) * 100 : 0}%` }}
              />
            </div>
            <button
              onClick={() => setSeed(s => s + 1)}
              className="text-xs text-indigo-600 hover:underline font-semibold flex items-center gap-1"
            >
              <RefreshCw size={11} /> Refresh
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
