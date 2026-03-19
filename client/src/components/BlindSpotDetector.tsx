/**
 * BlindSpotDetector — Feature 2
 * After every 10 Quick Drill sessions, surfaces patterns never drilled, always skipped,
 * or consistently rated 1–2 stars.
 */
import { useMemo } from "react";
import { AlertTriangle, TrendingDown, EyeOff, Zap } from "lucide-react";
import { PATTERNS } from "@/lib/guideData";

const DRILL_KEY = "meta-guide-drill-ratings";

function loadRatings(): Record<string, { rating: number; ts: number }[]> {
  try { return JSON.parse(localStorage.getItem(DRILL_KEY) ?? "{}"); } catch { return {}; }
}

interface BlindSpot {
  patternId: string;
  patternName: string;
  type: "never-drilled" | "consistently-weak" | "rarely-drilled";
  avg: number | null;
  attempts: number;
}

export default function BlindSpotDetector({ onStartDrill }: { onStartDrill?: (patternId: string) => void }) {
  const { blindSpots, totalSessions } = useMemo(() => {
    const data = loadRatings();
    const totalSessions = Object.values(data).reduce((s, arr) => s + arr.length, 0);

    const spots: BlindSpot[] = [];
    PATTERNS.forEach(p => {
      const entries = data[p.id] ?? [];
      const attempts = entries.length;
      const avg = attempts ? entries.reduce((s, e) => s + e.rating, 0) / attempts : null;

      if (attempts === 0) spots.push({ patternId: p.id, patternName: p.name, type: "never-drilled", avg: null, attempts: 0 });
      else if (avg !== null && avg < 2.5 && attempts >= 2) spots.push({ patternId: p.id, patternName: p.name, type: "consistently-weak", avg, attempts });
      else if (attempts === 1) spots.push({ patternId: p.id, patternName: p.name, type: "rarely-drilled", avg, attempts });
    });

    return { blindSpots: spots, totalSessions };
  }, []);

  const neverDrilled = blindSpots.filter(s => s.type === "never-drilled");
  const weak = blindSpots.filter(s => s.type === "consistently-weak");
  const rare = blindSpots.filter(s => s.type === "rarely-drilled");

  if (blindSpots.length === 0) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
        <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
          <Zap size={16} className="text-emerald-600" />
        </div>
        <div>
          <p className="text-sm font-bold text-emerald-800">No blind spots detected!</p>
          <p className="text-xs text-emerald-600">You have drilled all patterns with solid ratings. Keep it up.</p>
        </div>
      </div>
    );
  }

  const Section = ({ title, icon: Icon, items, color }: {
    title: string;
    icon: typeof AlertTriangle;
    items: BlindSpot[];
    color: string;
  }) => {
    if (!items.length) return null;
    return (
      <div>
        <div className={`flex items-center gap-2 mb-2`}>
          <Icon size={14} className={color} />
          <span className={`text-xs font-bold uppercase tracking-widest ${color}`}>{title}</span>
          <span className="text-xs text-gray-400">({items.length})</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {items.map(s => (
            <button
              key={s.patternId}
              onClick={() => onStartDrill?.(s.patternId)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 hover:border-blue-400 hover:bg-blue-50 rounded-lg text-xs font-semibold text-gray-700 transition-colors group"
              title={s.avg !== null ? `Avg: ${s.avg.toFixed(1)}★ over ${s.attempts} attempts` : "Never drilled"}
            >
              {s.patternName}
              {s.avg !== null && <span className="text-gray-400 group-hover:text-blue-500">{s.avg.toFixed(1)}★</span>}
              <Zap size={10} className="text-gray-300 group-hover:text-blue-500" />
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} className="text-amber-600" />
          <span className="text-sm font-bold text-amber-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Blind Spot Report
          </span>
        </div>
        <span className="text-xs text-amber-600 font-medium">{totalSessions} total drill sessions</span>
      </div>
      <p className="text-xs text-amber-700">
        {blindSpots.length} pattern{blindSpots.length !== 1 ? "s" : ""} need attention. Click any to start a focused drill.
      </p>
      <Section title="Never drilled" icon={EyeOff} items={neverDrilled} color="text-red-600" />
      <Section title="Consistently weak (avg &lt; 2.5★)" icon={TrendingDown} items={weak} color="text-orange-600" />
      <Section title="Only drilled once" icon={AlertTriangle} items={rare} color="text-amber-600" />
    </div>
  );
}
