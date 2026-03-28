import { useState, useEffect, useCallback } from "react";

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        console.error(error);
      }
    },
    [key, storedValue]
  );

  return [storedValue, setValue] as const;
}

// ── Streak tracker ─────────────────────────────────────────────────────────
export interface StreakData {
  currentStreak: number;
  lastVisit: string | null;
  longestStreak: number;
}

export function useStreak() {
  const [streak, setStreak] = useLocalStorage<StreakData>("meta_streak_v1", {
    currentStreak: 0,
    lastVisit: null,
    longestStreak: 0,
  });

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    setStreak(prev => {
      if (prev.lastVisit === today) return prev;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];
      const newStreak =
        prev.lastVisit === yesterdayStr ? prev.currentStreak + 1 : 1;
      return {
        currentStreak: newStreak,
        lastVisit: today,
        longestStreak: Math.max(newStreak, prev.longestStreak),
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today]);

  return streak;
}

// ── Pattern ratings ────────────────────────────────────────────────────────
export function usePatternRatings() {
  return useLocalStorage<Record<string, number>>("meta_pattern_ratings_v1", {});
}

// ── Pattern notes ──────────────────────────────────────────────────────────
export function usePatternNotes() {
  return useLocalStorage<Record<string, string>>("meta_pattern_notes_v1", {});
}

// ── Spaced repetition due dates ────────────────────────────────────────────
export function useSpacedRepetition() {
  return useLocalStorage<Record<string, string>>("meta_sr_due_v1", {});
}

// ── Behavioral story ratings ───────────────────────────────────────────────
export function useBehavioralRatings() {
  return useLocalStorage<Record<string, number>>("meta_bq_ratings_v1", {});
}

// ── STAR story notes ───────────────────────────────────────────────────────
export function useStarNotes() {
  return useLocalStorage<Record<string, string>>("meta_star_notes_v1", {});
}

// ── Mock session history ───────────────────────────────────────────────────
export interface MockSession {
  id: string;
  date: string;
  questions: Array<{ text: string; area: string }>;
  ratings: number[];
  avgScore: number;
}

export function useMockHistory() {
  return useLocalStorage<MockSession[]>("meta_mock_history_v1", []);
}

// ── Coding session history ─────────────────────────────────────────────────
export interface CodingSession {
  id: string;
  date: string;
  duration: number; // minutes
  type: "25min" | "35min" | "45min" | "drill";
}

export function useCodingHistory() {
  return useLocalStorage<CodingSession[]>("meta_coding_sessions_v1", []);
}

// ── Interview countdown ────────────────────────────────────────────────────
export function useInterviewDate() {
  return useLocalStorage<string | null>("meta_interview_date_v1", null);
}

// ── Notification settings ──────────────────────────────────────────────────
export interface NotifSettings {
  enabled: boolean;
  time: string;
  dismissed: boolean;
}

export function useNotifSettings() {
  return useLocalStorage<NotifSettings>("meta_notif_v1", {
    enabled: false,
    time: "09:00",
    dismissed: false,
  });
}

// ── Onboarding dismissed ──────────────────────────────────────────────────
export function useOnboardingDismissed() {
  return useLocalStorage<boolean>("meta_onboarding_v1", false);
}

// ── Disclaimer dismissed ──────────────────────────────────────────────────
export function useDisclaimerDismissed() {
  return useLocalStorage<boolean>("meta_disclaimer_v1", false);
}

// ── Confetti fired ────────────────────────────────────────────────────────
export function useCongratsShown() {
  return useLocalStorage<boolean>("meta_congrats_v1", false);
}

// ── Debugging Under Pressure history ─────────────────────────────────────
export interface DebuggingSession {
  id: string;
  date: string; // ISO timestamp
  problemId: string;
  problemTitle: string;
  language: string;
  solved: boolean;
  timeUsedSeconds: number; // seconds taken (0 if timed out)
  attempts: number; // run attempts before solving
  feedback: string; // AI feedback text
}
export function useDebuggingHistory() {
  return useLocalStorage<DebuggingSession[]>("meta_debugging_history_v1", []);
}

// ── AI Review History (Code Practice tab) ─────────────────────────────────
export interface AIReviewRecord {
  id: string;
  problemId: string;
  problemTitle: string;
  topic: string;
  difficulty: string;
  date: string; // ISO
  score: number; // 0-5
  level: string; // L5/L6/L7
  verdict: string;
  correctness: number;
  complexity: number;
  edgeCases: number;
  codeQuality: number;
  coaching: string;
}
export function useAIReviewHistory() {
  return useLocalStorage<AIReviewRecord[]>("meta_ai_review_history_v1", []);
}

// ── Code Practice solved count (for TopNav badge + readiness dashboard) ───────
export function useCodePracticeSolvedCount(): number {
  const [solved] = useLocalStorage<Record<string, boolean>>(
    "meta_code_practice_solved_v1",
    {}
  );
  return Object.values(solved).filter(Boolean).length;
}
export const CODE_PRACTICE_TOTAL = 50;
