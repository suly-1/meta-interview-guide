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
          targetLevel: z.enum(["IC6", "IC7", "IC7_PRINCIPAL"]).default("IC6"),
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
          ? "Principal/Senior Staff Engineer (IC7+)"
          : input.targetLevel === "IC7" ? "Staff Engineer (IC7)" : "Senior Engineer (IC6)";
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
Evaluate the candidate against the IC7+ bar at Meta:
- Cross-functional influence: Does the candidate drive alignment across multiple teams, orgs, or functions?
- Retrospective ownership: Do they demonstrate deep ownership of outcomes, including failures, with systemic improvements?
- Org-wide impact: Are their examples scoped to org-level or company-level impact, not just team-level?
- Communication & persuasion: Can they influence without authority, navigate ambiguity, and align senior stakeholders?
- Strategic thinking: Do they demonstrate long-horizon thinking, trade-off reasoning, and prioritisation at scale?
Be direct and calibrated. IC7+ requires clear evidence of staff-level leadership, not just strong IC execution.
Score behavioral from 1 (poor) to 5 (exceptional). Set codingScore to 0 and codingFeedback to "N/A — behavioral-only session".`;
          userMessage = `=== BEHAVIORAL INTERVIEW (60 min, IC7+ Principal/Senior Staff) ===\n${behavioralSection}`;
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
Do not be overly generous — IC7 requires demonstrable staff-level scope and impact.
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
        const systemPrompt = `You are an expert Meta IC6/IC7 interview coach building a personalised ${durationLabel} study session plan.
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
          targetLevel: z.enum(["IC6", "IC7"]).default("IC6"),
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
        const levelLabel = input.targetLevel === "IC7" ? "Staff Engineer (IC7)" : "Senior Engineer (IC6)";
        const minutesSpent = Math.round(input.durationSec / 60);
        const systemPrompt = `You are a Meta engineering interview panel evaluating a candidate for ${levelLabel} on a System Design interview.
The candidate was given 45 minutes to design: "${input.problem.title}" (${input.problem.difficulty}).
They spent ${minutesSpent} minutes.

Evaluate each of the 5 dimensions below on a 1-5 scale and provide specific, actionable feedback.
Be calibrated to the ${input.targetLevel} bar at Meta. IC7 requires demonstrable staff-level scope, trade-off depth, and Meta-scale thinking.
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
          targetLevel: z.enum(["IC6", "IC7"]).default("IC6"),
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
        const levelLabel = input.targetLevel === "IC7" ? "Staff Engineer (IC7)" : "Senior Engineer (IC6)";
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
          targetLevel: z.enum(["IC6", "IC7"]).default("IC6"),
          elapsedSeconds: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { invokeLLM } = await import("./_core/llm");
        const levelBar = input.targetLevel === "IC7"
          ? "IC7 Staff Engineer (owns large systems, drives technical direction, mentors others)"
          : "IC6 Senior Engineer (independently solves complex problems, strong code quality and verification)";
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
  }),
});

export type AppRouter = typeof appRouter;
