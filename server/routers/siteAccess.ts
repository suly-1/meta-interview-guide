/**
 * siteAccess router — manages the hybrid access gate.
 *
 * checkAccess    (public)         → { locked, reason, message, daysRemaining }
 * getSettings    (ownerProcedure) → full site_settings row
 * updateSettings (ownerProcedure) → update lock config
 */
import { z } from "zod";
import { publicProcedure, ownerProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { siteSettings } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

/** Fetch or auto-create the singleton settings row (id=1). */
async function getOrCreateSettings() {
  const db = await getDb();
  if (!db) return null;

  const rows = await db
    .select()
    .from(siteSettings)
    .where(eq(siteSettings.id, 1))
    .limit(1);
  if (rows.length > 0) return rows[0];

  // First-time bootstrap — insert default row
  await db
    .insert(siteSettings)
    .values({ id: 1, lockDays: 60, manualLockEnabled: 0 });
  const fresh = await db
    .select()
    .from(siteSettings)
    .where(eq(siteSettings.id, 1))
    .limit(1);
  return fresh[0] ?? null;
}

type LockState =
  | {
      locked: true;
      reason: "manual" | "expired";
      message: string;
      daysRemaining: null;
    }
  | {
      locked: false;
      reason: "active" | "no_expiry";
      message: null;
      daysRemaining: number | null;
    };

/** Determine whether the site is currently locked and why. */
function computeLockState(
  settings: NonNullable<Awaited<ReturnType<typeof getOrCreateSettings>>>
): LockState {
  // Manual lock takes priority
  if (settings.manualLockEnabled === 1) {
    return {
      locked: true,
      reason: "manual",
      message:
        settings.lockMessage ||
        "This guide is currently closed. Please check back later.",
      daysRemaining: null,
    };
  }

  // Auto-lock after N days
  if (settings.lockStartDate) {
    const start = new Date(settings.lockStartDate);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );
    const lockDays = settings.lockDays ?? 60;

    if (diffDays >= lockDays) {
      return {
        locked: true,
        reason: "expired",
        message:
          settings.lockMessage ||
          `This guide's ${lockDays}-day access window has ended. A new cohort may open soon.`,
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

  return {
    locked: false,
    reason: "no_expiry",
    message: null,
    daysRemaining: null,
  };
}

export const siteAccessRouter = router({
  /**
   * Public — called by the AccessGate component on every page load.
   * Returns { locked, reason, message, daysRemaining }.
   * The owner is NEVER locked out — the frontend checks auth.isOwner separately.
   */
  checkAccess: publicProcedure.query(async () => {
    const settings = await getOrCreateSettings();
    if (!settings) {
      // DB unavailable — fail open (don't lock users out if DB is down)
      return {
        locked: false,
        reason: "no_expiry" as const,
        message: null,
        daysRemaining: null,
      };
    }
    return computeLockState(settings);
  }),

  /** Owner-only — returns the full settings row for the admin panel. */
  getSettings: ownerProcedure.query(async () => {
    return getOrCreateSettings();
  }),

  /** Owner-only — update any combination of lock settings. */
  updateSettings: ownerProcedure
    .input(
      z.object({
        lockStartDate: z.string().max(16).nullable().optional(),
        lockDays: z.number().int().min(1).max(3650).optional(),
        manualLockEnabled: z.boolean().optional(),
        lockMessage: z.string().max(500).nullable().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const patch: Record<string, unknown> = {};
      if (input.lockStartDate !== undefined)
        patch.lockStartDate = input.lockStartDate;
      if (input.lockDays !== undefined) patch.lockDays = input.lockDays;
      if (input.manualLockEnabled !== undefined)
        patch.manualLockEnabled = input.manualLockEnabled ? 1 : 0;
      if (input.lockMessage !== undefined)
        patch.lockMessage = input.lockMessage;

      await db.update(siteSettings).set(patch).where(eq(siteSettings.id, 1));
      return { success: true };
    }),
});
