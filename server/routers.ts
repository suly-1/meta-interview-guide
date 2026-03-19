import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { notifyOwner } from "./_core/notification";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  /**
   * digest.send — sends a formatted weekly progress digest to the owner via Manus notifications.
   * Uses publicProcedure so no login is required (personal-use guide).
   */
  digest: router({
    send: publicProcedure
      .input(
        z.object({
          title: z.string().min(1, "title is required"),
          content: z.string().min(1, "content is required"),
        })
      )
      .mutation(async ({ input }) => {
        const delivered = await notifyOwner({ title: input.title, content: input.content });
        return { success: delivered } as const;
      }),
  }),

  /**
   * behavioral.score — LLM-powered rubric scoring for STAR answers.
   * Returns per-dimension scores (1–5) for Specificity, Impact, IC-level fit, Structure, and Conciseness.
   */
  behavioral: router({
    score: publicProcedure
      .input(
        z.object({
          answer: z.string().min(10, "Answer must be at least 10 characters"),
          question: z.string().optional(),
          targetLevel: z.enum(["IC6", "IC7"]).default("IC6"),
        })
      )
      .mutation(async ({ input }) => {
        const { invokeLLM } = await import("./_core/llm");
        const systemPrompt = `You are an expert Meta software engineering interview coach specializing in behavioral interviews.
You evaluate STAR (Situation, Task, Action, Result) answers for ${input.targetLevel} (${input.targetLevel === 'IC7' ? 'Staff Engineer' : 'Senior Engineer'}) candidates.

Score the answer on these 5 dimensions, each from 1 to 5:
1. Specificity (1=vague/generic, 5=concrete details, metrics, names, dates)
2. Impact (1=no measurable result, 5=clear quantified business/technical impact)
3. IC-Level Fit (1=too junior/too senior for ${input.targetLevel}, 5=perfectly calibrated scope and ownership)
4. Structure (1=disorganized, 5=clear STAR format with logical flow)
5. Conciseness (1=rambling/unfocused, 5=tight and on-point within ~2 minutes)

Also provide:
- A 1-sentence overall assessment
- 2-3 specific improvement suggestions
- The strongest part of the answer

Respond ONLY with valid JSON matching this exact schema.`;

        const userMessage = input.question
          ? `Question: "${input.question}"\n\nAnswer:\n${input.answer}`
          : `Answer:\n${input.answer}`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "behavioral_score",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  specificity: { type: "integer", description: "Score 1-5" },
                  impact: { type: "integer", description: "Score 1-5" },
                  icLevelFit: { type: "integer", description: "Score 1-5" },
                  structure: { type: "integer", description: "Score 1-5" },
                  conciseness: { type: "integer", description: "Score 1-5" },
                  overallAssessment: { type: "string" },
                  improvements: { type: "array", items: { type: "string" } },
                  strongestPart: { type: "string" },
                },
                required: ["specificity", "impact", "icLevelFit", "structure", "conciseness", "overallAssessment", "improvements", "strongestPart"],
                additionalProperties: false,
              },
            },
          },
        });

        const raw = response.choices?.[0]?.message?.content;
        const text = typeof raw === 'string' ? raw : JSON.stringify(raw);
        try {
          const parsed = JSON.parse(text);
          return parsed as {
            specificity: number; impact: number; icLevelFit: number;
            structure: number; conciseness: number;
            overallAssessment: string; improvements: string[]; strongestPart: string;
          };
        } catch {
          return {
            specificity: 3, impact: 3, icLevelFit: 3, structure: 3, conciseness: 3,
            overallAssessment: "Unable to parse scoring response. Please try again.",
            improvements: [],
            strongestPart: "",
          };
        }
      }),
  }),

  /**
   * hints.get — returns a targeted LLM hint for a coding problem without revealing the solution.
   */
  hints: router({
    get: publicProcedure
      .input(
        z.object({
          problemName: z.string().min(1),
          currentCode: z.string(),
          hintLevel: z.enum(["gentle", "medium", "strong"]).default("gentle"),
        })
      )
      .mutation(async ({ input }) => {
        const { invokeLLM } = await import("./_core/llm");
        const levelInstructions: Record<string, string> = {
          gentle: "Give a very gentle nudge — point to the right data structure or algorithmic family without revealing any code or the core insight.",
          medium: "Give a medium hint — describe the key insight or approach at a high level without writing any code.",
          strong: "Give a strong hint — describe the algorithm step by step in plain English, but do NOT write actual code.",
        };
        const systemPrompt = `You are a coding interview coach helping a candidate practice LeetCode problems. 
Your job is to give hints that guide the candidate toward the solution WITHOUT revealing it.
${levelInstructions[input.hintLevel]}
Keep your response concise (2-4 sentences max). Do not write any code.`;

        const userMessage = input.currentCode.trim()
          ? `Problem: ${input.problemName}\n\nMy current approach/code:\n${input.currentCode}\n\nPlease give me a hint.`
          : `Problem: ${input.problemName}\n\nI'm stuck and don't know where to start. Please give me a hint.`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage },
          ],
        });

        const hint = response.choices?.[0]?.message?.content ?? "Unable to generate a hint. Please try again.";
        return { hint } as const;
      }),
  }),

  /**
   * mockInterview.debrief — LLM post-session IC-level assessment.
   * Receives coding result + behavioral answers and returns a structured debrief.
   */
  mockInterview: router({
    debrief: publicProcedure
      .input(
        z.object({
          targetLevel: z.enum(["IC6", "IC7"]).default("IC6"),
          coding: z.object({
            problemName: z.string(),
            difficulty: z.string(),
            solved: z.boolean(),
            durationSec: z.number(),
            notes: z.string().optional(),
          }),
          behavioral: z.array(
            z.object({
              question: z.string(),
              answer: z.string(),
            })
          ).min(1).max(3),
        })
      )
      .mutation(async ({ input }) => {
        const { invokeLLM } = await import("./_core/llm");
        const levelLabel = input.targetLevel === "IC7" ? "Staff Engineer (IC7)" : "Senior Engineer (IC6)";
        const codingResult = input.coding.solved
          ? `Solved in ${Math.round(input.coding.durationSec / 60)} min`
          : `Did not solve within ${Math.round(input.coding.durationSec / 60)} min`;
        const behavioralSection = input.behavioral
          .map((b, i) => `Q${i + 1}: ${b.question}\nA${i + 1}: ${b.answer}`)
          .join("\n\n");
        const systemPrompt = `You are a Meta engineering interview panel evaluating a candidate for ${levelLabel}.
You have just completed a mock interview loop with one coding round and ${input.behavioral.length} behavioral questions.
Evaluate the candidate holistically and return a structured JSON debrief.
Be direct, specific, and calibrated to the ${input.targetLevel} bar at Meta.
Do not be overly generous — IC7 requires demonstrable staff-level scope and impact.
Score coding and behavioral each from 1 (poor) to 5 (exceptional).`;
        const userMessage = `=== CODING ROUND ===\nProblem: ${input.coding.problemName} (${input.coding.difficulty})\nResult: ${codingResult}${input.coding.notes ? `\nCandidate notes: ${input.coding.notes}` : ""}\n\n=== BEHAVIORAL ROUNDS ===\n${behavioralSection}`;
        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "mock_interview_debrief",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  icLevelVerdict: { type: "string", enum: ["Strong Hire", "Hire", "Borderline", "No Hire"] },
                  overallSummary: { type: "string" },
                  codingScore: { type: "integer" },
                  codingFeedback: { type: "string" },
                  behavioralScore: { type: "integer" },
                  behavioralFeedback: { type: "string" },
                  topStrengths: { type: "array", items: { type: "string" } },
                  topImprovements: { type: "array", items: { type: "string" } },
                  nextSteps: { type: "array", items: { type: "string" } },
                },
                required: ["icLevelVerdict", "overallSummary", "codingScore", "codingFeedback", "behavioralScore", "behavioralFeedback", "topStrengths", "topImprovements", "nextSteps"],
                additionalProperties: false,
              },
            },
          },
        });
        const raw = response.choices?.[0]?.message?.content;
        const text = typeof raw === "string" ? raw : JSON.stringify(raw);
        try {
          return JSON.parse(text) as {
            icLevelVerdict: "Strong Hire" | "Hire" | "Borderline" | "No Hire";
            overallSummary: string; codingScore: number; codingFeedback: string;
            behavioralScore: number; behavioralFeedback: string;
            topStrengths: string[]; topImprovements: string[]; nextSteps: string[];
          };
        } catch {
          return {
            icLevelVerdict: "Borderline" as const,
            overallSummary: "Unable to parse debrief. Please try again.",
            codingScore: 3, codingFeedback: "", behavioralScore: 3, behavioralFeedback: "",
            topStrengths: [], topImprovements: [], nextSteps: [],
          };
        }
      }),
  }),

  /**
   * patternHint.get — 3-step hint ladder for coding patterns (gentle → medium → full walkthrough).
   */
  patternHint: router({
    get: publicProcedure
      .input(
        z.object({
          patternName: z.string().min(1),
          keyIdea: z.string(),
          hintLevel: z.enum(["gentle", "medium", "full"]).default("gentle"),
        })
      )
      .mutation(async ({ input }) => {
        const { invokeLLM } = await import("./_core/llm");
        const levelInstructions: Record<string, string> = {
          gentle: "Give a very gentle nudge — mention only the high-level algorithmic family or data structure this pattern belongs to. Do NOT describe the approach or key insight.",
          medium: "Give a medium hint — describe the core insight of this pattern at a high level. Mention what problem shape it solves and why. Do NOT write code.",
          full: "Give a full walkthrough — explain the pattern step by step in plain English: when to recognise it, the key invariant, and the general algorithm. Do NOT write actual code.",
        };
        const systemPrompt = `You are a senior software engineer coaching a Meta IC6/IC7 candidate.\nYou are explaining the \"${input.patternName}\" coding pattern.\nCore idea: ${input.keyIdea}\n${levelInstructions[input.hintLevel]}\nKeep your response concise (3-5 sentences). Do not write code.`;
        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `I'm stuck on the ${input.patternName} pattern. ${input.hintLevel === 'gentle' ? 'Give me a gentle nudge.' : input.hintLevel === 'medium' ? 'Give me a medium hint.' : 'Walk me through it fully.'}` },
          ],
        });
        const hint = response.choices?.[0]?.message?.content ?? "Unable to generate a hint. Please try again.";
        return { hint } as const;
      }),
  }),
});

export type AppRouter = typeof appRouter;
