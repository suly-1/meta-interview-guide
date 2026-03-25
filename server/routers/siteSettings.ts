import { z } from "zod";
import { tokenAdminProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { siteSettings, users } from "../../drizzle/schema";
import { eq, count, isNotNull } from "drizzle-orm";

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
   *
   * IMPORTANT: `isLocked` reflects the TRUE lock state for non-admin users.
   * Admins bypass the gate (see SiteLockGate), but we still report the real
   * state so the AdminSettings UI can show whether the site is actually locked.
   * The `isOwner` flag tells the UI that the admin is bypassing the lock.
   */
  getLockStatus: publicProcedure.query(async ({ ctx }) => {
    const lockEnabled = (await getSetting("lock_enabled")) === "1";
    const lockStartDate = await getSetting("lock_start_date");
    const lockDurationDays = parseInt((await getSetting("lock_duration_days")) ?? "60", 10);

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
      // True lock state — admins bypass it in SiteLockGate, but the UI
      // should still show "LOCKED" so the admin knows the site is closed.
      isLocked: isExpired,
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
  updateLockSettings: tokenAdminProcedure
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
  resetClock: tokenAdminProcedure.mutation(async () => {
    const today = new Date().toISOString().slice(0, 10);
    await setSetting("lock_start_date", today);
    await setSetting("lock_enabled", "1");
    return { success: true, newStartDate: today };
  }),

  /**
   * Admin: Immediately lock the site (manual override).
   * Sets the start date 61 days in the past so the cohort is immediately expired.
   */
  lockNow: tokenAdminProcedure.mutation(async () => {
    const pastDate = new Date(Date.now() - 61 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    await setSetting("lock_start_date", pastDate);
    await setSetting("lock_enabled", "1");
    return { success: true };
  }),

  /**
   * Admin: Unlock the site immediately.
   */
  unlock: tokenAdminProcedure.mutation(async () => {
    await setSetting("lock_enabled", "0");
    return { success: true };
  }),

  /**
   * Admin: Cohort health summary — total users, % acknowledged disclaimer, days remaining.
   */
  getCohortHealth: tokenAdminProcedure.query(async () => {
    const db = await getDb();
    if (!db) {
      return {
        totalUsers: 0, acknowledgedCount: 0, acknowledgedPct: 0,
        daysRemaining: null, daysElapsed: null,
        lockEnabled: false, lockStartDate: null, lockDurationDays: 60,
      };
    }
    // User counts
    const [{ total }] = await db.select({ total: count() }).from(users);
    const [{ acked }] = await db
      .select({ acked: count() })
      .from(users)
      .where(isNotNull(users.disclaimerAcknowledgedAt));
    const totalUsers = Number(total);
    const acknowledgedCount = Number(acked);
    const acknowledgedPct = totalUsers > 0 ? Math.round((acknowledgedCount / totalUsers) * 100) : 0;
    // Lock / cohort window
    const lockEnabled = (await getSetting("lock_enabled")) === "1";
    const lockStartDate = await getSetting("lock_start_date");
    const lockDurationDays = parseInt((await getSetting("lock_duration_days")) ?? "60", 10);
    let daysRemaining: number | null = null;
    let daysElapsed: number | null = null;
    if (lockEnabled && lockStartDate) {
      const elapsed = Math.floor((Date.now() - new Date(lockStartDate).getTime()) / (1000 * 60 * 60 * 24));
      daysElapsed = elapsed;
      daysRemaining = Math.max(0, lockDurationDays - elapsed);
    }
    return { totalUsers, acknowledgedCount, acknowledgedPct, daysRemaining, daysElapsed, lockEnabled, lockStartDate, lockDurationDays };
  }),

  /**
   * Public: Get whether the disclaimer gate is enabled.
   */
  getDisclaimerEnabled: publicProcedure.query(async () => {
    const val = await getSetting("disclaimer_enabled");
    // Default to enabled ("1") if not set
    return { enabled: val !== "0" };
  }),

  /**
   * Admin: Enable or disable the disclaimer gate.
   */
  setDisclaimerEnabled: tokenAdminProcedure
    .input(z.object({ enabled: z.boolean() }))
    .mutation(async ({ input }) => {
      await setSetting("disclaimer_enabled", input.enabled ? "1" : "0");
      return { success: true, enabled: input.enabled };
    }),
});
