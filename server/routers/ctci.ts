import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";

export const ctciRouter = router({
  scoreAnswer: publicProcedure
    .input(
      z.object({
        question: z.string().min(1),
        answer: z.string().min(1),
        icTarget: z.enum(["IC5", "IC6", "IC7"]).default("IC6"),
      })
    )
    .mutation(async ({ input }) => {
      const { question, answer, icTarget } = input;

      const systemPrompt = `You are a Meta senior engineering interviewer evaluating a STAR behavioral answer.
Score the answer on THREE dimensions, each 1-5:
1. Specificity (1=vague/generic, 5=concrete metrics/names/dates)
2. Impact (1=no measurable outcome, 5=clear business/technical impact with numbers)
3. IC-Level Fit (1=below ${icTarget}, 5=clearly demonstrates ${icTarget} scope and ownership)

Respond ONLY with valid JSON in this exact shape:
{
  "specificity": <1-5>,
  "impact": <1-5>,
  "icLevelFit": <1-5>,
  "overall": <1-5>,
  "strengths": ["<one sentence>", "<one sentence>"],
  "improvements": ["<one sentence>", "<one sentence>"]
}
No extra text outside the JSON.`;

      const userMsg = `Question: ${question}

Answer:
${answer.slice(0, 2000)}`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMsg },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "answer_score",
            strict: true,
            schema: {
              type: "object",
              properties: {
                specificity: { type: "integer" },
                impact: { type: "integer" },
                icLevelFit: { type: "integer" },
                overall: { type: "integer" },
                strengths: { type: "array", items: { type: "string" } },
                improvements: { type: "array", items: { type: "string" } },
              },
              required: ["specificity", "impact", "icLevelFit", "overall", "strengths", "improvements"],
              additionalProperties: false,
            },
          },
        },
      });

      const raw = response.choices?.[0]?.message?.content ?? "{}";
      try {
        const parsed = JSON.parse(typeof raw === "string" ? raw : JSON.stringify(raw));
        return {
          specificity: Math.min(5, Math.max(1, parsed.specificity ?? 3)),
          impact: Math.min(5, Math.max(1, parsed.impact ?? 3)),
          icLevelFit: Math.min(5, Math.max(1, parsed.icLevelFit ?? 3)),
          overall: Math.min(5, Math.max(1, parsed.overall ?? 3)),
          strengths: parsed.strengths ?? [],
          improvements: parsed.improvements ?? [],
        };
      } catch {
        return { specificity: 3, impact: 3, icLevelFit: 3, overall: 3, strengths: [], improvements: ["Could not parse AI response."] };
      }
    }),

  getHint: publicProcedure
    .input(
      z.object({
        problemName: z.string().min(1),
        problemNum: z.number().int().positive(),
        difficulty: z.string(),
        topics: z.array(z.string()),
        currentCode: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { problemName, difficulty, topics, currentCode } = input;

      const systemPrompt = `You are a coding interview coach helping a candidate prepare for Meta interviews.
Your job is to give a HINT — not the full solution.
Rules:
- Give 1-2 sentences maximum
- Point toward the right data structure or algorithmic pattern WITHOUT revealing the full approach
- If the user has written code, comment on the direction (right/wrong) without fixing it
- Never write actual solution code
- Be encouraging and concise`;

      const userMsg = `Problem: ${problemName} (${difficulty})
Topics: ${topics.join(", ")}
${currentCode && currentCode.trim().length > 50 ? `\nCurrent code attempt:\n\`\`\`\n${currentCode.slice(0, 800)}\n\`\`\`` : ""}

Give me a hint to get unstuck without spoiling the solution.`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMsg },
        ],
      });

      const hint = response.choices?.[0]?.message?.content ?? "Think about which data structure gives you O(1) lookup here.";

      return { hint: typeof hint === "string" ? hint : JSON.stringify(hint) };
    }),
});
