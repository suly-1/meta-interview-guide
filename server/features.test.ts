/**
 * Unit tests for the three new features:
 * 1. behavioral.score procedure input validation
 * 2. CTCIExport notes cheat sheet generation logic
 * 3. ReadinessGoalSetter date/task calculation helpers
 */
import { describe, it, expect } from "vitest";
import { z } from "zod";

// ─── 1. Behavioral Score Input Schema ───────────────────────────────────────
const behavioralScoreInput = z.object({
  answer: z.string().min(10, "Answer must be at least 10 characters"),
  question: z.string().optional(),
  targetLevel: z.enum(["L6", "L7"]).default("L6"),
});

describe("behavioral.score input validation", () => {
  it("accepts a valid L6 answer", () => {
    const result = behavioralScoreInput.safeParse({
      answer: "This is a valid STAR answer with more than 10 characters.",
      targetLevel: "L6",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a valid L7 answer with optional question", () => {
    const result = behavioralScoreInput.safeParse({
      answer: "Led a cross-functional initiative that reduced latency by 40%.",
      question: "Tell me about a time you drove a major technical initiative.",
      targetLevel: "L7",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an answer shorter than 10 characters", () => {
    const result = behavioralScoreInput.safeParse({
      answer: "Short",
      targetLevel: "L6",
    });
    // Zod should reject because 'Short' has 5 chars, min is 10
    expect(result.success).toBe(false);
  });

  it("rejects an invalid target level", () => {
    const result = behavioralScoreInput.safeParse({
      answer: "A valid answer that is long enough.",
      targetLevel: "L5",
    });
    expect(result.success).toBe(false);
  });

  it("defaults targetLevel to L6 when not provided", () => {
    const result = behavioralScoreInput.safeParse({
      answer: "A valid answer that is long enough.",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.targetLevel).toBe("L6");
    }
  });
});

// ─── 2. Notes Cheat Sheet Generation Logic ──────────────────────────────────
// Mirror the grouping logic from CTCIExport
function groupByTopic(
  problems: Array<{ id: number; name: string; topic: string; difficulty: string; url: string }>,
  progress: Record<number, { solved?: boolean; starred?: boolean; notes?: string; solvedAt?: string }>
) {
  const withNotes = problems.filter(p => progress[p.id]?.notes?.trim());
  const byTopic: Record<string, typeof withNotes> = {};
  for (const p of withNotes) {
    if (!byTopic[p.topic]) byTopic[p.topic] = [];
    byTopic[p.topic].push(p);
  }
  return { withNotes, byTopic };
}

const sampleProblems = [
  { id: 1, name: "Two Sum", topic: "Arrays", difficulty: "Easy", url: "https://leetcode.com/problems/two-sum/" },
  { id: 2, name: "Longest Substring", topic: "Strings", difficulty: "Medium", url: "https://leetcode.com/problems/longest-substring-without-repeating-characters/" },
  { id: 3, name: "Binary Search", topic: "Arrays", difficulty: "Easy", url: "https://leetcode.com/problems/binary-search/" },
  { id: 4, name: "Merge Intervals", topic: "Arrays", difficulty: "Medium", url: "https://leetcode.com/problems/merge-intervals/" },
];

describe("CTCIExport notes cheat sheet grouping", () => {
  it("returns empty groups when no problems have notes", () => {
    const progress = {
      1: { solved: true, notes: "" },
      2: { solved: false, notes: "   " }, // whitespace only
    };
    const { withNotes, byTopic } = groupByTopic(sampleProblems, progress);
    expect(withNotes).toHaveLength(0);
    expect(Object.keys(byTopic)).toHaveLength(0);
  });

  it("groups problems with notes by topic", () => {
    const progress = {
      1: { solved: true, notes: "Use hashmap for O(n) lookup" },
      2: { solved: false, notes: "Sliding window approach" },
      3: { solved: true, notes: "Classic binary search template" },
    };
    const { withNotes, byTopic } = groupByTopic(sampleProblems, progress);
    expect(withNotes).toHaveLength(3);
    expect(byTopic["Arrays"]).toHaveLength(2); // Two Sum + Binary Search
    expect(byTopic["Strings"]).toHaveLength(1); // Longest Substring
  });

  it("excludes problems without notes from the cheat sheet", () => {
    const progress = {
      1: { solved: true, notes: "Use hashmap" },
      2: { solved: true, notes: "" }, // no notes
      3: { solved: false, notes: undefined }, // no notes
      4: { solved: true, notes: "Sort then merge" },
    };
    const { withNotes } = groupByTopic(sampleProblems, progress);
    expect(withNotes).toHaveLength(2);
    expect(withNotes.map(p => p.id)).toEqual([1, 4]);
  });

  it("handles problems with no progress entry", () => {
    const progress = {
      1: { solved: true, notes: "Use hashmap" },
      // 2, 3, 4 have no progress entry
    };
    const { withNotes } = groupByTopic(sampleProblems, progress);
    expect(withNotes).toHaveLength(1);
  });
});

// ─── 3. ReadinessGoalSetter Date Helpers ────────────────────────────────────
function getDaysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function generateDailyTasks(currentScore: number, targetScore: number, daysLeft: number): string[] {
  const gap = Math.max(0, targetScore - currentScore);
  if (daysLeft <= 0) return ["Your interview date has passed — review your notes and stay confident!"];
  if (gap === 0) return ["You've hit your target! Keep practicing to maintain your edge."];
  if (daysLeft >= 30) return ["Solve CTCI problems (focus on your weakest topic).", "Study pattern cards using Teach It Back mode."];
  if (daysLeft >= 14) return ["Solve CTCI problems — prioritize Medium difficulty.", "Do 1 full timed mock coding session."];
  if (daysLeft >= 7) return ["Do 1 full timed mock coding session — simulate interview conditions.", "Review all starred CTCI problems."];
  return ["Light review only — do 2–3 easy/medium problems to stay warm.", "Re-read your STAR stories and say them out loud."];
}

describe("ReadinessGoalSetter date helpers", () => {
  it("getDaysUntil returns positive number for future date", () => {
    const future = new Date();
    future.setDate(future.getDate() + 30);
    const dateStr = future.toISOString().split("T")[0];
    const days = getDaysUntil(dateStr);
    expect(days).toBeGreaterThan(0);
    expect(days).toBeLessThanOrEqual(31);
  });

  it("getDaysUntil returns 0 or negative for past date", () => {
    const past = new Date();
    past.setDate(past.getDate() - 5);
    const dateStr = past.toISOString().split("T")[0];
    const days = getDaysUntil(dateStr);
    expect(days).toBeLessThanOrEqual(0);
  });

  it("generateDailyTasks returns past-interview message when daysLeft <= 0", () => {
    const tasks = generateDailyTasks(60, 80, 0);
    expect(tasks[0]).toContain("passed");
  });

  it("generateDailyTasks returns on-target message when gap is 0", () => {
    const tasks = generateDailyTasks(80, 80, 10);
    expect(tasks[0]).toContain("target");
  });

  it("generateDailyTasks returns long-term tasks for 30+ days", () => {
    const tasks = generateDailyTasks(30, 80, 45);
    expect(tasks.length).toBeGreaterThan(0);
    expect(tasks[0]).toContain("CTCI");
  });

  it("generateDailyTasks returns final-week tasks for 7 days", () => {
    const tasks = generateDailyTasks(50, 80, 5);
    expect(tasks[0]).toContain("Light review");
  });
});
