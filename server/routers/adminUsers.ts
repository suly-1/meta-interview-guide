/**
 * adminUsers router
 *
 * Provides admin-only user management procedures:
 *   - listUsers: list all users with ban status and activity info
 *   - getUserStats: aggregate stats (total, weeklyActive, blocked)
 *   - getUserLoginHistory: login events for a specific user
 *   - blockUser: block a user with optional expiry
 *   - unblockUser: unblock a user
 *   - reBlockUser: re-apply a block from the audit log
 *   - exportAuditLogCsv: export audit log as CSV string
 *   - listEvents: list all audit log events
 *   - checkInactiveUsers: find users inactive for 30+ days
 */
import { z } from "zod";
import { tokenAdminProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { users, userEvents, loginEvents } from "../../drizzle/schema";
import { eq, desc, and, lte, gte, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { notifyOwner } from "../_core/notification";

// ── Helpers ──────────────────────────────────────────────────────────────────

async function writeAuditLog(
  db: Awaited<ReturnType<typeof getDb>>,
  entry: {
    actorId: number;
    actorName: string | null;
    targetId: number;
    targetName: string | null;
    eventType: "block" | "unblock" | "role_change";
    metadata?: Record<string, unknown>;
  }
) {
  if (!db) return;
  await db
    .insert(userEvents)
    .values({
      action: entry.eventType,
      actorId: entry.actorId,
      actorName: entry.actorName ?? "Admin",
      targetUserId: entry.targetId,
      targetUserName: entry.targetName ?? `User #${entry.targetId}`,
      reason: (entry.metadata?.reason as string) ?? null,
    })
    .catch(() => {});
}

// ── Router ───────────────────────────────────────────────────────────────────

export const adminUsersRouter = router({
  /**
   * List all users with their ban status, role, and activity info.
   */
  listUsers: tokenAdminProcedure.query(async () => {
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
        isBanned: users.isBanned,
        bannedAt: users.bannedAt,
        bannedReason: users.bannedReason,
        bannedUntil: users.bannedUntil,
        disclaimerAcknowledgedAt: users.disclaimerAcknowledgedAt,
      })
      .from(users)
      .orderBy(desc(users.lastSignedIn));
    return rows.map(r => ({
      id: r.id,
      name: r.name ?? "—",
      email: r.email ?? "—",
      role: r.role,
      createdAt: r.createdAt,
      lastSignedIn: r.lastSignedIn,
      isBanned: r.isBanned === 1,
      bannedAt: r.bannedAt ?? null,
      bannedReason: r.bannedReason ?? null,
      bannedUntil: r.bannedUntil ?? null,
      disclaimerAcknowledged: r.disclaimerAcknowledgedAt !== null,
    }));
  }),

  /**
   * Aggregate user stats: total, weeklyActive, blocked.
   */
  getUserStats: tokenAdminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { total: 0, weeklyActive: 0, blocked: 0 };

    const allUsers = await db
      .select({
        id: users.id,
        isBanned: users.isBanned,
        lastSignedIn: users.lastSignedIn,
      })
      .from(users);

    const weekAgo = new Date(Date.now() - 7 * 86_400_000);
    return {
      total: allUsers.length,
      weeklyActive: allUsers.filter(u => u.lastSignedIn && new Date(u.lastSignedIn) >= weekAgo).length,
      blocked: allUsers.filter(u => u.isBanned === 1).length,
    };
  }),

  /**
   * Login history for a specific user (last 30 events).
   */
  getUserLoginHistory: tokenAdminProcedure
    .input(z.object({ userId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const rows = await db
        .select({ createdAt: loginEvents.createdAt, ipAddress: loginEvents.ipAddress })
        .from(loginEvents)
        .where(eq(loginEvents.userId, input.userId))
        .orderBy(desc(loginEvents.createdAt))
        .limit(30);
      return rows;
    }),

  /**
   * Block a user with an optional expiry (auto-unblock after N days).
   * Admin cannot block themselves or another admin.
   */
  blockUser: tokenAdminProcedure
    .input(
      z.object({
        userId: z.number().int().positive(),
        reason: z.string().max(500).optional(),
        expiryDays: z.number().positive().max(365).optional(), // fractional days allowed (e.g. 1/24 = 1 hour)
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [target] = await db
        .select({ id: users.id, name: users.name, email: users.email, role: users.role, openId: users.openId })
        .from(users)
        .where(eq(users.id, input.userId))
        .limit(1);

      if (!target) throw new TRPCError({ code: "NOT_FOUND" });
      if (target.openId === ctx.user!.openId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You cannot block yourself" });
      }
      if (target.role === "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Cannot block another admin" });
      }

      const bannedUntil = input.expiryDays
        ? new Date(Date.now() + input.expiryDays * 86_400_000)
        : null;

      await db
        .update(users)
        .set({
          isBanned: 1,
          bannedAt: new Date(),
          bannedReason: input.reason ?? "Blocked by administrator",
          bannedUntil,
        })
        .where(eq(users.id, input.userId));

      await writeAuditLog(db, {
        actorId: ctx.user!.id,
        actorName: ctx.user!.name,
        targetId: target.id,
        targetName: target.name,
        eventType: "block",
        metadata: {
          reason: input.reason,
          blockedUntil: bannedUntil?.toISOString(),
        },
      });

      await notifyOwner({
        title: `User blocked: ${target.name ?? target.id}`,
        content: `By: ${ctx.user!.name}\nReason: ${input.reason ?? "(none)"}`,
      }).catch(() => {});

      return { success: true };
    }),

  /**
   * Unblock a user.
   */
  unblockUser: tokenAdminProcedure
    .input(z.object({ userId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [target] = await db
        .select({ id: users.id, name: users.name })
        .from(users)
        .where(eq(users.id, input.userId))
        .limit(1);

      if (!target) throw new TRPCError({ code: "NOT_FOUND" });

      await db
        .update(users)
        .set({ isBanned: 0, bannedAt: null, bannedReason: null, bannedUntil: null })
        .where(eq(users.id, input.userId));

      await writeAuditLog(db, {
        actorId: ctx.user!.id,
        actorName: ctx.user!.name,
        targetId: target.id,
        targetName: target.name,
        eventType: "unblock",
      });

      return { success: true };
    }),

  /**
   * Re-block a user (quick re-apply from audit log).
   */
  reBlockUser: tokenAdminProcedure
    .input(
      z.object({
        userId: z.number().int().positive(),
        reason: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [target] = await db
        .select({ id: users.id, name: users.name, role: users.role })
        .from(users)
        .where(eq(users.id, input.userId))
        .limit(1);

      if (!target) throw new TRPCError({ code: "NOT_FOUND" });
      if (target.role === "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Cannot block an admin" });
      }

      await db
        .update(users)
        .set({
          isBanned: 1,
          bannedAt: new Date(),
          bannedReason: input.reason ?? "Re-blocked by administrator",
          bannedUntil: null,
        })
        .where(eq(users.id, input.userId));

      await writeAuditLog(db, {
        actorId: ctx.user!.id,
        actorName: ctx.user!.name,
        targetId: target.id,
        targetName: target.name,
        eventType: "block",
        metadata: { reason: input.reason ?? "Re-blocked from audit log" },
      });

      return { success: true };
    }),

  /**
   * Export the full audit log as a CSV string.
   */
  exportAuditLogCsv: tokenAdminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { csv: "" };

    const rows = await db
      .select()
      .from(userEvents)
      .orderBy(desc(userEvents.createdAt))
      .limit(1000);

    const header = "id,action,actorId,actorName,targetUserId,targetUserName,reason,createdAt";
    const lines = rows.map(r =>
      [
        r.id,
        r.action,
        r.actorId,
        `"${(r.actorName ?? "").replace(/"/g, '""')}"`,
        r.targetUserId,
        `"${(r.targetUserName ?? "").replace(/"/g, '""')}"`,
        `"${(r.reason ?? "").replace(/"/g, '""')}"`,
        r.createdAt.toISOString(),
      ].join(",")
    );

    return { csv: [header, ...lines].join("\n") };
  }),

  /**
   * List all audit log events (most recent first, max 200).
   */
  listEvents: tokenAdminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    const rows = await db
      .select()
      .from(userEvents)
      .orderBy(desc(userEvents.createdAt))
      .limit(200);
    return rows;
  }),

  /**
   * Find users who have not signed in for 30+ days and notify the owner.
   */
  checkInactiveUsers: tokenAdminProcedure.mutation(async () => {
    const db = await getDb();
    if (!db) return { notified: false, count: 0 };

    const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000);
    const inactive = await db
      .select({ id: users.id, name: users.name, email: users.email, lastSignedIn: users.lastSignedIn })
      .from(users)
      .where(and(eq(users.isBanned, 0), lte(users.lastSignedIn, thirtyDaysAgo)));

    if (inactive.length === 0) return { notified: false, count: 0 };

    const list = inactive
      .slice(0, 20)
      .map(u => `- ${u.name ?? "Unknown"} (${u.email ?? "no email"}) — last seen ${u.lastSignedIn?.toDateString() ?? "never"}`)
      .join("\n");

    await notifyOwner({
      title: `⚠️ ${inactive.length} Inactive Users (30+ days)`,
      content: `The following users have not signed in for 30+ days:\n\n${list}${inactive.length > 20 ? `\n\n...and ${inactive.length - 20} more.` : ""}`,
    }).catch(() => {});

    return { notified: true, count: inactive.length };
  }),
  /**
   * Get block/unblock history for a specific user.
   */
  getUserBlockHistory: tokenAdminProcedure
    .input(z.object({ userId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const rows = await db
        .select()
        .from(userEvents)
        .where(eq(userEvents.targetUserId, input.userId))
        .orderBy(desc(userEvents.createdAt))
        .limit(50);
      return rows;
    }),
  /**
   * List all audit log events (last 200).
   */
  listAuditLog: tokenAdminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    const rows = await db
      .select()
      .from(userEvents)
      .orderBy(desc(userEvents.createdAt))
      .limit(200);
    return rows;
  }),
});
