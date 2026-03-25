import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { notifyOwner } from "./_core/notification";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { disclaimerRouter } from "./routers/disclaimer";
import { collabRouter } from "./routers/collab";
import { leaderboardRouter } from "./routers/leaderboard";
import { ratingsRouter } from "./routers/ratings";
import { ctciRouter } from "./routers/ctci";
import { ctciProgressRouter } from "./routers/ctciProgress";
import { mockHistoryRouter } from "./routers/mockHistory";
import { onboardingRouter } from "./routers/onboarding";
import { aiRouter } from "./routers/ai";
import { highImpactRouter } from "./routers/highImpact";
import { scoresRouter } from "./routers/scores";
import { feedbackRouter } from "./routers/feedback";
import { adminRouter } from "./routers/admin";
import { adminPinRouter } from "./routers/adminPin";
import { siteSettingsRouter } from "./routers/siteSettings";
import { siteAccessRouter } from "./routers/siteAccess";
import { adminUsersRouter } from "./routers/adminUsers";
import { analyticsRouter } from "./routers/analytics";
import { ENV } from "./_core/env";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    isOwner: protectedProcedure.query(({ ctx }) => ({
      isOwner: !!ENV.ownerOpenId && ctx.user.openId === ENV.ownerOpenId,
    })),
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
   * Requires login to prevent notification spam from anonymous users.
   */
  digest: router({
    send: protectedProcedure
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
          targetLevel: z.enum(["L6", "L7"]).default("L6"),
        })
      )
      .mutation(async ({ input }) => {
        const { invokeLLM } = await import("./_core/llm");
        const systemPrompt = `You are an expert Meta software engineering interview coach specializing in behavioral interviews.
You evaluate STAR (Situation, Task, Action, Result) answers for ${input.targetLevel} (${input.targetLevel === 'L7' ? 'Staff Engineer' : 'Senior Engineer'}) candidates.

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
    /**
     * mockInterview.followUps — generates 3 personalized follow-up questions based on the weakest part of the debrief.
     */
    followUps: publicProcedure
      .input(
        z.object({
          targetLevel: z.enum(["L6", "L7", "IC7_PRINCIPAL"]).default("L6"),
          behavioralFeedback: z.string(),
          codingFeedback: z.string().optional(),
          topImprovements: z.array(z.string()),
          behavioralAnswers: z.array(z.object({
            question: z.string(),
            answer: z.string(),
          })).max(4),
        })
      )
      .mutation(async ({ input }) => {
        const { invokeLLM } = await import("./_core/llm");
        const levelLabel = input.targetLevel === "IC7_PRINCIPAL"
          ? "Principal/Senior Staff Engineer (L7+)"
          : input.targetLevel === "L7" ? "Staff Engineer (L7)" : "Senior Engineer (L6)";
        const improvementsText = input.topImprovements.slice(0, 3).map((s, i) => `${i + 1}. ${s}`).join("\n");
        const answersText = input.behavioralAnswers
          .map((b, i) => `Q${i + 1}: ${b.question}\nA${i + 1}: ${b.answer.slice(0, 300)}${b.answer.length > 300 ? '...' : ''}`)
          .join("\n\n");
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `You are a Meta interview coach. Based on a candidate's mock interview debrief, generate exactly 3 targeted follow-up questions that probe their weakest areas. Each question should:\n- Be specific to the candidate's actual answers (not generic)\n- Target the ${levelLabel} bar\n- Be phrased as a real interviewer would ask it\n- Include a brief coaching note (1 sentence) explaining WHY this question targets a weakness`,
            },
            {
              role: "user",
              content: `Behavioral feedback: ${input.behavioralFeedback}\n${input.codingFeedback ? `Coding feedback: ${input.codingFeedback}\n` : ""}\nTop areas to improve:\n${improvementsText}\n\nCandidate's behavioral answers:\n${answersText}`,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "follow_up_questions",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  questions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        question: { type: "string" },
                        targetArea: { type: "string" },
                        coachingNote: { type: "string" },
                      },
                      required: ["question", "targetArea", "coachingNote"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["questions"],
                additionalProperties: false,
              },
            },
          },
        });
        const raw = response.choices?.[0]?.message?.content;
        const text = typeof raw === "string" ? raw : JSON.stringify(raw);
        try {
          const parsed = JSON.parse(text) as { questions: { question: string; targetArea: string; coachingNote: string }[] };
          return { questions: parsed.questions.slice(0, 3) };
        } catch {
          return { questions: [] };
        }
      }),

    debrief: publicProcedure
      .input(
        z.object({
          targetLevel: z.enum(["L6", "L7", "IC7_PRINCIPAL"]).default("L6"),
          coding: z.object({
            problemName: z.string(),
            difficulty: z.string(),
            solved: z.boolean(),
            durationSec: z.number(),
            notes: z.string().optional(),
          }).optional(),
          behavioral: z.array(
            z.object({
              question: z.string(),
              answer: z.string(),
            })
          ).min(1).max(6),
        })
      )
      .mutation(async ({ input }) => {
        const { invokeLLM } = await import("./_core/llm");
        const isPrincipal = input.targetLevel === "IC7_PRINCIPAL";
        const levelLabel = isPrincipal
          ? "Principal/Senior Staff Engineer (L7+)"
          : input.targetLevel === "L7" ? "Staff Engineer (L7)" : "Senior Engineer (L6)";
        const behavioralSection = input.behavioral
          .map((b, i) => `Q${i + 1}: ${b.question}\nA${i + 1}: ${b.answer}`)
          .join("\n\n");

        // IC7_PRINCIPAL: behavioral-only 60-min session — skip coding entirely
        let systemPrompt: string;
        let userMessage: string;
        if (isPrincipal) {
          systemPrompt = `You are a senior Meta engineering panel evaluating a candidate for ${levelLabel}.
This is a 60-minute behavioral-only interview focused on cross-functional leadership, org-wide impact, and retrospective ownership.
Do NOT evaluate coding ability — this session has no coding component.
Evaluate the candidate against the L7+ bar at Meta:
- Cross-functional influence: Does the candidate drive alignment across multiple teams, orgs, or functions?
- Retrospective ownership: Do they demonstrate deep ownership of outcomes, including failures, with systemic improvements?
- Org-wide impact: Are their examples scoped to org-level or company-level impact, not just team-level?
- Communication & persuasion: Can they influence without authority, navigate ambiguity, and align senior stakeholders?
- Strategic thinking: Do they demonstrate long-horizon thinking, trade-off reasoning, and prioritisation at scale?
Be direct and calibrated. L7+ requires clear evidence of staff-level leadership, not just strong IC execution.
Score behavioral from 1 (poor) to 5 (exceptional). Set codingScore to 0 and codingFeedback to "N/A — behavioral-only session".`;
          userMessage = `=== BEHAVIORAL INTERVIEW (60 min, L7+ Principal/Senior Staff) ===\n${behavioralSection}`;
        } else {
          const codingResult = input.coding
            ? (input.coding.solved
              ? `Solved in ${Math.round(input.coding.durationSec / 60)} min`
              : `Did not solve within ${Math.round(input.coding.durationSec / 60)} min`)
            : "Not attempted";
          systemPrompt = `You are a Meta engineering interview panel evaluating a candidate for ${levelLabel}.
You have just completed a mock interview loop with one coding round and ${input.behavioral.length} behavioral questions.
Evaluate the candidate holistically and return a structured JSON debrief.
Be direct, specific, and calibrated to the ${input.targetLevel} bar at Meta.
Do not be overly generous — L7 requires demonstrable staff-level scope and impact.
Score coding and behavioral each from 1 (poor) to 5 (exceptional).`;
          userMessage = `=== CODING ROUND ===\nProblem: ${input.coding?.problemName ?? "Unknown"} (${input.coding?.difficulty ?? "Unknown"})\nResult: ${codingResult}${input.coding?.notes ? `\nCandidate notes: ${input.coding.notes}` : ""}\n\n=== BEHAVIORAL ROUNDS ===\n${behavioralSection}`;
        }
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
   * codeExec.run — executes source code via Judge0 CE public API.
   */
  codeExec: router({
    run: publicProcedure
      .input(
        z.object({
          sourceCode: z.string().min(1),
          languageId: z.number().int().positive(),
          stdin: z.string().optional().default(""),
        })
      )
      .mutation(async ({ input }) => {
        const response = await fetch("https://ce.judge0.com/submissions?wait=true", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            source_code: input.sourceCode,
            language_id: input.languageId,
            stdin: input.stdin,
            cpu_time_limit: 5,
            wall_time_limit: 10,
          }),
        });
        if (!response.ok) throw new Error(`Judge0 error: ${response.status}`);
        const data = await response.json() as {
          stdout?: string; stderr?: string; compile_output?: string;
          status?: { id: number; description: string };
          time?: string; memory?: number; message?: string;
        };
        return {
          stdout: data.stdout ?? "",
          stderr: data.stderr ?? "",
          compileOutput: data.compile_output ?? "",
          statusId: data.status?.id ?? 0,
          statusDescription: data.status?.description ?? "Unknown",
          time: data.time ?? null,
          memory: data.memory ?? null,
        };
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
        const systemPrompt = `You are a senior software engineer coaching a Meta L6/L7 candidate.\nYou are explaining the \"${input.patternName}\" coding pattern.\nCore idea: ${input.keyIdea}\n${levelInstructions[input.hintLevel]}\nKeep your response concise (3-5 sentences). Do not write code.`;
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
  /**
   * studyPlanner.generate — LLM-powered personalised study session plan.
   * Accepts a snapshot of the candidate's current progress and returns a
   * structured 30/60/90-min plan with specific patterns, CTCI problems, and
   * behavioral stories to cover.
   */
  studyPlanner: router({
    generate: publicProcedure
      .input(
        z.object({
          durationMinutes: z.union([z.literal(30), z.literal(60), z.literal(90)]),
          // SR due patterns (id + name)
          srDuePatterns: z.array(z.object({ id: z.string(), name: z.string() })).max(20),
          // Weak patterns by drill rating
          weakPatterns: z.array(z.object({ name: z.string(), avg: z.number() })).max(10),
          // Unsolved CTCI problems (sample)
          unsolvedProblems: z.array(z.object({ name: z.string(), difficulty: z.string(), topic: z.string() })).max(15),
          // Topics where self-rating diverges most from official (harder than expected)
          hardTopics: z.array(z.string()).max(5),
          // Current readiness score (0-100)
          readinessScore: z.number().min(0).max(100),
          // Days until interview (optional)
          daysUntilInterview: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { invokeLLM } = await import("./_core/llm");
        const durationLabel = `${input.durationMinutes}-minute`;
        const srSection = input.srDuePatterns.length > 0
          ? `SR Due Today (${input.srDuePatterns.length}): ${input.srDuePatterns.map(p => p.name).join(", ")}`
          : "No SR patterns due today";
        const weakSection = input.weakPatterns.length > 0
          ? `Weak Patterns (low drill ratings): ${input.weakPatterns.map(p => `${p.name} (avg ${p.avg.toFixed(1)}/5)`).join(", ")}`
          : "No weak patterns identified";
        const hardSection = input.hardTopics.length > 0
          ? `Topics felt harder than expected: ${input.hardTopics.join(", ")}`
          : "";
        const unsolvedSection = input.unsolvedProblems.length > 0
          ? `Sample unsolved CTCI problems: ${input.unsolvedProblems.map(p => `${p.name} (${p.difficulty}, ${p.topic})`).join("; ")}`
          : "All CTCI problems solved";
        const systemPrompt = `You are an expert Meta L6/L7 interview coach building a personalised ${durationLabel} study session plan.
Candidate snapshot:
- Readiness score: ${input.readinessScore}/100${input.daysUntilInterview ? `\n- Days until interview: ${input.daysUntilInterview}` : ""}
- ${srSection}
- ${weakSection}${hardSection ? `\n- ${hardSection}` : ""}
- ${unsolvedSection}

Build a concrete, prioritised study plan for a ${durationLabel} session.
Return JSON matching the schema exactly. Each block must have a specific, actionable task — not vague advice.
For coding blocks, name specific problems or patterns. For behavioral blocks, name specific themes or STAR stories.
Time allocations must sum to ${input.durationMinutes} minutes.`;
        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Generate my ${durationLabel} study plan.` },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "study_plan",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  headline: { type: "string", description: "One-line summary of the session focus" },
                  focusAreas: { type: "array", items: { type: "string" }, description: "2-4 key focus areas for this session" },
                  blocks: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        type: { type: "string", enum: ["coding", "behavioral", "sr_review", "system_design", "break"] },
                        title: { type: "string" },
                        durationMinutes: { type: "integer" },
                        tasks: { type: "array", items: { type: "string" } },
                        priority: { type: "string", enum: ["high", "medium", "low"] },
                      },
                      required: ["type", "title", "durationMinutes", "tasks", "priority"],
                      additionalProperties: false,
                    },
                  },
                  coachingNote: { type: "string", description: "1-2 sentence motivational or strategic coaching note" },
                },
                required: ["headline", "focusAreas", "blocks", "coachingNote"],
                additionalProperties: false,
              },
            },
          },
        });
        const raw = response.choices?.[0]?.message?.content;
        const text = typeof raw === "string" ? raw : JSON.stringify(raw);
        try {
          return JSON.parse(text) as {
            headline: string;
            focusAreas: string[];
            blocks: Array<{
              type: "coding" | "behavioral" | "sr_review" | "system_design" | "break";
              title: string;
              durationMinutes: number;
              tasks: string[];
              priority: "high" | "medium" | "low";
            }>;
            coachingNote: string;
          };
        } catch {
          return {
            headline: "Balanced Practice Session",
            focusAreas: ["Coding patterns", "Behavioral stories"],
            blocks: [
              { type: "coding" as const, title: "Coding Practice", durationMinutes: Math.floor(input.durationMinutes * 0.6), tasks: ["Solve 1-2 CTCI problems"], priority: "high" as const },
              { type: "behavioral" as const, title: "Behavioral Review", durationMinutes: Math.floor(input.durationMinutes * 0.4), tasks: ["Review STAR stories"], priority: "medium" as const },
            ],
            coachingNote: "Consistent daily practice is the key to interview success.",
          };
        }
      }),
  }),
  /**
   * systemDesign.debrief — LLM-powered IC-level debrief for a system design mock session.
   * Evaluates requirements, data model, API, scale, and Meta-specific depth.
   */
  systemDesign: router({
    debrief: publicProcedure
      .input(
        z.object({
          targetLevel: z.enum(["L6", "L7"]).default("L6"),
          problem: z.object({
            id: z.string(),
            title: z.string(),
            difficulty: z.string(),
            tagline: z.string(),
          }),
          durationSec: z.number(),
          sections: z.object({
            requirements: z.string(),
            dataModel: z.string(),
            api: z.string(),
            scaleBottlenecks: z.string(),
            metaTips: z.string(),
          }),
        })
      )
      .mutation(async ({ input }) => {
        const { invokeLLM } = await import("./_core/llm");
        const levelLabel = input.targetLevel === "L7" ? "Staff Engineer (L7)" : "Senior Engineer (L6)";
        const minutesSpent = Math.round(input.durationSec / 60);
        const systemPrompt = `You are a Meta engineering interview panel evaluating a candidate for ${levelLabel} on a System Design interview.
The candidate was given 45 minutes to design: "${input.problem.title}" (${input.problem.difficulty}).
They spent ${minutesSpent} minutes.

Evaluate each of the 5 dimensions below on a 1-5 scale and provide specific, actionable feedback.
Be calibrated to the ${input.targetLevel} bar at Meta. L7 requires demonstrable staff-level scope, trade-off depth, and Meta-scale thinking.
Do not be overly generous. Return a structured JSON debrief.`;
        const userMessage = [
          `=== PROBLEM ===${"\n"}${input.problem.title} — ${input.problem.tagline}`,
          `=== REQUIREMENTS ===${"\n"}${input.sections.requirements || "(not addressed)"}`,
          `=== DATA MODEL ===${"\n"}${input.sections.dataModel || "(not addressed)"}`,
          `=== API DESIGN ===${"\n"}${input.sections.api || "(not addressed)"}`,
          `=== SCALE & BOTTLENECKS ===${"\n"}${input.sections.scaleBottlenecks || "(not addressed)"}`,
          `=== META-SPECIFIC DEPTH ===${"\n"}${input.sections.metaTips || "(not addressed)"}`,
        ].join("\n\n");
        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "system_design_debrief",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  icLevelVerdict: { type: "string", enum: ["Strong Hire", "Hire", "Borderline", "No Hire"] },
                  overallSummary: { type: "string" },
                  requirementsScore: { type: "integer" },
                  requirementsFeedback: { type: "string" },
                  dataModelScore: { type: "integer" },
                  dataModelFeedback: { type: "string" },
                  apiScore: { type: "integer" },
                  apiFeedback: { type: "string" },
                  scaleScore: { type: "integer" },
                  scaleFeedback: { type: "string" },
                  metaDepthScore: { type: "integer" },
                  metaDepthFeedback: { type: "string" },
                  topStrengths: { type: "array", items: { type: "string" } },
                  topImprovements: { type: "array", items: { type: "string" } },
                  nextSteps: { type: "array", items: { type: "string" } },
                },
                required: [
                  "icLevelVerdict", "overallSummary",
                  "requirementsScore", "requirementsFeedback",
                  "dataModelScore", "dataModelFeedback",
                  "apiScore", "apiFeedback",
                  "scaleScore", "scaleFeedback",
                  "metaDepthScore", "metaDepthFeedback",
                  "topStrengths", "topImprovements", "nextSteps",
                ],
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
            overallSummary: string;
            requirementsScore: number; requirementsFeedback: string;
            dataModelScore: number; dataModelFeedback: string;
            apiScore: number; apiFeedback: string;
            scaleScore: number; scaleFeedback: string;
            metaDepthScore: number; metaDepthFeedback: string;
            topStrengths: string[]; topImprovements: string[]; nextSteps: string[];
          };
        } catch {
          return {
            icLevelVerdict: "Borderline" as const,
            overallSummary: "Unable to parse debrief. Please try again.",
            requirementsScore: 3, requirementsFeedback: "",
            dataModelScore: 3, dataModelFeedback: "",
            apiScore: 3, apiFeedback: "",
            scaleScore: 3, scaleFeedback: "",
            metaDepthScore: 3, metaDepthFeedback: "",
            topStrengths: [], topImprovements: [], nextSteps: [],
          };
        }
      }),
    followUp: publicProcedure
      .input(
        z.object({
          targetLevel: z.enum(["L6", "L7"]).default("L6"),
          problem: z.object({ id: z.string(), title: z.string(), difficulty: z.string(), tagline: z.string() }),
          sections: z.object({
            requirements: z.string(),
            dataModel: z.string(),
            api: z.string(),
            scaleBottlenecks: z.string(),
            metaTips: z.string(),
          }),
          verdict: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const { invokeLLM } = await import("./_core/llm");
        const levelLabel = input.targetLevel === "L7" ? "Staff Engineer (L7)" : "Senior Engineer (L6)";
        const systemPrompt = `You are a senior Meta interviewer conducting a follow-up drill after a system design debrief for ${levelLabel}.
The candidate just received a "${input.verdict}" verdict on "${input.problem.title}".
Generate 3 probing follow-up questions that target the weakest areas of their response.
Questions should be specific, realistic, and escalate in difficulty. Return structured JSON.`;
        const userContent = [
          `Requirements: ${input.sections.requirements || "(not addressed)"}`,
          `Data Model: ${input.sections.dataModel || "(not addressed)"}`,
          `API: ${input.sections.api || "(not addressed)"}`,
          `Scale: ${input.sections.scaleBottlenecks || "(not addressed)"}`,
          `Meta Depth: ${input.sections.metaTips || "(not addressed)"}`,
        ].join("\n");
        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userContent },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "follow_up_questions",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  questions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        question: { type: "string" },
                        dimension: { type: "string" },
                        hint: { type: "string" },
                      },
                      required: ["question", "dimension", "hint"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["questions"],
                additionalProperties: false,
              },
            },
          },
        });
        const raw = response.choices?.[0]?.message?.content;
        const text = typeof raw === "string" ? raw : JSON.stringify(raw);
        try {
          return JSON.parse(text) as { questions: Array<{ question: string; dimension: string; hint: string }> };
        } catch {
          return { questions: [
            { question: "How would you handle a 10× traffic spike?", dimension: "Scale & Bottlenecks", hint: "Think about horizontal scaling, caching layers, and rate limiting." },
            { question: "What happens if the primary database goes down?", dimension: "Data Model", hint: "Consider replication, failover, and consistency trade-offs." },
            { question: "How would you version your API without breaking existing clients?", dimension: "API Design", hint: "Consider versioning strategies: URL path, header, or query param." },
          ]};
        }
      }),
  }),

  /**
   * aiRound.debrief — LLM-powered IC-level debrief for AI-Enabled Round mock sessions.
   * Evaluates the 4 lenses: Problem Solving, Code Development, Verification & Debugging, Technical Communication.
   * Also scores AI tool usage and workflow adherence.
   */
  aiRound: router({
    debrief: publicProcedure
      .input(
        z.object({
          problemTitle: z.string(),
          problemScenario: z.string(),
          phases: z.array(z.object({
            type: z.enum(["bug-fix", "feature", "optimize"]),
            title: z.string(),
            answer: z.string(),
          })),
          workflowNotes: z.string().optional(),
          aiUsageNotes: z.string().optional(),
          targetLevel: z.enum(["L6", "L7"]).default("L6"),
          elapsedSeconds: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { invokeLLM } = await import("./_core/llm");
        const levelBar = input.targetLevel === "L7"
          ? "L7 Staff Engineer (owns large systems, drives technical direction, mentors others)"
          : "L6 Senior Engineer (independently solves complex problems, strong code quality and verification)";
        const phaseSummary = input.phases.map((p, i) =>
          `Phase ${i + 1} (${p.type} — ${p.title}):\n${p.answer || "(no answer provided)"}`
        ).join("\n\n");
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `You are a senior Meta engineering interviewer evaluating an AI-Enabled Coding Round mock session.
You evaluate candidates on 4 lenses:
1. Problem Solving — clarification, requirements, approach selection
2. Code Development & Understanding — code quality, correctness, style matching
3. Verification & Debugging — test coverage, bug identification, iterative fixing
4. Technical Communication — narration, trade-off discussion, AI tool guidance
Also evaluate AI Tool Usage — how well the candidate directed the AI vs. letting it drive.
Return ONLY valid JSON matching the schema exactly.`,
            },
            {
              role: "user",
              content: `Problem: ${input.problemTitle}\nScenario: ${input.problemScenario}\nTarget level: ${levelBar}\n\nCandidate responses by phase:\n${phaseSummary}\n\nWorkflow notes: ${input.workflowNotes || "none"}\nAI usage notes: ${input.aiUsageNotes || "none"}\nTime elapsed: ${input.elapsedSeconds ? Math.round(input.elapsedSeconds / 60) + " min" : "unknown"}\n\nEvaluate and return JSON.`,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "ai_round_debrief",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  icLevelVerdict: { type: "string", enum: ["Strong Hire", "Hire", "Borderline", "No Hire"] },
                  overallSummary: { type: "string" },
                  problemSolvingScore: { type: "number" },
                  problemSolvingFeedback: { type: "string" },
                  codeDevelopmentScore: { type: "number" },
                  codeDevelopmentFeedback: { type: "string" },
                  verificationScore: { type: "number" },
                  verificationFeedback: { type: "string" },
                  communicationScore: { type: "number" },
                  communicationFeedback: { type: "string" },
                  aiToolUsageScore: { type: "number" },
                  aiToolUsageFeedback: { type: "string" },
                  topStrengths: { type: "array", items: { type: "string" } },
                  topImprovements: { type: "array", items: { type: "string" } },
                  nextSteps: { type: "array", items: { type: "string" } },
                },
                required: [
                  "icLevelVerdict", "overallSummary",
                  "problemSolvingScore", "problemSolvingFeedback",
                  "codeDevelopmentScore", "codeDevelopmentFeedback",
                  "verificationScore", "verificationFeedback",
                  "communicationScore", "communicationFeedback",
                  "aiToolUsageScore", "aiToolUsageFeedback",
                  "topStrengths", "topImprovements", "nextSteps",
                ],
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
            overallSummary: string;
            problemSolvingScore: number; problemSolvingFeedback: string;
            codeDevelopmentScore: number; codeDevelopmentFeedback: string;
            verificationScore: number; verificationFeedback: string;
            communicationScore: number; communicationFeedback: string;
            aiToolUsageScore: number; aiToolUsageFeedback: string;
            topStrengths: string[]; topImprovements: string[]; nextSteps: string[];
          };
        } catch {
          return {
            icLevelVerdict: "Borderline" as const,
            overallSummary: "Unable to parse debrief. Please try again.",
            problemSolvingScore: 3, problemSolvingFeedback: "",
            codeDevelopmentScore: 3, codeDevelopmentFeedback: "",
            verificationScore: 3, verificationFeedback: "",
            communicationScore: 3, communicationFeedback: "",
            aiToolUsageScore: 3, aiToolUsageFeedback: "",
            topStrengths: [], topImprovements: [], nextSteps: [],
          };
        }
      }),
    drillDeeper: publicProcedure
      .input(
        z.object({
          targetLevel: z.enum(["L6", "L7"]).default("L6"),
          problemTitle: z.string(),
          problemDomain: z.string(),
          verdict: z.string(),
          weakDimensions: z.array(z.string()),
          phaseAnswers: z.array(z.string()),
        })
      )
      .mutation(async ({ input }) => {
        const { invokeLLM } = await import("./_core/llm");
        const levelLabel = input.targetLevel === "L7" ? "Staff Engineer (L7)" : "Senior Engineer (L6)";
        const systemPrompt = `You are a senior Meta interviewer running a targeted drill-deeper session after an AI-Enabled Coding Round debrief for ${levelLabel}. The candidate received a "${input.verdict}" verdict on "${input.problemTitle}" (domain: ${input.problemDomain}). Their weakest dimensions were: ${input.weakDimensions.join(", ")}. Generate 4 targeted follow-up challenges that directly address those weaknesses. Return structured JSON.`;
        const userContent = input.phaseAnswers.map((a, i) => `Phase ${i + 1}: ${a || "(no answer)"}`).join("\n");
        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userContent },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "drill_deeper_challenges",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  challenges: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        dimension: { type: "string" },
                        prompt: { type: "string" },
                        hint: { type: "string" },
                        modelAnswer: { type: "string" },
                      },
                      required: ["title", "dimension", "prompt", "hint", "modelAnswer"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["challenges"],
                additionalProperties: false,
              },
            },
          },
        });
        const raw = response.choices?.[0]?.message?.content;
        const text = typeof raw === "string" ? raw : JSON.stringify(raw);
        try {
          return JSON.parse(text) as { challenges: Array<{ title: string; dimension: string; prompt: string; hint: string; modelAnswer: string }> };
        } catch {
          return {
            challenges: [
              { title: "Optimize for Space", dimension: "Code Development", prompt: "Rewrite your solution using O(1) extra space.", hint: "Consider in-place modification.", modelAnswer: "Use two pointers or index manipulation to avoid extra allocations." },
              { title: "Add Error Handling", dimension: "Verification & Debugging", prompt: "What edge cases does your current solution miss? Add proper guards.", hint: "Think about null inputs, empty arrays, integer overflow.", modelAnswer: "Guard against null/empty inputs at the top of the function, check for overflow with long arithmetic." },
              { title: "Explain Trade-offs", dimension: "Technical Communication", prompt: "Compare your approach to two alternatives. When would each be preferred?", hint: "Think about time vs. space trade-offs and input characteristics.", modelAnswer: "Discuss the hash map approach (O(n) time, O(n) space) vs. sort-based (O(n log n) time, O(1) space) vs. brute force." },
              { title: "Scale to 10x Input", dimension: "Problem Solving", prompt: "How would your solution change if the input was 10x larger (e.g., 10M elements)?", hint: "Consider streaming, chunking, or distributed approaches.", modelAnswer: "For 10M elements, consider external merge sort or streaming algorithms that process data in chunks." },
            ],
          };
        }
      }),
  }),

  /**
   * requirementsTrainer.score — LLM-scores a candidate's requirements clarification questions
   * against a given system design problem. Returns per-dimension scores and coaching feedback.
   * This targets the #1 failure mode: jumping to architecture before defining the problem.
   */
  requirementsTrainer: router({
    score: publicProcedure
      .input(
        z.object({
          problemTitle: z.string(),
          problemTagline: z.string(),
          candidateQuestions: z.string().min(5, "Please write at least one clarifying question"),
          targetLevel: z.enum(["L6", "L7"]).default("L6"),
        })
      )
      .mutation(async ({ input }) => {
        const { invokeLLM } = await import("./_core/llm");
        const levelLabel = input.targetLevel === "L7" ? "Staff Engineer (L7)" : "Senior Engineer (L6)";
        const systemPrompt = `You are a senior Meta system design interviewer evaluating a candidate's requirements clarification for ${levelLabel}.
The problem is: "${input.problemTitle}" — ${input.problemTagline}.

At Meta, requirements clarification accounts for ~30% of the system design score. Evaluate the candidate's clarifying questions on 4 dimensions:
1. Functional Coverage (1-5): Did they identify the core user actions and features? Did they distinguish must-have from nice-to-have?
2. Scale & NFR Probing (1-5): Did they ask about DAU, QPS, latency SLOs, availability, consistency requirements?
3. Constraint Discovery (1-5): Did they ask about budget, team size, timeline, existing infrastructure, or Meta-specific context?
4. Scope Narrowing (1-5): Did they propose a focused scope to make the problem tractable in 45 minutes?

Also identify:
- The single most important question they MISSED that a ${input.targetLevel} candidate should always ask
- Whether they asked about the right things in the right order (broad → narrow)
- An IC-level verdict: L4 (too shallow), L5 (adequate), L6 (strong), L7 (exceptional)

Return ONLY valid JSON.`;
        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Candidate's clarifying questions:\n${input.candidateQuestions}` },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "requirements_trainer_score",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  functionalCoverageScore: { type: "integer" },
                  functionalCoverageFeedback: { type: "string" },
                  scaleNFRScore: { type: "integer" },
                  scaleNFRFeedback: { type: "string" },
                  constraintDiscoveryScore: { type: "integer" },
                  constraintDiscoveryFeedback: { type: "string" },
                  scopeNarrowingScore: { type: "integer" },
                  scopeNarrowingFeedback: { type: "string" },
                  biggestMissedQuestion: { type: "string" },
                  orderingFeedback: { type: "string" },
                  icLevelVerdict: { type: "string", enum: ["L4", "L5", "L6", "L7"] },
                  overallCoaching: { type: "string" },
                },
                required: [
                  "functionalCoverageScore", "functionalCoverageFeedback",
                  "scaleNFRScore", "scaleNFRFeedback",
                  "constraintDiscoveryScore", "constraintDiscoveryFeedback",
                  "scopeNarrowingScore", "scopeNarrowingFeedback",
                  "biggestMissedQuestion", "orderingFeedback",
                  "icLevelVerdict", "overallCoaching",
                ],
                additionalProperties: false,
              },
            },
          },
        });
        const raw = response.choices?.[0]?.message?.content;
        const text = typeof raw === "string" ? raw : JSON.stringify(raw);
        try {
          return JSON.parse(text) as {
            functionalCoverageScore: number; functionalCoverageFeedback: string;
            scaleNFRScore: number; scaleNFRFeedback: string;
            constraintDiscoveryScore: number; constraintDiscoveryFeedback: string;
            scopeNarrowingScore: number; scopeNarrowingFeedback: string;
            biggestMissedQuestion: string; orderingFeedback: string;
            icLevelVerdict: "L4" | "L5" | "L6" | "L7"; overallCoaching: string;
          };
        } catch {
          return {
            functionalCoverageScore: 3, functionalCoverageFeedback: "Unable to parse response.",
            scaleNFRScore: 3, scaleNFRFeedback: "",
            constraintDiscoveryScore: 3, constraintDiscoveryFeedback: "",
            scopeNarrowingScore: 3, scopeNarrowingFeedback: "",
            biggestMissedQuestion: "What is the expected read-to-write ratio?",
            orderingFeedback: "Start with functional requirements, then scale, then constraints.",
            icLevelVerdict: "L5" as const, overallCoaching: "Please try again.",
          };
        }
      }),
  }),

  /**
   * tradeoffDrill.score — LLM-scores a candidate's trade-off justification for a binary
   * architecture decision. Targets the #2 failure mode: asserting choices without explaining trade-offs.
   */
  tradeoffDrill: router({
    score: publicProcedure
      .input(
        z.object({
          decision: z.string(),
          optionA: z.string(),
          optionB: z.string(),
          candidateChoice: z.enum(["A", "B"]),
          candidateJustification: z.string().min(10, "Please write a justification"),
          context: z.string(),
          targetLevel: z.enum(["L6", "L7"]).default("L6"),
        })
      )
      .mutation(async ({ input }) => {
        const { invokeLLM } = await import("./_core/llm");
        const levelLabel = input.targetLevel === "L7" ? "Staff Engineer (L7)" : "Senior Engineer (L6)";
        const systemPrompt = `You are a senior Meta system design interviewer evaluating a candidate's trade-off articulation for ${levelLabel}.

The decision: "${input.decision}"
Option A: ${input.optionA}
Option B: ${input.optionB}
Context: ${input.context}

The candidate chose Option ${input.candidateChoice} and justified it below.

At Meta, trade-off articulation accounts for ~25-30% of the system design score. Evaluate on 4 dimensions:
1. Correctness (1-5): Is their choice reasonable for the given context?
2. Depth of Reasoning (1-5): Did they explain WHY — not just WHAT? Did they cite specific trade-offs (latency, consistency, complexity, cost)?
3. Counter-argument Awareness (1-5): Did they acknowledge the downsides of their choice and when the other option would be better?
4. Meta-Scale Calibration (1-5): Did they reason about Meta-scale implications (billions of users, global distribution, cost at scale)?

Also provide:
- The model answer: what a strong ${input.targetLevel} candidate would say
- The single biggest gap in their reasoning
- Whether they would pass this dimension at ${input.targetLevel}

Return ONLY valid JSON.`;
        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Candidate chose Option ${input.candidateChoice} and justified:\n${input.candidateJustification}` },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "tradeoff_drill_score",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  correctnessScore: { type: "integer" },
                  correctnessFeedback: { type: "string" },
                  depthScore: { type: "integer" },
                  depthFeedback: { type: "string" },
                  counterArgScore: { type: "integer" },
                  counterArgFeedback: { type: "string" },
                  metaScaleScore: { type: "integer" },
                  metaScaleFeedback: { type: "string" },
                  modelAnswer: { type: "string" },
                  biggestGap: { type: "string" },
                  passesBar: { type: "boolean" },
                },
                required: [
                  "correctnessScore", "correctnessFeedback",
                  "depthScore", "depthFeedback",
                  "counterArgScore", "counterArgFeedback",
                  "metaScaleScore", "metaScaleFeedback",
                  "modelAnswer", "biggestGap", "passesBar",
                ],
                additionalProperties: false,
              },
            },
          },
        });
        const raw = response.choices?.[0]?.message?.content;
        const text = typeof raw === "string" ? raw : JSON.stringify(raw);
        try {
          return JSON.parse(text) as {
            correctnessScore: number; correctnessFeedback: string;
            depthScore: number; depthFeedback: string;
            counterArgScore: number; counterArgFeedback: string;
            metaScaleScore: number; metaScaleFeedback: string;
            modelAnswer: string; biggestGap: string; passesBar: boolean;
          };
        } catch {
          return {
            correctnessScore: 3, correctnessFeedback: "Unable to parse response.",
            depthScore: 3, depthFeedback: "",
            counterArgScore: 3, counterArgFeedback: "",
            metaScaleScore: 3, metaScaleFeedback: "",
            modelAnswer: "Please try again.",
            biggestGap: "Explain the specific trade-offs more concretely.",
            passesBar: false,
          };
        }
      }),
  }),

  /**
   * mathTrainer.score — LLM checks a candidate's back-of-envelope calculations
   * for QPS, storage, and bandwidth, flagging order-of-magnitude errors.
   */
  mathTrainer: router({
    score: publicProcedure
      .input(
        z.object({
          scenarioTitle: z.string(),
          scenarioContext: z.string(),
          qpsAnswer: z.string(),
          storageAnswer: z.string(),
          bandwidthAnswer: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const { invokeLLM } = await import("./_core/llm");
        const prompt = `You are a Meta staff engineer evaluating a candidate's back-of-envelope estimation for a system design interview.

Scenario: ${input.scenarioTitle}
Context: ${input.scenarioContext}

Candidate's answers:
- QPS (Queries Per Second): ${input.qpsAnswer}
- Storage (per year): ${input.storageAnswer}
- Bandwidth (ingress/egress): ${input.bandwidthAnswer}

Evaluate each answer on a 1-5 scale. Check:
1. Is the order of magnitude correct (within 10x)?
2. Did they show their reasoning/formula?
3. Are the units correct?
4. Did they account for Meta-scale factors (replication, CDN, peak vs avg)?

Return JSON with these exact fields:
- qpsScore (1-5), qpsFeedback (string), qpsModelAnswer (string)
- storageScore (1-5), storageFeedback (string), storageModelAnswer (string)
- bandwidthScore (1-5), bandwidthFeedback (string), bandwidthModelAnswer (string)
- overallFeedback (string, 1-2 sentences on biggest gap)
- passesBar (boolean, true if all scores >= 3)
- keyFormula (string, the most important formula they should memorize for this scenario)`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: "You are a Meta staff engineer evaluating back-of-envelope estimation skills. Be precise about order-of-magnitude errors. Return only valid JSON." },
            { role: "user", content: prompt },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "math_trainer_score",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  qpsScore: { type: "integer" },
                  qpsFeedback: { type: "string" },
                  qpsModelAnswer: { type: "string" },
                  storageScore: { type: "integer" },
                  storageFeedback: { type: "string" },
                  storageModelAnswer: { type: "string" },
                  bandwidthScore: { type: "integer" },
                  bandwidthFeedback: { type: "string" },
                  bandwidthModelAnswer: { type: "string" },
                  overallFeedback: { type: "string" },
                  passesBar: { type: "boolean" },
                  keyFormula: { type: "string" },
                },
                required: [
                  "qpsScore", "qpsFeedback", "qpsModelAnswer",
                  "storageScore", "storageFeedback", "storageModelAnswer",
                  "bandwidthScore", "bandwidthFeedback", "bandwidthModelAnswer",
                  "overallFeedback", "passesBar", "keyFormula",
                ],
                additionalProperties: false,
              },
            },
          },
        });
        const raw = response.choices?.[0]?.message?.content;
        const text = typeof raw === "string" ? raw : JSON.stringify(raw);
        try {
          return JSON.parse(text) as {
            qpsScore: number; qpsFeedback: string; qpsModelAnswer: string;
            storageScore: number; storageFeedback: string; storageModelAnswer: string;
            bandwidthScore: number; bandwidthFeedback: string; bandwidthModelAnswer: string;
            overallFeedback: string; passesBar: boolean; keyFormula: string;
          };
        } catch {
          return {
            qpsScore: 3, qpsFeedback: "Unable to parse response.", qpsModelAnswer: "Please try again.",
            storageScore: 3, storageFeedback: "", storageModelAnswer: "",
            bandwidthScore: 3, bandwidthFeedback: "", bandwidthModelAnswer: "",
            overallFeedback: "Please try again.",
            passesBar: false,
            keyFormula: "QPS = DAU × actions_per_day / 86400",
          };
        }
       }),
  }),

  /**
   * signalDetector.classify — LLM classifies each paragraph of a candidate's
   * System Design mock answer as L4/L5/L6/L7, explaining what signal level
   * each paragraph demonstrates and what would elevate it.
   */
  signalDetector: router({
    classify: publicProcedure
      .input(
        z.object({
          targetLevel: z.string(),
          problemTitle: z.string(),
          sections: z.object({
            requirements: z.string(),
            dataModel: z.string(),
            api: z.string(),
            scaleBottlenecks: z.string(),
            metaTips: z.string(),
          }),
        })
      )
      .mutation(async ({ input }) => {
        const { invokeLLM } = await import("./_core/llm");

        // Split each section into paragraphs and classify
        const allParagraphs: { section: string; text: string }[] = [];
        const sectionLabels: Record<string, string> = {
          requirements: "Requirements",
          dataModel: "Data Model",
          api: "API Design",
          scaleBottlenecks: "Scale & Bottlenecks",
          metaTips: "Meta-Specific Depth",
        };
        for (const [key, label] of Object.entries(sectionLabels)) {
          const text = input.sections[key as keyof typeof input.sections];
          if (!text.trim()) continue;
          const paragraphs = text.split(/\n{2,}/).map(p => p.trim()).filter(p => p.length > 20);
          for (const para of paragraphs) {
            allParagraphs.push({ section: label, text: para });
          }
        }

        if (allParagraphs.length === 0) {
          return { classifications: [] as { section: string; text: string; level: string; reasoning: string; elevationTip: string }[] };
        }

        const paragraphList = allParagraphs
          .map((p, i) => `[${i}] (${p.section}) ${p.text}`)
          .join("\n\n");

        const prompt = `You are a Meta staff engineer scoring a ${input.targetLevel} system design interview for the problem: "${input.problemTitle}".

For each numbered paragraph below, classify the IC signal level it demonstrates:
- L4: Basic awareness, generic statements, no depth ("We need a database", "Use caching")
- L5: Correct but surface-level (names the right technology, gives one reason)
- L6: Concrete trade-off reasoning, quantified claims, considers failure modes
- L7: Exceptional depth — references Meta internals, multi-dimensional trade-offs, proactively addresses edge cases

Paragraphs to classify:
${paragraphList}

Return a JSON array with one object per paragraph index:
[
  {
    "index": 0,
    "level": "L5",
    "reasoning": "Names the right approach but doesn't explain why or quantify the benefit",
    "elevationTip": "Add: 'because at 500M DAU, offset pagination causes full table scans — cursor pagination keeps O(1) per page'"
  },
  ...
]`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: "You are a Meta staff engineer scoring system design interview answers. Be precise and specific. Return only valid JSON array." },
            { role: "user", content: prompt },
          ],
        });

        const raw = response.choices?.[0]?.message?.content;
        const text = typeof raw === "string" ? raw : JSON.stringify(raw);

        try {
          // Extract JSON array from response
          const jsonMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
          const parsed: { index: number; level: string; reasoning: string; elevationTip: string }[] = jsonMatch
            ? JSON.parse(jsonMatch[0])
            : JSON.parse(text);

          const classifications = parsed.map(item => ({
            section: allParagraphs[item.index]?.section ?? "Unknown",
            text: allParagraphs[item.index]?.text ?? "",
            level: item.level,
            reasoning: item.reasoning,
            elevationTip: item.elevationTip,
          }));

          return { classifications };
        } catch {
          // Fallback: return all paragraphs as L5 with generic feedback
          return {
            classifications: allParagraphs.map(p => ({
              section: p.section,
              text: p.text,
              level: "L5",
              reasoning: "Unable to classify — please try again.",
              elevationTip: "Add specific trade-off reasoning and quantified claims.",
            })),
          };
        }
      }),
  }),

  /**
   * stressTest.score — LLM scores a candidate's failure cascade reasoning for a component stress scenario.
   * Targets Root Cause 4: treating components as opaque black boxes.
   */
  stressTest: router({
    score: publicProcedure
      .input(
        z.object({
          component: z.string(),
          scenario: z.string(),
          candidateAnswer: z.string().min(10),
        })
      )
      .mutation(async ({ input }) => {
        const { invokeLLM } = await import("./_core/llm");
        const systemPrompt = `You are a senior Meta system design interviewer evaluating a candidate's ability to reason through component failure cascades.
Component: ${input.component}
Scenario: ${input.scenario}

Evaluate the candidate's answer on 3 dimensions (each 1-5):
1. Failure Mode Identification (1-5): Did they correctly identify what fails first and the cascade?
2. Mitigation Proposal (1-5): Did they propose concrete, actionable mitigations?
3. Impact Quantification (1-5): Did they quantify the impact (latency, error rate, data loss, etc.)?

Also provide:
- failureModeFeedback: specific feedback on their failure mode reasoning
- mitigationFeedback: specific feedback on their mitigation proposals
- quantificationFeedback: specific feedback on their quantification
- overallFeedback: the single most important thing they should add/improve
- passesBar: boolean — does this answer pass the L6 bar for Technical Depth?

Return ONLY valid JSON.`;
        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Candidate's answer:\n${input.candidateAnswer}` },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "stress_test_score",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  failureModeScore: { type: "integer" },
                  failureModeFeedback: { type: "string" },
                  mitigationScore: { type: "integer" },
                  mitigationFeedback: { type: "string" },
                  quantificationScore: { type: "integer" },
                  quantificationFeedback: { type: "string" },
                  overallFeedback: { type: "string" },
                  passesBar: { type: "boolean" },
                },
                required: ["failureModeScore","failureModeFeedback","mitigationScore","mitigationFeedback","quantificationScore","quantificationFeedback","overallFeedback","passesBar"],
                additionalProperties: false,
              },
            },
          },
        });
        const raw = response.choices[0].message.content ?? "{}";
        const text = typeof raw === "string" ? raw : JSON.stringify(raw);
        return JSON.parse(text) as {
          failureModeScore: number; failureModeFeedback: string;
          mitigationScore: number; mitigationFeedback: string;
          quantificationScore: number; quantificationFeedback: string;
          overallFeedback: string; passesBar: boolean;
        };
      }),
  }),

  skepticScoring: router({
    score: publicProcedure
      .input(z.object({
        problem: z.string(),
        challenges: z.array(z.object({
          section: z.string(),
          challenge: z.string(),
          response: z.string(),
        })),
      }))
      .mutation(async ({ input }) => {
        const { invokeLLM } = await import("./_core/llm");
        const challengeSummary = input.challenges
          .map((c, i) => `Challenge ${i+1} (${c.section}): "${c.challenge}"\nCandidate response: "${c.response}"`)
          .join("\n\n");
        const response = await invokeLLM({
          messages: [
            { role: "system", content: `You are a Meta Staff Engineer evaluating how well a candidate defended their system design decisions against skeptical challenges for the problem: ${input.problem}. Score each response on three dimensions (1-5): Directness (did they directly address the challenge?), Technical Depth (did they cite specific trade-offs, numbers, or Meta-scale context?), Confidence (did they hold their position or cave without justification?). Provide an overall Challenge Defense Quality score (1-5) and a brief coaching note for each response.` },
            { role: "user", content: `Problem: ${input.problem}\n\nSkeptic Challenge Responses:\n${challengeSummary}\n\nScore each response and provide an overall Challenge Defense Quality score.` },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "skeptic_scoring",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  overallScore: { type: "integer" },
                  overallFeedback: { type: "string" },
                  perChallenge: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        challengeIndex: { type: "integer" },
                        directnessScore: { type: "integer" },
                        depthScore: { type: "integer" },
                        confidenceScore: { type: "integer" },
                        avgScore: { type: "number" },
                        coachingNote: { type: "string" },
                      },
                      required: ["challengeIndex","directnessScore","depthScore","confidenceScore","avgScore","coachingNote"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["overallScore","overallFeedback","perChallenge"],
                additionalProperties: false,
              },
            },
          },
        });
        const raw = response.choices[0].message.content ?? "{}";
        const text = typeof raw === "string" ? raw : JSON.stringify(raw);
        return JSON.parse(text) as {
          overallScore: number;
          overallFeedback: string;
          perChallenge: { challengeIndex: number; directnessScore: number; depthScore: number; confidenceScore: number; avgScore: number; coachingNote: string }[];
        };
      }),
  }),
  /**
   * metaRubric.score — LLM-powered Meta SWE rubric assessment.
   * Scores the 4 official Meta focus areas: Problem Solving, Coding, Verification, Communication.
   * Each dimension uses Meta's exact 6-point scale:
   *   Insufficient | Moderate | Solid | Strong | Exceptional | Can't Assess
   */
  metaRubric: router({
    score: publicProcedure
      .input(
        z.object({
          problemName: z.string().min(1),
          approachText: z.string().min(10, "Approach must be at least 10 characters"),
          codeText: z.string().optional().default(""),
          targetLevel: z.enum(["L5", "L6", "L7"]).default("L6"),
        })
      )
      .mutation(async ({ input }) => {
        const { invokeLLM } = await import("./_core/llm");
        const levelLabel = input.targetLevel === "L7" ? "Staff Engineer (L7)" : input.targetLevel === "L6" ? "Senior Engineer (L6)" : "Software Engineer (L5)";
        const RATINGS = ["Insufficient", "Moderate", "Solid", "Strong", "Exceptional", "Can't Assess"] as const;
        const systemPrompt = `You are a Meta software engineering interviewer evaluating a candidate for ${levelLabel}.

You must assess the candidate on Meta's official 4 focus areas using Meta's exact 6-point rating scale:
- Insufficient: Does not meet the bar; significant gaps
- Moderate: Below bar; some understanding but notable weaknesses
- Solid: Meets the bar; competent with minor gaps
- Strong: Above bar; clear strengths, minimal weaknesses
- Exceptional: Significantly above bar; outstanding performance
- Can't Assess: Not enough information to evaluate this dimension

Focus Areas:
1. Problem Solving: Ability to break down the problem, identify the right algorithm/data structure, handle constraints, and arrive at an optimal solution. Looks for: clarifying questions, recognizing patterns, handling edge cases, iterating from brute force to optimal.
2. Coding: Quality of the actual code written or described. Looks for: clean readable code, correct syntax, appropriate data structures, handling of edge cases in code, no major bugs.
3. Verification: Ability to test and validate the solution. Looks for: tracing through examples, identifying bugs, writing test cases, checking edge cases, complexity analysis.
4. Communication: Clarity and structure of explanation throughout. Looks for: thinking out loud, explaining trade-offs, responding to hints, clear articulation of approach.

For each dimension, provide:
- rating: one of exactly ["Insufficient", "Moderate", "Solid", "Strong", "Exceptional", "Can't Assess"]
- rationale: 2-3 sentences explaining the rating with specific evidence from the candidate's response
- keyStrength: one specific strength (or null if Insufficient/Can't Assess)
- keyGap: one specific gap to address (or null if Exceptional)

Also provide:
- overallVerdict: one of ["No Hire", "Lean No Hire", "Lean Hire", "Hire", "Strong Hire"]
- summaryFeedback: 2-3 sentence overall coaching note

Base your assessment ONLY on the provided approach text and code. Be calibrated to the ${levelLabel} bar.`;

        const userMessage = `Problem: ${input.problemName}\n\nCandidate's Approach:\n${input.approachText}${input.codeText ? `\n\nCandidate's Code:\n${input.codeText}` : ""}`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "meta_rubric_score",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  problemSolving: {
                    type: "object",
                    properties: {
                      rating: { type: "string" },
                      rationale: { type: "string" },
                      keyStrength: { type: ["string", "null"] },
                      keyGap: { type: ["string", "null"] },
                    },
                    required: ["rating", "rationale", "keyStrength", "keyGap"],
                    additionalProperties: false,
                  },
                  coding: {
                    type: "object",
                    properties: {
                      rating: { type: "string" },
                      rationale: { type: "string" },
                      keyStrength: { type: ["string", "null"] },
                      keyGap: { type: ["string", "null"] },
                    },
                    required: ["rating", "rationale", "keyStrength", "keyGap"],
                    additionalProperties: false,
                  },
                  verification: {
                    type: "object",
                    properties: {
                      rating: { type: "string" },
                      rationale: { type: "string" },
                      keyStrength: { type: ["string", "null"] },
                      keyGap: { type: ["string", "null"] },
                    },
                    required: ["rating", "rationale", "keyStrength", "keyGap"],
                    additionalProperties: false,
                  },
                  communication: {
                    type: "object",
                    properties: {
                      rating: { type: "string" },
                      rationale: { type: "string" },
                      keyStrength: { type: ["string", "null"] },
                      keyGap: { type: ["string", "null"] },
                    },
                    required: ["rating", "rationale", "keyStrength", "keyGap"],
                    additionalProperties: false,
                  },
                  overallVerdict: { type: "string" },
                  summaryFeedback: { type: "string" },
                },
                required: ["problemSolving", "coding", "verification", "communication", "overallVerdict", "summaryFeedback"],
                additionalProperties: false,
              },
            },
          },
        });

        const raw = response.choices?.[0]?.message?.content;
        const text = typeof raw === "string" ? raw : JSON.stringify(raw);
        try {
          return JSON.parse(text) as {
            problemSolving: { rating: string; rationale: string; keyStrength: string | null; keyGap: string | null };
            coding: { rating: string; rationale: string; keyStrength: string | null; keyGap: string | null };
            verification: { rating: string; rationale: string; keyStrength: string | null; keyGap: string | null };
            communication: { rating: string; rationale: string; keyStrength: string | null; keyGap: string | null };
            overallVerdict: string;
            summaryFeedback: string;
          };
        } catch {
          return {
            problemSolving: { rating: "Can't Assess", rationale: "Unable to parse AI response.", keyStrength: null, keyGap: null },
            coding: { rating: "Can't Assess", rationale: "Unable to parse AI response.", keyStrength: null, keyGap: null },
            verification: { rating: "Can't Assess", rationale: "Unable to parse AI response.", keyStrength: null, keyGap: null },
            communication: { rating: "Can't Assess", rationale: "Unable to parse AI response.", keyStrength: null, keyGap: null },
            overallVerdict: "Can't Assess",
            summaryFeedback: "Unable to generate feedback. Please try again.",
          };
        }
      }),
  }),
  /**
   * metaScreenDebrief — AI-generated debrief for a completed Meta coding screen simulation.
   * Receives structured focus-area notes + ratings and returns a Proceed/Do Not Proceed recommendation
   * with per-dimension coaching notes calibrated to the target level.
   */
  metaScreenDebrief: publicProcedure
    .input(
      z.object({
        summary: z.string().min(10),
        targetLevel: z.enum(["E4", "E5", "E6", "E6+"]),
        overallRating: z.string(),
        recommendation: z.string(),
        testResults: z.string().optional(), // JSON string of Judge0 execution results per question
      })
    )
    .mutation(async ({ input }) => {
      const { invokeLLM } = await import("./_core/llm");
      const levelLabel = {
        E4: "SWE (E4)",
        E5: "Senior SWE (E5)",
        E6: "Staff SWE (E6)",
        "E6+": "Senior Staff / Principal SWE (E6+)",
      }[input.targetLevel];

      // Parse execution results for richer AI scoring
      let execSummary = "";
      if (input.testResults) {
        try {
          const results = JSON.parse(input.testResults) as Array<{
            questionIndex: number;
            problemName: string;
            difficulty: string;
            language: string;
            submitted: boolean;
            passed: boolean;
            statusDescription: string;
            executionTime: string | null;
            hasCompileError: boolean;
            hasRuntimeError: boolean;
          }>;
          execSummary = "\n\n## Code Execution Results (Judge0)\n" + results.map(r =>
            `Q${r.questionIndex} (${r.problemName}, ${r.difficulty}, ${r.language}): ` +
            (r.submitted
              ? `${r.passed ? "✓ PASSED" : "✗ FAILED"} — ${r.statusDescription}` +
                (r.executionTime ? ` (${r.executionTime}s)` : "") +
                (r.hasCompileError ? " [compile error]" : "") +
                (r.hasRuntimeError ? " [runtime error]" : "")
              : "Not submitted")
          ).join("\n");
        } catch { /* ignore parse errors */ }
      }

      const systemPrompt = `You are a senior Meta engineering interview coach who has conducted hundreds of coding screen interviews.
You are reviewing a candidate's coding screen for the ${levelLabel} bar.

You have access to:
1. The candidate's self-rated focus area scores (Problem Solving, Coding, Verification, Communication)
2. Their interviewer-style notes per dimension
3. ACTUAL CODE EXECUTION RESULTS from Judge0 — use these to objectively score the Coding and Verification dimensions

Your job is to:
1. Validate or challenge the candidate's self-ratings, using execution results as ground truth for Coding and Verification
2. If code passed: confirm or upgrade Coding/Verification ratings. If code failed: identify whether it was a logic error, compile error, or runtime error and adjust ratings accordingly
3. Identify the single biggest strength and the single most critical gap
4. Give 2-3 concrete, actionable coaching suggestions specific to the ${levelLabel} bar
5. Confirm or revise the Proceed / Do Not Proceed recommendation
6. Write a 2-3 sentence overall summary that a real interviewer would write in the debrief tool

Be direct, specific, and calibrated to the ${levelLabel} bar. Do not be generic.
Format your response in clear Markdown with sections: ## Overall Verdict, ## Execution Analysis, ## Dimension Analysis, ## Coaching Suggestions, ## Interviewer Summary.`;

      const userMessage = `Target Level: ${levelLabel}
Self-assessed Overall Rating: ${input.overallRating}
Self-assessed Recommendation: ${input.recommendation}
${execSummary}

## Focus Area Notes & Self-Ratings
${input.summary}`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
      });

      const debrief = response.choices?.[0]?.message?.content ?? "Unable to generate debrief. Please review your notes above.";
      const text = typeof debrief === "string" ? debrief : JSON.stringify(debrief);
      return { debrief: text };
    }),

  /**
   * interviewerChat.ask — LLM-powered mock interviewer chat for the coding screen simulator.
 * The AI plays the role of a Meta interviewer, asking clarifying questions and giving hints.
 */
  interviewerChat: router({
    ask: publicProcedure
      .input(
        z.object({
          problemName: z.string(),
          difficulty: z.enum(["Easy", "Medium", "Hard"]),
          targetLevel: z.enum(["E4", "E5", "E6", "E6+"]),
          currentCode: z.string().optional(),
          messages: z.array(
            z.object({
              role: z.enum(["user", "assistant"]),
              content: z.string(),
            })
          ),
        })
      )
      .mutation(async ({ input }) => {
        const { invokeLLM } = await import("./_core/llm");
        const levelLabel = input.targetLevel === "E6+" ? "Staff Engineer (E6+)" :
          input.targetLevel === "E6" ? "Senior Engineer (E6)" :
          input.targetLevel === "E5" ? "Engineer (E5)" : "Engineer (E4)";
        const systemPrompt = `You are an experienced Meta software engineer interviewing a candidate for the ${levelLabel} level.
The candidate is working on the LeetCode problem: "${input.problemName}" (${input.difficulty}).

Your role as the interviewer:
- Ask clarifying questions to understand the candidate's approach before they code
- Probe their understanding of time/space complexity
- Ask about edge cases they've considered
- If they're stuck, give a small nudge (not the full solution)
- Challenge their approach with follow-up questions ("What if the input is very large?", "Can you do better than O(n^2)?")
- Keep responses SHORT (1-3 sentences max) — you're in a real interview, not writing an essay
- Be professional but direct, like a real Meta interviewer
- Never give the full solution; only guide with questions and hints
- If they share code, comment on it specifically

Current candidate code (if any):
${input.currentCode ? "\`\`\`\n" + input.currentCode + "\n\`\`\`" : "(No code submitted yet)"}`;
        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            ...input.messages,
          ],
        });
        const reply = response.choices?.[0]?.message?.content ?? "I'm here — walk me through your approach.";
        const text = typeof reply === "string" ? reply : JSON.stringify(reply);
        return { reply: text };
      }),
  }),

  /**
   * deployStatus.get — fetches the latest GitHub Actions workflow run status for the repo.
   * Returns status: 'success' | 'in_progress' | 'failure' | 'unknown'
   */
  deployStatus: router({
    get: publicProcedure.query(async () => {
      try {
        const GITHUB_REPO = "owner/meta-interview-guide";
        const GITHUB_API = `https://api.github.com/repos/${GITHUB_REPO}/actions/runs?per_page=1&branch=main`;
        const response = await fetch(GITHUB_API, {
          headers: {
            Accept: "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            "User-Agent": "meta-interview-guide",
          },
        });
        if (!response.ok) {
          return { status: "unknown" as const, message: "GitHub API unavailable", updatedAt: null };
        }
        const data = await response.json() as {
          workflow_runs: Array<{
            status: string;
            conclusion: string | null;
            updated_at: string;
            html_url: string;
            name: string;
          }>;
        };
        const run = data.workflow_runs?.[0];
        if (!run) {
          return { status: "unknown" as const, message: "No workflow runs found", updatedAt: null };
        }
        let status: "success" | "in_progress" | "failure" | "unknown";
        if (run.status === "in_progress" || run.status === "queued" || run.status === "waiting") {
          status = "in_progress";
        } else if (run.status === "completed") {
          status = run.conclusion === "success" ? "success" : "failure";
        } else {
          status = "unknown";
        }
        return {
          status,
          message: run.name,
          updatedAt: run.updated_at,
          url: run.html_url,
        };
      } catch {
        return { status: "unknown" as const, message: "Error fetching status", updatedAt: null };
      }
    }),
  }),
  disclaimer: disclaimerRouter,
  collab: collabRouter,
  leaderboard: leaderboardRouter,
  ratings: ratingsRouter,
  ctci: ctciRouter,
  ctciProgress: ctciProgressRouter,
  mockHistory: mockHistoryRouter,
  onboarding: onboardingRouter,
  ai: aiRouter,
  highImpact: highImpactRouter,
  scores: scoresRouter,
  feedback: feedbackRouter,
  admin: adminRouter,
  adminPin: adminPinRouter,
  siteSettings: siteSettingsRouter,
  siteAccess: siteAccessRouter,
  adminUsers: adminUsersRouter,
  analytics: analyticsRouter,
});
export type AppRouter = typeof appRouter;
