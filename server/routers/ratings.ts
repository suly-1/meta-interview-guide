import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { userRatings } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

const VALID_TYPES = ["pattern", "bq"] as const;
type RatingType = (typeof VALID_TYPES)[number];

async function getRatings(userId: number, ratingType: RatingType) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select()
    .from(userRatings)
    .where(and(eq(userRatings.userId, userId), eq(userRatings.ratingType, ratingType)))
    .limit(1);
  if (rows.length === 0) return null;
  return rows[0].ratings as Record<string, number>;
}

async function saveRatings(userId: number, ratingType: RatingType, ratings: Record<string, number>) {
  const db = await getDb();
  if (!db) return false;
  const existing = await db
    .select({ id: userRatings.id })
    .from(userRatings)
    .where(and(eq(userRatings.userId, userId), eq(userRatings.ratingType, ratingType)))
    .limit(1);

  const ratingsValue = ratings as Record<string, number>;
  if (existing.length === 0) {
    await db.insert(userRatings).values([{
      userId,
      ratingType,
      ratings: ratingsValue,
    }]);
  } else {
    await db
      .update(userRatings)
      .set({ ratings: ratingsValue })
      .where(and(eq(userRatings.userId, userId), eq(userRatings.ratingType, ratingType)));
  }
  return true;
}

export const ratingsRouter = router({
  /** Get both pattern and BQ ratings for the current user */
  getAll: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) return null;
    const [patternRatings, bqRatings] = await Promise.all([
      getRatings(ctx.user.id, "pattern"),
      getRatings(ctx.user.id, "bq"),
    ]);
    return { patternRatings, bqRatings };
  }),

  /** Save pattern ratings */
  savePatternRatings: protectedProcedure
    .input(z.object({ ratings: z.record(z.string(), z.number()) }))
    .mutation(async ({ ctx, input }) => {
      const ok = await saveRatings(ctx.user.id, "pattern", input.ratings);
      return { success: ok };
    }),

  /** Save BQ ratings */
  saveBqRatings: protectedProcedure
    .input(z.object({ ratings: z.record(z.string(), z.number()) }))
    .mutation(async ({ ctx, input }) => {
      const ok = await saveRatings(ctx.user.id, "bq", input.ratings);
      return { success: ok };
    }),
});
