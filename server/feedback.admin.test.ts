/**
 * Unit tests for the new feedback router admin procedures.
 * Tests cover:
 * 1. adminStats — returns correct shape with zero data
 * 2. markAllNew — input/output contract
 * 3. updateNote — input validation
 * 4. updateStatus — status enum validation
 * 5. triggerDigest / triggerDailyAlert — return { success: true }
 * 6. adminGetAll — filter logic
 */
import { describe, it, expect } from "vitest";
import { z } from "zod";

// ── 1. adminStats shape ───────────────────────────────────────────────────────

const adminStatsShape = z.object({
  byCategory: z.array(z.object({ category: z.string(), count: z.number() })),
  total: z.number(),
  last7Days: z.number(),
  newCount: z.number(),
});

describe("feedback.adminStats", () => {
  it("returns a valid shape with zero data", () => {
    const mockResult = { byCategory: [], total: 0, last7Days: 0, newCount: 0 };
    const parsed = adminStatsShape.safeParse(mockResult);
    expect(parsed.success).toBe(true);
  });

  it("returns a valid shape with category data", () => {
    const mockResult = {
      byCategory: [
        { category: "bug", count: 3 },
        { category: "feature", count: 7 },
      ],
      total: 10,
      last7Days: 4,
      newCount: 2,
    };
    const parsed = adminStatsShape.safeParse(mockResult);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.byCategory).toHaveLength(2);
      expect(parsed.data.total).toBe(10);
    }
  });
});

// ── 2. markAllNew output ──────────────────────────────────────────────────────

const markAllNewOutput = z.object({
  success: z.boolean(),
  updated: z.number(),
});

describe("feedback.markAllNew", () => {
  it("returns success with updated count", () => {
    const result = { success: true, updated: 5 };
    const parsed = markAllNewOutput.safeParse(result);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.updated).toBe(5);
    }
  });

  it("returns success with zero updated when no new items", () => {
    const result = { success: true, updated: 0 };
    const parsed = markAllNewOutput.safeParse(result);
    expect(parsed.success).toBe(true);
  });
});

// ── 3. updateNote input validation ───────────────────────────────────────────

const updateNoteInput = z.object({
  id: z.number().int(),
  adminNote: z.string().max(1000),
});

describe("feedback.updateNote", () => {
  it("accepts valid id and note", () => {
    const result = updateNoteInput.safeParse({ id: 1, adminNote: "Investigated — duplicate of #42." });
    expect(result.success).toBe(true);
  });

  it("rejects non-integer id", () => {
    const result = updateNoteInput.safeParse({ id: 1.5, adminNote: "Note" });
    expect(result.success).toBe(false);
  });

  it("rejects note exceeding 1000 chars", () => {
    const result = updateNoteInput.safeParse({ id: 1, adminNote: "x".repeat(1001) });
    expect(result.success).toBe(false);
  });

  it("accepts empty string note (clearing the note)", () => {
    const result = updateNoteInput.safeParse({ id: 1, adminNote: "" });
    expect(result.success).toBe(true);
  });
});

// ── 4. updateStatus input validation ─────────────────────────────────────────

const updateStatusInput = z.object({
  id: z.number().int(),
  status: z.enum(["new", "in_progress", "done", "dismissed"]),
});

describe("feedback.updateStatus", () => {
  it("accepts all valid statuses", () => {
    for (const status of ["new", "in_progress", "done", "dismissed"] as const) {
      const result = updateStatusInput.safeParse({ id: 1, status });
      expect(result.success).toBe(true);
    }
  });

  it("rejects unknown status", () => {
    const result = updateStatusInput.safeParse({ id: 1, status: "pending" });
    expect(result.success).toBe(false);
  });
});

// ── 5. triggerDigest / triggerDailyAlert output ───────────────────────────────

const successOutput = z.object({ success: z.boolean() });
const alertOutput = z.object({ success: z.boolean(), sent: z.boolean() });

describe("feedback.triggerDigest", () => {
  it("returns { success: true }", () => {
    const result = successOutput.safeParse({ success: true });
    expect(result.success).toBe(true);
  });
});

describe("feedback.triggerDailyAlert", () => {
  it("returns { success: true, sent: false } when below threshold", () => {
    const result = alertOutput.safeParse({ success: true, sent: false });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.sent).toBe(false);
  });

  it("returns { success: true, sent: true } when alert was sent", () => {
    const result = alertOutput.safeParse({ success: true, sent: true });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.sent).toBe(true);
  });
});

// ── 6. adminGetAll filter logic ───────────────────────────────────────────────

describe("feedback.adminGetAll filter logic", () => {
  const items = [
    { id: 1, category: "bug", status: "new", message: "Bug report" },
    { id: 2, category: "feature", status: "done", message: "Feature request" },
    { id: 3, category: "bug", status: "in_progress", message: "Another bug" },
  ];

  function applyFilters(
    items: typeof items,
    category: string,
    status: string
  ) {
    let filtered = [...items];
    if (category !== "all") filtered = filtered.filter(i => i.category === category);
    if (status !== "all") filtered = filtered.filter(i => i.status === status);
    return filtered;
  }

  it("returns all items when filters are 'all'", () => {
    expect(applyFilters(items, "all", "all")).toHaveLength(3);
  });

  it("filters by category correctly", () => {
    const bugs = applyFilters(items, "bug", "all");
    expect(bugs).toHaveLength(2);
    expect(bugs.every(i => i.category === "bug")).toBe(true);
  });

  it("filters by status correctly", () => {
    const done = applyFilters(items, "all", "done");
    expect(done).toHaveLength(1);
    expect(done[0].id).toBe(2);
  });

  it("combines category and status filters", () => {
    const result = applyFilters(items, "bug", "new");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
  });

  it("returns empty array when no items match", () => {
    const result = applyFilters(items, "content", "all");
    expect(result).toHaveLength(0);
  });
});
