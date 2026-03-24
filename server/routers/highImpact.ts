/**
 * highImpact.ts — AI procedures for the 10 high-impact features
 *
 * Procedures:
 *  - highImpact.quantifyImpact       (#9)  Highlight missing metrics in a STAR answer
 *  - highImpact.personaStressTest    (#8)  Live persona exchange scoring
 *  - highImpact.remediationPlan      (#6)  5-problem plan for weak patterns
 *  - highImpact.interruptQuestion    (#1)  Generate a disruptive SD interviewer question
 *  - highImpact.gradeBoE             (#2)  Grade back-of-envelope estimation steps
 *  - highImpact.adversarialAttack    (#3)  Attack 3 weakest points of a system design
 *  - highImpact.adversarialDefense   (#3)  Score candidate's defense of a design point
 *  - highImpact.readinessReport      (#10) Weekly AI readiness report synthesis
 */

import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";

export const highImpactRouter = router({

  // ── #9 Impact Quantification Coach ────────────────────────────────────────
  quantifyImpact: publicProcedure
    .input(z.object({
      answer: z.string().max(3000),
      targetLevel: z.enum(["L4", "L5", "L6", "L7"]).default("L6"),
    }))
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a Meta ${input.targetLevel} interview coach specializing in behavioral answers.
Your job is to analyze a STAR answer and identify every sentence or clause that SHOULD contain a metric but doesn't.
For each gap, suggest the specific metric type the candidate should add (e.g., "latency reduction in ms", "% of users impacted", "revenue saved in $", "time saved per week", "error rate reduction").
Also identify sentences that already have strong metrics and praise them.
Return a JSON object with:
- sentences: array of { text: string, hasMetric: boolean, suggestion: string | null, praise: string | null }
- overallScore: 1-5 (1=no metrics, 5=every claim quantified)
- topSuggestion: the single most important metric to add (string)
- rewrittenResult: rewrite ONLY the Result section of the answer with strong metrics added (string)`,
          },
          { role: "user", content: `STAR Answer:\n\n${input.answer}` },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "impact_quantification",
            strict: true,
            schema: {
              type: "object",
              properties: {
                sentences: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      text: { type: "string" },
                      hasMetric: { type: "boolean" },
                      suggestion: { type: ["string", "null"] },
                      praise: { type: ["string", "null"] },
                    },
                    required: ["text", "hasMetric", "suggestion", "praise"],
                    additionalProperties: false,
                  },
                },
                overallScore: { type: "integer" },
                topSuggestion: { type: "string" },
                rewrittenResult: { type: "string" },
              },
              required: ["sentences", "overallScore", "topSuggestion", "rewrittenResult"],
              additionalProperties: false,
            },
          },
        },
      });
      try {
        const raw = response.choices?.[0]?.message?.content;
        const content = typeof raw === 'string' ? raw : JSON.stringify(raw ?? {});
        return JSON.parse(content) as {
          sentences: { text: string; hasMetric: boolean; suggestion: string | null; praise: string | null }[];
          overallScore: number;
          topSuggestion: string;
          rewrittenResult: string;
        };
      } catch {
        return { sentences: [], overallScore: 3, topSuggestion: "Unable to parse. Please try again.", rewrittenResult: "" };
      }
    }),

  // ── #8 Persona Stress Test — generate follow-up in persona ───────────────
  personaFollowUp: publicProcedure
    .input(z.object({
      persona: z.enum(["skeptical_senior", "fast_paced_pm", "detail_oriented_l7", "friendly_peer"]),
      question: z.string().max(500),
      candidateAnswer: z.string().max(2000),
      turnNumber: z.number().min(1).max(3),
      targetLevel: z.enum(["L4", "L5", "L6", "L7"]).default("L6"),
    }))
    .mutation(async ({ input }) => {
      const personaDescriptions: Record<string, string> = {
        skeptical_senior: "You are a skeptical L7 Meta engineer. You push back on every claim, demand specifics, and are never satisfied with vague answers. You interrupt with 'But why?' and 'How do you know that?'",
        fast_paced_pm: "You are a fast-paced Meta PM who cares only about user impact and speed. You get impatient with technical details and keep redirecting to 'But what did users actually experience?' and 'How fast did you ship?'",
        detail_oriented_l7: "You are a meticulous L7 Staff Engineer who digs into every technical decision. You ask about edge cases, failure modes, and alternative approaches the candidate didn't mention.",
        friendly_peer: "You are a friendly but probing L5 peer interviewer. You ask clarifying questions with genuine curiosity, but you always find the one thing the candidate glossed over.",
      };
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `${personaDescriptions[input.persona]}
This is turn ${input.turnNumber} of 3 in a behavioral interview stress test.
The candidate is targeting ${input.targetLevel}.
Generate ONE sharp follow-up question that probes the weakest part of their answer.
Also provide a brief coaching note (1 sentence) explaining what gap this question targets.
Return JSON: { followUpQuestion: string, coachingNote: string }`,
          },
          {
            role: "user",
            content: `Original question: ${input.question}\n\nCandidate's answer (turn ${input.turnNumber - 1} or initial): ${input.candidateAnswer}`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "persona_followup",
            strict: true,
            schema: {
              type: "object",
              properties: {
                followUpQuestion: { type: "string" },
                coachingNote: { type: "string" },
              },
              required: ["followUpQuestion", "coachingNote"],
              additionalProperties: false,
            },
          },
        },
      });
      try {
        const raw = response.choices?.[0]?.message?.content;
        const content = typeof raw === 'string' ? raw : JSON.stringify(raw ?? {});
        return JSON.parse(content) as { followUpQuestion: string; coachingNote: string };
      } catch {
        return { followUpQuestion: "Can you be more specific about the impact?", coachingNote: "Always quantify your results." };
      }
    }),

  // Score the full 3-turn exchange
  personaScore: publicProcedure
    .input(z.object({
      persona: z.string(),
      question: z.string().max(500),
      exchanges: z.array(z.object({
        turn: z.number(),
        interviewerQuestion: z.string(),
        candidateAnswer: z.string(),
      })),
      targetLevel: z.enum(["L4", "L5", "L6", "L7"]).default("L6"),
    }))
    .mutation(async ({ input }) => {
      const exchangeText = input.exchanges.map(e =>
        `Turn ${e.turn}:\nInterviewer: ${e.interviewerQuestion}\nCandidate: ${e.candidateAnswer}`
      ).join("\n\n");
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a Meta ${input.targetLevel} interview evaluator scoring a behavioral stress test.
Score the candidate's performance across 3 dimensions (1-5 each):
1. Composure: Did they stay calm and structured under pressure?
2. Depth: Did they add NEW information in each turn (not just repeat)?
3. Metrics: Did they quantify impact when pushed?
Also provide: overallVerdict (Pass/Borderline/Fail), keyStrength (1 sentence), keyGap (1 sentence).
Return JSON: { composure: number, depth: number, metrics: number, overallVerdict: string, keyStrength: string, keyGap: string }`,
          },
          {
            role: "user",
            content: `Original question: ${input.question}\n\nFull exchange:\n${exchangeText}`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "persona_score",
            strict: true,
            schema: {
              type: "object",
              properties: {
                composure: { type: "integer" },
                depth: { type: "integer" },
                metrics: { type: "integer" },
                overallVerdict: { type: "string" },
                keyStrength: { type: "string" },
                keyGap: { type: "string" },
              },
              required: ["composure", "depth", "metrics", "overallVerdict", "keyStrength", "keyGap"],
              additionalProperties: false,
            },
          },
        },
      });
      try {
        const raw = response.choices?.[0]?.message?.content;
        const content = typeof raw === 'string' ? raw : JSON.stringify(raw ?? {});
        return JSON.parse(content) as {
          composure: number; depth: number; metrics: number;
          overallVerdict: string; keyStrength: string; keyGap: string;
        };
      } catch {
        return { composure: 3, depth: 3, metrics: 3, overallVerdict: "Borderline", keyStrength: "Structured answers.", keyGap: "Add more metrics." };
      }
    }),

  // ── #6 Personalized Weak Pattern Remediation Plan ─────────────────────────
  remediationPlan: publicProcedure
    .input(z.object({
      weakPatterns: z.array(z.object({
        name: z.string(),
        rating: z.number(),
        keyIdea: z.string(),
      })).max(5),
      targetLevel: z.enum(["L4", "L5", "L6", "L7"]).default("L6"),
    }))
    .mutation(async ({ input }) => {
      const patternsText = input.weakPatterns.map(p =>
        `- ${p.name} (current rating: ${p.rating}/5): ${p.keyIdea}`
      ).join("\n");
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a Meta ${input.targetLevel} interview coach building a personalized remediation plan.
Given a candidate's weakest coding patterns, generate a 5-problem sequence that will fix the gaps in 3 days.
For each problem:
- problemName: exact LeetCode problem name
- difficulty: Easy/Medium/Hard
- targetPattern: which weak pattern this fixes
- whyThisProblem: 1 sentence explaining why this specific problem targets the gap
- keyInsight: the one thing they must understand to solve it
Return JSON: { plan: array of 5 problems, studyOrder: string (overall 3-day schedule), mindsetTip: string }`,
          },
          { role: "user", content: `Weak patterns:\n${patternsText}` },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "remediation_plan",
            strict: true,
            schema: {
              type: "object",
              properties: {
                plan: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      problemName: { type: "string" },
                      difficulty: { type: "string" },
                      targetPattern: { type: "string" },
                      whyThisProblem: { type: "string" },
                      keyInsight: { type: "string" },
                    },
                    required: ["problemName", "difficulty", "targetPattern", "whyThisProblem", "keyInsight"],
                    additionalProperties: false,
                  },
                },
                studyOrder: { type: "string" },
                mindsetTip: { type: "string" },
              },
              required: ["plan", "studyOrder", "mindsetTip"],
              additionalProperties: false,
            },
          },
        },
      });
      try {
        const raw = response.choices?.[0]?.message?.content;
        const content = typeof raw === 'string' ? raw : JSON.stringify(raw ?? {});
        return JSON.parse(content) as {
          plan: { problemName: string; difficulty: string; targetPattern: string; whyThisProblem: string; keyInsight: string }[];
          studyOrder: string;
          mindsetTip: string;
        };
      } catch {
        return { plan: [], studyOrder: "Unable to generate plan.", mindsetTip: "Focus on understanding the pattern, not memorizing solutions." };
      }
    }),

  // ── #1 AI Interviewer Interrupt Mode — generate disruptive question ────────
  interruptQuestion: publicProcedure
    .input(z.object({
      problemTitle: z.string(),
      candidateText: z.string().max(2000),
      minutesElapsed: z.number(),
      previousInterrupts: z.array(z.string()).max(10),
      targetLevel: z.enum(["L4", "L5", "L6", "L7"]).default("L6"),
    }))
    .mutation(async ({ input }) => {
      const prevText = input.previousInterrupts.length > 0
        ? `\nPrevious interrupts already asked: ${input.previousInterrupts.join(" | ")}`
        : "";
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a Meta ${input.targetLevel} system design interviewer who interrupts candidates to probe their reasoning.
The candidate has been designing for ${input.minutesElapsed} minutes.
Generate ONE sharp, disruptive interrupt question that:
- Targets a specific gap or assumption in what they've written
- Is phrased as a real interviewer would say it mid-session (direct, slightly challenging)
- Forces them to defend a specific decision or recalculate an estimate
- Is different from previous interrupts${prevText}
Also provide: interruptType (one of: "math_check" | "failure_mode" | "trade_off" | "scale_assumption" | "alternative_approach")
Return JSON: { question: string, interruptType: string, targetArea: string }`,
          },
          {
            role: "user",
            content: `Problem: ${input.problemTitle}\n\nCandidate's design so far:\n${input.candidateText}`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "interrupt_question",
            strict: true,
            schema: {
              type: "object",
              properties: {
                question: { type: "string" },
                interruptType: { type: "string" },
                targetArea: { type: "string" },
              },
              required: ["question", "interruptType", "targetArea"],
              additionalProperties: false,
            },
          },
        },
      });
      try {
        const raw = response.choices?.[0]?.message?.content;
        const content = typeof raw === 'string' ? raw : JSON.stringify(raw ?? {});
        return JSON.parse(content) as { question: string; interruptType: string; targetArea: string };
      } catch {
        return { question: "Walk me through your capacity estimates — how did you arrive at those numbers?", interruptType: "math_check", targetArea: "Capacity estimation" };
      }
    }),

  // Score candidate's response to an interrupt
  scoreInterruptResponse: publicProcedure
    .input(z.object({
      interruptQuestion: z.string(),
      candidateResponse: z.string().max(1000),
      interruptType: z.string(),
      targetLevel: z.enum(["L4", "L5", "L6", "L7"]).default("L6"),
    }))
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a Meta ${input.targetLevel} interview evaluator scoring how well a candidate handled an interviewer interrupt.
Score the response (1-5) on:
- clarity: Was the answer clear and direct?
- depth: Did they add new information or just repeat?
- recovery: Did they pivot gracefully and continue their design?
Provide: verdict (Strong/Adequate/Weak), oneLineFeedback (1 sentence).
Return JSON: { clarity: number, depth: number, recovery: number, verdict: string, oneLineFeedback: string }`,
          },
          {
            role: "user",
            content: `Interrupt type: ${input.interruptType}\nInterrupt question: ${input.interruptQuestion}\nCandidate's response: ${input.candidateResponse}`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "interrupt_score",
            strict: true,
            schema: {
              type: "object",
              properties: {
                clarity: { type: "integer" },
                depth: { type: "integer" },
                recovery: { type: "integer" },
                verdict: { type: "string" },
                oneLineFeedback: { type: "string" },
              },
              required: ["clarity", "depth", "recovery", "verdict", "oneLineFeedback"],
              additionalProperties: false,
            },
          },
        },
      });
      try {
        const raw = response.choices?.[0]?.message?.content;
        const content = typeof raw === 'string' ? raw : JSON.stringify(raw ?? {});
        return JSON.parse(content) as { clarity: number; depth: number; recovery: number; verdict: string; oneLineFeedback: string };
      } catch {
        return { clarity: 3, depth: 3, recovery: 3, verdict: "Adequate", oneLineFeedback: "Answer was reasonable but could be more specific." };
      }
    }),

  // ── #2 Back-of-Envelope Calculator with Grading ───────────────────────────
  gradeBoE: publicProcedure
    .input(z.object({
      problemTitle: z.string(),
      estimationSteps: z.string().max(2000),
      targetLevel: z.enum(["L4", "L5", "L6", "L7"]).default("L6"),
    }))
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a Meta ${input.targetLevel} system design interviewer grading a candidate's back-of-envelope estimation.
Evaluate three dimensions (1-5 each):
1. mathAccuracy: Are the calculations correct? Check arithmetic and unit conversions.
2. assumptionQuality: Are the assumptions reasonable and explicitly stated?
3. architecturalConnection: Did they connect the numbers to a specific architectural decision (e.g., "This QPS means we need 5 app servers")?
Also provide:
- correctedMath: if there are errors, show the corrected calculation (string, or null if correct)
- keyInsight: the most important number they derived and what it implies (string)
- missedConnection: the architectural decision they should have derived but didn't (string, or null)
- overallFeedback: 2-3 sentence summary
Return JSON with all fields.`,
          },
          {
            role: "user",
            content: `Problem: ${input.problemTitle}\n\nCandidate's estimation steps:\n${input.estimationSteps}`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "boe_grade",
            strict: true,
            schema: {
              type: "object",
              properties: {
                mathAccuracy: { type: "integer" },
                assumptionQuality: { type: "integer" },
                architecturalConnection: { type: "integer" },
                correctedMath: { type: ["string", "null"] },
                keyInsight: { type: "string" },
                missedConnection: { type: ["string", "null"] },
                overallFeedback: { type: "string" },
              },
              required: ["mathAccuracy", "assumptionQuality", "architecturalConnection", "correctedMath", "keyInsight", "missedConnection", "overallFeedback"],
              additionalProperties: false,
            },
          },
        },
      });
      try {
        const raw = response.choices?.[0]?.message?.content;
        const content = typeof raw === 'string' ? raw : JSON.stringify(raw ?? {});
        return JSON.parse(content) as {
          mathAccuracy: number; assumptionQuality: number; architecturalConnection: number;
          correctedMath: string | null; keyInsight: string; missedConnection: string | null; overallFeedback: string;
        };
      } catch {
        return { mathAccuracy: 3, assumptionQuality: 3, architecturalConnection: 3, correctedMath: null, keyInsight: "Unable to parse.", missedConnection: null, overallFeedback: "Please try again." };
      }
    }),

  // ── #3 Adversarial Design Review — attack 3 weakest points ────────────────
  adversarialAttack: publicProcedure
    .input(z.object({
      problemTitle: z.string(),
      designText: z.string().max(3000),
      targetLevel: z.enum(["L4", "L5", "L6", "L7"]).default("L6"),
    }))
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a highly critical Meta ${input.targetLevel} system design interviewer.
Find the 3 weakest points in this system design and attack each with a sharp, specific challenge question.
For each weakness:
- weaknessTitle: short label (e.g., "Single Point of Failure", "No Cache Invalidation Strategy")
- attackQuestion: the exact challenging question you'd ask the candidate
- severity: "Critical" | "Major" | "Minor"
- hint: a one-sentence hint to help the candidate think about the fix (shown after they respond)
Return JSON: { attacks: array of 3 objects }`,
          },
          {
            role: "user",
            content: `Problem: ${input.problemTitle}\n\nCandidate's design:\n${input.designText}`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "adversarial_attack",
            strict: true,
            schema: {
              type: "object",
              properties: {
                attacks: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      weaknessTitle: { type: "string" },
                      attackQuestion: { type: "string" },
                      severity: { type: "string" },
                      hint: { type: "string" },
                    },
                    required: ["weaknessTitle", "attackQuestion", "severity", "hint"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["attacks"],
              additionalProperties: false,
            },
          },
        },
      });
      try {
        const raw = response.choices?.[0]?.message?.content;
        const content = typeof raw === 'string' ? raw : JSON.stringify(raw ?? {});
        return JSON.parse(content) as {
          attacks: { weaknessTitle: string; attackQuestion: string; severity: string; hint: string }[];
        };
      } catch {
        return { attacks: [] };
      }
    }),

  // Score candidate's defense of a design point
  scoreDefense: publicProcedure
    .input(z.object({
      attackQuestion: z.string(),
      weaknessTitle: z.string(),
      candidateDefense: z.string().max(1000),
      targetLevel: z.enum(["L4", "L5", "L6", "L7"]).default("L6"),
    }))
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a Meta ${input.targetLevel} interview evaluator scoring a candidate's defense of their system design.
Score (1-5):
- acknowledgment: Did they acknowledge the weakness honestly?
- solution: Did they propose a concrete fix?
- tradeoffs: Did they discuss the trade-offs of their fix?
Provide: verdict ("Strong Defense" | "Adequate Defense" | "Weak Defense"), feedback (2 sentences).
Return JSON: { acknowledgment: number, solution: number, tradeoffs: number, verdict: string, feedback: string }`,
          },
          {
            role: "user",
            content: `Weakness: ${input.weaknessTitle}\nAttack question: ${input.attackQuestion}\nCandidate's defense: ${input.candidateDefense}`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "defense_score",
            strict: true,
            schema: {
              type: "object",
              properties: {
                acknowledgment: { type: "integer" },
                solution: { type: "integer" },
                tradeoffs: { type: "integer" },
                verdict: { type: "string" },
                feedback: { type: "string" },
              },
              required: ["acknowledgment", "solution", "tradeoffs", "verdict", "feedback"],
              additionalProperties: false,
            },
          },
        },
      });
      try {
        const raw = response.choices?.[0]?.message?.content;
        const content = typeof raw === 'string' ? raw : JSON.stringify(raw ?? {});
        return JSON.parse(content) as { acknowledgment: number; solution: number; tradeoffs: number; verdict: string; feedback: string };
      } catch {
        return { acknowledgment: 3, solution: 3, tradeoffs: 3, verdict: "Adequate Defense", feedback: "Answer was reasonable. Add more specifics." };
      }
    }),

  // ── #10 Weekly AI Readiness Report ────────────────────────────────────────
  readinessReport: publicProcedure
    .input(z.object({
      readinessScore: z.number().min(0).max(100),
      weakPatterns: z.array(z.string()).max(5),
      strongPatterns: z.array(z.string()).max(5),
      behavioralCoverage: z.number().min(0).max(100), // % of focus areas covered
      mockScores: z.array(z.number()).max(10),
      daysUntilInterview: z.number().optional(),
      targetLevel: z.enum(["L4", "L5", "L6", "L7"]).default("L6"),
      lastWeekActivity: z.object({
        problemsSolved: z.number(),
        mocksTaken: z.number(),
        behavioralPracticed: z.number(),
      }),
    }))
    .mutation(async ({ input }) => {
      const avgMock = input.mockScores.length > 0
        ? (input.mockScores.reduce((a, b) => a + b, 0) / input.mockScores.length).toFixed(1)
        : "N/A";
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a Meta ${input.targetLevel} interview coach generating a weekly readiness report.
Be honest, specific, and actionable. Do NOT be generic.
Generate:
- headline: one punchy sentence summarizing the candidate's current state (e.g., "Strong coder, behavioral gaps will cost you the offer")
- top3Focus: array of exactly 3 objects, each with { area: string, why: string, exercise: string } — ranked by urgency
- weeklyGrade: letter grade A/B/C/D/F based on activity and scores
- trajectory: "On Track" | "Needs Acceleration" | "At Risk" | "Ready"
- coachMessage: 2-3 sentences of direct, honest coaching (not cheerleading)
Return JSON with all fields.`,
          },
          {
            role: "user",
            content: `Readiness score: ${input.readinessScore}/100
Target level: ${input.targetLevel}
${input.daysUntilInterview ? `Days until interview: ${input.daysUntilInterview}` : "No interview date set"}
Weak patterns: ${input.weakPatterns.join(", ") || "None identified"}
Strong patterns: ${input.strongPatterns.join(", ") || "None identified"}
Behavioral story coverage: ${input.behavioralCoverage}%
Average mock score: ${avgMock}/5
Last week: ${input.lastWeekActivity.problemsSolved} problems solved, ${input.lastWeekActivity.mocksTaken} mocks taken, ${input.lastWeekActivity.behavioralPracticed} behavioral sessions`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "readiness_report",
            strict: true,
            schema: {
              type: "object",
              properties: {
                headline: { type: "string" },
                top3Focus: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      area: { type: "string" },
                      why: { type: "string" },
                      exercise: { type: "string" },
                    },
                    required: ["area", "why", "exercise"],
                    additionalProperties: false,
                  },
                },
                weeklyGrade: { type: "string" },
                trajectory: { type: "string" },
                coachMessage: { type: "string" },
              },
              required: ["headline", "top3Focus", "weeklyGrade", "trajectory", "coachMessage"],
              additionalProperties: false,
            },
          },
        },
      });
      try {
        const raw = response.choices?.[0]?.message?.content;
        const content = typeof raw === 'string' ? raw : JSON.stringify(raw ?? {});
        return JSON.parse(content) as {
          headline: string;
          top3Focus: { area: string; why: string; exercise: string }[];
          weeklyGrade: string;
          trajectory: string;
          coachMessage: string;
        };
      } catch {
        return {
          headline: "Unable to generate report. Please try again.",
          top3Focus: [],
          weeklyGrade: "N/A",
          trajectory: "Unknown",
          coachMessage: "Keep practicing consistently.",
        };
      }
    }),

  generateSprintPlan: publicProcedure
    .input(z.object({
      weakAreas: z.array(z.string()).max(5),
      daysUntilInterview: z.number().min(1).max(90).default(7),
      targetLevel: z.enum(["L4", "L5", "L6", "L7"]).default("L6"),
      focusPriority: z.enum(["system_design", "coding", "behavioral", "balanced"]).default("balanced"),
    }))
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a Meta ${input.targetLevel} interview coach generating a personalized ${Math.min(input.daysUntilInterview, 7)}-day sprint plan.
Each day must have exactly 3 tasks. Tasks must be specific, actionable, and reference real tools from this guide.
Available tools: Story Coverage Matrix, Impact Quantification Coach, Persona Stress Test, Think Out Loud Coach, Pattern Recognition Drill, Personalized Remediation Plan, AI Interviewer Interrupt Mode, BoE Grader, Adversarial Design Review, Weekly Readiness Report.
Return JSON with days array. Each day has: dayNumber (int), theme (string), tasks (array of 3 objects with: title, tool, duration, description).`,
          },
          {
            role: "user",
            content: `Weak areas: ${input.weakAreas.join(", ") || "balanced across all areas"}
Days until interview: ${input.daysUntilInterview}
Target level: ${input.targetLevel}
Focus priority: ${input.focusPriority}
Generate a ${Math.min(input.daysUntilInterview, 7)}-day sprint plan.`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "sprint_plan",
            strict: true,
            schema: {
              type: "object",
              properties: {
                days: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      dayNumber: { type: "integer" },
                      theme: { type: "string" },
                      tasks: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            title: { type: "string" },
                            tool: { type: "string" },
                            duration: { type: "string" },
                            description: { type: "string" },
                          },
                          required: ["title", "tool", "duration", "description"],
                          additionalProperties: false,
                        },
                      },
                    },
                    required: ["dayNumber", "theme", "tasks"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["days"],
              additionalProperties: false,
            },
          },
        },
      });
      try {
        const raw = response.choices?.[0]?.message?.content;
        const content = typeof raw === 'string' ? raw : JSON.stringify(raw ?? {});
        return JSON.parse(content) as {
          days: {
            dayNumber: number;
            theme: string;
            tasks: { title: string; tool: string; duration: string; description: string }[];
          }[];
        };
      } catch {
        return { days: [] };
      }
    }),

  // ── #2 IC6→IC7 Answer Upgrader — AI scores any answer and gives upgrade path ──
  upgradeAnswer: publicProcedure
    .input(z.object({
      answer: z.string().min(20).max(4000),
      question: z.string().max(300).optional(),
      targetLevel: z.enum(["L5", "L6", "L7"]).default("L7"),
    }))
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a Meta Staff/Principal Engineer interview coach. Your job is to:
1. Detect the current IC level of the answer (L4/L5/L6/L7) based on scope, impact, and signals
2. Give a score 1-10 for the answer at its current level
3. List exactly what signals are present (strengths)
4. List exactly what signals are missing to reach ${input.targetLevel}
5. Provide a rewritten version of the answer upgraded to ${input.targetLevel} level
6. Give 3 specific upgrade instructions the candidate can apply to their own stories

