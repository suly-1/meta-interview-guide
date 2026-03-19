import { protectedProcedure, publicProcedure, adminProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq, asc } from "drizzle-orm";

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

  /**
   * Admin-only: return all users with their disclaimer acknowledgment status.
   * Sorted by acknowledgedAt desc (acknowledged first), then by createdAt asc.
   */
  adminReport: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    const rows = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
        lastSignedIn: users.lastSignedIn,
        disclaimerAcknowledgedAt: users.disclaimerAcknowledgedAt,
      })
      .from(users)
      .orderBy(asc(users.createdAt));

    return rows.map(r => ({
      id: r.id,
      name: r.name ?? "—",
      email: r.email ?? "—",
      role: r.role,
      createdAt: r.createdAt,
      lastSignedIn: r.lastSignedIn,
      acknowledged: r.disclaimerAcknowledgedAt !== null,
      acknowledgedAt: r.disclaimerAcknowledgedAt ?? null,
    }));
  }),
});
