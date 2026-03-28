/**
 * inviteGate router — admin CRUD for invite codes, active sessions, and attempt log.
 *
 * Public:
 *   checkCodeAccess  — heartbeat; upserts active_sessions row, checks revocation
 *
 * tokenAdminProcedure:
 *   listCodes        — all invite codes with use counts
 *   createCode       — create a new invite code
 *   toggleCode       — activate / block a code
 *   deleteCode       — delete a code
 *   listSessions     — all active_sessions rows
 *   revokeSession    — revoke a session by id
 *   restoreSession   — un-revoke a session
 *   purgeOldSessions — delete sessions older than 30 days
 *   listAttempts     — invite attempt log (rate limit log)
 *   getGateEnabled   — is the invite gate currently enabled?
 *   setGateEnabled   — toggle the invite gate on/off
 */
import { z } from "zod";
import { publicProcedure, tokenAdminProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  inviteCodes,
  activeSessions,
  inviteAttempts,
  inviteGateSettings,
} from "../../drizzle/schema";
import { eq, desc, lt, and, count } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

function maskIp(ip: string): string {
  if (ip.includes(".")) {
    const parts = ip.split(".");
    return `${parts[0]}.${parts[1]}.${parts[2]}.xxx`;
  }
  if (ip.includes(":")) {
    const parts = ip.split(":");
    return `${parts[0]}:${parts[1]}:xxxx:xxxx`;
  }
  return ip;
}

function getClientIp(req: {
  ip?: string;
  headers: Record<string, string | string[] | undefined>;
}): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    const first = Array.isArray(forwarded)
      ? forwarded[0]
      : forwarded.split(",")[0];
    return first.trim();
  }
  return req.ip ?? "unknown";
}

export const inviteGateRouter = router({
  /**
   * Heartbeat — called every 2 minutes by InviteGate.
   * Upserts an active_sessions row. Returns { ok: false } if revoked.
   */
  checkCodeAccess: publicProcedure
    .input(
      z.object({
        code: z.string().min(1).max(64),
        sessionToken: z.string().min(1).max(64),
        userAgent: z.string().max(256).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return { ok: true };

      const ip = getClientIp(ctx.req as Parameters<typeof getClientIp>[0]);
      const userAgent =
        input.userAgent ??
        (ctx.req.headers["user-agent"] as string | undefined) ??
        "";

      // Find the invite code row
      const [codeRow] = await db
        .select()
        .from(inviteCodes)
        .where(eq(inviteCodes.code, input.code.trim()))
        .limit(1);

      if (!codeRow || !codeRow.active) {
        return { ok: false, reason: "invalid_code" };
      }

      // Check for existing session
      const [existing] = await db
        .select()
        .from(activeSessions)
        .where(eq(activeSessions.sessionToken, input.sessionToken))
        .limit(1);

      if (existing) {
        if (existing.isRevoked) {
          return { ok: false, reason: "revoked" };
        }
        // Update lastSeenAt
        await db
          .update(activeSessions)
          .set({ lastSeenAt: new Date() })
          .where(eq(activeSessions.sessionToken, input.sessionToken));
        return { ok: true };
      }

      // Create new session
      await db.insert(activeSessions).values({
        sessionToken: input.sessionToken,
        codeId: codeRow.id,
        code: codeRow.code,
        ipAddress: ip,
        userAgent: userAgent.slice(0, 256),
        isRevoked: false,
      });

      return { ok: true };
    }),

  /** List all invite codes with use counts. */
  listCodes: tokenAdminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    const codes = await db
      .select()
      .from(inviteCodes)
      .orderBy(desc(inviteCodes.createdAt));
    // Attach session counts
    const withCounts = await Promise.all(
      codes.map(async c => {
        const [{ value: sessionCount }] = await db
          .select({ value: count() })
          .from(activeSessions)
          .where(
            and(
              eq(activeSessions.codeId, c.id),
              eq(activeSessions.isRevoked, false)
            )
          );
        return { ...c, sessionCount };
      })
    );
    return withCounts;
  }),

  /** Create a new invite code. */
  createCode: tokenAdminProcedure
    .input(
      z.object({
        code: z.string().min(1).max(64),
        cohortName: z.string().max(128).optional(),
        welcomeMessage: z.string().max(1024).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "DB unavailable",
        });
      await db.insert(inviteCodes).values({
        code: input.code.trim().toUpperCase(),
        cohortName: input.cohortName ?? null,
        welcomeMessage: input.welcomeMessage ?? null,
        active: true,
      });
      return { success: true };
    }),

  /** Toggle a code active/blocked. */
  toggleCode: tokenAdminProcedure
    .input(z.object({ id: z.number(), active: z.boolean() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { success: false };
      await db
        .update(inviteCodes)
        .set({ active: input.active })
        .where(eq(inviteCodes.id, input.id));
      return { success: true };
    }),

  /** Delete an invite code. */
  deleteCode: tokenAdminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { success: false };
      await db.delete(inviteCodes).where(eq(inviteCodes.id, input.id));
      return { success: true };
    }),

  /** List all active sessions. */
  listSessions: tokenAdminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    const rows = await db
      .select()
      .from(activeSessions)
      .orderBy(desc(activeSessions.lastSeenAt));
    return rows.map(r => ({ ...r, ipAddress: maskIp(r.ipAddress) }));
  }),

  /** Revoke a session. */
  revokeSession: tokenAdminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { success: false };
      await db
        .update(activeSessions)
        .set({ isRevoked: true })
        .where(eq(activeSessions.id, input.id));
      return { success: true };
    }),

  /** Restore a revoked session. */
  restoreSession: tokenAdminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { success: false };
      await db
        .update(activeSessions)
        .set({ isRevoked: false })
        .where(eq(activeSessions.id, input.id));
      return { success: true };
    }),

  /** Delete sessions older than 30 days. */
  purgeOldSessions: tokenAdminProcedure.mutation(async () => {
    const db = await getDb();
    if (!db) return { success: false, deleted: 0 };
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const result = await db
      .delete(activeSessions)
      .where(lt(activeSessions.lastSeenAt, cutoff));
    return { success: true, deleted: result[0]?.affectedRows ?? 0 };
  }),

  /** List invite attempt log. */
  listAttempts: tokenAdminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    const rows = await db
      .select()
      .from(inviteAttempts)
      .orderBy(desc(inviteAttempts.createdAt))
      .limit(200);
    return rows.map(r => ({ ...r, ipAddress: maskIp(r.ipAddress) }));
  }),

  /** Get whether the invite gate is enabled. */
  getGateEnabled: tokenAdminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { enabled: false };
    const [row] = await db
      .select()
      .from(inviteGateSettings)
      .where(eq(inviteGateSettings.id, 1))
      .limit(1);
    return { enabled: row?.enabled ?? false };
  }),

  /** Toggle the invite gate on/off globally. */
  setGateEnabled: tokenAdminProcedure
    .input(z.object({ enabled: z.boolean() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { success: false };
      await db
        .update(inviteGateSettings)
        .set({ enabled: input.enabled })
        .where(eq(inviteGateSettings.id, 1));
      return { success: true };
    }),
});
