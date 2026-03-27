/**
 * engagement.ts
 *
 * tRPC router covering all 7 engagement / addictiveness features:
 *   1. Daily Interview Challenge
 *   2. Streak System with Stakes
 *   3. Boss Fight
 *   4. Comeback Arc
 *   5. Adaptive Difficulty Engine
 *   6. Live Typing Pressure
 *   7. Interview Seasons
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { invokeLLM } from "../_core/llm";
import {
  dailyChallengeSubmissions,
  userStreaks,
  bossFightSessions,
  comebackArcPlans,
  adaptiveDifficultyState,
  interviewSeasons,
  seasonScores,
} from "../../drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function todayKey(): string {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

/** Deterministic daily question seeded from date string */
function getDailyQuestion(
  dateKey: string,
  category: "system-design" | "coding" | "behavioral"
) {
  const seed = dateKey.replace(/-/g, "");
  const idx = parseInt(seed) % QUESTION_BANK[category].length;
  return QUESTION_BANK[category][idx];
}

const QUESTION_BANK = {
  "system-design": [
    {
      id: "sd-1",
      title: "Design a Real-Time Feed Ranking Service",
      prompt:
        "Design a system that ranks and serves a personalized news feed for 500M DAU. The feed must update in near real-time as new posts arrive. Focus on: data ingestion pipeline, ranking model serving, caching strategy, and fan-out approach.",
    },
    {
      id: "sd-2",
      title: "Design a Distributed Rate Limiter",
      prompt:
        "Design a rate limiter that enforces per-user, per-endpoint limits across a fleet of 10,000 API servers. Must handle 2M RPS globally with <5ms added latency. Discuss consistency trade-offs and failure modes.",
    },
    {
      id: "sd-3",
      title: "Design a Notification Delivery System",
      prompt:
        "Design a system that delivers push, email, and in-app notifications to 1B users. Must handle burst traffic (viral events), deduplication, user preferences, and delivery guarantees. Discuss at-least-once vs exactly-once delivery.",
    },
    {
      id: "sd-4",
      title: "Design a Distributed Cache Layer",
      prompt:
        "Design a caching layer for a social graph service with 2B edges. Must support sub-10ms reads, handle hot keys (celebrity accounts), and maintain consistency with the source of truth DB. Discuss eviction policies and cache invalidation strategies.",
    },
    {
      id: "sd-5",
      title: "Design a Video Upload and Processing Pipeline",
      prompt:
        "Design the backend pipeline for uploading and processing user videos (up to 4K, 60min). Must handle 100K concurrent uploads, transcode to multiple formats, and serve via CDN. Discuss storage, job queuing, and failure recovery.",
    },
    {
      id: "sd-6",
      title: "Design a Search Autocomplete Service",
      prompt:
        "Design a search autocomplete service that suggests queries as users type. Must return results in <50ms for 500M DAU, handle trending queries, and personalize suggestions. Discuss trie vs inverted index trade-offs.",
    },
    {
      id: "sd-7",
      title: "Design a Distributed Task Queue",
      prompt:
        "Design a distributed task queue that supports delayed execution, priority queues, and at-least-once delivery for 10M tasks/day. Must handle worker failures gracefully. Compare Kafka, SQS, and custom approaches.",
    },
  ],
  coding: [
    {
      id: "c-1",
      title: "LRU Cache with O(1) Operations",
      prompt:
        "Implement an LRU (Least Recently Used) cache with O(1) get and put operations. Then extend it to support a TTL (time-to-live) per entry. Walk through your data structure choices and edge cases.",
    },
    {
      id: "c-2",
      title: "Serialize and Deserialize a Binary Tree",
      prompt:
        "Design an algorithm to serialize a binary tree to a string and deserialize it back. Your solution must handle null nodes, duplicate values, and be space-efficient. Analyze time and space complexity.",
    },
    {
      id: "c-3",
      title: "Find All Paths in a Weighted Graph",
      prompt:
        "Given a directed weighted graph, find all paths from source to destination with total weight less than K. Then optimize for the case where the graph has 10M nodes. Discuss BFS vs DFS trade-offs and memoization opportunities.",
    },
    {
      id: "c-4",
      title: "Design a Thread-Safe Bounded Queue",
      prompt:
        "Implement a thread-safe bounded blocking queue in your language of choice. Support multiple producers and consumers. Handle the case where producers should block when the queue is full and consumers should block when it is empty.",
    },
    {
      id: "c-5",
      title: "Merge K Sorted Streams",
      prompt:
        "Given K sorted streams (potentially infinite), merge them into a single sorted output stream. Optimize for the case where K=10,000 streams and each stream produces 1M elements. Discuss heap vs merge sort approaches.",
    },
    {
      id: "c-6",
      title: "Implement a Consistent Hash Ring",
      prompt:
        "Implement a consistent hash ring that distributes keys across N nodes with minimal remapping when nodes are added or removed. Support virtual nodes for better distribution. Analyze the distribution quality.",
    },
    {
      id: "c-7",
      title: "Rate Limiter with Sliding Window",
      prompt:
        "Implement a rate limiter using the sliding window algorithm that allows N requests per M seconds per user. Must be thread-safe and memory-efficient for 10M concurrent users. Compare with token bucket and fixed window approaches.",
    },
  ],
  behavioral: [
    {
      id: "b-1",
      title: "Influence Without Authority",
      prompt:
        "Tell me about a time you drove a significant technical decision that required buy-in from multiple teams who did not report to you. How did you build consensus? What happened when someone disagreed? What would you do differently?",
    },
    {
      id: "b-2",
      title: "Navigating Ambiguity at Scale",
      prompt:
        "Describe a project where the requirements were fundamentally unclear and changed significantly mid-execution. How did you scope the work, manage stakeholder expectations, and deliver despite the ambiguity? What signals told you when to push back vs adapt?",
    },
    {
      id: "b-3",
      title: "Technical Failure and Recovery",
      prompt:
        "Tell me about the most significant production incident you were responsible for. Walk me through the timeline, your decision-making under pressure, how you communicated with stakeholders, and what systemic changes you made afterward.",
    },
    {
      id: "b-4",
      title: "Raising the Bar on Quality",
      prompt:
        "Give me an example of a time you identified a quality or reliability problem that others had accepted as normal. How did you make the case for fixing it? What resistance did you face? What was the measurable outcome?",
    },
    {
      id: "b-5",
      title: "Cross-Functional Conflict Resolution",
      prompt:
        "Describe a situation where you had a significant disagreement with a PM or designer about the right technical approach. How did you handle it? Did you ultimately get your way? Looking back, were you right?",
    },
    {
      id: "b-6",
      title: "Mentoring and Growing Others",
      prompt:
        "Tell me about an engineer you mentored who grew significantly under your guidance. What was your approach? What was the hardest part of the mentoring relationship? How did you measure their growth?",
    },
    {
      id: "b-7",
      title: "Delivering Under Pressure",
      prompt:
        "Describe a time when you had to deliver a critical project with an immovable deadline and insufficient resources. How did you prioritize? What did you cut? How did you communicate trade-offs to leadership?",
    },
  ],
};

