/**
 * siteSettings router
 *
 * Lock model (two independent axes):
 *
 *   1. manual_lock  (key: "manual_lock_enabled", "1"/"0")
 *      Instant on/off switch. When "1" the site is locked RIGHT NOW regardless
 *      of the timer. Admins see "LOCKED (manual)" in the UI.
 *
 *   2. 60-day timer (keys: "lock_enabled", "lock_start_date", "lock_duration_days")
 *      Auto-expires the cohort after N days from the start date.
 *      Completely independent of the manual lock.
 *
 * A non-admin visitor is locked out if EITHER axis is active.
 * Admins always bypass both.
 */
import { z } from "zod";
import { ownerProcedure, tokenAdminProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { siteSettings, users } from "../../drizzle/schema";
import { eq, count, isNotNull } from "drizzle-orm";

// ── Helpers ──────────────────────────────────────────────────────────────────

async function getSetting(key: string): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db
    .select({ value: siteSettings.value })
    .from(siteSettings)
    .where(eq(siteSettings.key, key))
    .limit(1);
  return row?.value ?? null;
}

async function setSetting(key: string, value: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .insert(siteSettings)
    .values({ key, value })
    .onDuplicateKeyUpdate({ set: { value } });
}

// ── Router ───────────────────────────────────────────────────────────────────

export const siteSettingsRouter = router({
  /**
   * Public: Get the current lock status.
   * isLocked = true if manual lock OR timer has expired.
   * lockReason = "manual" | "timer_expired" | "none"
   */
  getLockStatus: publicProcedure.query(async ({ ctx }) => {
    const [manualLock, lockEnabled, lockStartDate, lockDurationDaysRaw] = await Promise.all([
      getSetting("manual_lock_enabled"),
      getSetting("lock_enabled"),
      getSetting("lock_start_date"),
      getSetting("lock_duration_days"),
    ]);

    const isOwner = ctx.user?.role === "admin";
    const lockDurationDays = parseInt(lockDurationDaysRaw ?? "60", 10);

    // ── Manual lock ──────────────────────────────────────────────────────────
    if (manualLock === "1") {
      return {
        isLocked: true,
        lockReason: "manual" as const,
        isOwner,
        lockEnabled: lockEnabled === "1",
        lockStartDate: lockStartDate ?? null,
        lockDurationDays,
        daysRemaining: null,
        daysElapsed: null,
        lockedAt: null,
      };
    }

    // ── Timer-based lock ─────────────────────────────────────────────────────
    if (lockEnabled === "1" && lockStartDate) {
      const startMs = new Date(lockStartDate).getTime();
      const nowMs = Date.now();
      const daysElapsed = Math.floor((nowMs - startMs) / 86_400_000);
      const daysRemaining = Math.max(0, lockDurationDays - daysElapsed);
      const isExpired = daysElapsed >= lockDurationDays;

      return {
        isLocked: isExpired,
        lockReason: isExpired ? ("timer_expired" as const) : ("none" as const),
        isOwner,
        lockEnabled: true,
        lockStartDate,
        lockDurationDays,
        daysRemaining,
        daysElapsed,
        lockedAt: isExpired
          ? new Date(startMs + lockDurationDays * 86_400_000).toISOString()
          : null,
      };
    }

    // ── No lock active ───────────────────────────────────────────────────────
    return {
      isLocked: false,
      lockReason: "none" as const,
      isOwner,
      lockEnabled: lockEnabled === "1",
      lockStartDate: lockStartDate ?? null,
      lockDurationDays,
      daysRemaining: null,
      daysElapsed: null,
      lockedAt: null,
    };
  }),

  /**
   * Admin: Instantly lock the site for all non-admin visitors.
   * Sets manual_lock_enabled = "1". Timer state is untouched.
   */
  lockNow: tokenAdminProcedure.mutation(async () => {
    await setSetting("manual_lock_enabled", "1");
    return { success: true };
  }),

  /**
   * Admin: Instantly unlock the site.
   * Clears the manual lock. Timer continues running normally.
   */
  unlock: tokenAdminProcedure.mutation(async () => {
    await setSetting("manual_lock_enabled", "0");
    return { success: true };
  }),

  /**
   * Admin: Reset the 60-day clock to today (start a new cohort).
   * Also clears the manual lock so the site opens immediately.
   */
  resetClock: tokenAdminProcedure.mutation(async () => {
    const today = new Date().toISOString().slice(0, 10);
    await setSetting("lock_start_date", today);
    await setSetting("lock_enabled", "1");
    await setSetting("manual_lock_enabled", "0");
    return { success: true, newStartDate: today };
  }),

  /**
   * Admin: Update timer settings (start date, duration, enabled toggle).
   */
  updateLockSettings: tokenAdminProcedure
    .input(
      z.object({
        lockEnabled:      z.boolean().optional(),
        lockStartDate:    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD").optional(),
        lockDurationDays: z.number().int().min(1).max(730).optional(),
      })
    )
    .mutation(async ({ input }) => {
      if (input.lockEnabled !== undefined)
        await setSetting("lock_enabled", input.lockEnabled ? "1" : "0");
      if (input.lockStartDate !== undefined)
        await setSetting("lock_start_date", input.lockStartDate);
      if (input.lockDurationDays !== undefined)
        await setSetting("lock_duration_days", String(input.lockDurationDays));
      return { success: true };
    }),

  /**
   * Admin: Cohort health summary.
   */
  getCohortHealth: ownerProcedure.query(async () => {
    const db = await getDb();
    if (!db) {
      return {
        totalUsers: 0, acknowledgedCount: 0, acknowledgedPct: 0,
        daysRemaining: null, daysElapsed: null,
        lockEnabled: false, lockStartDate: null, lockDurationDays: 60,
        manualLock: false,
      };
    }
    const [{ total }] = await db.select({ total: count() }).from(users);
    const [{ acked }] = await db
      .select({ acked: count() })
      .from(users)
      .where(isNotNull(users.disclaimerAcknowledgedAt));
    const totalUsers = Number(total);
    const acknowledgedCount = Number(acked);
    const acknowledgedPct = totalUsers > 0 ? Math.round((acknowledgedCount / totalUsers) * 100) : 0;

    const lockEnabled   = (await getSetting("lock_enabled")) === "1";
    const manualLock    = (await getSetting("manual_lock_enabled")) === "1";
    const lockStartDate = await getSetting("lock_start_date");
    const lockDurationDays = parseInt((await getSetting("lock_duration_days")) ?? "60", 10);

    let daysRemaining: number | null = null;
    let daysElapsed: number | null = null;
    if (lockEnabled && lockStartDate) {
      const elapsed = Math.floor((Date.now() - new Date(lockStartDate).getTime()) / 86_400_000);
      daysElapsed = elapsed;
      daysRemaining = Math.max(0, lockDurationDays - elapsed);
    }
    return {
      totalUsers, acknowledgedCount, acknowledgedPct,
      daysRemaining, daysElapsed,
      lockEnabled, lockStartDate, lockDurationDays, manualLock,
    };
  }),

  /**
   * Public: Get whether the disclaimer gate is enabled.
   */
  getDisclaimerEnabled: publicProcedure.query(async () => {
    const val = await getSetting("disclaimer_enabled");
    return { enabled: val !== "0" };
  }),

  /**
   * Admin: Enable or disable the disclaimer gate.
   */
  setDisclaimerEnabled: ownerProcedure
    .input(z.object({ enabled: z.boolean() }))
    .mutation(async ({ input }) => {
      await setSetting("disclaimer_enabled", input.enabled ? "1" : "0");
      return { success: true, enabled: input.enabled };
    }),
});
