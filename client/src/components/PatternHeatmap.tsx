// PatternHeatmap — color-coded mastery grid for all 14 patterns
// Reads Quick Drill ratings from localStorage and maps to red→green scale
import { useMemo } from "react";
import { PATTERNS } from "@/lib/guideData";
import { Zap } from "lucide-react";

const DRILL_KEY = "meta-guide-drill-ratings";

type RatingEntry = { rating: number; ts?: number };

function loadRatings(): Record<string, RatingEntry[]> {
  try { return JSON.parse(localStorage.getItem(DRILL_KEY) ?? "{}"); } catch { return {}; }
}

function avgRating(entries: RatingEntry[]): number | null {
  if (!entries.length) return null;
  return entries.reduce((s, e) => s + e.rating, 0) / entries.length;
}

type MasteryLevel = "unrated" | "weak" | "developing" | "decent" | "solid" | "strong";

function getMastery(avg: number | null): MasteryLevel {
  if (avg === null) return "unrated";
  if (avg < 1.5)   return "weak";
  if (avg < 2.5)   return "developing";
  if (avg < 3.5)   return "decent";
  if (avg < 4.5)   return "solid";
  return "strong";
}

const MASTERY_STYLES: Record<MasteryLevel, { bg: string; border: string; text: string; label: string; dot: string }> = {
  unrated:    { bg: "bg-gray-50",      border: "border-gray-200",    text: "text-gray-400",    label: "Not drilled",  dot: "bg-gray-300"    },
  weak:       { bg: "bg-red-50",       border: "border-red-300",     text: "text-red-700",     label: "Weak",         dot: "bg-red-500"     },
  developing: { bg: "bg-orange-50",    border: "border-orange-300",  text: "text-orange-700",  label: "Developing",   dot: "bg-orange-500"  },
  decent:     { bg: "bg-amber-50",     border: "border-amber-300",   text: "text-amber-700",   label: "Decent",       dot: "bg-amber-500"   },
  solid:      { bg: "bg-blue-50",      border: "border-blue-300",    text: "text-blue-700",    label: "Solid",        dot: "bg-blue-500"    },
  strong:     { bg: "bg-emerald-50",   border: "border-emerald-300", text: "text-emerald-700", label: "Strong",       dot: "bg-emerald-500" },
};

const LEGEND: { level: MasteryLevel; range: string }[] = [
  { level: "unrated",    range: "Not drilled" },
  { level: "weak",       range: "1.0 – 1.4"  },
  { level: "developing", range: "1.5 – 2.4"  },
  { level: "decent",     range: "2.5 – 3.4"  },
  { level: "solid",      range: "3.5 – 4.4"  },
  { level: "strong",     range: "4.5 – 5.0"  },
];

export default function PatternHeatmap() {
  const patternData = useMemo(() => {
    const ratings = loadRatings();
    return PATTERNS.map((p) => {
      const entries = ratings[p.id] ?? [];
      const avg     = avgRating(entries);
      const mastery = getMastery(avg);
      return { ...p, avg, mastery, attempts: entries.length };
    });
  }, []);

  const masteredCount = patternData.filter((p) => p.mastery === "solid" || p.mastery === "strong").length;
  const drilledCount  = patternData.filter((p) => p.mastery !== "unrated").length;

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs">
          <span className="font-bold text-emerald-700">{masteredCount}</span>
          <span className="text-emerald-600">of {PATTERNS.length} patterns mastered (4★+)</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-xl text-xs">
          <Zap size={12} className="text-blue-500" />
          <span className="font-bold text-blue-700">{drilledCount}</span>
          <span className="text-blue-600">drilled so far</span>
        </div>
        {drilledCount === 0 && (
          <p className="text-xs text-gray-400 italic">Complete Quick Drill sessions to fill in the heatmap</p>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2">
        {patternData.map((p) => {
          const s = MASTERY_STYLES[p.mastery];
          return (
            <div
              key={p.id}
              className={`relative flex flex-col gap-1.5 p-3 rounded-xl border transition-shadow hover:shadow-md ${s.bg} ${s.border}`}
              title={`${p.name} — ${s.label}${p.avg !== null ? ` (${p.avg.toFixed(1)} avg, ${p.attempts} attempt${p.attempts !== 1 ? "s" : ""})` : ""}`}
            >
              {/* Mastery dot */}
              <div className="flex items-center justify-between">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${s.dot}`} />
                <span className="text-[10px] font-bold text-gray-400">{"★".repeat(p.frequency)}</span>
              </div>

              {/* Pattern name */}
              <p className={`text-xs font-bold leading-tight ${s.text}`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {p.name}
              </p>

              {/* Rating or "Not drilled" */}
              <p className={`text-[11px] font-semibold ${s.text} opacity-80`}>
                {p.avg !== null ? `${p.avg.toFixed(1)} ★ · ${p.attempts}×` : "Not drilled"}
              </p>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 pt-1">
        {LEGEND.map(({ level, range }) => {
          const s = MASTERY_STYLES[level];
          return (
            <div key={level} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold ${s.bg} ${s.border} ${s.text}`}>
              <span className={`w-2 h-2 rounded-full ${s.dot}`} />
              {s.label}
              <span className="opacity-60 font-normal">{range}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
