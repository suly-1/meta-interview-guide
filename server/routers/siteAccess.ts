/**
 * siteAccess router
 *
 * Provides site-wide access control procedures:
 *   - checkAccess (public): returns lock state for every page load
 *   - getDisclaimerEnabled (public): returns disclaimer gate toggle
 *   - getSettings (ownerProcedure): full settings row
 *   - updateSettings (ownerProcedure): update lock date, lock days, manual lock, message
 *   - setDisclaimerEnabled (ownerProcedure): toggle disclaimer gate globally
 *   - cohortReset (ownerProcedure): reset 60-day clock, clear all disclaimer acknowledgments
 */
import { z } from "zod";
import { ownerProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { siteSettings, users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { notifyOwner } from "../_core/notification";

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

type LockState = {
  locked: boolean;
  reason: "manual" | "expired" | "active" | "no_expiry";
  message: string | null;
  daysRemaining: number | null;
};

function computeLockState(opts: {
  lockEnabled: boolean;
  manualLock: boolean;
  lockStartDate: string | null;
  lockDays: number;
  lockMessage: string | null;
}): LockState {
  if (opts.manualLock) {
    return {
      locked: true,
      reason: "manual",
      message: opts.lockMessage ?? "The site is currently locked by the administrator.",
      daysRemaining: null,
    };
  }
  if (opts.lockEnabled && opts.lockStartDate) {
    const diffDays = Math.floor(
      (Date.now() - new Date(opts.lockStartDate).getTime()) / 86_400_000
    );
    const lockDays = opts.lockDays ?? 60;
    if (diffDays >= lockDays) {
      return {
        locked: true,
        reason: "expired",
        message:
          opts.lockMessage ??
          "The 60-day study window has ended. Thank you for using this guide.",
        daysRemaining: null,
      };
    }
    return {
      locked: false,
      reason: "active",
      message: null,
      daysRemaining: lockDays - diffDays,
    };
  }
  return { locked: false, reason: "no_expiry", message: null, daysRemaining: null };
}

// ── Router ───────────────────────────────────────────────────────────────────

export const siteAccessRouter = router({
  /**
   * Public: Returns the current lock state.
   * Called on every page load by the SiteLockGate component.
   * Admins are never locked out.
   */
  checkAccess: publicProcedure.query(async ({ ctx }) => {
    const [lockEnabled, manualLock, lockStartDate, lockDays, lockMessage] = await Promise.all([
      getSetting("lock_enabled"),
      getSetting("manual_lock_enabled"),
      getSetting("lock_start_date"),
      getSetting("lock_duration_days"),
      getSetting("lock_message"),
    ]);

    const isAdmin = ctx.user?.role === "admin";
    if (isAdmin) {
      return {
        locked: false,
        reason: "no_expiry" as const,
        message: null,
        daysRemaining: null,
        isAdmin: true,
      };
    }

    const state = computeLockState({
      lockEnabled: lockEnabled === "1",
      manualLock: manualLock === "1",
      lockStartDate: lockStartDate ?? null,
      lockDays: parseInt(lockDays ?? "60", 10),
      lockMessage: lockMessage ?? null,
    });

    return { ...state, isAdmin: false };
  }),

  /**
   * Public: Returns whether the disclaimer gate is enabled.
   */
  getDisclaimerEnabled: publicProcedure.query(async () => {
    const val = await getSetting("disclaimer_enabled");
    // Default to enabled ("1") if not set
    return { enabled: val !== "0" };
  }),

  /**
   * Owner: Returns all current site settings.
   */
  getSettings: ownerProcedure.query(async () => {
    const [lockEnabled, manualLock, lockStartDate, lockDays, lockMessage, disclaimerEnabled] =
      await Promise.all([
        getSetting("lock_enabled"),
        getSetting("manual_lock_enabled"),
        getSetting("lock_start_date"),
        getSetting("lock_duration_days"),
        getSetting("lock_message"),
        getSetting("disclaimer_enabled"),
      ]);
    return {
      lockEnabled: lockEnabled === "1",
      manualLockEnabled: manualLock === "1",
      lockStartDate: lockStartDate ?? null,
      lockDays: parseInt(lockDays ?? "60", 10),
      lockMessage: lockMessage ?? null,
      disclaimerEnabled: disclaimerEnabled !== "0",
    };
  }),

  /**
   * Owner: Update lock settings.
   */
  updateSettings: ownerProcedure
    .input(
      z.object({
        lockEnabled: z.boolean().optional(),
        manualLockEnabled: z.boolean().optional(),
        lockStartDate: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD")
          .optional()
          .nullable(),
        lockDays: z.number().int().min(1).max(730).optional(),
        lockMessage: z.string().max(500).optional().nullable(),
      })
    )
    .mutation(async ({ input }) => {
      if (input.lockEnabled !== undefined) {
        await setSetting("lock_enabled", input.lockEnabled ? "1" : "0");
      }
      if (input.manualLockEnabled !== undefined) {
        await setSetting("manual_lock_enabled", input.manualLockEnabled ? "1" : "0");
      }
      if (input.lockStartDate !== undefined) {
        await setSetting("lock_start_date", input.lockStartDate ?? "");
      }
      if (input.lockDays !== undefined) {
        await setSetting("lock_duration_days", String(input.lockDays));
      }
      if (input.lockMessage !== undefined) {
        await setSetting("lock_message", input.lockMessage ?? "");
      }
      return { success: true };
    }),

  /**
   * Owner: Enable or disable the disclaimer gate globally.
   */
  setDisclaimerEnabled: ownerProcedure
    .input(z.object({ enabled: z.boolean() }))
    .mutation(async ({ input }) => {
      await setSetting("disclaimer_enabled", input.enabled ? "1" : "0");
      return { success: true, enabled: input.enabled };
    }),

  /**
   * Owner: Reset the cohort clock to today and clear all disclaimer acknowledgments.
   * This starts a fresh 60-day window for all users.
   */
  cohortReset: ownerProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");

    const today = new Date().toISOString().slice(0, 10);
    await setSetting("lock_start_date", today);
    await setSetting("lock_enabled", "1");
    await setSetting("manual_lock_enabled", "0");

    // Clear all disclaimer acknowledgments so users must re-accept
    await db.update(users).set({ disclaimerAcknowledgedAt: null });

    await notifyOwner({
      title: "🔄 Cohort Reset Performed",
      content: `A new cohort has been started by ${ctx.user?.name ?? "Admin"}.\n\n**Lock clock reset to:** ${today}\n**All disclaimer acknowledgments cleared.**\nThe site will auto-lock 60 days from today.`,
    }).catch(() => {});

    return { success: true, newStartDate: today };
  }),
});
