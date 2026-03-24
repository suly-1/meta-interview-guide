import { z } from "zod";
import { adminProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { users, userEvents } from "../../drizzle/schema";
import { eq, asc, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { notifyOwner } from "../_core/notification";

export const adminRouter = router({
  /**
   * List all users with their ban status, role, and activity info.
   * Admin-only.
   */
  listUsers: adminProcedure.query(async () => {
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
      disclaimerAcknowledged: r.disclaimerAcknowledgedAt !== null,
    }));
  }),

  /**
   * Block a user by ID. Admin cannot block themselves.
   */
  blockUser: adminProcedure
    .input(z.object({
      userId: z.number().int().positive(),
      reason: z.string().max(500).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (input.userId === ctx.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot block yourself.",
        });
      }
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      // Prevent blocking another admin
      const [target] = await db.select({ role: users.role }).from(users).where(eq(users.id, input.userId)).limit(1);
      if (target?.role === "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Cannot block another admin.",
        });
      }

      // Fetch user info for the notification
      const [blockedUser] = await db
        .select({ name: users.name, email: users.email })
        .from(users)
        .where(eq(users.id, input.userId))
        .limit(1);

      await db.update(users).set({
        isBanned: 1,
        bannedAt: new Date(),
        bannedReason: input.reason ?? "Blocked by administrator",
      }).where(eq(users.id, input.userId));

      // Notify owner via Manus inbox
      const userName = blockedUser?.name ?? `User #${input.userId}`;
      const userEmail = blockedUser?.email ?? "unknown email";
      const reason = input.reason ?? "No reason provided";
      await notifyOwner({
        title: `🚫 User Blocked: ${userName}`,
        content: `**User access has been revoked.**\n\n**Name:** ${userName}\n**Email:** ${userEmail}\n**User ID:** ${input.userId}\n**Reason:** ${reason}\n**Blocked at:** ${new Date().toUTCString()}`,
      }).catch(() => { /* non-critical — don't fail the block if notification fails */ });

      // Write tamper-evident audit log entry
      await db.insert(userEvents).values({
        action: "block",
        actorId: ctx.user.id,
        actorName: ctx.user.name ?? "Admin",
        targetUserId: input.userId,
        targetUserName: userName,
        targetUserEmail: userEmail,
        reason: reason,
      }).catch(() => { /* non-critical */ });

      return { success: true };
    }),

  /**
   * Unblock a user by ID.
   */
  unblockUser: adminProcedure
    .input(z.object({ userId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      // Fetch user info for the audit log
      const [targetUser] = await db
        .select({ name: users.name, email: users.email })
        .from(users)
        .where(eq(users.id, input.userId))
        .limit(1);

      await db.update(users).set({
        isBanned: 0,
        bannedAt: null,
        bannedReason: null,
      }).where(eq(users.id, input.userId));

      // Write audit log entry
      await db.insert(userEvents).values({
        action: "unblock",
        actorId: ctx.user.id,
        actorName: ctx.user.name ?? "Admin",
        targetUserId: input.userId,
        targetUserName: targetUser?.name ?? `User #${input.userId}`,
        targetUserEmail: targetUser?.email ?? "unknown",
        reason: "Access restored by administrator",
      }).catch(() => { /* non-critical */ });

      return { success: true };
    }),

  /**
   * List the admin audit log (all block/unblock events), newest first.
   * Admin-only.
   */
  listAuditLog: adminProcedure.query(async () => {
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
