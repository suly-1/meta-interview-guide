// useStreak — tracks daily activity dates and computes the current consecutive streak
// A "day" is counted when the user completes at least one Quick Drill or Practice Mode session
// Storage key: "meta-guide-streak-dates" → sorted array of "YYYY-MM-DD" strings
import { useState, useCallback, useMemo } from "react";

const STORAGE_KEY = "meta-guide-streak-dates";

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

function loadDates(): string[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]"); } catch { return []; }
}

function saveDates(dates: string[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(dates)); } catch { /* ignore */ }
}

function computeStreak(dates: string[]): number {
  if (!dates.length) return 0;
  const sorted = Array.from(new Set(dates)).sort().reverse(); // newest first, deduplicated
  const today  = todayStr();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  // Streak must include today or yesterday (otherwise it's broken)
  if (sorted[0] !== today && sorted[0] !== yesterdayStr) return 0;

  let streak = 0;
  let cursor = new Date(sorted[0] + "T00:00:00");

  for (const d of sorted) {
    const expected = cursor.toISOString().split("T")[0];
    if (d === expected) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

export function useStreak() {
  const [dates, setDates] = useState<string[]>(loadDates);

  const recordActivity = useCallback(() => {
    const today = todayStr();
    setDates((prev) => {
      if (prev.includes(today)) return prev;
      const next = [...prev, today];
      saveDates(next);
      return next;
    });
  }, []);

  const streak = useMemo(() => computeStreak(dates), [dates]);
  const activatedToday = useMemo(() => dates.includes(todayStr()), [dates]);

  return { streak, activatedToday, recordActivity };
}
