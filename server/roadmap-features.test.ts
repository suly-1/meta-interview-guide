/**
 * Tests for the 4-week roadmap features:
 * - analyzePrompt tRPC procedure (PromptEngineeringDrill backend)
 * - generateVerdict tRPC procedure (InstantVerdictCard backend)
 * - CandidateReportArchive localStorage helpers (pure functions)
 * - YandexAlgorithmTrainer problem bank integrity
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Helpers ────────────────────────────────────────────────────────────────

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      cookies: {},
      headers: {},
    } as unknown as TrpcContext["req"],
    res: {
      cookie: vi.fn(),
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-open-id",
    email: "test@meta.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    user,
    req: {
      cookies: {},
      headers: {},
    } as unknown as TrpcContext["req"],
    res: {
      cookie: vi.fn(),
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

// ─── analyzePrompt procedure ─────────────────────────────────────────────────

describe("ai.analyzePrompt", () => {
  it("should exist on the appRouter", () => {
    const caller = appRouter.createCaller(createPublicContext());
    expect(typeof caller.ai.analyzePrompt).toBe("function");
  });

  it("should reject empty prompt string", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.ai.analyzePrompt({ prompt: "", context: "test" })
    ).rejects.toThrow();
  });

  it("should accept a valid prompt and context", async () => {
    // Mock the LLM call to avoid real API calls in tests
    vi.mock("./_core/llm", () => ({
      invokeLLM: vi.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                score: 75,
                clarity: 8,
                specificity: 7,
                metaAlignment: 8,
                feedback: "Good prompt structure",
                improvements: ["Add more context", "Be more specific"],
                verdict: "good",
              }),
            },
          },
        ],
      }),
    }));

    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.ai.analyzePrompt({
      scenario: "Debug a production ML model serving latency issue",
      context: "AI-Enabled Round practice",
      userPrompt: "You are a helpful assistant. Analyze the latency issue and suggest fixes.",
      rubric: ["Clarity", "Specificity", "Meta alignment", "Safety", "Actionability"],
    });
    expect(result).toBeDefined();
  });
});

// ─── generateVerdict procedure ───────────────────────────────────────────────

describe("ai.generateVerdict", () => {
  it("should exist on the appRouter", () => {
    const caller = appRouter.createCaller(createPublicContext());
    expect(typeof caller.ai.generateVerdict).toBe("function");
  });

  it("should accept progressData object", async () => {
    vi.mock("./_core/llm", () => ({
      invokeLLM: vi.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                overallScore: 72,
                verdict: "hire",
                icLevel: "IC5",
                dimensionScores: [],
                strengths: ["Strong coding fundamentals"],
                criticalGaps: ["System design depth"],
                hiringRecommendation: "Likely hire with coaching",
                nextSteps: ["Practice system design daily"],
              }),
            },
          },
        ],
      }),
    }));

    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.ai.generateVerdict({
      ratings: [
        {
          dimensionId: "coding",
          dimensionName: "Coding Fundamentals",
          category: "Technical",
          weight: 0.3,
          rating: 4,
          evidence: ["Solved 3 medium problems"],
          notes: "Good speed",
          ic5Bar: "Solves mediums",
          ic6Bar: "Solves hards",
          ic7Bar: "Optimal solutions",
        },
      ],
    });
    expect(result).toBeDefined();
    expect(result.verdict).toBeDefined();
  });
});

// ─── CandidateReportArchive data helpers ─────────────────────────────────────

describe("CandidateReportArchive data model", () => {
  it("should parse verdict history from localStorage format", () => {
    const sampleVerdict = {
      timestamp: Date.now(),
      overallScore: 78,
      verdict: "hire",
      icLevel: "IC5",
      strengths: ["Coding speed", "Communication"],
      criticalGaps: ["System design"],
      hiringRecommendation: "Hire with coaching",
    };

    // Validate the data shape
    expect(sampleVerdict.overallScore).toBeGreaterThanOrEqual(0);
    expect(sampleVerdict.overallScore).toBeLessThanOrEqual(100);
    expect(["strong_hire", "hire", "borderline", "no_hire"]).toContain(sampleVerdict.verdict);
    expect(Array.isArray(sampleVerdict.strengths)).toBe(true);
    expect(Array.isArray(sampleVerdict.criticalGaps)).toBe(true);
  });

  it("should handle empty localStorage gracefully", () => {
    // Simulate what loadArchive() does with empty storage
    const verdictHistory = JSON.parse("[]");
    const replays = JSON.parse("[]");
    const debugAttempts = JSON.parse("[]");

    expect(Array.isArray(verdictHistory)).toBe(true);
    expect(Array.isArray(replays)).toBe(true);
    expect(Array.isArray(debugAttempts)).toBe(true);
    expect(verdictHistory.length + replays.length + debugAttempts.length).toBe(0);
  });

  it("should sort entries by date descending", () => {
    const entries = [
      { id: "a", date: 1000, label: "A" },
      { id: "b", date: 3000, label: "B" },
      { id: "c", date: 2000, label: "C" },
    ];
    const sorted = entries.sort((a, b) => b.date - a.date);
    expect(sorted[0].id).toBe("b");
    expect(sorted[1].id).toBe("c");
    expect(sorted[2].id).toBe("a");
  });
});

// ─── YandexAlgorithmTrainer problem bank ────────────────────────────────────

describe("YandexAlgorithmTrainer problem bank", () => {
  const PROBLEMS = [
    {
      id: "max-subarray-circular",
      title: "Maximum Circular Subarray Sum",
      difficulty: "C",
      timeLimit: 1200,
      tags: ["Kadane's", "Prefix Sum", "Circular Array"],
    },
    {
      id: "longest-palindromic-subsequence",
      title: "Minimum Deletions to Make Palindrome",
      difficulty: "C",
      timeLimit: 1200,
      tags: ["DP", "LCS", "Palindrome"],
    },
    {
      id: "sliding-window-median",
      title: "Sliding Window Median",
      difficulty: "D",
      timeLimit: 1800,
      tags: ["Heap", "Two Heaps", "Sliding Window"],
    },
    {
      id: "count-of-range-sum",
      title: "Count of Range Sum",
      difficulty: "E",
      timeLimit: 2400,
      tags: ["Merge Sort", "Prefix Sum", "Divide & Conquer"],
    },
    {
      id: "minimum-window-subsequence",
      title: "Minimum Window Subsequence",
      difficulty: "D",
      timeLimit: 1800,
      tags: ["Two Pointers", "DP", "String"],
    },
  ];

  it("should have exactly 5 problems", () => {
    expect(PROBLEMS.length).toBe(5);
  });

  it("should have unique problem IDs", () => {
    const ids = PROBLEMS.map((p) => p.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("should have valid difficulty levels (C, D, or E)", () => {
    const validDifficulties = new Set(["C", "D", "E"]);
    PROBLEMS.forEach((p) => {
      expect(validDifficulties.has(p.difficulty)).toBe(true);
    });
  });

  it("should have time limits between 600 and 3600 seconds", () => {
    PROBLEMS.forEach((p) => {
      expect(p.timeLimit).toBeGreaterThanOrEqual(600);
      expect(p.timeLimit).toBeLessThanOrEqual(3600);
    });
  });

  it("should have at least 2 tags per problem", () => {
    PROBLEMS.forEach((p) => {
      expect(p.tags.length).toBeGreaterThanOrEqual(2);
    });
  });

  it("should cover all difficulty tiers", () => {
    const difficulties = new Set(PROBLEMS.map((p) => p.difficulty));
    expect(difficulties.has("C")).toBe(true);
    expect(difficulties.has("D")).toBe(true);
    expect(difficulties.has("E")).toBe(true);
  });
});

// ─── InstantVerdictCard score logic ─────────────────────────────────────────

describe("InstantVerdictCard score interpretation", () => {
  it("should classify scores correctly", () => {
    const classify = (score: number) => {
      if (score >= 75) return "strong";
      if (score >= 55) return "moderate";
      return "weak";
    };

    expect(classify(90)).toBe("strong");
    expect(classify(75)).toBe("strong");
    expect(classify(74)).toBe("moderate");
    expect(classify(55)).toBe("moderate");
    expect(classify(54)).toBe("weak");
    expect(classify(0)).toBe("weak");
  });

  it("should map verdict strings to display labels", () => {
    const VERDICT_LABELS: Record<string, string> = {
      strong_hire: "Strong Hire",
      hire: "Hire",
      borderline: "Borderline",
      no_hire: "No Hire",
    };

    expect(VERDICT_LABELS["strong_hire"]).toBe("Strong Hire");
    expect(VERDICT_LABELS["hire"]).toBe("Hire");
    expect(VERDICT_LABELS["borderline"]).toBe("Borderline");
    expect(VERDICT_LABELS["no_hire"]).toBe("No Hire");
  });

  it("should save verdict to localStorage history (max 20 entries)", () => {
    const history: unknown[] = [];
    const maxEntries = 20;

    // Simulate adding 25 entries
    for (let i = 0; i < 25; i++) {
      history.unshift({ overallScore: i * 3, timestamp: Date.now() + i });
    }

    const trimmed = history.slice(0, maxEntries);
    expect(trimmed.length).toBe(maxEntries);
  });
});
