/**
 * Tests for Failure Analysis Tab data integrity and Learning Path drill sessions
 */
import { describe, it, expect } from "vitest";

// ── Failure Analysis data integrity ──────────────────────────────────────────

const FAILURE_DISTRIBUTION = [
  { category: "System Design", share: 42 },
  { category: "Coding", share: 31 },
  { category: "Behavioral", share: 27 },
];

const ALL_WEAK_SIGNAL_IDS = [
  "sd1",
  "sd2",
  "sd3",
  "sd4", // System Design
  "c1",
  "c2", // Coding
  "b1",
  "b2", // Behavioral
  "p1",
  "p2", // Process
];

const STRESS_TEST_COMPONENTS = [
  "Cache (Redis)",
  "Message Queue (Kafka)",
  "Database (MySQL/Postgres)",
];

const BEHAVIORAL_AREAS = [
  "Influence & Conflict",
  "Ownership & Ambiguity",
  "Scale & Impact",
  "Failure & Learning",
  "XFN Partnership",
];

const PERSONAS = [
  "skeptic",
  "devils-advocate",
  "detail-obsessive",
  "silent-starer",
  "friendly-trap",
];

const TOOLS_MAP_COUNT = 10;

describe("Failure Analysis Tab — data integrity", () => {
  it("failure distribution shares sum to 100%", () => {
    const total = FAILURE_DISTRIBUTION.reduce((sum, r) => sum + r.share, 0);
    expect(total).toBe(100);
  });

  it("has exactly 10 weak signal IDs (Signals 1–10)", () => {
    expect(ALL_WEAK_SIGNAL_IDS.length).toBe(10);
  });

  it("all weak signal IDs are unique", () => {
    const unique = new Set(ALL_WEAK_SIGNAL_IDS);
    expect(unique.size).toBe(ALL_WEAK_SIGNAL_IDS.length);
  });

  it("has exactly 3 stress test component categories", () => {
    expect(STRESS_TEST_COMPONENTS.length).toBe(3);
  });

  it("has exactly 5 behavioral focus areas", () => {
    expect(BEHAVIORAL_AREAS.length).toBe(5);
  });

  it("has exactly 5 interviewer personas", () => {
    expect(PERSONAS.length).toBe(5);
  });

  it("tools map has exactly 10 tools", () => {
    expect(TOOLS_MAP_COUNT).toBe(10);
  });

  it("system design is the largest failure category", () => {
    const sd = FAILURE_DISTRIBUTION.find(r => r.category === "System Design")!;
    const coding = FAILURE_DISTRIBUTION.find(r => r.category === "Coding")!;
    const behavioral = FAILURE_DISTRIBUTION.find(
      r => r.category === "Behavioral"
    )!;
    expect(sd.share).toBeGreaterThan(coding.share);
    expect(sd.share).toBeGreaterThan(behavioral.share);
  });
});

// ── Learning Path drill sessions ──────────────────────────────────────────────

const LEARNING_PATH_SESSIONS = [
  {
    week: 1,
    drills: ["requirements", "flashcards", "star-bq"],
  },
  {
    week: 2,
    drills: ["rubber-duck", "checkpoint-pacer", "behavioral-timed"],
  },
  {
    week: 3,
    drills: ["code-nav", "hallucination", "epistemic"],
  },
  {
    week: 4,
    drills: ["hallucination-2", "verbal-2", "full-mock"],
  },
];

describe("Learning Path — drill session structure", () => {
  it("has exactly 4 weekly sessions", () => {
    expect(LEARNING_PATH_SESSIONS.length).toBe(4);
  });

  it("each session has exactly 3 drills", () => {
    LEARNING_PATH_SESSIONS.forEach(session => {
      expect(session.drills.length).toBe(3);
    });
  });

  it("all drill IDs are unique across all sessions", () => {
    const allIds = LEARNING_PATH_SESSIONS.flatMap(s => s.drills);
    const unique = new Set(allIds);
    expect(unique.size).toBe(allIds.length);
  });

  it("weeks are numbered 1 through 4 in order", () => {
    LEARNING_PATH_SESSIONS.forEach((session, i) => {
      expect(session.week).toBe(i + 1);
    });
  });

  it("Week 1 includes requirements clarification drill", () => {
    const week1 = LEARNING_PATH_SESSIONS.find(s => s.week === 1)!;
    expect(week1.drills).toContain("requirements");
  });

  it("Week 4 includes full mock screening call", () => {
    const week4 = LEARNING_PATH_SESSIONS.find(s => s.week === 4)!;
    expect(week4.drills).toContain("full-mock");
  });
});

// ── Tab registration ──────────────────────────────────────────────────────────

const REGISTERED_TABS = [
  "overview",
  "coding",
  "behavioral",
  "design",
  "ai-coding",
  "ai-training",
  "ai-native",
  "learning-path",
  "failure-analysis",
];

describe("Tab registration", () => {
  it("failure-analysis tab is registered", () => {
    expect(REGISTERED_TABS).toContain("failure-analysis");
  });

  it("learning-path tab is registered", () => {
    expect(REGISTERED_TABS).toContain("learning-path");
  });

  it("has 9 total tabs", () => {
    expect(REGISTERED_TABS.length).toBe(9);
  });
});
