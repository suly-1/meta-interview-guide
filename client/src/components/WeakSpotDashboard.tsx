// WeakSpotDashboard — surfaces the 3 weakest patterns and 3 weakest behavioral questions
// Reads from localStorage keys used by usePracticeRatings and useDrillRatings
import { useMemo } from "react";
import { AlertTriangle, TrendingUp, Star, RotateCcw, Zap } from "lucide-react";
import { PATTERNS, BEHAVIORAL_FOCUS_AREAS } from "@/lib/guideData";

const DRILL_KEY    = "meta-guide-drill-ratings";
const PRACTICE_KEY = "meta-guide-practice-ratings";

type RatingEntry = { rating: number; ts?: number };

function loadRatings(key: string): Record<string, RatingEntry[]> {
  try { return JSON.parse(localStorage.getItem(key) ?? "{}"); } catch { return {}; }
}

function avg(entries: RatingEntry[]): number {
  if (!entries.length) return 0;
  return entries.reduce((s, e) => s + e.rating, 0) / entries.length;
}

function StarRow({ rating, max = 5 }: { rating: number; max?: number }) {
  const filled = Math.round(rating);
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star key={i} size={11} className={i < filled ? "fill-amber-400 text-amber-900" : "text-gray-200"} />
      ))}
    </div>
  );
}

const LABEL: Record<number, { text: string; color: string }> = {
  1: { text: "Blank",            color: "text-red-600 bg-red-100 border-red-200"     },
  2: { text: "Vague idea",       color: "text-orange-800 bg-orange-100 border-orange-200" },
  3: { text: "Mostly right",     color: "text-amber-800 bg-amber-100 border-amber-200"   },
  4: { text: "Solid",            color: "text-blue-600 bg-blue-50 border-blue-200"       },
  5: { text: "Perfect recall",   color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
};

export default function WeakSpotDashboard() {
  const { weakPatterns, weakQuestions, totalDrills, totalPractice } = useMemo(() => {
    const drillData    = loadRatings(DRILL_KEY);
    const practiceData = loadRatings(PRACTICE_KEY);

    // ── Patterns ──────────────────────────────────────────────────────────
    const patternScores = PATTERNS.map((p) => {
      const entries = drillData[p.id] ?? [];
      return { id: p.id, name: p.name, entries, avg: entries.length ? avg(entries) : null };
    }).filter((p) => p.avg !== null) as { id: string; name: string; entries: RatingEntry[]; avg: number }[];

    patternScores.sort((a, b) => a.avg - b.avg);
    const weakPatterns = patternScores.slice(0, 3);

    // ── Behavioral questions ──────────────────────────────────────────────
    const allQuestions = BEHAVIORAL_FOCUS_AREAS.flatMap((area) =>
      area.questions.map((q) => ({ question: q.question, areaTitle: area.title }))
    );

    const questionScores = allQuestions.map((q) => {
      const key     = q.question.slice(0, 80);
      const entries = practiceData[key] ?? [];
      return { ...q, entries, avg: entries.length ? avg(entries) : null };
    }).filter((q) => q.avg !== null) as { question: string; areaTitle: string; entries: RatingEntry[]; avg: number }[];

    questionScores.sort((a, b) => a.avg - b.avg);
    const weakQuestions = questionScores.slice(0, 3);

    const totalDrills   = Object.values(drillData).reduce((s, e) => s + e.length, 0);
    const totalPractice = Object.values(practiceData).reduce((s, e) => s + e.length, 0);

    return { weakPatterns, weakQuestions, totalDrills, totalPractice };
  }, []);

  const hasData = weakPatterns.length > 0 || weakQuestions.length > 0;

  if (!hasData) {
    return (
      <div className="flex items-center gap-4 p-5 bg-gray-50 border border-dashed border-gray-300 rounded-2xl">
        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
          <TrendingUp size={18} className="text-gray-600" />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-600">No data yet</p>
          <p className="text-xs text-gray-600 mt-0.5">
            Complete at least one <strong>Quick Drill</strong> or <strong>Practice Mode</strong> session and rate yourself — your weak spots will appear here automatically.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-xl text-xs">
          <Zap size={13} className="text-blue-500" />
          <span className="font-bold text-blue-700">{totalDrills}</span>
          <span className="text-blue-600">Quick Drill attempts</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 border border-indigo-200 rounded-xl text-xs">
          <Star size={13} className="text-indigo-500" />
          <span className="font-bold text-indigo-700">{totalPractice}</span>
          <span className="text-indigo-600">Practice Mode attempts</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Weak patterns */}
        {weakPatterns.length > 0 && (
          <div className="bg-white border border-red-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="flex items-center gap-2 px-4 py-3 bg-red-100 border-b border-red-100">
              <AlertTriangle size={14} className="text-red-500 flex-shrink-0" />
              <p className="text-xs font-bold text-red-700 uppercase tracking-wide">Weakest Coding Patterns</p>
            </div>
            <div className="divide-y divide-gray-100">
              {weakPatterns.map((p, i) => {
                const rounded = Math.round(p.avg);
                const lbl = LABEL[rounded] ?? LABEL[1];
                return (
                  <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                    <span className="text-lg font-extrabold text-gray-200 w-5 flex-shrink-0" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{p.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <StarRow rating={p.avg} />
                        <span className="text-[11px] text-gray-600">{p.avg.toFixed(1)} avg · {p.entries.length} attempt{p.entries.length > 1 ? "s" : ""}</span>
                      </div>
                    </div>
                    <span className={`text-[11px] font-bold border px-2 py-0.5 rounded-full flex-shrink-0 ${lbl.color}`}>
                      {lbl.text}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100">
              <p className="text-[11px] text-gray-600 flex items-center gap-1">
                <RotateCcw size={10} /> Go to the <strong className="text-gray-600">Coding tab → Quick Drill</strong> to practice these patterns
              </p>
            </div>
          </div>
        )}

        {/* Weak behavioral questions */}
        {weakQuestions.length > 0 && (
          <div className="bg-white border border-orange-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="flex items-center gap-2 px-4 py-3 bg-orange-100 border-b border-orange-100">
              <AlertTriangle size={14} className="text-orange-500 flex-shrink-0" />
              <p className="text-xs font-bold text-orange-900 uppercase tracking-wide">Weakest Behavioral Questions</p>
            </div>
            <div className="divide-y divide-gray-100">
              {weakQuestions.map((q, i) => {
                const rounded = Math.round(q.avg);
                const lbl = LABEL[rounded] ?? LABEL[1];
                return (
                  <div key={i} className="flex items-start gap-3 px-4 py-3">
                    <span className="text-lg font-extrabold text-gray-200 w-5 flex-shrink-0 mt-0.5" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-orange-800 mb-0.5 truncate">
                        {q.areaTitle.replace(/Focus Area \d+: /, "")}
                      </p>
                      <p className="text-sm font-semibold text-gray-800 leading-snug line-clamp-2">{q.question}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <StarRow rating={q.avg} />
                        <span className="text-[11px] text-gray-600">{q.avg.toFixed(1)} avg · {q.entries.length} attempt{q.entries.length > 1 ? "s" : ""}</span>
                      </div>
                    </div>
                    <span className={`text-[11px] font-bold border px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5 ${lbl.color}`}>
                      {lbl.text}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100">
              <p className="text-[11px] text-gray-600 flex items-center gap-1">
                <RotateCcw size={10} /> Go to the <strong className="text-gray-600">Behavioral tab → Practice Mode</strong> to drill these questions
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