// ─── Daily Challenge ──────────────────────────────────────────────────────────

export const engagementRouter = router({
  // Get today's three questions (one per category)
  getDailyChallenge: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const dateKey = todayKey();
    const userId = ctx.user.id;

    const sdQ = getDailyQuestion(dateKey, "system-design");
    const codingQ = getDailyQuestion(dateKey, "coding");
    const behavioralQ = getDailyQuestion(dateKey, "behavioral");

    // Check which categories the user has already submitted today
    const existing = await db
      .select({
        category: dailyChallengeSubmissions.category,
        score: dailyChallengeSubmissions.score,
      })
      .from(dailyChallengeSubmissions)
      .where(
        and(
          eq(dailyChallengeSubmissions.userId, userId),
          eq(dailyChallengeSubmissions.dateKey, dateKey)
        )
      );

    const submitted = Object.fromEntries(
      existing.map((r: { category: string; score: number }) => [
        r.category,
        r.score,
      ])
    );

    // Get leaderboard for today (top 10 per category, anonymized)
    const leaderboard = await db
      .select({
        category: dailyChallengeSubmissions.category,
        score: dailyChallengeSubmissions.score,
        rank: sql<number>`RANK() OVER (PARTITION BY ${dailyChallengeSubmissions.category} ORDER BY ${dailyChallengeSubmissions.score} DESC)`,
      })
      .from(dailyChallengeSubmissions)
      .where(eq(dailyChallengeSubmissions.dateKey, dateKey))
      .orderBy(desc(dailyChallengeSubmissions.score))
      .limit(30);

    return {
      dateKey,
      questions: {
        "system-design": sdQ,
        coding: codingQ,
        behavioral: behavioralQ,
      },
      submitted,
      leaderboard,
    };
  }),

  // Submit an answer for today's challenge
  submitDailyChallenge: protectedProcedure
    .input(
      z.object({
        category: z.enum(["system-design", "coding", "behavioral"]),
        answer: z.string().min(50).max(8000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const userId = ctx.user.id;
      const dateKey = todayKey();

      // Check not already submitted
      const existing = await db
        .select({ id: dailyChallengeSubmissions.id })
        .from(dailyChallengeSubmissions)
        .where(
          and(
            eq(dailyChallengeSubmissions.userId, userId),
            eq(dailyChallengeSubmissions.dateKey, dateKey),
            eq(dailyChallengeSubmissions.category, input.category)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        throw new Error("Already submitted for this category today");
      }

      const question = getDailyQuestion(
        dateKey,
        input.category as "system-design" | "coding" | "behavioral"
      );

      // AI scoring
      const scoringPrompt =
        input.category === "system-design"
          ? `You are a Meta L7 system design interviewer. Score this candidate answer for the question: "${question.title}"\n\nQuestion: ${question.prompt}\n\nCandidate Answer: ${input.answer}\n\nScore from 0-100 based on: NFR coverage (20pts), architecture quality (25pts), scalability (25pts), trade-off reasoning (20pts), communication clarity (10pts). Return JSON: { "score": number, "feedback": "2-3 sentence specific feedback mentioning what was strong and what was missing" }`
          : input.category === "coding"
            ? `You are a Meta L7 coding interviewer. Score this candidate answer for: "${question.title}"\n\nQuestion: ${question.prompt}\n\nCandidate Answer: ${input.answer}\n\nScore from 0-100 based on: correctness (30pts), time complexity (25pts), space complexity (15pts), edge cases (20pts), code clarity (10pts). Return JSON: { "score": number, "feedback": "2-3 sentence specific feedback" }`
            : `You are a Meta L7 behavioral interviewer. Score this STAR answer for: "${question.title}"\n\nQuestion: ${question.prompt}\n\nCandidate Answer: ${input.answer}\n\nScore from 0-100 based on: specificity (25pts), impact/scale (25pts), ownership signals (25pts), L6+ level indicators (25pts). Return JSON: { "score": number, "feedback": "2-3 sentence specific feedback" }`;

      let score = 0;
      let feedback = "Submission recorded.";

      try {
        const result = await invokeLLM({
          messages: [{ role: "user", content: scoringPrompt }],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "daily_score",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  score: { type: "integer" },
                  feedback: { type: "string" },
                },
                required: ["score", "feedback"],
                additionalProperties: false,
              },
            },
          },
        });
        const parsed = JSON.parse(result.choices[0].message.content as string);
        score = Math.min(100, Math.max(0, parsed.score));
        feedback = parsed.feedback;
      } catch {
        score = 50;
        feedback =
          "Your answer was recorded. AI scoring temporarily unavailable.";
      }

      await db.insert(dailyChallengeSubmissions).values({
        userId,
        dateKey,
        category: input.category,
        questionId: question.id,
        answer: input.answer,
        score,
        feedback,
      });

      // Update streak
      await updateStreak(userId);

      // Update season score if active season
      await updateSeasonScore(userId, input.category, score);

      return { score, feedback };
    }),

  // Get daily leaderboard for a specific date
  getDailyLeaderboard: protectedProcedure
    .input(z.object({ dateKey: z.string().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const dateKey = input.dateKey ?? todayKey();
      const rows = await db
        .select({
          category: dailyChallengeSubmissions.category,
          score: dailyChallengeSubmissions.score,
        })
        .from(dailyChallengeSubmissions)
        .where(eq(dailyChallengeSubmissions.dateKey, dateKey))
        .orderBy(desc(dailyChallengeSubmissions.score));

      // Group by category, anonymize, rank
      const grouped: Record<
        string,
        Array<{ rank: number; score: number; isYou?: boolean }>
      > = {};
      for (const row of rows) {
        if (!grouped[row.category]) grouped[row.category] = [];
        grouped[row.category].push({
          rank: grouped[row.category].length + 1,
          score: row.score,
        });
      }
      return grouped;
    }),

  // ─── Streak System ──────────────────────────────────────────────────────────

  getStreak: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const userId = ctx.user.id;
    const rows = await db
      .select()
      .from(userStreaks)
      .where(eq(userStreaks.userId, userId))
      .limit(1);

    if (rows.length === 0) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: null,
        hardModeUnlocked: false,
        bossFightUnlocked: false,
        atRisk: false,
      };
    }

    const streak = rows[0];
    const today = todayKey();
    const yesterday = new Date(Date.now() - 86400000)
      .toISOString()
      .slice(0, 10);

    // Check if streak is at risk (active today but haven't practiced yet)
    const atRisk = streak.lastActivityDate === yesterday;

    return {
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      lastActivityDate: streak.lastActivityDate,
      hardModeUnlocked: streak.hardModeUnlocked,
      bossFightUnlocked: streak.bossFightUnlocked,
      atRisk,
    };
  }),

  // Record a practice activity (called by any drill on completion)
  recordActivity: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await updateStreak(ctx.user.id);
    return { success: true };
  }),

  // ─── Boss Fight ─────────────────────────────────────────────────────────────

  startBossFight: protectedProcedure
    .input(z.object({ topic: z.string().min(10).max(200) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      // Check unlock status
      const streakRows = await db
        .select({ bossFightUnlocked: userStreaks.bossFightUnlocked })
        .from(userStreaks)
        .where(eq(userStreaks.userId, ctx.user.id))
        .limit(1);

      // Allow if unlocked OR if they've completed enough drills (graceful fallback)
      const unlocked =
        streakRows.length === 0 || streakRows[0].bossFightUnlocked;

      const openingMessage = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are "The Architect" — a legendary Meta L7 interviewer known for being brilliant, demanding, and occasionally terrifying. You combine 5 interviewer archetypes simultaneously:
1. The Skeptic: You challenge every assumption
2. The Devil's Advocate: You argue the opposite of whatever the candidate says
3. The Interruptor: You cut candidates off mid-sentence to probe deeper
4. The Scope Creep: You add new requirements mid-design
5. The Silent Skeptic: You sometimes respond with just "Hmm." or "Interesting." and wait

This is a 45-minute Boss Fight mock interview. The candidate's topic is: "${input.topic}"

Start with a brief, intimidating introduction as The Architect, then ask your opening question. Be specific, demanding, and use technical depth. Do NOT be friendly or encouraging. This is the hardest interview of their life.`,
          },
          { role: "user", content: "Begin the interview." },
        ],
      });

      return {
        unlocked,
        opening: openingMessage.choices[0].message.content,
        sessionStarted: true,
      };
    }),

  continueBossFight: protectedProcedure
    .input(
      z.object({
        transcript: z.array(
          z.object({
            role: z.enum(["architect", "candidate"]),
            content: z.string(),
            timestamp: z.number(),
            personaMode: z.string().optional(),
          })
        ),
        candidateResponse: z.string().min(1).max(5000),
        elapsedMinutes: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const turnNumber =
        input.transcript.filter(t => t.role === "candidate").length + 1;

      // Rotate persona modes to keep it unpredictable
      const personas = [
        "skeptic",
        "devil-advocate",
        "interruptor",
        "scope-creep",
        "silent-skeptic",
      ];
      const personaMode = personas[turnNumber % personas.length];

      const personaInstructions: Record<string, string> = {
        skeptic:
          "Be deeply skeptical of their last answer. Challenge their assumptions with specific technical counter-examples.",
        "devil-advocate":
          "Argue the complete opposite of what they just said. Make a strong case for the alternative approach.",
        interruptor:
          "Cut them off mid-thought (reference something specific they said) and demand they clarify a specific technical detail before continuing.",
        "scope-creep":
          "Add a new requirement that complicates their current design significantly. Be matter-of-fact about it, as if it was always obvious.",
        "silent-skeptic":
          "Respond with exactly one of these: 'Hmm.', 'Interesting.', or 'Go on.' Then ask one devastatingly specific follow-up question.",
      };

      const conversationHistory = input.transcript.map(t => ({
        role:
          t.role === "architect" ? ("assistant" as const) : ("user" as const),
        content: t.content,
      }));

      conversationHistory.push({
        role: "user",
        content: input.candidateResponse,
      });

      const timeWarning =
        input.elapsedMinutes >= 35
          ? " NOTE: Only 10 minutes remain. Increase pressure. Ask for final trade-off decisions."
          : input.elapsedMinutes >= 20
            ? " NOTE: You are halfway through. The candidate should be wrapping up their design."
            : "";

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are "The Architect" — the most demanding Meta L7 interviewer. Current persona mode: ${personaMode}. ${personaInstructions[personaMode]}${timeWarning} Keep responses under 150 words. Be specific, technical, and relentless.`,
          },
          ...conversationHistory,
        ],
      });

      return {
        architectResponse: response.choices[0].message.content,
        personaMode,
        turnNumber,
      };
    }),

  finishBossFight: protectedProcedure
    .input(
      z.object({
        transcript: z.array(
          z.object({
            role: z.enum(["architect", "candidate"]),
            content: z.string(),
            timestamp: z.number(),
            personaMode: z.string().optional(),
            score: z.number().optional(),
          })
        ),
        topic: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const candidateResponses = input.transcript
        .filter(t => t.role === "candidate")
        .map(t => t.content)
        .join("\n\n---\n\n");

      const scoringResult = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a Meta L7 calibration panel scoring a Boss Fight mock interview on topic: "${input.topic}". Score the candidate's overall performance across 5 dimensions (0-100 each). Then determine their level readiness verdict.`,
          },
          {
            role: "user",
            content: `Candidate responses:\n\n${candidateResponses}\n\nReturn JSON with: { "systemDesign": number, "coding": number, "behavioral": number, "resilience": number, "communication": number, "verdict": "L5"|"L6"|"L7"|"L7+", "overallScore": number, "summaryFeedback": "3-4 sentence honest assessment" }`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "boss_fight_score",
            strict: true,
            schema: {
              type: "object",
              properties: {
                systemDesign: { type: "integer" },
                coding: { type: "integer" },
                behavioral: { type: "integer" },
                resilience: { type: "integer" },
                communication: { type: "integer" },
                verdict: { type: "string" },
                overallScore: { type: "integer" },
                summaryFeedback: { type: "string" },
              },
              required: [
                "systemDesign",
                "coding",
                "behavioral",
                "resilience",
                "communication",
                "verdict",
                "overallScore",
                "summaryFeedback",
              ],
              additionalProperties: false,
            },
          },
        },
      });

      const scores = JSON.parse(
        scoringResult.choices[0].message.content as string
      );

      await db.insert(bossFightSessions).values({
        userId: ctx.user.id,
        verdict: scores.verdict,
        overallScore: scores.overallScore,
        transcript: input.transcript,
        scoreBreakdown: {
          systemDesign: scores.systemDesign,
          coding: scores.coding,
          behavioral: scores.behavioral,
          resilience: scores.resilience,
          communication: scores.communication,
        },
      });

      // Update streak
      await updateStreak(ctx.user.id);

      return {
        verdict: scores.verdict,
        overallScore: scores.overallScore,
        scoreBreakdown: {
          systemDesign: scores.systemDesign,
          coding: scores.coding,
          behavioral: scores.behavioral,
          resilience: scores.resilience,
          communication: scores.communication,
        },
        summaryFeedback: scores.summaryFeedback,
      };
    }),

  getBossFightHistory: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    return db
      .select({
        id: bossFightSessions.id,
        verdict: bossFightSessions.verdict,
        overallScore: bossFightSessions.overallScore,
        scoreBreakdown: bossFightSessions.scoreBreakdown,
        completedAt: bossFightSessions.completedAt,
      })
      .from(bossFightSessions)
      .where(eq(bossFightSessions.userId, ctx.user.id))
      .orderBy(desc(bossFightSessions.completedAt))
      .limit(10);
  }),

  // ─── Comeback Arc ───────────────────────────────────────────────────────────

  generateComebackPlan: protectedProcedure
    .input(
      z.object({
        drillId: z.string(),
        drillName: z.string(),
        score: z.number(),
        weakAreas: z.array(z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const result = await invokeLLM({
        messages: [
          {
            role: "system",
            content:
              "You are a Meta interview coach generating a personalized comeback plan for a candidate who scored below 50 on a practice drill.",
          },
          {
            role: "user",
            content: `Drill: ${input.drillName}\nScore: ${input.score}/100\nWeak areas identified: ${input.weakAreas.join(", ")}\n\nGenerate a comeback plan with exactly 3 specific, actionable steps. Each step should reference a specific concept or technique. Also predict what score they'll achieve if they follow the plan.\n\nReturn JSON: { "steps": [{"title": string, "description": string, "drillToRun": string|null}], "predictedScore": number, "coachNote": string }`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "comeback_plan",
            strict: true,
            schema: {
              type: "object",
              properties: {
                steps: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      description: { type: "string" },
                      drillToRun: { type: ["string", "null"] },
                    },
                    required: ["title", "description", "drillToRun"],
                    additionalProperties: false,
                  },
                },
                predictedScore: { type: "integer" },
                coachNote: { type: "string" },
              },
              required: ["steps", "predictedScore", "coachNote"],
              additionalProperties: false,
            },
          },
        },
      });

      const plan = JSON.parse(result.choices[0].message.content as string);

      const [inserted] = await db.insert(comebackArcPlans).values({
        userId: ctx.user.id,
        drillId: input.drillId,
        triggerScore: input.score,
        steps: plan.steps,
        predictedScore: plan.predictedScore,
      });

      return {
        planId: (inserted as { insertId: number }).insertId,
        steps: plan.steps,
        predictedScore: plan.predictedScore,
        coachNote: plan.coachNote,
      };
    }),

  recordRetryScore: protectedProcedure
    .input(z.object({ planId: z.number(), retryScore: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db
        .update(comebackArcPlans)
        .set({ retryScore: input.retryScore })
        .where(
          and(
            eq(comebackArcPlans.id, input.planId),
            eq(comebackArcPlans.userId, ctx.user.id)
          )
        );
      return { success: true };
    }),

  getActiveComebackPlan: protectedProcedure
    .input(z.object({ drillId: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const rows = await db
        .select()
        .from(comebackArcPlans)
        .where(
          and(
            eq(comebackArcPlans.userId, ctx.user.id),
            eq(comebackArcPlans.drillId, input.drillId)
          )
        )
        .orderBy(desc(comebackArcPlans.createdAt))
        .limit(1);

      return rows[0] ?? null;
    }),

  // ─── Adaptive Difficulty ────────────────────────────────────────────────────

  getDifficulty: protectedProcedure
    .input(z.object({ drillId: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const rows = await db
        .select()
        .from(adaptiveDifficultyState)
        .where(
          and(
            eq(adaptiveDifficultyState.userId, ctx.user.id),
            eq(adaptiveDifficultyState.drillId, input.drillId)
          )
        )
        .limit(1);

      return rows[0] ?? { difficulty: "normal", recentScores: [] };
    }),

  updateDifficulty: protectedProcedure
    .input(z.object({ drillId: z.string(), newScore: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const userId = ctx.user.id;
      const existing = await db
        .select()
        .from(adaptiveDifficultyState)
        .where(
          and(
            eq(adaptiveDifficultyState.userId, userId),
            eq(adaptiveDifficultyState.drillId, input.drillId)
          )
        )
        .limit(1);

      const currentScores: number[] = existing[0]?.recentScores ?? [];
      const updatedScores = [...currentScores, input.newScore].slice(-3); // keep last 3

      // Determine new difficulty
      let newDifficulty = "normal";
      if (updatedScores.length >= 3) {
        const avg =
          updatedScores.reduce((a, b) => a + b, 0) / updatedScores.length;
        if (avg >= 80) newDifficulty = "hard";
        else if (avg < 50) newDifficulty = "easy";
        else newDifficulty = "normal";
      }

      if (existing.length === 0) {
        await db.insert(adaptiveDifficultyState).values({
          userId,
          drillId: input.drillId,
          difficulty: newDifficulty,
          recentScores: updatedScores,
        });
      } else {
        await db
          .update(adaptiveDifficultyState)
          .set({ difficulty: newDifficulty, recentScores: updatedScores })
          .where(
            and(
              eq(adaptiveDifficultyState.userId, userId),
              eq(adaptiveDifficultyState.drillId, input.drillId)
            )
          );
      }

      return { difficulty: newDifficulty, recentScores: updatedScores };
    }),

  // ─── Interview Seasons ──────────────────────────────────────────────────────

  getActiveSeason: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const today = todayKey();
    const seasons = await db
      .select()
      .from(interviewSeasons)
      .where(
        and(
          sql`${interviewSeasons.startDate} <= ${today}`,
          sql`${interviewSeasons.endDate} >= ${today}`
        )
      )
      .limit(1);

    if (seasons.length === 0) return null;
    const season = seasons[0];

    // Get user's season score
    const userScore = await db
      .select()
      .from(seasonScores)
      .where(
        and(
          eq(seasonScores.userId, ctx.user.id),
          eq(seasonScores.seasonId, season.id)
        )
      )
      .limit(1);

    // Get leaderboard (top 10)
    const leaderboard = await db
      .select({
        totalScore: seasonScores.totalScore,
        drillsCompleted: seasonScores.drillsCompleted,
        isChampion: seasonScores.isChampion,
      })
      .from(seasonScores)
      .where(eq(seasonScores.seasonId, season.id))
      .orderBy(desc(seasonScores.totalScore))
      .limit(10);

    const daysLeft = Math.max(
      0,
      Math.ceil((new Date(season.endDate).getTime() - Date.now()) / 86400000)
    );

    return {
      season,
      userScore: userScore[0] ?? {
        totalScore: 0,
        drillsCompleted: 0,
        isChampion: false,
      },
      leaderboard,
      daysLeft,
    };
  }),

  getAllSeasons: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    return db
      .select()
      .from(interviewSeasons)
      .orderBy(desc(interviewSeasons.seasonNumber));
  }),
});

