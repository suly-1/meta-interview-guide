import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { leaderboardEntries } from "../../drizzle/schema";
import { desc, eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

// ── Leaderboard Router ────────────────────────────────────────────────────────
// Fix #3: upsert and remove now require login and enforce user ownership.
// getTop and checkHandle remain public so anyone can view the leaderboard.
export const leaderboardRouter = router({
  // Get top 20 entries — public read
  getTop: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    const rows = await db
      .select()
      .from(leaderboardEntries)
      .orderBy(desc(leaderboardEntries.patternsMastered), desc(leaderboardEntries.streakDays))
      .limit(20);
    return rows;
  }),

  // Upsert a leaderboard entry — requires login, enforces ownership
  upsert: protectedProcedure
    .input(
      z.object({
        anonHandle: z.string().min(2).max(32),
        streakDays: z.number().int().min(0),
        patternsMastered: z.number().int().min(0).max(20),
        mockSessions: z.number().int().min(0),
        overallPct: z.number().int().min(0).max(100),
        badges: z.array(z.string()).default([]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Check if this user already has an entry
      const existingByUser = await db
        .select()
        .from(leaderboardEntries)
        .where(eq(leaderboardEntries.userId, ctx.user.id))
        .limit(1);

      if (existingByUser.length > 0) {
        // User owns this entry — update it (handle may change too)
        await db
          .update(leaderboardEntries)
          .set({
            anonHandle: input.anonHandle,
            streakDays: input.streakDays,
            patternsMastered: input.patternsMastered,
            mockSessions: input.mockSessions,
            overallPct: input.overallPct,
            badges: input.badges,
          })
          .where(eq(leaderboardEntries.userId, ctx.user.id));
      } else {
        // Check handle uniqueness before inserting
        const handleTaken = await db
          .select({ id: leaderboardEntries.id })
          .from(leaderboardEntries)
          .where(eq(leaderboardEntries.anonHandle, input.anonHandle))
          .limit(1);

        if (handleTaken.length > 0) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "This handle is already taken. Please choose a different one.",
          });
        }

        await db.insert(leaderboardEntries).values({
          userId: ctx.user.id,
          anonHandle: input.anonHandle,
          streakDays: input.streakDays,
          patternsMastered: input.patternsMastered,
          mockSessions: input.mockSessions,
          overallPct: input.overallPct,
          badges: input.badges,
        });
      }

      return { success: true, handle: input.anonHandle };
    }),

  // Remove own leaderboard entry — requires login, only deletes own entry
  remove: protectedProcedure
    .mutation(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await db
        .delete(leaderboardEntries)
        .where(eq(leaderboardEntries.userId, ctx.user.id));
      return { success: true };
    }),

  // Check if a handle is taken — public
  checkHandle: publicProcedure
    .input(z.object({ anonHandle: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { taken: false };
      const rows = await db
        .select({ id: leaderboardEntries.id })
        .from(leaderboardEntries)
        .where(eq(leaderboardEntries.anonHandle, input.anonHandle))
        .limit(1);
      return { taken: rows.length > 0 };
    }),

  // Get current user's own entry (so they can see their rank)
  getMyEntry: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;
    const rows = await db
      .select()
      .from(leaderboardEntries)
      .where(eq(leaderboardEntries.userId, ctx.user.id))
      .limit(1);
    return rows[0] ?? null;
  }),
});