IC Level criteria:
- L4: Team-level execution, follows direction, delivers assigned work
- L5: Owns features end-to-end, some cross-team coordination, measurable technical outcomes
- L6: Drives org-level initiatives, cross-functional alignment, establishes patterns, quantified business impact
- L7: Proactively identifies org-wide problems, influences directors+, creates lasting org-wide policies/frameworks, grows senior leaders, connects to company-level business value

Return JSON only.`,
          },
          {
            role: "user",
            content: `${input.question ? `Question: ${input.question}\n\n` : ""}Answer to upgrade:\n\n${input.answer}`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "answer_upgrade",
            strict: true,
            schema: {
              type: "object",
              properties: {
                detectedLevel: { type: "string", description: "Detected IC level: L4, L5, L6, or L7" },
                currentScore: { type: "integer", description: "Score 1-10 at current level" },
                presentSignals: { type: "array", items: { type: "string" }, description: "IC signals already present" },
                missingSignals: { type: "array", items: { type: "string" }, description: "Signals missing to reach target level" },
                upgradeInstructions: { type: "array", items: { type: "string" }, description: "3 specific actionable upgrade instructions" },
                upgradedAnswer: { type: "string", description: "Full rewritten answer at target level" },
                keyDelta: { type: "string", description: "One sentence: the single most important thing that changed" },
              },
              required: ["detectedLevel", "currentScore", "presentSignals", "missingSignals", "upgradeInstructions", "upgradedAnswer", "keyDelta"],
              additionalProperties: false,
            },
          },
        },
      });
      try {
        const raw = response.choices?.[0]?.message?.content;
        const content = typeof raw === 'string' ? raw : JSON.stringify(raw ?? {});
        return JSON.parse(content) as {
          detectedLevel: string;
          currentScore: number;
          presentSignals: string[];
          missingSignals: string[];
          upgradeInstructions: string[];
          upgradedAnswer: string;
          keyDelta: string;
        };
      } catch {
        return { detectedLevel: "L5", currentScore: 5, presentSignals: [], missingSignals: [], upgradeInstructions: [], upgradedAnswer: "", keyDelta: "" };
      }
    }),

  // ── Story Coverage Gap Analysis — AI identifies weak coverage areas ─────────
  storyGapAnalysis: publicProcedure
    .input(z.object({
      stories: z.array(z.object({
        title: z.string(),
        focusAreas: z.array(z.string()),
        values: z.array(z.string()),
        hasMetric: z.boolean(),
      })),
      targetLevel: z.enum(["L5", "L6", "L7"]).default("L6"),
    }))
    .mutation(async ({ input }) => {
      const storySummary = input.stories.map(s =>
        `- "${s.title}" covers: ${s.focusAreas.join(", ")} | values: ${s.values.join(", ")}${s.hasMetric ? " | has metrics" : " | NO metrics"}`
      ).join("\n");
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a Meta ${input.targetLevel} behavioral interview coach. Analyze a candidate's STAR story bank and identify gaps.
Meta behavioral interviews cover 4 focus areas: XFN Collaboration, Problem Solving, Communication, Conflict Resolution.
Meta's 6 core values: Move Fast, Long-Term Impact, Build Awesome Things, Live in the Future, Be Direct, Meta/Metamates/Me.
Return JSON with gap analysis and specific story angle suggestions.`,
          },
          {
            role: "user",
            content: `Target level: ${input.targetLevel}\n\nStory bank:\n${storySummary}\n\nAnalyze gaps and suggest missing story angles.`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "story_gap_analysis",
            strict: true,
            schema: {
              type: "object",
              properties: {
                overallCoverage: { type: "integer", description: "Coverage score 0-100" },
                verdict: { type: "string", description: "One sentence overall assessment" },
                criticalGaps: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      area: { type: "string" },
                      gap: { type: "string" },
                      suggestedStoryAngle: { type: "string" },
                      exampleQuestion: { type: "string" },
                    },
                    required: ["area", "gap", "suggestedStoryAngle", "exampleQuestion"],
                    additionalProperties: false,
                  },
                },
                strengths: { type: "array", items: { type: "string" } },
                topPriority: { type: "string", description: "The single most important story to add" },
              },
              required: ["overallCoverage", "verdict", "criticalGaps", "strengths", "topPriority"],
              additionalProperties: false,
            },
          },
        },
      });
      try {
        const raw = response.choices?.[0]?.message?.content;
        const content = typeof raw === 'string' ? raw : JSON.stringify(raw ?? {});
        return JSON.parse(content) as {
          overallCoverage: number;
          verdict: string;
          criticalGaps: { area: string; gap: string; suggestedStoryAngle: string; exampleQuestion: string }[];
          strengths: string[];
          topPriority: string;
        };
      } catch {
        return { overallCoverage: 50, verdict: "", criticalGaps: [], strengths: [], topPriority: "" };
      }
    }),

  // ── IC7 Signal Coaching — AI generates personalized story prompt for a gap ──
  ic7SignalCoach: publicProcedure
    .input(z.object({
      signal: z.string(),
      description: z.string(),
      probeQuestion: z.string(),
      gapNote: z.string().max(500).optional(),
      targetLevel: z.enum(["L6", "L7"]).default("L7"),
    }))
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a Meta ${input.targetLevel} interview coach helping a candidate find a story for a specific IC signal gap.
Your job is to:
1. Suggest 3 different story angles the candidate might have from their career that would demonstrate this signal
2. Give a STAR framework outline for the strongest angle
3. Provide 2-3 probing questions to help the candidate recall relevant experiences
4. Give one example of what a strong ${input.targetLevel} answer opening line would sound like
Be specific, practical, and encouraging.`,
          },
          {
            role: "user",
            content: `Signal needed: ${input.signal}\nDescription: ${input.description}\nProbe question: ${input.probeQuestion}${input.gapNote ? `\nCandidate's note: ${input.gapNote}` : ""}`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "ic7_signal_coach",
            strict: true,
            schema: {
              type: "object",
              properties: {
                storyAngles: { type: "array", items: { type: "string" }, description: "3 story angle suggestions" },
                starOutline: {
                  type: "object",
                  properties: {
                    situation: { type: "string" },
                    task: { type: "string" },
                    action: { type: "string" },
                    result: { type: "string" },
                  },
                  required: ["situation", "task", "action", "result"],
                  additionalProperties: false,
                },
                recallQuestions: { type: "array", items: { type: "string" }, description: "2-3 questions to help recall" },
                exampleOpener: { type: "string", description: "Example strong opening line" },
              },
              required: ["storyAngles", "starOutline", "recallQuestions", "exampleOpener"],
              additionalProperties: false,
            },
          },
        },
      });
      try {
        const raw = response.choices?.[0]?.message?.content;
        const content = typeof raw === 'string' ? raw : JSON.stringify(raw ?? {});
        return JSON.parse(content) as {
          storyAngles: string[];
          starOutline: { situation: string; task: string; action: string; result: string };
          recallQuestions: string[];
          exampleOpener: string;
        };
      } catch {
        return { storyAngles: [], starOutline: { situation: "", task: "", action: "", result: "" }, recallQuestions: [], exampleOpener: "" };
      }
    }),
});
