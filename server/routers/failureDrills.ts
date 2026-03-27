import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { failureDrillSessions } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";

// ─── Shared scoring helpers ────────────────────────────────────────────────

async function scoreDrillWithLLM(systemPrompt: string, userPrompt: string) {
  const result = await invokeLLM({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "drill_score",
        strict: true,
        schema: {
          type: "object",
          properties: {
            score: { type: "integer", description: "Score 0-100" },
            feedback: {
              type: "string",
              description: "2-3 sentence coaching feedback",
            },
            missed: {
              type: "array",
              items: { type: "string" },
              description: "List of items the candidate missed",
            },
            strengths: {
              type: "array",
              items: { type: "string" },
              description: "List of things the candidate did well",
            },
          },
          required: ["score", "feedback", "missed", "strengths"],
          additionalProperties: false,
        },
      },
    },
  });
  const raw = result.choices?.[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(
    typeof raw === "string" ? raw : JSON.stringify(raw)
  );
  return {
    score: Math.min(100, Math.max(0, parsed.score ?? 50)),
    feedback: parsed.feedback ?? "",
    missed: parsed.missed ?? [],
    strengths: parsed.strengths ?? [],
  };
}

// ─── Router ───────────────────────────────────────────────────────────────

export const failureDrillsRouter = router({
  // ── Drill 1: NFR Ambush ────────────────────────────────────────────────
  scoreNFRAmbush: protectedProcedure
    .input(
      z.object({
        prompt: z.string().max(300),
        nfrs: z.array(z.string().max(100)).max(20),
        elapsedSeconds: z.number().int().min(0).max(120),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await scoreDrillWithLLM(
        `You are a Meta Staff Engineer evaluating a candidate's NFR (Non-Functional Requirements) enumeration for a system design prompt.
Score 0-100 based on: coverage of critical NFRs (latency, throughput, availability, durability, consistency, scalability, security, observability), relevance to the specific prompt, and specificity (e.g. "p99 < 100ms" beats "low latency").
Deduct 5 points for each critical NFR missed. Award bonus points for prompt-specific NFRs.`,
        `Prompt: "${input.prompt}"
Candidate's NFRs (${input.nfrs.length} items, ${input.elapsedSeconds}s elapsed):
${input.nfrs.map((n, i) => `${i + 1}. ${n}`).join("\n")}

Score their NFR coverage and list what they missed.`
      );
      const db = await getDb();
      if (db) {
        await db.insert(failureDrillSessions).values({
          userId: ctx.user.id,
          drillId: "nfr-ambush",
          score: result.score,
          payload: {
            prompt: input.prompt,
            nfrs: input.nfrs,
            elapsedSeconds: input.elapsedSeconds,
          },
          feedback: result.feedback,
        });
      }
      return result;
    }),

  // ── Drill 2: Bottleneck Autopsy ────────────────────────────────────────
  scoreBottleneckAutopsy: protectedProcedure
    .input(
      z.object({
        scenario: z.string().max(500),
        bottlenecks: z.array(z.string().max(200)).max(10),
        mitigations: z.array(z.string().max(200)).max(10),
        elapsedSeconds: z.number().int().min(0).max(180),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await scoreDrillWithLLM(
        `You are a Meta Staff Engineer evaluating a candidate's bottleneck identification for a system design scenario.
Score 0-100: did they identify the primary bottleneck correctly (40pts), secondary bottlenecks (20pts), root cause accuracy (20pts), and quality of mitigations (20pts).
Common bottlenecks to look for: single DB node, no caching layer, synchronous fan-out, hot partitions, missing CDN, no rate limiting.`,
        `Scenario: "${input.scenario}"
Bottlenecks identified: ${input.bottlenecks.join("; ")}
Mitigations proposed: ${input.mitigations.join("; ")}
Time taken: ${input.elapsedSeconds}s

Score their bottleneck analysis.`
      );
      const db = await getDb();
      if (db) {
        await db.insert(failureDrillSessions).values({
          userId: ctx.user.id,
          drillId: "bottleneck-autopsy",
          score: result.score,
          payload: input,
          feedback: result.feedback,
        });
      }
      return result;
    }),

  // ── Drill 3: Scale Jump ────────────────────────────────────────────────
  scoreScaleJump: protectedProcedure
    .input(
      z.object({
        originalDesign: z.string().max(1000),
        scaleResponse: z.string().max(1500),
        fromRPS: z.number().int(),
        toRPS: z.number().int(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await scoreDrillWithLLM(
        `You are a Meta Staff Engineer evaluating a candidate's ability to scale a system design from ${input.fromRPS} RPS to ${input.toRPS} RPS.
Score 0-100: did they identify what breaks first (30pts), propose correct scaling solutions (40pts), address data layer scaling (15pts), address application layer scaling (15pts).
Look for: DB sharding/read replicas, caching strategy, async processing, horizontal scaling, CDN, load balancing.`,
        `Original design (${input.fromRPS} RPS): "${input.originalDesign}"
Scale response to ${input.toRPS} RPS: "${input.scaleResponse}"

Score their scaling analysis.`
      );
      const db = await getDb();
      if (db) {
        await db.insert(failureDrillSessions).values({
          userId: ctx.user.id,
          drillId: "scale-jump",
          score: result.score,
          payload: input,
          feedback: result.feedback,
        });
      }
      return result;
    }),

  // ── Drill 4: Edge Case Gauntlet ────────────────────────────────────────
  scoreEdgeCaseGauntlet: protectedProcedure
    .input(
      z.object({
        problem: z.string().max(300),
        edgeCases: z.array(z.string().max(150)).max(20),
        elapsedSeconds: z.number().int().min(0).max(90),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await scoreDrillWithLLM(
        `You are a Meta Staff Engineer evaluating edge case coverage for a coding problem.
Score 0-100 based on coverage of: empty/null inputs, single element, duplicates, overflow/underflow, negative numbers, max constraints, unsorted input, circular references, concurrent access, invalid types.
Award 10pts per critical edge case covered. Deduct for irrelevant cases.`,
        `Problem: "${input.problem}"
Edge cases listed (${input.edgeCases.length} items, ${input.elapsedSeconds}s):
${input.edgeCases.map((e, i) => `${i + 1}. ${e}`).join("\n")}

Score their edge case coverage.`
      );
      const db = await getDb();
      if (db) {
        await db.insert(failureDrillSessions).values({
          userId: ctx.user.id,
          drillId: "edge-case-gauntlet",
          score: result.score,
          payload: {
            problem: input.problem,
            edgeCases: input.edgeCases,
            elapsedSeconds: input.elapsedSeconds,
          },
          feedback: result.feedback,
        });
      }
      return result;
    }),

  // ── Drill 5: STAR Specificity Rewriter ────────────────────────────────
  scoreSTARRewrite: protectedProcedure
    .input(
      z.object({
        originalAnswer: z.string().max(2000),
        rewrittenAnswer: z.string().max(2000),
        question: z.string().max(300),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await scoreDrillWithLLM(
        `You are a Meta Staff Engineer evaluating a STAR behavioral answer rewrite.
Score 0-100: did the rewrite replace vague phrases with specific metrics/names/decisions (40pts), add quantified impact (30pts), show clear ownership (20pts), maintain conciseness (10pts).
Vague phrases to flag: "we improved", "I helped", "the team decided", "significant impact", "worked with stakeholders".`,
        `Question: "${input.question}"
Original answer: "${input.originalAnswer}"
Rewritten answer: "${input.rewrittenAnswer}"

Score the improvement in specificity and impact.`
      );
      const db = await getDb();
      if (db) {
        await db.insert(failureDrillSessions).values({
          userId: ctx.user.id,
          drillId: "star-rewriter",
          score: result.score,
          payload: input,
          feedback: result.feedback,
        });
      }
      return result;
    }),

  // ── Drill 6: Ownership Signal Extractor ───────────────────────────────
  generateOwnershipProbe: protectedProcedure
    .input(z.object({ projectDescription: z.string().max(500) }))
    .mutation(async ({ input }) => {
      const result = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a skeptical Meta L7 interviewer. Generate exactly 5 probing questions designed to distinguish a true owner from a contributor on the described project. Questions should expose: who made final decisions, what would break without them, what they pushed back on, how they handled failure, and what they'd do differently.
Respond ONLY with valid JSON: {"questions": ["q1","q2","q3","q4","q5"]}`,
          },
          { role: "user", content: `Project: "${input.projectDescription}"` },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "ownership_probes",
            strict: true,
            schema: {
              type: "object",
              properties: {
                questions: {
                  type: "array",
                  items: { type: "string" },
                  description: "5 probing questions",
                },
              },
              required: ["questions"],
              additionalProperties: false,
            },
          },
        },
      });
      const raw = result.choices?.[0]?.message?.content ?? "{}";
      const parsed = JSON.parse(
        typeof raw === "string" ? raw : JSON.stringify(raw)
      );
      return { questions: (parsed.questions ?? []).slice(0, 5) as string[] };
    }),

  scoreOwnershipSignal: protectedProcedure
    .input(
      z.object({
        projectDescription: z.string().max(500),
        questions: z.array(z.string().max(300)).max(5),
        answers: z.array(z.string().max(500)).max(5),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const qa = input.questions
        .map(
          (q, i) =>
            `Q${i + 1}: ${q}\nA${i + 1}: ${input.answers[i] ?? "(no answer)"}`
        )
        .join("\n\n");
      const result = await scoreDrillWithLLM(
        `You are a Meta L7 interviewer scoring ownership signals. For each answer, score 1-5: 5=clear owner (made decisions, drove outcomes, accountable), 1=passenger (vague, deflects to team, no specifics). Average the 5 scores and multiply by 20 for final 0-100 score.`,
        `Project: "${input.projectDescription}"\n\n${qa}\n\nScore each answer's ownership signal and provide overall assessment.`
      );
      const db = await getDb();
      if (db) {
        await db.insert(failureDrillSessions).values({
          userId: ctx.user.id,
          drillId: "ownership-extractor",
          score: result.score,
          payload: input,
          feedback: result.feedback,
        });
      }
      return result;
    }),

  // ── Drill 7: Down-Level Detector ──────────────────────────────────────
  detectLevel: protectedProcedure
    .input(
      z.object({
        answer: z.string().max(2000),
        questionType: z.enum(["system-design", "behavioral", "coding"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a Meta calibration expert. Classify the candidate's answer as L5, L6, or L7 based on these signals:
L5: Solves the problem, team-level scope, follows direction, needs guidance on ambiguity.
L6: Leads initiatives, org-level impact, drives trade-offs, handles ambiguity independently, mentions stakeholders.
L7: Cross-org scope, sets direction for others, reframes the problem, anticipates second-order effects, influences without authority.

Respond ONLY with valid JSON:
{"level": "L5"|"L6"|"L7", "score": 0-100, "levelSignals": ["phrase that triggered this level"], "upgradeTips": ["specific change to sound more senior"], "feedback": "2-3 sentence coaching note"}`,
          },
          {
            role: "user",
            content: `Question type: ${input.questionType}\nAnswer: "${input.answer}"`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "level_detection",
            strict: true,
            schema: {
              type: "object",
              properties: {
                level: { type: "string" },
                score: { type: "integer" },
                levelSignals: { type: "array", items: { type: "string" } },
                upgradeTips: { type: "array", items: { type: "string" } },
                feedback: { type: "string" },
              },
              required: [
                "level",
                "score",
                "levelSignals",
                "upgradeTips",
                "feedback",
              ],
              additionalProperties: false,
            },
          },
        },
      });
      const raw = result.choices?.[0]?.message?.content ?? "{}";
      const parsed = JSON.parse(
        typeof raw === "string" ? raw : JSON.stringify(raw)
      );
      const score = Math.min(100, Math.max(0, parsed.score ?? 50));
      const db = await getDb();
      if (db) {
        await db.insert(failureDrillSessions).values({
          userId: ctx.user.id,
          drillId: "down-level-detector",
          score,
          payload: input,
          feedback: parsed.feedback ?? "",
        });
      }
      return {
        level: (parsed.level ?? "L5") as "L5" | "L6" | "L7",
        score,
        levelSignals: (parsed.levelSignals ?? []) as string[],
        upgradeTips: (parsed.upgradeTips ?? []) as string[],
        feedback: (parsed.feedback ?? "") as string,
      };
    }),

  // ── Drill 8: Trade-Off Pressure Cooker ────────────────────────────────
  generateTradeOffChallenge: protectedProcedure
    .input(
      z.object({ decision: z.string().max(300), position: z.string().max(500) })
    )
    .mutation(async ({ input }) => {
      const result = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a Meta Staff Engineer challenging a candidate's design decision. Identify the weakest assumption in their position and generate ONE sharp follow-up challenge question that exposes it. Be direct and slightly adversarial.
Respond ONLY with valid JSON: {"challenge": "your challenge question", "weakAssumption": "the assumption you're targeting"}`,
          },
          {
            role: "user",
            content: `Decision: "${input.decision}"\nCandidate's position: "${input.position}"`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "tradeoff_challenge",
            strict: true,
            schema: {
              type: "object",
              properties: {
                challenge: { type: "string" },
                weakAssumption: { type: "string" },
              },
              required: ["challenge", "weakAssumption"],
              additionalProperties: false,
            },
          },
        },
      });
      const raw = result.choices?.[0]?.message?.content ?? "{}";
      const parsed = JSON.parse(
        typeof raw === "string" ? raw : JSON.stringify(raw)
      );
      return {
        challenge: parsed.challenge ?? "",
        weakAssumption: parsed.weakAssumption ?? "",
      };
    }),

  scoreTradeOffDefense: protectedProcedure
    .input(
      z.object({
        decision: z.string().max(300),
        originalPosition: z.string().max(500),
        challenge: z.string().max(300),
        defense: z.string().max(800),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await scoreDrillWithLLM(
        `You are a Meta Staff Engineer scoring a candidate's ability to defend a trade-off under pressure.
Score 0-100: did they hold a correct position (30pts), gracefully concede if wrong (20pts), provide new evidence/reasoning (30pts), avoid being defensive or dismissive (20pts).`,
        `Decision: "${input.decision}"
Original position: "${input.originalPosition}"
Challenge: "${input.challenge}"
Defense: "${input.defense}"

Score their trade-off defense.`
      );
      const db = await getDb();
      if (db) {
        await db.insert(failureDrillSessions).values({
          userId: ctx.user.id,
          drillId: "tradeoff-pressure",
          score: result.score,
          payload: input,
          feedback: result.feedback,
        });
      }
      return result;
    }),

  // ── Drill 9: Failure Mode Flashcard Sprint ─────────────────────────────
  scoreFlashcardSprint: protectedProcedure
    .input(
      z.object({
        answers: z
          .array(
            z.object({
              cardId: z.string(),
              excerpt: z.string().max(300),
              userCategory: z.enum(["system-design", "coding", "behavioral"]),
              userSignal: z.string().max(100),
              userFix: z.string().max(100),
            })
          )
          .max(15),
        elapsedSeconds: z.number().int().min(0).max(600),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Score based on correct classifications (pre-defined answers embedded in cards)
      const CARD_ANSWERS: Record<string, { category: string; signal: string }> =
        {
          c1: { category: "system-design", signal: "Skipping NFRs" },
          c2: { category: "system-design", signal: "Missing bottleneck" },
          c3: { category: "coding", signal: "Weak edge cases" },
          c4: { category: "behavioral", signal: "Vague STAR" },
          c5: { category: "behavioral", signal: "Weak ownership" },
          c6: { category: "system-design", signal: "Can't scale" },
          c7: { category: "coding", signal: "No time complexity" },
          c8: { category: "behavioral", signal: "No metrics" },
          c9: { category: "system-design", signal: "Shallow trade-offs" },
          c10: { category: "coding", signal: "Brute force only" },
          c11: { category: "behavioral", signal: "Passive language" },
          c12: { category: "system-design", signal: "No failure handling" },
          c13: { category: "coding", signal: "No test cases" },
          c14: { category: "behavioral", signal: "No conflict resolution" },
          c15: { category: "system-design", signal: "L5 scope language" },
        };
      let correct = 0;
      for (const a of input.answers) {
        const expected = CARD_ANSWERS[a.cardId];
        if (expected && a.userCategory === expected.category) correct++;
      }
      const score = Math.round(
        (correct / Math.max(1, input.answers.length)) * 100
      );
      const db = await getDb();
      if (db) {
        await db.insert(failureDrillSessions).values({
          userId: ctx.user.id,
          drillId: "flashcard-sprint",
          score,
          payload: {
            answers: input.answers,
            elapsedSeconds: input.elapsedSeconds,
            correct,
          },
          feedback: `Classified ${correct}/${input.answers.length} cards correctly in ${input.elapsedSeconds}s.`,
        });
      }
      return {
        score,
        correct,
        total: input.answers.length,
        cardAnswers: CARD_ANSWERS,
      };
    }),

  // ── Drill 10: Live Fix Simulator ──────────────────────────────────────
  scoreLiveFixSimulator: protectedProcedure
    .input(
      z.object({
        transcript: z.string().max(3000),
        diagnosedFailures: z
          .array(
            z.object({
              type: z.enum(["system-design", "coding", "behavioral"]),
              signal: z.string().max(100),
              fixTool: z.string().max(100),
              correctedAnswer: z.string().max(500),
            })
          )
          .max(5),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await scoreDrillWithLLM(
        `You are a Meta interview coach scoring a candidate's ability to diagnose and fix failures in an interview transcript.
Score 0-100: correct failure identification (30pts), correct signal labeling (20pts), appropriate fix tool selection (20pts), quality of corrected answers (30pts).`,
        `Transcript: "${input.transcript}"
Candidate's diagnoses:
${input.diagnosedFailures.map((f, i) => `${i + 1}. Type: ${f.type}, Signal: ${f.signal}, Fix: ${f.fixTool}\n   Corrected: "${f.correctedAnswer}"`).join("\n\n")}

Score their diagnosis and fix quality.`
      );
      const db = await getDb();
      if (db) {
        await db.insert(failureDrillSessions).values({
          userId: ctx.user.id,
          drillId: "live-fix-simulator",
          score: result.score,
          payload: input,
          feedback: result.feedback,
        });
      }
      return result;
    }),

  // ── Drills 11-18: Live Mock Interviewer Engine ─────────────────────────

  /** Generate the first challenge/question for a live mock drill */
  startLiveMock: protectedProcedure
    .input(
      z.object({
        drillId: z.enum([
          "interruptor",
          "clarification-interrogator",
          "devils-advocate",
          "silent-skeptic",
          "scope-creep",
          "time-pressure",
          "xfn-conflict",
          "gotcha-followup",
        ]),
        topic: z.string().max(200),
        context: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const DRILL_PERSONAS: Record<string, string> = {
        interruptor: `You are a Meta Staff Engineer who interrupts candidates mid-explanation. The candidate is about to explain their system design. Generate a realistic mid-explanation interruption question (as if they just said 2-3 sentences). Be direct, technical, and slightly impatient. Ask about a specific technical choice they haven't justified yet.`,
        "clarification-interrogator": `You are a terse Meta interviewer. Give the candidate a deliberately underspecified system design prompt. Do NOT answer follow-up questions about scale, users, or constraints — just say "use your best judgment" for most things. Only answer 2 out of 5 clarifying questions.`,
        "devils-advocate": `You are a Meta Staff Engineer who always takes the opposite position. Whatever the candidate proposes, challenge it — even if it's correct. Be technically sharp, not dismissive. Your goal is to see if they can defend correct positions under sustained pressure.`,
        "silent-skeptic": `You are a Meta interviewer who responds minimally. After the candidate answers, respond with only "Hmm.", "Okay.", "I see.", or "Go on." Never validate or encourage. After 3 exchanges, reveal what you were actually looking for.`,
        "scope-creep": `You are a Meta PM/interviewer. After the candidate starts designing, interrupt with additional requirements that significantly expand scope. Be realistic — these are the kind of scope additions that actually happen in Meta interviews.`,
        "time-pressure": `You are a Meta interviewer running a timed coding round. The candidate has 20 minutes. Generate the coding problem first. Then at the 10-minute mark (when prompted), ask for a status update. At 18 minutes, ask them to verbally walk through their solution.`,
        "xfn-conflict": `You are a Meta PM who disagrees with the candidate's technical recommendation. You believe the engineering estimate is too high and the timeline is too long. Push back professionally but firmly. You have business pressure and a deadline.`,
        "gotcha-followup": `You are a Meta Staff Engineer who fires one sharp follow-up question targeting the weakest assumption in any answer. After the candidate responds to anything, immediately identify their weakest assumption and challenge it with a specific technical question.`,
      };

      const systemPrompt =
        DRILL_PERSONAS[input.drillId] ?? DRILL_PERSONAS["interruptor"];
      const result = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Topic: "${input.topic}"${input.context ? `\nContext: "${input.context}"` : ""}
Generate your opening statement or first question to start this mock drill. Be realistic and in-character.`,
          },
        ],
      });
      const content = result.choices?.[0]?.message?.content ?? "Let's begin.";
      return {
        message:
          typeof content === "string" ? content : JSON.stringify(content),
      };
    }),

  /** Continue a live mock drill turn */
  continueLiveMock: protectedProcedure
    .input(
      z.object({
        drillId: z.enum([
          "interruptor",
          "clarification-interrogator",
          "devils-advocate",
          "silent-skeptic",
          "scope-creep",
          "time-pressure",
          "xfn-conflict",
          "gotcha-followup",
        ]),
        topic: z.string().max(200),
        history: z
          .array(
            z.object({
              role: z.enum(["interviewer", "candidate"]),
              content: z.string().max(1000),
            })
          )
          .max(20),
        candidateResponse: z.string().max(1500),
        turnNumber: z.number().int().min(1).max(10),
        elapsedSeconds: z.number().int().min(0).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const DRILL_PERSONAS: Record<string, string> = {
        interruptor: `You are a Meta Staff Engineer who interrupts candidates. Stay in character — interrupt with a sharp technical question based on what the candidate just said. Find a gap or unjustified assumption in their response and challenge it immediately.`,
        "clarification-interrogator": `You are a terse Meta interviewer. Respond to the candidate's clarifying question. Answer only if it's one of the 2 questions you'll answer — otherwise say "use your best judgment" or "that's up to you." Keep responses very short.`,
        "devils-advocate": `You are a Meta Staff Engineer who always challenges. Take the opposite position from whatever the candidate just said. Be technically sharp. If they defended well, escalate the challenge slightly.`,
        "silent-skeptic": `You are a Meta interviewer who responds minimally. Respond with only "Hmm.", "Okay.", "I see.", "Go on.", or "Interesting." — nothing more. If this is turn 3+, you may reveal one thing you were looking for.`,
        "scope-creep": `You are a Meta PM/interviewer. Add another scope requirement or constraint that complicates the candidate's design. Be realistic. At turn 3+, you can start asking how they'd prioritize given the expanded scope.`,
        "time-pressure": `You are a Meta interviewer. If turn >= 3 and elapsed > 600s, ask for a status update: "You have ${Math.max(0, 20 - Math.floor((input.elapsedSeconds ?? 600) / 60))} minutes left — where are you?" If turn >= 5, ask them to walk through their solution verbally.`,
        "xfn-conflict": `You are a Meta PM in a disagreement. Respond to the candidate's position. If they're being reasonable, soften slightly but maintain your timeline pressure. If they're being dismissive, escalate. Look for a path to alignment.`,
        "gotcha-followup": `You are a Meta Staff Engineer. Identify the weakest assumption or gap in the candidate's latest response and fire ONE sharp follow-up question targeting it. Be specific and technical.`,
      };

      const systemPrompt =
        DRILL_PERSONAS[input.drillId] ?? DRILL_PERSONAS["interruptor"];
      const messages = [
        { role: "system" as const, content: systemPrompt },
        ...input.history.map(h => ({
          role: (h.role === "interviewer" ? "assistant" : "user") as
            | "assistant"
            | "user",
          content: h.content,
        })),
        { role: "user" as const, content: input.candidateResponse },
      ];

      const result = await invokeLLM({ messages });
      const content = result.choices?.[0]?.message?.content ?? "Continue.";
      return {
        message:
          typeof content === "string" ? content : JSON.stringify(content),
        turnNumber: input.turnNumber + 1,
      };
    }),

  /** Score and save a completed live mock session */
  scoreLiveMock: protectedProcedure
    .input(
      z.object({
        drillId: z.enum([
          "interruptor",
          "clarification-interrogator",
          "devils-advocate",
          "silent-skeptic",
          "scope-creep",
          "time-pressure",
          "xfn-conflict",
          "gotcha-followup",
        ]),
        topic: z.string().max(200),
        history: z
          .array(
            z.object({
              role: z.enum(["interviewer", "candidate"]),
              content: z.string().max(1000),
            })
          )
          .max(20),
        elapsedSeconds: z.number().int().min(0).max(2400),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const SCORE_CRITERIA: Record<string, string> = {
        interruptor:
          "Score 0-100: recovery speed after interruption (30pts), technical accuracy of interruption answers (40pts), maintained thread of explanation (30pts).",
        "clarification-interrogator":
          "Score 0-100: quality of clarifying questions (30pts), reasonable assumptions made (30pts), design quality given ambiguity (40pts).",
        "devils-advocate":
          "Score 0-100: held correct positions under pressure (40pts), gracefully conceded genuinely weak points (20pts), provided new evidence when challenged (40pts).",
        "silent-skeptic":
          "Score 0-100: correctly read silence as needing more detail (30pts), didn't over-explain (30pts), maintained confidence without validation (40pts).",
        "scope-creep":
          "Score 0-100: pushed back professionally on unreasonable scope (30pts), re-estimated correctly (30pts), prioritized existing work appropriately (40pts).",
        "time-pressure":
          "Score 0-100: code progress at 10-min check (30pts), quality of status update (30pts), verbal walkthrough clarity (40pts).",
        "xfn-conflict":
          "Score 0-100: held technical ground (30pts), proposed real alternatives (30pts), reached alignment without capitulating (40pts).",
        "gotcha-followup":
          "Score 0-100: addressed the actual weak assumption (40pts), provided new reasoning not in original answer (30pts), didn't deflect or repeat original answer (30pts).",
      };

      const transcript = input.history
        .map(
          h =>
            `${h.role === "interviewer" ? "Interviewer" : "Candidate"}: ${h.content}`
        )
        .join("\n\n");
      const criteria =
        SCORE_CRITERIA[input.drillId] ?? "Score 0-100 on overall performance.";

      const result = await scoreDrillWithLLM(
        `You are a Meta interview coach scoring a live mock drill session. ${criteria}`,
        `Drill: ${input.drillId}\nTopic: "${input.topic}"\nDuration: ${Math.round(input.elapsedSeconds / 60)} minutes\n\nTranscript:\n${transcript}\n\nProvide final score and coaching.`
      );

      const db = await getDb();
      if (db) {
        await db.insert(failureDrillSessions).values({
          userId: ctx.user.id,
          drillId: input.drillId,
          score: result.score,
          payload: {
            topic: input.topic,
            history: input.history,
            elapsedSeconds: input.elapsedSeconds,
          },
          feedback: result.feedback,
        });
      }
      return result;
    }),

  // ── Drill 11: Clarification Interrogator ─────────────────────────────
  answerClarification: protectedProcedure
    .input(
      z.object({
        prompt: z.string().max(300),
        question: z.string().max(300),
        questionsAsked: z.array(z.string()).max(5),
      })
    )
    .mutation(async ({ input }) => {
      const answeredCount = input.questionsAsked.length;
      // Only answer 2 out of every 3 questions
      const shouldIgnore = answeredCount % 3 === 2;
      if (shouldIgnore) {
        return { answer: null, ignored: true };
      }
      const result = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a terse Meta interviewer. Answer this clarifying question about the system design prompt VERY briefly (1-2 sentences max). If the question is about scale/users/constraints and you've already answered 1 question, say "Use your best judgment" instead.`,
          },
          {
            role: "user",
            content: `Prompt: "${input.prompt}"\nQuestion: "${input.question}"`,
          },
        ],
      });
      const content =
        result.choices?.[0]?.message?.content ?? "Use your best judgment.";
      return {
        answer: typeof content === "string" ? content : JSON.stringify(content),
        ignored: false,
      };
    }),

  scoreClarificationDesign: protectedProcedure
    .input(
      z.object({
        prompt: z.string().max(300),
        clarifications: z
          .array(z.object({ question: z.string(), answer: z.string() }))
          .max(5),
        design: z.string().max(3000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const clarificationText = input.clarifications
        .map(c => `Q: ${c.question}\nA: ${c.answer}`)
        .join("\n\n");
      const result = await scoreDrillWithLLM(
        `You are a Meta Staff Engineer scoring a system design done under ambiguity.
Score 0-100: quality of clarifying questions (30pts — were they the right questions?), quality of stated assumptions (30pts — reasonable given the ambiguity?), design quality given the constraints (40pts).
Also return sub-scores as questionQuality (0-30) and assumptionClarity (0-30) in the feedback field.`,
        `Prompt: "${input.prompt}"\n\nClarifications received:\n${clarificationText}\n\nDesign submitted:\n${input.design}\n\nScore their performance.`
      );
      const db = await getDb();
      if (db) {
        await db.insert(failureDrillSessions).values({
          userId: ctx.user.id,
          drillId: "clarification-interrogator",
          score: result.score,
          payload: input,
          feedback: result.feedback,
        });
      }
      return {
        ...result,
        questionQuality: Math.round(result.score * 0.3),
        assumptionClarity: Math.round(result.score * 0.3),
      };
    }),

  // ── Drill 13: Devil's Advocate ────────────────────────────────────────
  generateDevilsChallenge: protectedProcedure
    .input(
      z.object({
        topic: z.string().max(300),
        position: z.string().max(1000),
        turnNumber: z.number().int().min(1).max(5),
        history: z
          .array(
            z.object({
              role: z.enum(["candidate", "interviewer"]),
              content: z.string().max(1000),
            })
          )
          .max(10)
          .optional(),
      })
    )
    .mutation(async ({ input }) => {
      const history = input.history ?? [];
      const messages = [
        {
          role: "system" as const,
          content: `You are a Meta Staff Engineer who always takes the opposite position. Topic: "${input.topic}". The candidate's position: "${input.position}". Challenge their position with a sharp, technically specific counter-argument. Be direct and slightly adversarial but not dismissive. Keep your challenge to 2-3 sentences.`,
        },
        ...history.map(h => ({
          role: (h.role === "interviewer" ? "assistant" : "user") as
            | "assistant"
            | "user",
          content: h.content,
        })),
        {
          role: "user" as const,
          content:
            input.turnNumber === 1
              ? "Start the challenge."
              : "Continue challenging.",
        },
      ];
      const result = await invokeLLM({ messages });
      const content =
        result.choices?.[0]?.message?.content ??
        "Interesting. But have you considered...";
      return {
        challenge:
          typeof content === "string" ? content : JSON.stringify(content),
      };
    }),

  scoreDevilsAdvocate: protectedProcedure
    .input(
      z.object({
        topic: z.string().max(300),
        position: z.string().max(1000),
        turns: z
          .array(
            z.object({
              role: z.enum(["candidate", "interviewer"]),
              content: z.string().max(1000),
            })
          )
          .max(10),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const transcript = input.turns
        .map(
          t =>
            `${t.role === "interviewer" ? "Interviewer" : "Candidate"}: ${t.content}`
        )
        .join("\n\n");
      const result = await scoreDrillWithLLM(
        `You are a Meta interview coach scoring a Devil's Advocate debate.
Score 0-100: held correct positions under sustained pressure (40pts), gracefully conceded genuinely weak points without capitulating (20pts), provided new technical evidence when challenged (40pts).
Look for: repeating the same argument, capitulating too easily, becoming defensive, or failing to address the specific challenge.`,
        `Topic: "${input.topic}"\nOriginal position: "${input.position}"\n\nTranscript:\n${transcript}\n\nScore their debate performance.`
      );
      const db = await getDb();
      if (db) {
        await db.insert(failureDrillSessions).values({
          userId: ctx.user.id,
          drillId: "devils-advocate",
          score: result.score,
          payload: input,
          feedback: result.feedback,
        });
      }
      return result;
    }),

  // ── Drill 14: Silent Skeptic ──────────────────────────────────────────
  scoreSilentSkeptic: protectedProcedure
    .input(
      z.object({
        scenario: z.string().max(300),
        interpretation: z.string().max(1000),
        response: z.string().max(1500),
        silenceType: z.string().max(100),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await scoreDrillWithLLM(
        `You are a Meta interview coach scoring a candidate's ability to read and respond to interviewer silence.
Score 0-100: correct interpretation of what the silence meant (30pts), appropriate response that addressed the gap (40pts), maintained confidence without over-explaining (30pts).
Common silence meanings: needs more detail, waiting for you to catch your own mistake, wants you to go deeper on a specific point, unconvinced by your reasoning.`,
        `Scenario: "${input.scenario}"\nSilence type: "${input.silenceType}"\nCandidate's interpretation: "${input.interpretation}"\nCandidate's response: "${input.response}"\n\nScore their silence-reading ability.`
      );
      const db = await getDb();
      if (db) {
        await db.insert(failureDrillSessions).values({
          userId: ctx.user.id,
          drillId: "silent-skeptic",
          score: result.score,
          payload: input,
          feedback: result.feedback,
        });
      }
      return result;
    }),

  // ── Drill 15: Scope Creep Challenger ─────────────────────────────────
  generateScopeCreep: protectedProcedure
    .input(
      z.object({
        originalPrompt: z.string().max(300),
        currentDesign: z.string().max(1500),
        scopeAdditionNumber: z.number().int().min(1).max(4),
      })
    )
    .mutation(async ({ input }) => {
      const result = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a Meta PM/interviewer. The candidate is designing: "${input.originalPrompt}". Add a realistic scope requirement that complicates their current design. This is scope addition #${input.scopeAdditionNumber}. Be specific and realistic — these are real requirements that come up in Meta interviews. Keep it to 1-2 sentences.`,
          },
          {
            role: "user",
            content: `Current design so far: "${input.currentDesign}"\n\nAdd a new scope requirement.`,
          },
        ],
      });
      const content =
        result.choices?.[0]?.message?.content ??
        "Actually, we also need to support...";
      return {
        requirement:
          typeof content === "string" ? content : JSON.stringify(content),
      };
    }),

  scoreScopeCreep: protectedProcedure
    .input(
      z.object({
        originalPrompt: z.string().max(300),
        scopeAdditions: z.array(z.string()).max(4),
        finalDesign: z.string().max(3000),
        pushbackGiven: z.string().max(1000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await scoreDrillWithLLM(
        `You are a Meta Staff Engineer scoring a candidate's response to scope creep in a system design interview.
Score 0-100: pushed back professionally on unreasonable scope (30pts), re-estimated correctly when scope expanded (30pts), prioritized existing work appropriately without starting over (40pts).
Look for: starting over completely (bad), ignoring the new requirements (bad), adapting the existing design (good), explicitly stating trade-offs of the scope addition (great).`,
        `Original prompt: "${input.originalPrompt}"\nScope additions: ${input.scopeAdditions.join("; ")}\nPushback given: "${input.pushbackGiven ?? "none"}"\nFinal design: "${input.finalDesign}"\n\nScore their scope management.`
      );
      const db = await getDb();
      if (db) {
        await db.insert(failureDrillSessions).values({
          userId: ctx.user.id,
          drillId: "scope-creep",
          score: result.score,
          payload: input,
          feedback: result.feedback,
        });
      }
      return result;
    }),

  // ── Drill 16: Time Pressure Mock ─────────────────────────────────────
  scoreTimePressureMock: protectedProcedure
    .input(
      z.object({
        problem: z.string().max(500),
        code: z.string().max(5000),
        statusUpdate: z.string().max(1000),
        verbalWalkthrough: z.string().max(2000),
        elapsedSeconds: z.number().int().min(0).max(2400),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await scoreDrillWithLLM(
        `You are a Meta Staff Engineer scoring a timed coding mock.
Score 0-100: code correctness and completeness (40pts), quality of status update at midpoint (20pts), clarity of verbal walkthrough (20pts), time management (20pts — finishing within time or having a clear plan).
Look for: edge case handling, clean code, clear communication under pressure.`,
        `Problem: "${input.problem}"\nTime elapsed: ${Math.round(input.elapsedSeconds / 60)} minutes\nCode submitted:\n${input.code}\nStatus update given: "${input.statusUpdate}"\nVerbal walkthrough: "${input.verbalWalkthrough}"\n\nScore their timed coding performance.`
      );
      const db = await getDb();
      if (db) {
        await db.insert(failureDrillSessions).values({
          userId: ctx.user.id,
          drillId: "time-pressure",
          score: result.score,
          payload: {
            problem: input.problem,
            elapsedSeconds: input.elapsedSeconds,
          },
          feedback: result.feedback,
        });
      }
      return result;
    }),

  // ── Drill 17: XFN Conflict Simulator ─────────────────────────────────
  generateXFNResponse: protectedProcedure
    .input(
      z.object({
        scenarioId: z.string().max(50),
        history: z
          .array(
            z.object({
              role: z.enum(["you", "xfn"]),
              content: z.string().max(1000),
            })
          )
          .max(10),
        turnNumber: z.number().int().min(1).max(6),
      })
    )
    .mutation(async ({ input }) => {
      const XFN_PERSONAS: Record<string, string> = {
        xfn1: "You are a Meta PM under executive pressure. The engineer says the feature takes 6 weeks but you need it in 2. Push back professionally. You have business justification. Be firm but not dismissive.",
        xfn2: "You are a Meta Designer with executive buy-in for an animation-heavy UI. The engineer is pushing back on performance. Defend your design but be open to technical constraints.",
        xfn3: "You are a Meta Data Scientist confident in your model's offline metrics. Push back on the engineer's request for shadow mode testing. You believe it's unnecessary caution.",
        xfn4: "You are a Meta Security Engineer blocking a launch for a theoretical vulnerability. You believe the risk is real even if low-probability. Hold your position but be open to risk mitigation alternatives.",
      };
      const persona = XFN_PERSONAS[input.scenarioId] ?? XFN_PERSONAS["xfn1"];
      const messages = [
        {
          role: "system" as const,
          content: `${persona} Keep responses to 2-3 sentences. Be realistic and in-character.`,
        },
        ...input.history.map(h => ({
          role: (h.role === "xfn" ? "assistant" : "user") as
            | "assistant"
            | "user",
          content: h.content,
        })),
        {
          role: "user" as const,
          content:
            input.turnNumber === 1
              ? "Start the conflict scenario."
              : "Respond to the engineer.",
        },
      ];
      const result = await invokeLLM({ messages });
      const content =
        result.choices?.[0]?.message?.content ??
        "I understand your concern, but...";
      return {
        response:
          typeof content === "string" ? content : JSON.stringify(content),
      };
    }),

  scoreXFNConflict: protectedProcedure
    .input(
      z.object({
        scenarioId: z.string().max(50),
        turns: z
          .array(
            z.object({
              role: z.enum(["you", "xfn"]),
              content: z.string().max(1000),
            })
          )
          .max(12),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const transcript = input.turns
        .map(
          t =>
            `${t.role === "xfn" ? "XFN Stakeholder" : "Engineer"}: ${t.content}`
        )
        .join("\n\n");
      const result = await scoreDrillWithLLM(
        `You are a Meta interview coach scoring an XFN conflict resolution exercise.
Score 0-100: proposed concrete alternatives rather than just saying no (30pts), acknowledged the other person's constraints and business context (30pts), reached a workable resolution or clear escalation path (40pts).
Look for: dismissing the stakeholder's concerns, agreeing to everything without pushback, failing to propose alternatives.`,
        `Scenario ID: ${input.scenarioId}\n\nTranscript:\n${transcript}\n\nScore their XFN conflict resolution.`
      );
      const db = await getDb();
      if (db) {
        await db.insert(failureDrillSessions).values({
          userId: ctx.user.id,
          drillId: "xfn-conflict",
          score: result.score,
          payload: input,
          feedback: result.feedback,
        });
      }
      return result;
    }),

  // ── Drill 18: The Gotcha Follow-Up ───────────────────────────────────
  generateGotchaQuestion: protectedProcedure
    .input(
      z.object({
        scenarioId: z.string().max(50),
        candidateAnswer: z.string().max(1500),
      })
    )
    .mutation(async ({ input }) => {
      const result = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a Meta Staff Engineer. Read this candidate answer and identify the single weakest assumption or biggest gap. Then generate ONE sharp follow-up question that directly exposes it. The question should be specific and technical, not generic. Keep it to 1-2 sentences.`,
          },
          {
            role: "user",
            content: `Candidate answer: "${input.candidateAnswer}"\n\nGenerate the gotcha follow-up question.`,
          },
        ],
      });
      const content =
        result.choices?.[0]?.message?.content ?? "What happens when...";
      return {
        question:
          typeof content === "string" ? content : JSON.stringify(content),
      };
    }),

  scoreGotchaFollowUp: protectedProcedure
    .input(
      z.object({
        scenarioId: z.string().max(50),
        gotchaQuestion: z.string().max(500),
        predictedFollowUps: z.string().max(1000),
        answer: z.string().max(2000),
        weakAssumptions: z.array(z.string()).max(10),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await scoreDrillWithLLM(
        `You are a Meta interview coach scoring a Gotcha Follow-Up drill.
Score 0-100: prediction quality — did their predicted follow-ups include the actual gotcha question or similar concerns (30pts), answer quality — did they address the actual weak assumption (40pts), provided new reasoning not just repeating original answer (30pts).
Also estimate predictionScore (0-30) and answerScore (0-70) sub-scores.`,
        `Gotcha question: "${input.gotchaQuestion}"\nPredicted follow-ups: "${input.predictedFollowUps}"\nActual weak assumptions: ${input.weakAssumptions.join("; ")}\nCandidate's answer to gotcha: "${input.answer}"\n\nScore their prediction and answer quality.`
      );
      const db = await getDb();
      if (db) {
        await db.insert(failureDrillSessions).values({
          userId: ctx.user.id,
          drillId: "gotcha-followup",
          score: result.score,
          payload: input,
          feedback: result.feedback,
        });
      }
      return {
        ...result,
        predictionScore: Math.round(result.score * 0.3),
        answerScore: Math.round(result.score * 0.7),
      };
    }),

  // ── History ────────────────────────────────────────────────────────────
  getHistory: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) return [];
    const db = await getDb();
    if (!db) return [];
    return db
      .select()
      .from(failureDrillSessions)
      .where(eq(failureDrillSessions.userId, ctx.user.id))
      .orderBy(desc(failureDrillSessions.completedAt))
      .limit(100);
  }),

  getBestScores: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) return {} as Record<string, number>;
    const db = await getDb();
    if (!db) return {} as Record<string, number>;
    const rows = await db
      .select()
      .from(failureDrillSessions)
      .where(eq(failureDrillSessions.userId, ctx.user.id))
      .orderBy(desc(failureDrillSessions.completedAt))
      .limit(500);
    const best: Record<string, number> = {};
    for (const row of rows) {
      if (best[row.drillId] === undefined || row.score > best[row.drillId]) {
        best[row.drillId] = row.score;
      }
    }
    return best;
  }),
});
