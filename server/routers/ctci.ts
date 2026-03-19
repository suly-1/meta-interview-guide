import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";

export const ctciRouter = router({
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
