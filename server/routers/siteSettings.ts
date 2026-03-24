import { z } from "zod";
import { adminProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { siteSettings } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

// Helper: get a setting value by key
async function getSetting(key: string): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select({ value: siteSettings.value }).from(siteSettings).where(eq(siteSettings.key, key)).limit(1);
  return row?.value ?? null;
}

// Helper: set a setting value
async function setSetting(key: string, value: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(siteSettings).values({ key, value }).onDuplicateKeyUpdate({ set: { value } });
}

export const siteSettingsRouter = router({
  /**
   * Public: Get the current lock status.
   * Returns whether the site is locked, when it started, and how many days remain.
   * The owner (admin) is never locked out — they bypass the gate.
   */
  getLockStatus: publicProcedure.query(async ({ ctx }) => {
    const lockEnabled = (await getSetting("lock_enabled")) === "1";
    const lockStartDate = await getSetting("lock_start_date");
    const lockDurationDays = parseInt((await getSetting("lock_duration_days")) ?? "60", 10);

    // Owner always bypasses the lock
    const isOwner = ctx.user?.role === "admin";

    if (!lockEnabled || !lockStartDate) {
      return {
        isLocked: false,
        isOwner,
        lockEnabled,
        lockStartDate,
        lockDurationDays,
        daysRemaining: null,
        daysElapsed: null,
        lockedAt: null,
      };
    }

    const startMs = new Date(lockStartDate).getTime();
    const nowMs = Date.now();
    const daysElapsed = Math.floor((nowMs - startMs) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.max(0, lockDurationDays - daysElapsed);
    const isExpired = daysElapsed >= lockDurationDays;

    return {
      isLocked: isExpired && !isOwner,
      isOwner,
      lockEnabled,
      lockStartDate,
      lockDurationDays,
      daysRemaining,
      daysElapsed,
      lockedAt: isExpired ? new Date(startMs + lockDurationDays * 24 * 60 * 60 * 1000).toISOString() : null,
    };
  }),

  /**
   * Admin: Update lock settings.
   */
  updateLockSettings: adminProcedure
    .input(z.object({
      lockEnabled: z.boolean().optional(),
      lockStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD").optional(),
      lockDurationDays: z.number().int().min(1).max(365).optional(),
    }))
    .mutation(async ({ input }) => {
      if (input.lockEnabled !== undefined) {
        await setSetting("lock_enabled", input.lockEnabled ? "1" : "0");
      }
      if (input.lockStartDate !== undefined) {
        await setSetting("lock_start_date", input.lockStartDate);
      }
      if (input.lockDurationDays !== undefined) {
        await setSetting("lock_duration_days", String(input.lockDurationDays));
      }
      return { success: true };
    }),

  /**
   * Admin: Reset the 60-day clock to today (start a new cohort).
   */
  resetClock: adminProcedure.mutation(async () => {
    const today = new Date().toISOString().slice(0, 10);
    await setSetting("lock_start_date", today);
    await setSetting("lock_enabled", "1");
    return { success: true, newStartDate: today };
  }),

  /**
   * Admin: Immediately lock the site (manual override).
   */
  lockNow: adminProcedure.mutation(async () => {
    // Set start date far in the past so it's immediately expired
    const pastDate = new Date(Date.now() - 61 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    await setSetting("lock_start_date", pastDate);
    await setSetting("lock_enabled", "1");
    return { success: true };
  }),

  /**
   * Admin: Unlock the site immediately.
   */
  unlock: adminProcedure.mutation(async () => {
    await setSetting("lock_enabled", "0");
    return { success: true };
  }),
});