// ─── Internal helpers ─────────────────────────────────────────────────────────

async function updateStreak(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const today = todayKey();
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  const existing = await db
    .select()
    .from(userStreaks)
    .where(eq(userStreaks.userId, userId))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(userStreaks).values({
      userId,
      currentStreak: 1,
      longestStreak: 1,
      lastActivityDate: today,
      hardModeUnlocked: false,
      bossFightUnlocked: false,
    });
    return;
  }

  const streak = existing[0];

  // Already recorded today
  if (streak.lastActivityDate === today) return;

  const isConsecutive = streak.lastActivityDate === yesterday;
  const newStreak = isConsecutive ? streak.currentStreak + 1 : 1;
  const newLongest = Math.max(streak.longestStreak, newStreak);
  const hardModeUnlocked = streak.hardModeUnlocked || newStreak >= 7;
  const bossFightUnlocked = streak.bossFightUnlocked || newStreak >= 30;

  await db
    .update(userStreaks)
    .set({
      currentStreak: newStreak,
      longestStreak: newLongest,
      lastActivityDate: today,
      hardModeUnlocked,
      bossFightUnlocked,
    })
    .where(eq(userStreaks.userId, userId));
}

async function updateSeasonScore(
  userId: number,
  _category: string,
  score: number
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const today = todayKey();
  const seasons = await db
    .select({ id: interviewSeasons.id })
    .from(interviewSeasons)
    .where(
      and(
        sql`${interviewSeasons.startDate} <= ${today}`,
        sql`${interviewSeasons.endDate} >= ${today}`
      )
    )
    .limit(1);

  if (seasons.length === 0) return;
  const seasonId = seasons[0].id;

  const existing = await db
    .select()
    .from(seasonScores)
    .where(
      and(eq(seasonScores.userId, userId), eq(seasonScores.seasonId, seasonId))
    )
    .limit(1);

  if (existing.length === 0) {
    await db.insert(seasonScores).values({
      userId,
      seasonId,
      totalScore: score,
      drillsCompleted: 1,
    });
  } else {
    await db
      .update(seasonScores)
      .set({
        totalScore: existing[0].totalScore + score,
        drillsCompleted: existing[0].drillsCompleted + 1,
      })
      .where(
        and(
          eq(seasonScores.userId, userId),
          eq(seasonScores.seasonId, seasonId)
        )
      );
  }
}
