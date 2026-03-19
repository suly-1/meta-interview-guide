/**
 * useReadinessScore — composite 0–100 interview readiness score
 * Weights: Quick Drill avg rating (40%) + CTCI solve % (30%) + Behavioral avg (20%) + Streak (10%)
 */
import { useMemo } from "react";
import { PATTERNS } from "@/lib/guideData";
import { CTCI_PROBLEMS } from "@/lib/ctciProblems";
import { BEHAVIORAL_FOCUS_AREAS } from "@/lib/guideData";

const DRILL_KEY = "meta-guide-drill-ratings";
const CTCI_KEY  = "ctci_progress_v1";
const BEH_KEY   = "meta-guide-practice-ratings";
const STREAK_KEY = "meta-guide-streak-dates";

function loadJSON<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) ?? "") ?? fallback; } catch { return fallback; }
}

export interface ReadinessBreakdown {
  total: number;           // 0–100
  drillScore: number;      // 0–100
  ctciScore: number;       // 0–100
  behavioralScore: number; // 0–100
  streakScore: number;     // 0–100
  drillAvg: number | null;
  ctciSolved: number;
  ctciTotal: number;
  behavioralAvg: number | null;
  streak: number;
}

export function computeReadiness(): ReadinessBreakdown {
  // 1. Quick Drill avg rating (max 5 → 100%)
  const drillData = loadJSON<Record<string, { rating: number }[]>>(DRILL_KEY, {});
  const drillAvgs = PATTERNS.map(p => {
    const entries = drillData[p.id] ?? [];
    if (!entries.length) return null;
    return entries.reduce((s, e) => s + e.rating, 0) / entries.length;
  }).filter((v): v is number => v !== null);
  const drillAvg = drillAvgs.length ? drillAvgs.reduce((a, b) => a + b, 0) / drillAvgs.length : null;
  const drillScore = drillAvg !== null ? Math.round((drillAvg / 5) * 100) : 0;

  // 2. CTCI solve %
  const ctciData = loadJSON<Record<number, { solved: boolean }>>(CTCI_KEY, {});
  const ctciSolved = Object.values(ctciData).filter(p => p.solved).length;
  const ctciTotal = CTCI_PROBLEMS.length;
  const ctciScore = Math.round((ctciSolved / ctciTotal) * 100);

  // 3. Behavioral avg rating (max 5 → 100%)
  const behData = loadJSON<Record<string, { rating: number; timestamp: number }[]>>(BEH_KEY, {});
  const allBehRatings: number[] = [];
  BEHAVIORAL_FOCUS_AREAS.forEach(fa => {
    fa.questions.forEach(q => {
      const key = q.question.slice(0, 80);
      const entries = behData[key] ?? [];
      if (entries.length) allBehRatings.push(entries[entries.length - 1].rating);
    });
  });
  const behavioralAvg = allBehRatings.length
    ? allBehRatings.reduce((a, b) => a + b, 0) / allBehRatings.length
    : null;
  const behavioralScore = behavioralAvg !== null ? Math.round((behavioralAvg / 5) * 100) : 0;

  // 4. Streak (cap at 14 days = 100%)
  const streakDates = loadJSON<string[]>(STREAK_KEY, []);
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];
  const sorted = Array.from(new Set(streakDates)).sort().reverse();
  let streak = 0;
  if (sorted.length && (sorted[0] === today || sorted[0] === yesterdayStr)) {
    let cursor = new Date(sorted[0] + "T00:00:00");
    for (const d of sorted) {
      if (d === cursor.toISOString().split("T")[0]) { streak++; cursor.setDate(cursor.getDate() - 1); }
      else break;
    }
  }
  const streakScore = Math.min(100, Math.round((streak / 14) * 100));

  const total = Math.round(drillScore * 0.4 + ctciScore * 0.3 + behavioralScore * 0.2 + streakScore * 0.1);

  return { total, drillScore, ctciScore, behavioralScore, streakScore, drillAvg, ctciSolved, ctciTotal, behavioralAvg, streak };
}

export function useReadinessScore(): ReadinessBreakdown {
  return useMemo(() => computeReadiness(), []);
}
