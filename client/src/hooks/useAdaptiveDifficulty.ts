import { useMemo } from "react";
import { PATTERNS } from "@/lib/guideData";

const MASTERY_THRESHOLD = 4; // avg rating >= 4 after 3+ sessions = mastered
const MIN_SESSIONS = 3;

interface DrillRatings {
  [patternId: string]: { ratings: number[]; nextReview?: string };
}

export function useAdaptiveDifficulty(drillRatings: DrillRatings) {
  const { masteredIds, activeIds } = useMemo(() => {
    const mastered: string[] = [];
    const active: string[] = [];

    PATTERNS.forEach(p => {
      const data = drillRatings[p.id];
      if (data && data.ratings.length >= MIN_SESSIONS) {
        const avg = data.ratings.reduce((a, b) => a + b, 0) / data.ratings.length;
        if (avg >= MASTERY_THRESHOLD) {
          mastered.push(p.id);
          return;
        }
      }
      active.push(p.id);
    });

    return { masteredIds: mastered, activeIds: active };
  }, [drillRatings]);

  const getMasteryLevel = (patternId: string): "mastered" | "progressing" | "needs-work" | "undrilled" => {
    const data = drillRatings[patternId];
    if (!data || data.ratings.length === 0) return "undrilled";
    const avg = data.ratings.reduce((a, b) => a + b, 0) / data.ratings.length;
    if (avg >= MASTERY_THRESHOLD && data.ratings.length >= MIN_SESSIONS) return "mastered";
    if (avg >= 3) return "progressing";
    return "needs-work";
  };

  return { masteredIds, activeIds, getMasteryLevel };
}
