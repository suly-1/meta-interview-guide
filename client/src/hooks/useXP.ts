/**
 * useXP — Daily XP System for the Independence Study Guide
 *
 * XP is earned from:
 *   - Solving a CTCI problem:          +10 XP
 *   - Completing a Topic Sprint:        +25 XP
 *   - Completing a Behavioral session:  +15 XP
 *   - Completing an AI Mock session:    +40 XP
 *   - Completing a SD Mock session:     +40 XP
 *   - Maintaining a daily streak:       +5 XP/day bonus
 *
 * XP Levels:
 *   0      → Rookie
 *   200    → Apprentice
 *   500    → Engineer
 *   1000   → Senior Engineer
 *   2000   → Staff Engineer
 *   4000   → Principal Engineer
 *   8000   → Distinguished Engineer
 *
 * Storage key: "meta-guide-xp-log"
 * Shape: { totalXP: number; events: XPEvent[] }
 */
import { useState, useCallback, useMemo } from "react";

export interface XPEvent {
  id: string;
  type:
    | "ctci_solve"
    | "sprint_complete"
    | "behavioral_session"
    | "ai_mock"
    | "sd_mock"
    | "streak_bonus"
    | "first_solve"
    | "first_sprint"
    | "first_mock";
  amount: number;
  label: string;
  ts: number; // Unix ms
}

export interface XPLevel {
  name: string;
  minXP: number;
  color: string;
  bgColor: string;
  borderColor: string;
  emoji: string;
}

export const XP_LEVELS: XPLevel[] = [
  { name: "Rookie",               minXP: 0,    color: "text-gray-600",   bgColor: "bg-gray-100",   borderColor: "border-gray-300",   emoji: "🌱" },
  { name: "Apprentice",           minXP: 200,  color: "text-blue-600",   bgColor: "bg-blue-100",   borderColor: "border-blue-300",   emoji: "📚" },
  { name: "Engineer",             minXP: 500,  color: "text-teal-600",   bgColor: "bg-teal-100",   borderColor: "border-teal-300",   emoji: "⚙️" },
  { name: "Senior Engineer",      minXP: 1000, color: "text-indigo-600", bgColor: "bg-indigo-100", borderColor: "border-indigo-300", emoji: "🔧" },
  { name: "Staff Engineer",       minXP: 2000, color: "text-violet-600", bgColor: "bg-violet-100", borderColor: "border-violet-300", emoji: "🚀" },
  { name: "Principal Engineer",   minXP: 4000, color: "text-amber-600",  bgColor: "bg-amber-100",  borderColor: "border-amber-300",  emoji: "⭐" },
  { name: "Distinguished Engineer", minXP: 8000, color: "text-rose-600", bgColor: "bg-rose-100",   borderColor: "border-rose-300",   emoji: "🏆" },
];

export const XP_REWARDS: Record<XPEvent["type"], number> = {
  ctci_solve:        10,
  sprint_complete:   25,
  behavioral_session: 15,
  ai_mock:           40,
  sd_mock:           40,
  streak_bonus:       5,
  first_solve:       50,
  first_sprint:      50,
  first_mock:        50,
};

const STORAGE_KEY = "meta-guide-xp-log";

interface XPStore {
  totalXP: number;
  events: XPEvent[];
}

function loadStore(): XPStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { totalXP: 0, events: [] };
    return JSON.parse(raw);
  } catch {
    return { totalXP: 0, events: [] };
  }
}

function saveStore(store: XPStore) {
  try {
    // Keep last 500 events
    const trimmed = { ...store, events: store.events.slice(-500) };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch { /* ignore */ }
}

export function getLevelInfo(totalXP: number): {
  current: XPLevel;
  next: XPLevel | null;
  progressPct: number;
  xpIntoLevel: number;
  xpToNextLevel: number;
} {
  let current = XP_LEVELS[0];
  let next: XPLevel | null = null;
  for (let i = XP_LEVELS.length - 1; i >= 0; i--) {
    if (totalXP >= XP_LEVELS[i].minXP) {
      current = XP_LEVELS[i];
      next = XP_LEVELS[i + 1] ?? null;
      break;
    }
  }
  const xpIntoLevel = totalXP - current.minXP;
  const xpToNextLevel = next ? next.minXP - current.minXP : 0;
  const progressPct = next ? Math.min(100, Math.round((xpIntoLevel / xpToNextLevel) * 100)) : 100;
  return { current, next, progressPct, xpIntoLevel, xpToNextLevel };
}

export function getTodayXP(events: XPEvent[]): number {
  const todayStr = new Date().toISOString().split("T")[0];
  return events
    .filter(e => new Date(e.ts).toISOString().split("T")[0] === todayStr)
    .reduce((sum, e) => sum + e.amount, 0);
}

export function useXP() {
  const [store, setStore] = useState<XPStore>(loadStore);

  const addXP = useCallback((
    type: XPEvent["type"],
    label: string,
    customAmount?: number
  ) => {
    const amount = customAmount ?? XP_REWARDS[type];
    const event: XPEvent = {
      id: Math.random().toString(36).slice(2),
      type,
      amount,
      label,
      ts: Date.now(),
    };
    setStore(prev => {
      const next: XPStore = {
        totalXP: prev.totalXP + amount,
        events: [...prev.events, event],
      };
      saveStore(next);
      return next;
    });
    return amount;
  }, []);

  const totalXP = store.totalXP;
  const events = store.events;
  const levelInfo = useMemo(() => getLevelInfo(totalXP), [totalXP]);
  const todayXP = useMemo(() => getTodayXP(events), [events]);

  return {
    totalXP,
    events,
    levelInfo,
    todayXP,
    addXP,
  };
}
