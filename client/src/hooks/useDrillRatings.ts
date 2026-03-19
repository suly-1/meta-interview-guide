/**
 * useDrillRatings — shared read-only hook for Quick Drill pattern ratings
 * Storage key: "meta-guide-drill-ratings"
 * Shape: Record<patternId, { rating: number; ts: number }[]>
 */
import { useMemo } from "react";
import { PATTERNS } from "@/lib/guideData";

const DRILL_KEY = "meta-guide-drill-ratings";

export interface PatternRating {
  patternId: string;
  patternName: string;
  avg: number | null;
  latest: number | null;
  attempts: number;
}

function loadRatings(): Record<string, { rating: number; ts: number }[]> {
  try { return JSON.parse(localStorage.getItem(DRILL_KEY) ?? "{}"); } catch { return {}; }
}

export function useDrillRatings(): PatternRating[] {
  return useMemo(() => {
    const data = loadRatings();
    return PATTERNS.map(p => {
      const entries = data[p.id] ?? [];
      const avg = entries.length
        ? entries.reduce((s, e) => s + e.rating, 0) / entries.length
        : null;
      const latest = entries.length ? entries[entries.length - 1].rating : null;
      return { patternId: p.id, patternName: p.name, avg, latest, attempts: entries.length };
    });
  }, []);
}

export function getWeakestPatterns(n = 3): PatternRating[] {
  const data = loadRatings();
  return PATTERNS
    .map(p => {
      const entries = data[p.id] ?? [];
      const avg = entries.length ? entries.reduce((s, e) => s + e.rating, 0) / entries.length : null;
      const latest = entries.length ? entries[entries.length - 1].rating : null;
      return { patternId: p.id, patternName: p.name, avg, latest, attempts: entries.length };
    })
    .sort((a, b) => {
      // unrated patterns come first (most neglected), then by avg ascending
      if (a.avg === null && b.avg === null) return 0;
      if (a.avg === null) return -1;
      if (b.avg === null) return 1;
      return a.avg - b.avg;
    })
    .slice(0, n);
}
