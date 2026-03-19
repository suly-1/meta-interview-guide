/**
 * PatternHeatmap — enhanced mastery grid for all 14 patterns.
 *
 * Features:
 * - Color-coded mastery levels (unrated → strong)
 * - Attempt count & last-practiced date on each card
 * - Unlock status badge (locked if prerequisites not met)
 * - Rich tooltip on hover
 * - Drill-down panel on click: shows full history sparkline + prerequisite chain
 */
import { useMemo, useState } from "react";
import { PATTERNS, PATTERN_PREREQUISITES } from "@/lib/guideData";
import { Zap, Lock, ChevronDown, ChevronUp, Calendar, BarChart2, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const DRILL_KEY = "meta-guide-drill-ratings";

type RatingEntry = { rating: number; ts?: number };

function loadRatings(): Record<string, RatingEntry[]> {
  try { return JSON.parse(localStorage.getItem(DRILL_KEY) ?? "{}"); } catch { return {}; }
}

function avgRating(entries: RatingEntry[]): number | null {
  if (!entries.length) return null;
  return entries.reduce((s, e) => s + e.rating, 0) / entries.length;
}

function latestRating(entries: RatingEntry[]): number | null {
  if (!entries.length) return null;
  return entries[entries.length - 1].rating;
}

function lastPracticedTs(entries: RatingEntry[]): number | null {
  if (!entries.length) return null;
  const withTs = entries.filter(e => e.ts);
  if (!withTs.length) return null;
  return Math.max(...withTs.map(e => e.ts!));
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

const MASTERY_STYLES: Record<MasteryLevel, {
  bg: string; border: string; text: string; label: string; dot: string;
  ring: string; badgeBg: string; badgeText: string;
}> = {
  unrated:    { bg: "bg-gray-50",      border: "border-gray-200",    text: "text-gray-500",    label: "Not drilled",  dot: "bg-gray-300",     ring: "ring-gray-200",    badgeBg: "bg-gray-100",    badgeText: "text-gray-500"    },
  weak:       { bg: "bg-red-50",       border: "border-red-300",     text: "text-red-700",     label: "Weak",         dot: "bg-red-500",      ring: "ring-red-300",     badgeBg: "bg-red-100",     badgeText: "text-red-700"     },
  developing: { bg: "bg-orange-50",    border: "border-orange-300",  text: "text-orange-700",  label: "Developing",   dot: "bg-orange-500",   ring: "ring-orange-300",  badgeBg: "bg-orange-100",  badgeText: "text-orange-700"  },
  decent:     { bg: "bg-amber-50",     border: "border-amber-300",   text: "text-amber-700",   label: "Decent",       dot: "bg-amber-500",    ring: "ring-amber-300",   badgeBg: "bg-amber-100",   badgeText: "text-amber-700"   },
  solid:      { bg: "bg-blue-50",      border: "border-blue-300",    text: "text-blue-700",    label: "Solid",        dot: "bg-blue-500",     ring: "ring-blue-300",    badgeBg: "bg-blue-100",    badgeText: "text-blue-700"    },
  strong:     { bg: "bg-emerald-50",   border: "border-emerald-300", text: "text-emerald-700", label: "Strong",       dot: "bg-emerald-500",  ring: "ring-emerald-300", badgeBg: "bg-emerald-100", badgeText: "text-emerald-700" },
};

const LEGEND: { level: MasteryLevel; range: string }[] = [
  { level: "unrated",    range: "Not drilled" },
  { level: "weak",       range: "1.0 – 1.4"  },
  { level: "developing", range: "1.5 – 2.4"  },
  { level: "decent",     range: "2.5 – 3.4"  },
  { level: "solid",      range: "3.5 – 4.4"  },
  { level: "strong",     range: "4.5 – 5.0"  },
];

/** Mini sparkline bar chart for rating history */
function RatingSparkline({ entries }: { entries: RatingEntry[] }) {
  if (!entries.length) return <p className="text-xs text-gray-400 italic">No drill sessions yet.</p>;
  const last10 = entries.slice(-10);
  return (
    <div className="flex items-end gap-0.5 h-8">
      {last10.map((e, i) => {
        const heightPct = (e.rating / 5) * 100;
        const color =
          e.rating >= 4.5 ? "bg-emerald-500" :
          e.rating >= 3.5 ? "bg-blue-500" :
          e.rating >= 2.5 ? "bg-amber-500" :
          e.rating >= 1.5 ? "bg-orange-500" : "bg-red-500";
        return (
          <div
            key={i}
            className={`flex-1 rounded-sm ${color} opacity-80`}
            style={{ height: `${heightPct}%` }}
            title={`Session ${i + 1}: ${e.rating}★`}
          />
        );
      })}
    </div>
  );
}

/** Drill-down panel shown when a card is clicked */
function PatternDetailPanel({
  pattern,
  entries,
  avg,
  mastery,
  attempts,
  lastTs,
  isLocked,
  prereqNames,
  onClose,
}: {
  pattern: typeof PATTERNS[0];
  entries: RatingEntry[];
  avg: number | null;
  mastery: MasteryLevel;
  attempts: number;
  lastTs: number | null;
  isLocked: boolean;
  prereqNames: string[];
  onClose: () => void;
}) {
  const s = MASTERY_STYLES[mastery];
  return (
    <div className={`mt-2 rounded-2xl border-2 p-5 space-y-4 ${s.bg} ${s.border}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`w-3 h-3 rounded-full flex-shrink-0 ${s.dot}`} />
          <h3 className="text-base font-extrabold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            {pattern.name}
          </h3>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${s.badgeBg} ${s.badgeText}`}>
            {s.label}
          </span>
          {isLocked && (
            <span className="flex items-center gap-1 text-xs font-bold bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
              <Lock size={10} /> Locked
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 p-1 rounded-lg hover:bg-black/10 transition-colors"
          title="Close"
        >
          <X size={14} className="text-gray-500" />
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-gray-100 p-3 text-center">
          <p className="text-xl font-extrabold text-gray-900">{avg !== null ? avg.toFixed(1) : "—"}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">Avg rating</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-3 text-center">
          <p className="text-xl font-extrabold text-gray-900">{attempts}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">Drill sessions</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-3 text-center">
          <p className="text-xl font-extrabold text-gray-900">{"★".repeat(pattern.frequency)}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">Meta frequency</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-3 text-center">
          <p className="text-[13px] font-bold text-gray-700">
            {lastTs ? formatDistanceToNow(new Date(lastTs), { addSuffix: true }) : "Never"}
          </p>
          <p className="text-[11px] text-gray-500 mt-0.5">Last practiced</p>
        </div>
      </div>

      {/* Rating history sparkline */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <div className="flex items-center gap-2 mb-3">
          <BarChart2 size={13} className="text-gray-500" />
          <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">
            Rating History (last {Math.min(entries.length, 10)} sessions)
          </span>
        </div>
        <RatingSparkline entries={entries} />
        {entries.length > 0 && (
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-gray-400">Oldest</span>
            <span className="text-[10px] text-gray-400">Most recent</span>
          </div>
        )}
      </div>

      {/* Prerequisite chain */}
      {(PATTERN_PREREQUISITES[pattern.id] ?? []).length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Lock size={12} className="text-gray-500" />
            <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">Prerequisite Chain</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {(PATTERN_PREREQUISITES[pattern.id] ?? []).map(pid => {
              const prereq = PATTERNS.find(p => p.id === pid);
              return prereq ? (
                <span key={pid} className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                  prereqNames.includes(prereq.name)
                    ? "bg-red-50 border-red-200 text-red-700"
                    : "bg-emerald-50 border-emerald-200 text-emerald-700"
                }`}>
                  {prereqNames.includes(prereq.name) ? "⚠ " : "✓ "}{prereq.name}
                </span>
              ) : null;
            })}
          </div>
          {isLocked && (
            <p className="text-xs text-red-600 mt-2 font-medium">
              Rate <strong>{prereqNames.join(" and ")}</strong> ≥ 3 in Quick Drill to unlock this pattern.
            </p>
          )}
        </div>
      )}

      {/* Key idea */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <div className="flex items-center gap-2 mb-1">
          <Zap size={12} className="text-blue-500" />
          <span className="text-xs font-bold text-blue-700 uppercase tracking-wide">Key Idea</span>
        </div>
        <p className="text-sm text-gray-700 leading-relaxed">{pattern.keyIdea}</p>
      </div>
    </div>
  );
}

export default function PatternHeatmap() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const patternData = useMemo(() => {
    const ratings = loadRatings();
    return PATTERNS.map((p) => {
      const entries = ratings[p.id] ?? [];
      const avg     = avgRating(entries);
      const latest  = latestRating(entries);
      const lastTs  = lastPracticedTs(entries);
      const mastery = getMastery(avg);

      // Unlock status
      const prereqIds   = PATTERN_PREREQUISITES[p.id] ?? [];
      const allRatings  = Object.fromEntries(
        PATTERNS.map(pat => [pat.id, latestRating(ratings[pat.id] ?? [])])
      );
      const isLocked    = prereqIds.some(pid => (allRatings[pid] ?? 0) < 3);
      const prereqNames = prereqIds
        .filter(pid => (allRatings[pid] ?? 0) < 3)
        .map(pid => PATTERNS.find(pat => pat.id === pid)?.name ?? pid);

      return { ...p, avg, latest, lastTs, mastery, attempts: entries.length, entries, isLocked, prereqNames };
    });
  }, []);

  const masteredCount = patternData.filter(p => p.mastery === "solid" || p.mastery === "strong").length;
  const drilledCount  = patternData.filter(p => p.mastery !== "unrated").length;
  const lockedCount   = patternData.filter(p => p.isLocked).length;

  const selected = selectedId ? patternData.find(p => p.id === selectedId) : null;

  return (
    <div className="space-y-5">
      {/* Stats row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="font-bold text-emerald-700">{masteredCount}</span>
          <span className="text-emerald-600">of {PATTERNS.length} mastered (4★+)</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-xl text-xs">
          <Zap size={12} className="text-blue-500" />
          <span className="font-bold text-blue-700">{drilledCount}</span>
          <span className="text-blue-600">drilled</span>
        </div>
        {lockedCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 border border-gray-200 rounded-xl text-xs">
            <Lock size={11} className="text-gray-500" />
            <span className="font-bold text-gray-600">{lockedCount}</span>
            <span className="text-gray-500">locked (prerequisites not met)</span>
          </div>
        )}
        {drilledCount === 0 && (
          <p className="text-xs text-gray-400 italic">Complete Quick Drill sessions to fill in the heatmap</p>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2">
        {patternData.map((p) => {
          const s = MASTERY_STYLES[p.mastery];
          const isSelected = selectedId === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setSelectedId(isSelected ? null : p.id)}
              className={`relative flex flex-col gap-1.5 p-3 rounded-xl border-2 text-left transition-all hover:shadow-md focus:outline-none ${s.bg} ${s.border} ${
                isSelected ? `ring-2 ${s.ring} shadow-md` : ""
              } ${p.isLocked ? "opacity-60" : ""}`}
              title={`${p.name} — ${s.label}${p.avg !== null ? ` (${p.avg.toFixed(1)} avg, ${p.attempts} session${p.attempts !== 1 ? "s" : ""})` : ""}${p.isLocked ? " — LOCKED" : ""}`}
            >
              {/* Top row: mastery dot + lock/frequency */}
              <div className="flex items-center justify-between">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${s.dot}`} />
                <div className="flex items-center gap-1">
                  {p.isLocked && <Lock size={9} className="text-gray-400" />}
                  <span className="text-[9px] font-bold text-gray-400">{"★".repeat(p.frequency)}</span>
                </div>
              </div>

              {/* Pattern name */}
              <p className={`text-xs font-bold leading-tight ${s.text}`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {p.name}
              </p>

              {/* Rating / attempts */}
              <p className={`text-[10px] font-semibold ${s.text} opacity-80`}>
                {p.avg !== null ? `${p.avg.toFixed(1)}★ · ${p.attempts}×` : "Not drilled"}
              </p>

              {/* Last practiced */}
              {p.lastTs && (
                <div className="flex items-center gap-0.5 mt-0.5">
                  <Calendar size={8} className="text-gray-400 flex-shrink-0" />
                  <p className="text-[9px] text-gray-400 truncate">
                    {formatDistanceToNow(new Date(p.lastTs), { addSuffix: true })}
                  </p>
                </div>
              )}

              {/* Expand indicator */}
              <div className={`absolute bottom-1.5 right-1.5 ${s.text} opacity-40`}>
                {isSelected ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Drill-down panel */}
      {selected && (
        <PatternDetailPanel
          pattern={selected}
          entries={selected.entries}
          avg={selected.avg}
          mastery={selected.mastery}
          attempts={selected.attempts}
          lastTs={selected.lastTs}
          isLocked={selected.isLocked}
          prereqNames={selected.prereqNames}
          onClose={() => setSelectedId(null)}
        />
      )}

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
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold bg-gray-100 border-gray-200 text-gray-500">
          <Lock size={9} /> Locked (prereqs not met)
        </div>
      </div>

      <p className="text-xs text-gray-400">Click any card to see drill history, rating trend, and prerequisite chain.</p>
    </div>
  );
}
