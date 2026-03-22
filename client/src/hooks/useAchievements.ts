/**
 * useAchievements — Achievement Badge Wall for the Independent Study Guide
 *
 * Badges are computed from existing localStorage data — no new storage needed.
 * Categories: Coding, Behavioral, Mock Interviews, Streaks & Consistency, Milestones
 */
import { useMemo } from "react";

export interface Badge {
  id: string;
  name: string;
  description: string;
  emoji: string;
  category: "coding" | "behavioral" | "mock" | "streak" | "milestone";
  rarity: "common" | "rare" | "epic" | "legendary";
  unlocked: boolean;
  unlockedAt?: number; // Unix ms
  progress?: { current: number; target: number };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) ?? fallback;
  } catch {
    return fallback;
  }
}

function computeStreak(dates: string[]): number {
  if (!dates.length) return 0;
  const sorted = Array.from(new Set(dates)).sort().reverse();
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];
  if (sorted[0] !== today && sorted[0] !== yesterdayStr) return 0;
  let streak = 0;
  let cursor = new Date(sorted[0] + "T00:00:00");
  for (const d of sorted) {
    if (d === cursor.toISOString().split("T")[0]) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else break;
  }
  return streak;
}

// ─── Badge definitions ────────────────────────────────────────────────────────
export function computeAchievements(): Badge[] {
  // Load all data sources
  const ctciData = loadJSON<Record<number, { solved: boolean; solvedAt?: string }>>("ctci_progress_v1", {});
  const drillData = loadJSON<Record<string, { rating: number; ts: number }[]>>("meta-guide-drill-ratings", {});
  const behData = loadJSON<Record<string, { rating: number; timestamp: number }[]>>("meta-guide-practice-ratings", {});
  const streakDates = loadJSON<string[]>("meta-guide-streak-dates", []);
  const sprintHistory = loadJSON<Array<{ id: string; topic: string; totalScore: number; scores: number[]; date: number }>>("cp_sprint_history", []);
  const aiHistory = loadJSON<Array<{ id: string; verdict: string; problemSolvingScore: number; codeDevelopmentScore: number; verificationScore: number; communicationScore: number; aiToolUsageScore: number; date: string }>>("ai_mock_session_history", []);
  const sdHistory = loadJSON<Array<{ id: string; verdict: string; scores: { requirements: number; dataModel: number; api: number; scale: number; metaDepth: number }; date: number }>>("sd_mock_history_v1", []);
  const sessionLog = loadJSON<Array<{ type: string; date: string }>>("meta-guide-session-log", []);
  const xpStore = loadJSON<{ totalXP: number; events: Array<{ type: string; ts: number }> }>("meta-guide-xp-log", { totalXP: 0, events: [] });

  // Derived stats
  const ctciSolved = Object.values(ctciData).filter(p => p.solved).length;
  const drillAttempts = Object.values(drillData).reduce((s, arr) => s + arr.length, 0);
  const drillPatternsRated = Object.keys(drillData).length;
  const drillHighRatings = Object.values(drillData).filter(arr => {
    const avg = arr.reduce((s, e) => s + e.rating, 0) / arr.length;
    return avg >= 4.5;
  }).length;
  const behAttempts = Object.values(behData).reduce((s, arr) => s + arr.length, 0);
  const behHighRatings = Object.values(behData).filter(arr => {
    const latest = arr[arr.length - 1]?.rating ?? 0;
    return latest >= 4;
  }).length;
  const streak = computeStreak(streakDates);
  const sprintCount = sprintHistory.length;
  const perfectSprints = sprintHistory.filter(e => e.totalScore >= 200).length;
  const aiMockCount = aiHistory.length;
  const aiHires = aiHistory.filter(e => e.verdict === "Hire" || e.verdict === "Strong Hire").length;
  const aiStrongHires = aiHistory.filter(e => e.verdict === "Strong Hire").length;
  const sdMockCount = sdHistory.length;
  const sdHires = sdHistory.filter(e => e.verdict === "Hire" || e.verdict === "Strong Hire").length;
  const totalXP = xpStore.totalXP;

  const badges: Badge[] = [
    // ── Coding badges ──────────────────────────────────────────────────────────
    {
      id: "first_solve",
      name: "First Blood",
      description: "Solve your first CTCI problem",
      emoji: "🩸",
      category: "coding",
      rarity: "common",
      unlocked: ctciSolved >= 1,
      progress: { current: Math.min(ctciSolved, 1), target: 1 },
    },
    {
      id: "ten_solves",
      name: "Getting Warmed Up",
      description: "Solve 10 CTCI problems",
      emoji: "🔥",
      category: "coding",
      rarity: "common",
      unlocked: ctciSolved >= 10,
      progress: { current: Math.min(ctciSolved, 10), target: 10 },
    },
    {
      id: "fifty_solves",
      name: "Grind Mode",
      description: "Solve 50 CTCI problems",
      emoji: "💪",
      category: "coding",
      rarity: "rare",
      unlocked: ctciSolved >= 50,
      progress: { current: Math.min(ctciSolved, 50), target: 50 },
    },
    {
      id: "hundred_solves",
      name: "Century Club",
      description: "Solve 100 CTCI problems",
      emoji: "💯",
      category: "coding",
      rarity: "epic",
      unlocked: ctciSolved >= 100,
      progress: { current: Math.min(ctciSolved, 100), target: 100 },
    },
    {
      id: "two_fifty_solves",
      name: "Half-Way Hero",
      description: "Solve 250 CTCI problems",
      emoji: "🦸",
      category: "coding",
      rarity: "epic",
      unlocked: ctciSolved >= 250,
      progress: { current: Math.min(ctciSolved, 250), target: 250 },
    },
    {
      id: "all_solves",
      name: "CTCI Master",
      description: "Solve all 500 CTCI problems",
      emoji: "🏅",
      category: "coding",
      rarity: "legendary",
      unlocked: ctciSolved >= 500,
      progress: { current: Math.min(ctciSolved, 500), target: 500 },
    },
    {
      id: "first_drill",
      name: "Pattern Spotter",
      description: "Rate your first Quick Drill pattern",
      emoji: "🔍",
      category: "coding",
      rarity: "common",
      unlocked: drillAttempts >= 1,
      progress: { current: Math.min(drillAttempts, 1), target: 1 },
    },
    {
      id: "all_patterns_drilled",
      name: "Pattern Collector",
      description: "Rate all 14 coding patterns in Quick Drill",
      emoji: "🗂️",
      category: "coding",
      rarity: "rare",
      unlocked: drillPatternsRated >= 14,
      progress: { current: Math.min(drillPatternsRated, 14), target: 14 },
    },
    {
      id: "pattern_master",
      name: "Pattern Master",
      description: "Achieve 4.5+ average rating on 5 patterns",
      emoji: "⚡",
      category: "coding",
      rarity: "epic",
      unlocked: drillHighRatings >= 5,
      progress: { current: Math.min(drillHighRatings, 5), target: 5 },
    },
    {
      id: "first_sprint",
      name: "Sprint Starter",
      description: "Complete your first Topic Sprint",
      emoji: "🏃",
      category: "coding",
      rarity: "common",
      unlocked: sprintCount >= 1,
      progress: { current: Math.min(sprintCount, 1), target: 1 },
    },
    {
      id: "ten_sprints",
      name: "Sprint Veteran",
      description: "Complete 10 Topic Sprints",
      emoji: "🏋️",
      category: "coding",
      rarity: "rare",
      unlocked: sprintCount >= 10,
      progress: { current: Math.min(sprintCount, 10), target: 10 },
    },
    {
      id: "perfect_sprint",
      name: "Perfect Sprint",
      description: "Score 200+ points in a single Topic Sprint",
      emoji: "🎯",
      category: "coding",
      rarity: "epic",
      unlocked: perfectSprints >= 1,
      progress: { current: Math.min(perfectSprints, 1), target: 1 },
    },

    // ── Behavioral badges ──────────────────────────────────────────────────────
    {
      id: "first_behavioral",
      name: "Story Teller",
      description: "Complete your first behavioral practice session",
      emoji: "📖",
      category: "behavioral",
      rarity: "common",
      unlocked: behAttempts >= 1,
      progress: { current: Math.min(behAttempts, 1), target: 1 },
    },
    {
      id: "ten_behavioral",
      name: "STAR Practitioner",
      description: "Complete 10 behavioral practice sessions",
      emoji: "⭐",
      category: "behavioral",
      rarity: "common",
      unlocked: behAttempts >= 10,
      progress: { current: Math.min(behAttempts, 10), target: 10 },
    },
    {
      id: "behavioral_excellence",
      name: "Behavioral Excellence",
      description: "Score 4+ on 5 different behavioral questions",
      emoji: "🎤",
      category: "behavioral",
      rarity: "rare",
      unlocked: behHighRatings >= 5,
      progress: { current: Math.min(behHighRatings, 5), target: 5 },
    },

    // ── Mock Interview badges ──────────────────────────────────────────────────
    {
      id: "first_ai_mock",
      name: "AI Challenger",
      description: "Complete your first AI-Enabled Mock session",
      emoji: "🤖",
      category: "mock",
      rarity: "common",
      unlocked: aiMockCount >= 1,
      progress: { current: Math.min(aiMockCount, 1), target: 1 },
    },
    {
      id: "ai_hire",
      name: "Hire-Worthy",
      description: "Receive a Hire verdict in an AI Mock session",
      emoji: "✅",
      category: "mock",
      rarity: "rare",
      unlocked: aiHires >= 1,
      progress: { current: Math.min(aiHires, 1), target: 1 },
    },
    {
      id: "ai_strong_hire",
      name: "Strong Hire",
      description: "Receive a Strong Hire verdict in an AI Mock session",
      emoji: "🌟",
      category: "mock",
      rarity: "epic",
      unlocked: aiStrongHires >= 1,
      progress: { current: Math.min(aiStrongHires, 1), target: 1 },
    },
    {
      id: "five_ai_mocks",
      name: "Mock Veteran",
      description: "Complete 5 AI Mock sessions",
      emoji: "🎓",
      category: "mock",
      rarity: "rare",
      unlocked: aiMockCount >= 5,
      progress: { current: Math.min(aiMockCount, 5), target: 5 },
    },
    {
      id: "first_sd_mock",
      name: "System Architect",
      description: "Complete your first System Design Mock session",
      emoji: "🏗️",
      category: "mock",
      rarity: "common",
      unlocked: sdMockCount >= 1,
      progress: { current: Math.min(sdMockCount, 1), target: 1 },
    },
    {
      id: "sd_hire",
      name: "Design Approved",
      description: "Receive a Hire verdict in a System Design Mock",
      emoji: "📐",
      category: "mock",
      rarity: "rare",
      unlocked: sdHires >= 1,
      progress: { current: Math.min(sdHires, 1), target: 1 },
    },

    // ── Streak & Consistency badges ────────────────────────────────────────────
    {
      id: "streak_3",
      name: "On a Roll",
      description: "Maintain a 3-day practice streak",
      emoji: "🔥",
      category: "streak",
      rarity: "common",
      unlocked: streak >= 3,
      progress: { current: Math.min(streak, 3), target: 3 },
    },
    {
      id: "streak_7",
      name: "Week Warrior",
      description: "Maintain a 7-day practice streak",
      emoji: "📅",
      category: "streak",
      rarity: "rare",
      unlocked: streak >= 7,
      progress: { current: Math.min(streak, 7), target: 7 },
    },
    {
      id: "streak_14",
      name: "Fortnight Grinder",
      description: "Maintain a 14-day practice streak",
      emoji: "🗓️",
      category: "streak",
      rarity: "epic",
      unlocked: streak >= 14,
      progress: { current: Math.min(streak, 14), target: 14 },
    },
    {
      id: "streak_30",
      name: "Unstoppable",
      description: "Maintain a 30-day practice streak",
      emoji: "💎",
      category: "streak",
      rarity: "legendary",
      unlocked: streak >= 30,
      progress: { current: Math.min(streak, 30), target: 30 },
    },

    // ── Milestone badges ───────────────────────────────────────────────────────
    {
      id: "xp_500",
      name: "XP Earner",
      description: "Earn 500 total XP",
      emoji: "✨",
      category: "milestone",
      rarity: "common",
      unlocked: totalXP >= 500,
      progress: { current: Math.min(totalXP, 500), target: 500 },
    },
    {
      id: "xp_2000",
      name: "XP Grinder",
      description: "Earn 2,000 total XP",
      emoji: "💫",
      category: "milestone",
      rarity: "rare",
      unlocked: totalXP >= 2000,
      progress: { current: Math.min(totalXP, 2000), target: 2000 },
    },
    {
      id: "xp_5000",
      name: "XP Legend",
      description: "Earn 5,000 total XP",
      emoji: "🌠",
      category: "milestone",
      rarity: "epic",
      unlocked: totalXP >= 5000,
      progress: { current: Math.min(totalXP, 5000), target: 5000 },
    },
    {
      id: "full_stack",
      name: "Full Stack Prep",
      description: "Complete at least 1 session in Coding, Behavioral, AI Mock, and System Design",
      emoji: "🎯",
      category: "milestone",
      rarity: "epic",
      unlocked: ctciSolved >= 1 && behAttempts >= 1 && aiMockCount >= 1 && sdMockCount >= 1,
      progress: {
        current: [ctciSolved >= 1, behAttempts >= 1, aiMockCount >= 1, sdMockCount >= 1].filter(Boolean).length,
        target: 4,
      },
    },
    {
      id: "interview_ready",
      name: "Interview Ready",
      description: "Solve 50+ problems, 5+ behavioral sessions, and 1+ mock interview",
      emoji: "🚀",
      category: "milestone",
      rarity: "legendary",
      unlocked: ctciSolved >= 50 && behAttempts >= 5 && (aiMockCount >= 1 || sdMockCount >= 1),
      progress: {
        current: [ctciSolved >= 50, behAttempts >= 5, (aiMockCount >= 1 || sdMockCount >= 1)].filter(Boolean).length,
        target: 3,
      },
    },
  ];

  return badges;
}

export function useAchievements(): Badge[] {
  return useMemo(() => computeAchievements(), []);
}
