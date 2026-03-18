import { useState, useCallback } from "react";

const STORAGE_KEY = "meta-guide-practice-ratings";

type RatingEntry = { rating: number; timestamp: number };

function load(): Record<string, RatingEntry[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function save(data: Record<string, RatingEntry[]>) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { /* ignore */ }
}

export function usePracticeRatings() {
  const [ratings, setRatings] = useState<Record<string, RatingEntry[]>>(load);

  const addRating = useCallback((question: string, rating: number) => {
    setRatings((prev) => {
      const key = question.slice(0, 80);
      const existing = prev[key] ?? [];
      const next = { ...prev, [key]: [...existing, { rating, timestamp: Date.now() }] };
      save(next);
      return next;
    });
  }, []);

  const getLatestRating = useCallback((question: string): number | null => {
    const key = question.slice(0, 80);
    const entries = ratings[key];
    if (!entries || entries.length === 0) return null;
    return entries[entries.length - 1].rating;
  }, [ratings]);

  const getAverageRating = useCallback((question: string): number | null => {
    const key = question.slice(0, 80);
    const entries = ratings[key];
    if (!entries || entries.length === 0) return null;
    return Math.round((entries.reduce((s, e) => s + e.rating, 0) / entries.length) * 10) / 10;
  }, [ratings]);

  const getAttemptCount = useCallback((question: string): number => {
    const key = question.slice(0, 80);
    return ratings[key]?.length ?? 0;
  }, [ratings]);

  return { addRating, getLatestRating, getAverageRating, getAttemptCount };
}
