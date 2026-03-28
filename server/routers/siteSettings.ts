/**
 * siteSettings router — cohort window, disclaimer toggle, and cohort reset.
 *
 * getStatus            (public)              → lock state + days remaining
 * getSettings          (tokenAdminProcedure) → full site_settings row
 * updateSettings       (tokenAdminProcedure) → update cohort window config
 * setDisclaimerEnabled (tokenAdminProcedure) → toggle disclaimer gate
 * cohortReset          (tokenAdminProcedure) → reset clock + clear all disclaimers
 */
import { z } from "zod";
import { publicProcedure, tokenAdminProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { siteSettings, users } from "../../drizzle/schema";
import { eq, isNull, isNotNull } from "drizzle-orm";

async function getOrCreateSettings() {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select()
    .from(siteSettings)
    .where(eq(siteSettings.id, 1))
    .limit(1);
  if (rows.length > 0) return rows[0];
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

export const siteSettingsRouter = router({
  /** Public lock-state check (used by SiteLockGate). */
  getStatus: publicProcedure.query(async () => {
    const settings = await getOrCreateSettings();
    if (!settings)
      return { locked: false, reason: "no_settings", daysRemaining: null };

    if (settings.manualLockEnabled === 1) {
      return {
        locked: true,
        reason: "manual",
        message: settings.lockMessage ?? "Site is temporarily locked.",
        daysRemaining: null,
      };
    }

    if (settings.lockStartDate && settings.lockDays) {
      const start = new Date(settings.lockStartDate);
      const end = new Date(start.getTime() + settings.lockDays * 86400_000);
      const now = new Date();
      if (now > end) {
        return {
          locked: true,
          reason: "expired",
          message: "The cohort window has closed.",
          daysRemaining: null,
        };
      }
      const daysRemaining = Math.ceil(
        (end.getTime() - now.getTime()) / 86400_000
      );
      return { locked: false, reason: "active", daysRemaining };
    }

    return { locked: false, reason: "no_expiry", daysRemaining: null };
  }),

  /** Full settings row for admin panel. */
  getSettings: tokenAdminProcedure.query(async () => {
    return await getOrCreateSettings();
  }),

  /** Update cohort window config. */
  updateSettings: tokenAdminProcedure
    .input(
      z.object({
        lockStartDate: z.string().optional(),
        lockDays: z.number().int().min(1).max(365).optional(),
        lockEnabled: z.boolean().optional(),
        lockMessage: z.string().max(512).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { success: false };
      const patch: Record<string, unknown> = {};
      if (input.lockStartDate !== undefined)
        patch.lockStartDate = input.lockStartDate;
      if (input.lockDays !== undefined) patch.lockDays = input.lockDays;
      if (input.lockEnabled !== undefined)
        patch.lockEnabled = input.lockEnabled ? 1 : 0;
      if (input.lockMessage !== undefined)
        patch.lockMessage = input.lockMessage;
      await db.update(siteSettings).set(patch).where(eq(siteSettings.id, 1));
      return { success: true };
    }),

  /** Toggle the disclaimer gate on/off. */
  setDisclaimerEnabled: tokenAdminProcedure
    .input(z.object({ enabled: z.boolean() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { success: false };
      await db
        .update(siteSettings)
        .set({ disclaimerEnabled: input.enabled ? 1 : 0 })
        .where(eq(siteSettings.id, 1));
      return { success: true };
    }),

  /** Cohort reset — resets lockStartDate to now and clears all disclaimer acknowledgments. */
  cohortReset: tokenAdminProcedure.mutation(async () => {
    const db = await getDb();
    if (!db) return { success: false, usersReset: 0 };
    // Reset the cohort start date
    await db
      .update(siteSettings)
      .set({ lockStartDate: new Date().toISOString().slice(0, 10) })
      .where(eq(siteSettings.id, 1));
    // Clear all disclaimer acknowledgments
    const result = await db
      .update(users)
      .set({ disclaimerAcknowledgedAt: null })
      .where(isNotNull(users.disclaimerAcknowledgedAt));
    return { success: true, usersReset: result[0]?.affectedRows ?? 0 };
  }),
});
