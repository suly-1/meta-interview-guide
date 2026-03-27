/**
 * StreakCalendar — Feature 10
 * 12-week GitHub-style contribution heatmap colored by daily activity intensity.
 */
import { useMemo } from "react";
import { Flame } from "lucide-react";
import { CTCI_PROBLEMS } from "@/lib/ctciProblems";

const STREAK_KEY = "meta-guide-streak-dates";
const CTCI_KEY = "ctci_progress_v1";
const DRILL_KEY = "meta-guide-drill-ratings";

function loadJSON<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) ?? "") ?? fallback; } catch { return fallback; }
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function StreakCalendar({ weeks = 12 }: { weeks?: number }) {
  const { grid, totalActiveDays, currentStreak, maxStreak } = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const todayDow = new Date(today + "T12:00:00").getDay();
    // Start from the Sunday of the week that is `weeks` weeks ago
    const startDate = addDays(today, -(todayDow + (weeks - 1) * 7));

    const streakDates = new Set(loadJSON<string[]>(STREAK_KEY, []));
    const ctciData = loadJSON<Record<number, { solved: boolean; solvedAt?: string }>>(CTCI_KEY, {});
    const drillData = loadJSON<Record<string, { rating: number; ts: number }[]>>(DRILL_KEY, {});

    // Count CTCI solves per day
    const ctciPerDay: Record<string, number> = {};
    CTCI_PROBLEMS.forEach(p => {
      const prog = ctciData[p.id];
      if (prog?.solved && prog.solvedAt) {
        const d = prog.solvedAt.split("T")[0];
        ctciPerDay[d] = (ctciPerDay[d] ?? 0) + 1;
      }
    });

    // Count drill sessions per day
    const drillPerDay: Record<string, number> = {};
    Object.values(drillData).forEach(entries => {
      entries.forEach(e => {
        const d = new Date(e.ts).toISOString().split("T")[0];
        drillPerDay[d] = (drillPerDay[d] ?? 0) + 1;
      });
    });

    // Build grid: weeks × 7 days
    const grid: { date: string; intensity: number; ctci: number; drills: number; isToday: boolean; isFuture: boolean }[][] = [];
    for (let w = 0; w < weeks; w++) {
      const week: typeof grid[0] = [];
      for (let d = 0; d < 7; d++) {
        const date = addDays(startDate, w * 7 + d);
        const isFuture = date > today;
        const ctci = ctciPerDay[date] ?? 0;
        const drills = drillPerDay[date] ?? 0;
        const hasStreak = streakDates.has(date);
        const intensity = isFuture ? -1 : Math.min(4, ctci + drills + (hasStreak ? 1 : 0));
        week.push({ date, intensity, ctci, drills, isToday: date === today, isFuture });
      }
      grid.push(week);
    }

    const totalActiveDays = grid.flat().filter(d => d.intensity > 0).length;

    // Compute current streak
    const sortedDates = Array.from(streakDates).sort().reverse();
    let currentStreak = 0;
    const yesterday = addDays(today, -1);
    if (sortedDates.length && (sortedDates[0] === today || sortedDates[0] === yesterday)) {
      let cursor = new Date(sortedDates[0] + "T12:00:00");
      for (const d of sortedDates) {
        if (d === cursor.toISOString().split("T")[0]) { currentStreak++; cursor.setDate(cursor.getDate() - 1); }
        else break;
      }
    }

    // Max streak
    let maxStreak = 0, runStreak = 0;
    const allDates = Array.from(streakDates).sort();
    for (let i = 0; i < allDates.length; i++) {
      if (i === 0) { runStreak = 1; }
      else {
        const prev = new Date(allDates[i - 1] + "T12:00:00");
        prev.setDate(prev.getDate() + 1);
        if (allDates[i] === prev.toISOString().split("T")[0]) runStreak++;
        else runStreak = 1;
      }
      maxStreak = Math.max(maxStreak, runStreak);
    }

    return { grid, totalActiveDays, currentStreak, maxStreak };
  }, [weeks]);

  const intensityColors = [
    "bg-gray-100",           // 0 - no activity
    "bg-blue-200",           // 1 - light
    "bg-blue-400",           // 2 - moderate
    "bg-blue-600",           // 3 - active
    "bg-emerald-500",        // 4 - very active
  ];

  // Month labels
  const monthLabels = useMemo(() => {
    const labels: { label: string; col: number }[] = [];
    let lastMonth = "";
    grid.forEach((week, w) => {
      const firstDay = week[0];
      if (!firstDay.isFuture) {
        const month = new Date(firstDay.date + "T12:00:00").toLocaleDateString("en-US", { month: "short" });
        if (month !== lastMonth) {
          labels.push({ label: month, col: w });
          lastMonth = month;
        }
      }
    });
    return labels;
  }, [grid]);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Flame size={16} className="text-orange-500" />
          <span className="text-sm font-bold text-gray-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Activity Calendar</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-base font-extrabold text-orange-500" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{currentStreak}</p>
            <p className="text-[10px] text-gray-600">current streak</p>
          </div>
          <div className="text-center">
            <p className="text-base font-extrabold text-blue-600" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{maxStreak}</p>
            <p className="text-[10px] text-gray-600">best streak</p>
          </div>
          <div className="text-center">
            <p className="text-base font-extrabold text-gray-700" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{totalActiveDays}</p>
            <p className="text-[10px] text-gray-600">active days</p>
          </div>
        </div>
      </div>

      <div className="px-5 py-4 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {/* Day labels */}
          <div className="flex flex-col gap-1 mr-1">
            <div className="h-4" /> {/* month label spacer */}
            {DAY_LABELS.map((d, i) => (
              <div key={d} className="h-3 flex items-center">
                {i % 2 === 1 && <span className="text-[9px] text-gray-600 w-6">{d.slice(0, 1)}</span>}
                {i % 2 === 0 && <span className="w-6" />}
              </div>
            ))}
          </div>

          {/* Grid */}
          {grid.map((week, w) => (
            <div key={w} className="flex flex-col gap-1">
              {/* Month label */}
              <div className="h-4 flex items-center">
                {monthLabels.find(m => m.col === w) && (
                  <span className="text-[9px] text-gray-600 font-semibold">{monthLabels.find(m => m.col === w)?.label}</span>
                )}
              </div>
              {week.map((day, d) => (
                <div
                  key={d}
                  className={`w-3 h-3 rounded-sm transition-colors ${
                    day.isFuture ? "bg-gray-50" :
                    day.intensity === 0 ? "bg-gray-100" :
                    intensityColors[day.intensity]
                  } ${day.isToday ? "ring-1 ring-blue-500 ring-offset-1" : ""}`}
                  title={day.isFuture ? day.date : `${day.date}: ${day.ctci} problems solved, ${day.drills} drills`}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-1.5 mt-3 justify-end">
          <span className="text-[10px] text-gray-600">Less</span>
          {intensityColors.map((c, i) => (
            <div key={i} className={`w-3 h-3 rounded-sm ${c}`} />
          ))}
          <span className="text-[10px] text-gray-600">More</span>
        </div>
      </div>
    </div>
  );
}
