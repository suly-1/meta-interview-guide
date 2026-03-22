import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { onboardingProgress } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const onboardingRouter = router({
  /** Get onboarding progress for the current user (null if not logged in or no record) */
  get: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) return null;
    const db = await getDb();
    if (!db) return null;
    const rows = await db
      .select()
      .from(onboardingProgress)
      .where(eq(onboardingProgress.userId, ctx.user.id))
      .limit(1);
    if (rows.length === 0) return null;
    return {
      progress: rows[0].progress as Record<string, boolean>,
      dismissed: rows[0].dismissed === 1,
    };
  }),

  /** Upsert onboarding progress for the current user */
  save: protectedProcedure
    .input(
      z.object({
        progress: z.record(z.string(), z.boolean()),
        dismissed: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: false };

      const existing = await db
        .select({ id: onboardingProgress.id })
        .from(onboardingProgress)
        .where(eq(onboardingProgress.userId, ctx.user.id))
        .limit(1);

      const progressValue = input.progress as Record<string, boolean>;
      if (existing.length === 0) {
        await db.insert(onboardingProgress).values([
          {
            userId: ctx.user.id,
            progress:
              Object.keys(progressValue).length > 0
                ? progressValue
                : ({} as Record<string, boolean>),
            dismissed: input.dismissed ? 1 : 0,
          },
        ]);
      } else {
        await db
          .update(onboardingProgress)
          .set({
            progress: progressValue,
            dismissed: input.dismissed ? 1 : 0,
          })
          .where(eq(onboardingProgress.userId, ctx.user.id));
      }
      return { success: true };
    }),
});
