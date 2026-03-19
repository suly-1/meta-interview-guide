/**
 * ActivityCalendar60 — 60-day GitHub-style contribution heatmap
 * Shows daily practice activity across all dimensions (drills, CTCI solves, behavioral)
 * with week labels, month markers, and a summary legend.
 */
import { useMemo } from "react";

const STREAK_KEY   = "meta-guide-streak-dates";
const CTCI_KEY     = "ctci_progress_v1";
const DRILL_KEY    = "meta-guide-drill-ratings";
const BEH_KEY      = "meta-guide-practice-ratings";

function loadJSON<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) ?? "") ?? fallback; } catch { return fallback; }
}

function dateStr(d: Date) { return d.toISOString().split("T")[0]; }

function addDays(base: Date, n: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d;
}

function formatMonth(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short" });
}

export default function ActivityCalendar60() {
  // Build 60-day date array ending today
  const today = useMemo(() => new Date(), []);
  const days = useMemo(() => {
    return Array.from({ length: 60 }, (_, i) => {
      const d = addDays(today, -(59 - i));
      return dateStr(d);
    });
  }, [today]);

  // Load all activity data
  const streakDates  = useMemo(() => new Set(loadJSON<string[]>(STREAK_KEY, [])), []);
  const ctciData     = useMemo(() => loadJSON<Record<number, { solved: boolean; solvedAt?: string }>>(CTCI_KEY, {}), []);
  const drillData    = useMemo(() => loadJSON<Record<string, { rating: number; timestamp?: number }[]>>(DRILL_KEY, {}), []);
  const behData      = useMemo(() => loadJSON<Record<string, { rating: number; timestamp: number }[]>>(BEH_KEY, {}), []);

  // Build per-day activity counts
  const activityMap = useMemo(() => {
    const map: Record<string, { streak: boolean; ctci: number; drill: number; beh: number }> = {};

    days.forEach(d => { map[d] = { streak: false, ctci: 0, drill: 0, beh: 0 }; });

    // Streak dates
    streakDates.forEach(d => { if (map[d]) map[d].streak = true; });

    // CTCI solves (if solvedAt timestamp available)
    Object.values(ctciData).forEach(p => {
      if (p.solved && p.solvedAt && map[p.solvedAt]) map[p.solvedAt].ctci++;
    });

    // Drill sessions (by timestamp)
    Object.values(drillData).forEach(entries => {
      entries.forEach(e => {
        if (e.timestamp) {
          const d = new Date(e.timestamp).toISOString().split("T")[0];
          if (map[d]) map[d].drill++;
        }
      });
    });

    // Behavioral sessions (by timestamp)
    Object.values(behData).forEach(entries => {
      entries.forEach(e => {
        if (e.timestamp) {
          const d = new Date(e.timestamp).toISOString().split("T")[0];
          if (map[d]) map[d].beh++;
        }
      });
    });

    return map;
  }, [days, streakDates, ctciData, drillData, behData]);

  // Compute intensity level (0–4) per day
  function intensity(d: string) {
    const a = activityMap[d];
    if (!a) return 0;
    const total = (a.streak ? 1 : 0) + Math.min(a.ctci, 3) + Math.min(a.drill, 2) + Math.min(a.beh, 2);
    if (total === 0) return 0;
    if (total === 1) return 1;
    if (total <= 3) return 2;
    if (total <= 5) return 3;
    return 4;
  }

  const intensityColors = [
    "bg-gray-100 dark:bg-gray-800",
    "bg-blue-200 dark:bg-blue-900",
    "bg-blue-400 dark:bg-blue-700",
    "bg-blue-600 dark:bg-blue-500",
    "bg-blue-800 dark:bg-blue-400",
  ];

  // Group into weeks (columns of 7)
  const weeks = useMemo(() => {
    const result: string[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      result.push(days.slice(i, i + 7));
    }
    return result;
  }, [days]);

  // Month labels — show month name when it changes
  const monthLabels = useMemo(() => {
    const labels: { col: number; label: string }[] = [];
    let lastMonth = "";
    weeks.forEach((week, col) => {
      const m = formatMonth(new Date(week[0]));
      if (m !== lastMonth) { labels.push({ col, label: m }); lastMonth = m; }
    });
    return labels;
  }, [weeks]);

  // Stats
  const activeDays = days.filter(d => intensity(d) > 0).length;
  const currentStreak = useMemo(() => {
    let streak = 0;
    for (let i = days.length - 1; i >= 0; i--) {
      if (activityMap[days[i]]?.streak) streak++;
      else break;
    }
    return streak;
  }, [days, activityMap]);

  const todayStr = dateStr(today);
  const todayActivity = activityMap[todayStr];

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            60-Day Activity Calendar
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {activeDays} active day{activeDays !== 1 ? "s" : ""} · {currentStreak}-day current streak
          </p>
        </div>
        {/* Today badge */}
        {todayActivity?.streak ? (
          <span className="text-xs font-bold px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full border border-blue-200">
            ✓ Practiced today
          </span>
        ) : (
          <span className="text-xs font-bold px-3 py-1.5 bg-amber-50 text-amber-600 rounded-full border border-amber-200">
            Practice today to keep your streak
          </span>
        )}
      </div>

      {/* Calendar grid */}
      <div className="overflow-x-auto">
        <div style={{ minWidth: 480 }}>
          {/* Month labels */}
          <div className="flex mb-1" style={{ paddingLeft: 28 }}>
            {weeks.map((_, col) => {
              const label = monthLabels.find(m => m.col === col);
              return (
                <div key={col} className="flex-1 text-[10px] text-gray-400 font-medium">
                  {label ? label.label : ""}
                </div>
              );
            })}
          </div>

          {/* Day-of-week labels + grid */}
          <div className="flex gap-0">
            {/* Day labels */}
            <div className="flex flex-col gap-0.5 mr-1 pt-0.5">
              {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                <div key={i} className="text-[9px] text-gray-400 w-5 h-[13px] flex items-center justify-end pr-1">
                  {i % 2 === 1 ? d : ""}
                </div>
              ))}
            </div>

            {/* Weeks */}
            <div className="flex gap-0.5 flex-1">
              {weeks.map((week, col) => (
                <div key={col} className="flex flex-col gap-0.5 flex-1">
                  {week.map((d, row) => {
                    const level = intensity(d);
                    const a = activityMap[d];
                    const isToday = d === todayStr;
                    const tooltip = [
                      d,
                      a?.streak ? "Practiced" : "",
                      a?.ctci ? `${a.ctci} CTCI` : "",
                      a?.drill ? `${a.drill} Drills` : "",
                      a?.beh ? `${a.beh} Behavioral` : "",
                    ].filter(Boolean).join(" · ");

                    return (
                      <div
                        key={row}
                        title={tooltip}
                        className={`rounded-sm transition-all cursor-default ${intensityColors[level]} ${
                          isToday ? "ring-2 ring-blue-500 ring-offset-1" : ""
                        }`}
                        style={{ height: 13, minWidth: 13 }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend + stats */}
      <div className="flex items-center justify-between flex-wrap gap-3 pt-1 border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-gray-400">Less</span>
          {intensityColors.map((c, i) => (
            <div key={i} className={`w-3 h-3 rounded-sm ${c} border border-gray-200 dark:border-gray-700`} />
          ))}
          <span className="text-[11px] text-gray-400">More</span>
        </div>

        <div className="flex items-center gap-4">
          {[
            { label: "Active days", value: activeDays },
            { label: "Streak", value: `${currentStreak}d` },
          ].map(s => (
            <div key={s.label} className="text-center">
              <p className="text-sm font-extrabold text-gray-900 dark:text-gray-100" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{s.value}</p>
              <p className="text-[10px] text-gray-400">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
