/**
 * useCTCIStreak — tracks consecutive days the user has solved at least one CTCI problem.
 * Storage key: "ctci_streak_data" → { streak, lastSolvedDate, longestStreak }
 */
import { useState, useEffect, useCallback } from 'react';

interface CTCIStreakData {
  streak: number;
  lastSolvedDate: string | null; // ISO date string YYYY-MM-DD
  longestStreak: number;
}

const STORAGE_KEY = 'ctci_streak_data';

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function loadData(): CTCIStreakData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as CTCIStreakData;
  } catch { /* ignore */ }
  return { streak: 0, lastSolvedDate: null, longestStreak: 0 };
}

function saveData(data: CTCIStreakData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { /* ignore */ }
}

export function useCTCIStreak() {
  const [data, setData] = useState<CTCIStreakData>(loadData);

  // Recompute whether streak is still alive on mount (in case user hasn't opened app for 2+ days)
  useEffect(() => {
    const current = loadData();
    const today = todayStr();
    const yesterday = yesterdayStr();
    if (
      current.streak > 0 &&
      current.lastSolvedDate !== today &&
      current.lastSolvedDate !== yesterday
    ) {
      // Streak broken
      const updated = { ...current, streak: 0 };
      saveData(updated);
      setData(updated);
    }
  }, []);

  /**
   * Call this whenever the user solves a problem.
   * Idempotent within the same calendar day.
   */
  const recordSolve = useCallback(() => {
    setData(prev => {
      const today = todayStr();
      const yesterday = yesterdayStr();

      if (prev.lastSolvedDate === today) {
        // Already recorded today — no change
        return prev;
      }

      const newStreak = prev.lastSolvedDate === yesterday ? prev.streak + 1 : 1;
      const updated: CTCIStreakData = {
        streak: newStreak,
        lastSolvedDate: today,
        longestStreak: Math.max(prev.longestStreak, newStreak),
      };
      saveData(updated);
      return updated;
    });
  }, []);

  const activatedToday = data.lastSolvedDate === todayStr();

  return {
    streak: data.streak,
    longestStreak: data.longestStreak,
    activatedToday,
    recordSolve,
  };
}
