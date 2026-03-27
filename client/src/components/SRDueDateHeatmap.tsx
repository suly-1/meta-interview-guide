/**
 * SRDueDateHeatmap — GitHub-style 30-day calendar showing SR reviews due per day.
 * Reads directly from the "meta-guide-srs-schedule" localStorage key.
 * Each cell is coloured by how many reviews are due that day.
 */
import { useMemo } from "react";
import { CalendarDays } from "lucide-react";

type SRSEntry = {
  patternId: string;
  nextReview: string; // "YYYY-MM-DD"
  interval: number;
  lastRating: number;
  lastReviewed: string;
};

function loadSchedule(): Record<string, SRSEntry> {
  try { return JSON.parse(localStorage.getItem("meta-guide-srs-schedule") ?? "{}"); } catch { return {}; }
}

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function addDays(base: Date, n: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d;
}

const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTH_ABBR = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function SRDueDateHeatmap() {
  const schedule = useMemo(() => loadSchedule(), []);

  // Build a map: dateStr → count of reviews due that day
  const dueCounts = useMemo(() => {
    const map: Record<string, number> = {};
    Object.values(schedule).forEach((e) => {
      map[e.nextReview] = (map[e.nextReview] ?? 0) + 1;
    });
    return map;
  }, [schedule]);

  // Build 30 days starting from today
  const today = useMemo(() => new Date(), []);
  const days = useMemo(() =>
    Array.from({ length: 30 }, (_, i) => {
      const d = addDays(today, i);
      const str = formatDate(d);
      return { date: d, str, count: dueCounts[str] ?? 0, isToday: i === 0 };
    }),
  [today, dueCounts]);

  const totalScheduled = Object.keys(schedule).length;
  const totalDueToday = dueCounts[formatDate(today)] ?? 0;
  const totalDueNext7 = days.slice(0, 7).reduce((s, d) => s + d.count, 0);
  const maxCount = Math.max(1, ...days.map(d => d.count));

  function cellColor(count: number, isToday: boolean): string {
    if (count === 0) return isToday ? "bg-blue-100 border-blue-300" : "bg-gray-100 border-gray-200";
    const intensity = Math.min(count / maxCount, 1);
    if (intensity < 0.25) return "bg-emerald-200 border-emerald-300";
    if (intensity < 0.5)  return "bg-emerald-400 border-emerald-500";
    if (intensity < 0.75) return "bg-emerald-600 border-emerald-700";
    return "bg-emerald-800 border-emerald-900";
  }

  function textColor(count: number): string {
    if (count === 0) return "text-gray-600";
    const intensity = Math.min(count / maxCount, 1);
    return intensity >= 0.5 ? "text-white" : "text-emerald-900";
  }

  if (totalScheduled === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <CalendarDays size={13} className="text-emerald-500" />
          <span className="text-xs font-semibold text-foreground">SR Review Schedule (Next 30 Days)</span>
        </div>
        <p className="text-xs text-muted-foreground">
          No patterns scheduled yet. Rate patterns in the Quick Drill section to start your spaced-repetition schedule.
        </p>
      </div>
    );
  }

  // Group days into weeks (rows) for the grid
  // Start from the first day's weekday offset
  const startDow = today.getDay(); // 0=Sun
  // Pad the beginning so the grid aligns to the week
  const paddedDays: Array<{ date: Date; str: string; count: number; isToday: boolean } | null> = [
    ...Array(startDow).fill(null),
    ...days,
  ];
  // Pad end to complete the last row
  while (paddedDays.length % 7 !== 0) paddedDays.push(null);
  const weeks: Array<typeof paddedDays> = [];
  for (let i = 0; i < paddedDays.length; i += 7) {
    weeks.push(paddedDays.slice(i, i + 7));
  }

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <CalendarDays size={13} className="text-emerald-500" />
          <span className="text-xs font-semibold text-foreground">SR Review Schedule (Next 30 Days)</span>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <span><span className="font-bold text-emerald-600">{totalDueToday}</span> due today</span>
          <span><span className="font-bold text-blue-600">{totalDueNext7}</span> this week</span>
          <span><span className="font-bold text-foreground">{totalScheduled}</span> scheduled</span>
        </div>
      </div>

      {/* Day-of-week labels */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAY_LABELS.map(d => (
          <div key={d} className="text-[9px] text-center text-muted-foreground font-semibold">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="space-y-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-1">
            {week.map((day, di) => {
              if (!day) return <div key={di} className="aspect-square" />;
              const isMonthStart = day.date.getDate() === 1;
              return (
                <div
                  key={di}
                  title={`${day.str}: ${day.count} review${day.count !== 1 ? "s" : ""} due`}
                  className={`relative aspect-square rounded flex flex-col items-center justify-center border text-[9px] font-bold cursor-default transition-all hover:scale-110 ${cellColor(day.count, day.isToday)}`}
                >
                  {day.isToday && (
                    <span className="absolute top-0.5 right-0.5 w-1 h-1 rounded-full bg-blue-500" />
                  )}
                  <span className={textColor(day.count)}>{day.date.getDate()}</span>
                  {isMonthStart && (
                    <span className="absolute -top-3 left-0 text-[8px] text-muted-foreground font-semibold whitespace-nowrap">
                      {MONTH_ABBR[day.date.getMonth()]}
                    </span>
                  )}
                  {day.count > 0 && (
                    <span className={`text-[7px] leading-none ${textColor(day.count)} opacity-80`}>{day.count}</span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-3 justify-end">
        <span className="text-[9px] text-muted-foreground">Less</span>
        {[0, 1, 2, 3, 4].map(level => (
          <div
            key={level}
            className={`w-3 h-3 rounded border ${
              level === 0 ? "bg-gray-100 border-gray-200" :
              level === 1 ? "bg-emerald-200 border-emerald-300" :
              level === 2 ? "bg-emerald-400 border-emerald-500" :
              level === 3 ? "bg-emerald-600 border-emerald-700" :
                            "bg-emerald-800 border-emerald-900"
            }`}
          />
        ))}
        <span className="text-[9px] text-muted-foreground">More</span>
      </div>

      {/* Pattern breakdown */}
      {totalDueToday > 0 && (
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-[10px] font-semibold text-foreground mb-1.5">Due Today</p>
          <div className="flex flex-wrap gap-1.5">
            {Object.values(schedule)
              .filter(e => e.nextReview === formatDate(today))
              .map(e => (
                <span
                  key={e.patternId}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 font-medium capitalize"
                >
                  {e.patternId.replace(/-/g, " ")}
                </span>
              ))
            }
          </div>
        </div>
      )}
    </div>
  );
}
