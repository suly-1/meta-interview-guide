import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const disclaimerRouter = router({
  /**
   * Write a disclaimer_acknowledged_at timestamp for the current logged-in user.
   * Idempotent — calling it again updates the timestamp (re-acknowledgment).
   */
  acknowledge: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { success: false, acknowledgedAt: null };
    const now = new Date();
    await db
      .update(users)
      .set({ disclaimerAcknowledgedAt: now })
      .where(eq(users.id, ctx.user.id));
    return { success: true, acknowledgedAt: now };
  }),

  /**
   * Return the disclaimer acknowledgment status for the current user.
   * Returns acknowledged: false for unauthenticated users (they rely on localStorage only).
   */
  status: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) return { acknowledged: false, acknowledgedAt: null };
    const db = await getDb();
    if (!db) return { acknowledged: false, acknowledgedAt: null };
    const [row] = await db
      .select({ disclaimerAcknowledgedAt: users.disclaimerAcknowledgedAt })
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1);
    const ts = row?.disclaimerAcknowledgedAt ?? null;
    return {
      acknowledged: ts !== null,
      acknowledgedAt: ts,
    };
  }),
});
