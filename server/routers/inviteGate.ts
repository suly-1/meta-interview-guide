/**
 * Invite Gate Router
 * Manages invite codes and the site access gate.
 * - Public: verifyCode — anyone can check a code
 * - Admin: enable/disable gate, create/list/delete codes
 */
import { z } from "zod";
import { adminProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { inviteCodes, inviteGateSettings } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";

export const inviteGateRouter = router({
  /** Check if the invite gate is currently enabled */
  isEnabled: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { enabled: false };
    const [row] = await db.select().from(inviteGateSettings).limit(1);
    return { enabled: row ? row.enabled === 1 : false };
  }),

  /** Verify an invite code — returns ok:true if valid */
  verifyCode: publicProcedure
    .input(z.object({ code: z.string().min(1).max(32) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { ok: false, reason: "db_unavailable" };

      const normalised = input.code.trim().toUpperCase();
      const [row] = await db
        .select()
        .from(inviteCodes)
        .where(eq(inviteCodes.code, normalised))
        .limit(1);

      if (!row) return { ok: false, reason: "invalid" };
      if (!row.isActive) return { ok: false, reason: "inactive" };
      if (row.expiresAt && new Date(row.expiresAt) < new Date())
        return { ok: false, reason: "expired" };
      if (row.maxUses && row.maxUses > 0 && row.useCount >= row.maxUses)
        return { ok: false, reason: "exhausted" };

      // Increment use count
      await db
        .update(inviteCodes)
        .set({ useCount: row.useCount + 1 })
        .where(eq(inviteCodes.id, row.id));

      return { ok: true };
    }),

  /** Toggle the invite gate on or off */
  setEnabled: adminProcedure
    .input(z.object({ enabled: z.boolean() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { ok: false };
      const [existing] = await db.select().from(inviteGateSettings).limit(1);
      if (existing) {
        await db
          .update(inviteGateSettings)
          .set({ enabled: input.enabled ? 1 : 0 })
          .where(eq(inviteGateSettings.id, existing.id));
      } else {
        await db
          .insert(inviteGateSettings)
          .values({ enabled: input.enabled ? 1 : 0 });
      }
      return { ok: true };
    }),

  /** List all invite codes */
  listCodes: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(inviteCodes).orderBy(desc(inviteCodes.createdAt));
  }),

  /** Create a new invite code */
  createCode: adminProcedure
    .input(
      z.object({
        code: z.string().min(3).max(32).optional(),
        label: z.string().max(128).optional(),
        maxUses: z.number().int().min(0).default(0),
        expiresAt: z.string().optional(), // ISO date string or undefined
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { ok: false };

      // Auto-generate code if not provided
      const code = input.code
        ? input.code.trim().toUpperCase()
        : Math.random().toString(36).substring(2, 8).toUpperCase();

      await db.insert(inviteCodes).values({
        code,
        label: input.label ?? null,
        maxUses: input.maxUses,
        useCount: 0,
        isActive: 1,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      });

      return { ok: true, code };
    }),

  /** Deactivate (soft-delete) an invite code */
  deactivateCode: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { ok: false };
      await db
        .update(inviteCodes)
        .set({ isActive: 0 })
        .where(eq(inviteCodes.id, input.id));
      return { ok: true };
    }),

  /** Hard-delete an invite code */
  deleteCode: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { ok: false };
      await db.delete(inviteCodes).where(eq(inviteCodes.id, input.id));
      return { ok: true };
    }),
});
