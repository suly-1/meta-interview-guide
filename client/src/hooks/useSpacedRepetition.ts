// useSpacedRepetition — schedules pattern review dates based on Quick Drill ratings
// Rating → next review interval:
//   1 (Blank)        → 1 day
//   2 (Developing)   → 1 day
//   3 (Decent)       → 3 days
//   4 (Solid)        → 7 days
//   5 (Strong)       → 14 days
import { useState, useCallback, useMemo } from "react";

const STORAGE_KEY = "meta-guide-srs-schedule";

export type SRSEntry = {
  patternId: string;
  nextReview: string; // ISO date string "YYYY-MM-DD"
  interval: number;   // days until next review
  lastRating: number;
  lastReviewed: string; // ISO date string
};

function ratingToInterval(rating: number): number {
  if (rating <= 2) return 1;
  if (rating === 3) return 3;
  if (rating === 4) return 7;
  return 14;
}

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

function loadSchedule(): Record<string, SRSEntry> {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}"); } catch { return {}; }
}

function saveSchedule(schedule: Record<string, SRSEntry>) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(schedule)); } catch { /* ignore */ }
}

export function useSpacedRepetition() {
  const [schedule, setSchedule] = useState<Record<string, SRSEntry>>(loadSchedule);

  const scheduleReview = useCallback((patternId: string, rating: number) => {
    const interval    = ratingToInterval(rating);
    const nextReview  = addDays(interval);
    const today       = todayStr();

    setSchedule((prev) => {
      const next = {
        ...prev,
        [patternId]: { patternId, nextReview, interval, lastRating: rating, lastReviewed: today },
      };
      saveSchedule(next);
      return next;
    });
  }, []);

  // IDs of patterns due today or overdue
  const dueToday = useMemo(() => {
    const today = todayStr();
    return Object.values(schedule)
      .filter((e) => e.nextReview <= today)
      .map((e) => e.patternId);
  }, [schedule]);

  const getEntry = useCallback((patternId: string): SRSEntry | null => {
    return schedule[patternId] ?? null;
  }, [schedule]);

  const isDue = useCallback((patternId: string): boolean => {
    const entry = schedule[patternId];
    if (!entry) return false;
    return entry.nextReview <= todayStr();
  }, [schedule]);

  const isScheduled = useCallback((patternId: string): boolean => {
    return !!schedule[patternId];
  }, [schedule]);

  return { scheduleReview, dueToday, getEntry, isDue, isScheduled };
}
