import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { drillSessions, personaStressSessions } from "../../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";

// ── Learning Path Drill Sessions ─────────────────────────────────────────────

export const drillSessionsRouter = router({
  /** Save a completed weekly drill session to the DB */
  saveSession: protectedProcedure
    .input(
      z.object({
        weekNumber: z.number().int().min(1).max(4),
        sessionScore: z.number().int().min(0).max(100),
        drillScores: z.array(
          z.object({
            drillId: z.string().min(1).max(64),
            score: z.number().int().min(0).max(100),
            completedAt: z.number(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: false };
      await db.insert(drillSessions).values({
        userId: ctx.user.id,
        weekNumber: input.weekNumber,
        sessionScore: input.sessionScore,
        drillScores: input.drillScores,
      });
      return { success: true };
    }),

  /** Get the best session score per week for the current user */
  getBestScoresByWeek: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) return {} as Record<number, number>;
    const db = await getDb();
    if (!db) return {} as Record<number, number>;
    const rows = await db
      .select()
      .from(drillSessions)
      .where(eq(drillSessions.userId, ctx.user.id))
      .orderBy(desc(drillSessions.completedAt))
      .limit(100);
    // Group by weekNumber, keep best sessionScore
    const best: Record<number, number> = {};
    for (const row of rows) {
      if (
        best[row.weekNumber] === undefined ||
        row.sessionScore > best[row.weekNumber]
      ) {
        best[row.weekNumber] = row.sessionScore;
      }
    }
    return best;
  }),

  /** Get all sessions for the current user (for history view) */
  getSessionHistory: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) return [];
    const db = await getDb();
    if (!db) return [];
    return db
      .select()
      .from(drillSessions)
      .where(eq(drillSessions.userId, ctx.user.id))
      .orderBy(desc(drillSessions.completedAt))
      .limit(50);
  }),

  // ── Persona Stress Test Sessions ─────────────────────────────────────────

  /** Run a Persona Stress Test turn — AI plays the archetype and scores the response */
  evaluatePersonaTurn: protectedProcedure
    .input(
      z.object({
        personaId: z.string().min(1).max(64),
        personaLabel: z.string().min(1).max(128),
        personaDescription: z.string().max(500),
        topic: z.string().max(200),
        challenge: z.string().max(1000),
        response: z.string().min(1).max(2000),
        turnNumber: z.number().int().min(1).max(5),
      })
    )
    .mutation(async ({ input }) => {
      const result = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a Meta Staff/Principal Engineer interviewer playing the "${input.personaLabel}" archetype.
Archetype description: ${input.personaDescription}

Your job is to:
1. Score the candidate's response on resilience (0-10): how well they handled your challenge without collapsing, deflecting, or over-explaining.
2. Generate the NEXT challenge question you would ask (staying in character as this archetype).
3. Provide a 1-sentence coaching note.

Respond ONLY with valid JSON in this exact format:
{
  "resilienceScore": <0-10 integer>,
  "nextChallenge": "<your next in-character challenge question>",
  "coachingNote": "<one sentence of coaching feedback>"
}`,
          },
          {
            role: "user",
            content: `Topic: ${input.topic}
Turn ${input.turnNumber} — Your challenge was: "${input.challenge}"
Candidate's response: "${input.response}"

Score their resilience and generate the next challenge.`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "persona_turn_result",
            strict: true,
            schema: {
              type: "object",
              properties: {
                resilienceScore: {
                  type: "integer",
                  description: "Resilience score 0-10",
                },
                nextChallenge: {
                  type: "string",
                  description: "Next in-character challenge question",
                },
                coachingNote: {
                  type: "string",
                  description: "One sentence of coaching feedback",
                },
              },
              required: ["resilienceScore", "nextChallenge", "coachingNote"],
              additionalProperties: false,
            },
          },
        },
      });

      const content = result.choices?.[0]?.message?.content ?? "{}";
      const parsed = JSON.parse(
        typeof content === "string" ? content : JSON.stringify(content)
      );
      return {
        resilienceScore: Math.min(10, Math.max(0, parsed.resilienceScore ?? 5)),
        nextChallenge: parsed.nextChallenge ?? "Tell me more.",
        coachingNote: parsed.coachingNote ?? "",
      };
    }),

  /** Generate the final resilience scorecard after all turns */
  generatePersonaScorecard: protectedProcedure
    .input(
      z.object({
        personaId: z.string().min(1).max(64),
        personaLabel: z.string().min(1).max(128),
        topic: z.string().max(200),
        turns: z.array(
          z.object({
            challenge: z.string(),
            response: z.string(),
            score: z.number(),
            feedback: z.string(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const avgScore = Math.round(
        input.turns.reduce((s, t) => s + t.score, 0) /
          Math.max(1, input.turns.length)
      );
      const resilienceScore = Math.round((avgScore / 10) * 100);

      const result = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a Meta interview coach reviewing a candidate's performance in a Persona Stress Test.
The candidate was challenged by the "${input.personaLabel}" interviewer archetype across ${input.turns.length} turns.
Provide a concise final coaching note (2-3 sentences) covering: what they did well, their biggest resilience gap, and one concrete tip.`,
          },
          {
            role: "user",
            content: `Topic: ${input.topic}
Turns:\n${input.turns.map((t, i) => `Turn ${i + 1}: Challenge="${t.challenge}" | Response="${t.response}" | Score=${t.score}/10`).join("\n")}
Average score: ${avgScore}/10`,
          },
        ],
      });

      const aiCoachNote =
        result.choices?.[0]?.message?.content ??
        "Good effort. Keep practicing.";

      // Persist to DB
      const db = await getDb();
      if (db) {
        await db.insert(personaStressSessions).values({
          userId: ctx.user.id,
          personaId: input.personaId,
          personaLabel: input.personaLabel,
          resilienceScore,
          turns: input.turns,
          aiCoachNote:
            typeof aiCoachNote === "string"
              ? aiCoachNote
              : JSON.stringify(aiCoachNote),
        });
      }

      return {
        resilienceScore,
        avgTurnScore: avgScore,
        aiCoachNote:
          typeof aiCoachNote === "string"
            ? aiCoachNote
            : JSON.stringify(aiCoachNote),
      };
    }),

  /** Get per-drill best scores for the current user (flattened from drillScores JSON) */
  getDrillLeaderboard: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user)
      return [] as Array<{
        drillId: string;
        bestScore: number;
        completedAt: number;
      }>;
    const db = await getDb();
    if (!db)
      return [] as Array<{
        drillId: string;
        bestScore: number;
        completedAt: number;
      }>;
    const rows = await db
      .select()
      .from(drillSessions)
      .where(eq(drillSessions.userId, ctx.user.id))
      .orderBy(desc(drillSessions.completedAt))
      .limit(200);
    // Flatten drillScores arrays and keep best per drillId
    const best: Record<string, { bestScore: number; completedAt: number }> = {};
    for (const row of rows) {
      const scores =
        (row.drillScores as Array<{
          drillId: string;
          score: number;
          completedAt: number;
        }>) ?? [];
      for (const ds of scores) {
        if (!best[ds.drillId] || ds.score > best[ds.drillId].bestScore) {
          best[ds.drillId] = {
            bestScore: ds.score,
            completedAt: ds.completedAt,
          };
        }
      }
    }
    return Object.entries(best)
      .map(([drillId, v]) => ({ drillId, ...v }))
      .sort((a, b) => b.bestScore - a.bestScore);
  }),

  /** Get persona stress test history for the current user */
  getPersonaHistory: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) return [];
    const db = await getDb();
    if (!db) return [];
    return db
      .select()
      .from(personaStressSessions)
      .where(eq(personaStressSessions.userId, ctx.user.id))
      .orderBy(desc(personaStressSessions.completedAt))
      .limit(20);
  }),
});
