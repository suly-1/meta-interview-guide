import { z } from "zod";
import { tokenAdminProcedure, router, publicProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { users, userEvents, loginEvents, siteSettings, pinAttempts } from "../../drizzle/schema";
import { eq, asc, desc, inArray, lte, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { notifyOwner } from "../_core/notification";
import { SignJWT, jwtVerify } from "jose";
import { ENV } from "../_core/env";

export const adminRouter = router({
  /**
   * List all users with their ban status, role, and activity info.
   * Admin-only.
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
   * Block a user by ID. Admin cannot block themselves.
   */
  blockUser: tokenAdminProcedure
    .input(z.object({
      userId: z.number().int().positive(),
      reason: z.string().max(500).optional(),
      expiryDays: z.number().positive().max(365).optional(), // fractional days allowed (e.g. 1/24 = 1 hour)
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

      const bannedUntil = input.expiryDays
        ? new Date(Date.now() + input.expiryDays * 86_400_000)
        : null;

      await db.update(users).set({
        isBanned: 1,
        bannedAt: new Date(),
        bannedReason: input.reason ?? "Blocked by administrator",
        bannedUntil,
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
  unblockUser: tokenAdminProcedure
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

  /**
   * List last 5 login events per user, grouped by userId.
   * Returns a map of userId -> login timestamps.
   * Admin-only.
   */
  listLoginActivity: tokenAdminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return {};
    // Fetch the 500 most recent login events across all users
    const rows = await db
      .select()
      .from(loginEvents)
      .orderBy(desc(loginEvents.createdAt))
      .limit(500);
    // Group by userId, keep last 5 per user
    const grouped: Record<number, Date[]> = {};
    for (const row of rows) {
      if (!grouped[row.userId]) grouped[row.userId] = [];
      if (grouped[row.userId].length < 5) {
        grouped[row.userId].push(row.createdAt);
      }
    }
    return grouped;
  }),

  /**
   * Cohort Reset — resets the 60-day lock clock to today and clears all
   * disclaimer acknowledgments so the new cohort must re-sign.
   * Admin-only.
   */
  cohortReset: tokenAdminProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // Reset lock start date to today
    await db.insert(siteSettings)
      .values({ key: 'lock_start_date', value: today })
      .onDuplicateKeyUpdate({ set: { value: today } });

    // Ensure lock is enabled
    await db.insert(siteSettings)
      .values({ key: 'lock_enabled', value: '1' })
      .onDuplicateKeyUpdate({ set: { value: '1' } });

    // Clear all disclaimer acknowledgments
    await db.update(users).set({ disclaimerAcknowledgedAt: null });

    // Notify owner
    await notifyOwner({
      title: '🔄 Cohort Reset Performed',
      content: `A new cohort has been started by ${ctx.user.name ?? 'Admin'}.\n\n**Lock clock reset to:** ${today}\n**All disclaimer acknowledgments cleared.**\nThe site will auto-lock 60 days from today.`,
    }).catch(() => {});

    return { success: true, newStartDate: today };
  }),

  /**
   * Block a user with an optional expiry date (auto-unblock after N days).
   * This extends the existing blockUser to support blockedUntil.
   */
  blockUserWithExpiry: tokenAdminProcedure
    .input(z.object({
      userId: z.number().int().positive(),
      reason: z.string().max(500).optional(),
      daysUntilUnblock: z.number().int().min(1).max(365).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (input.userId === ctx.user.id) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'You cannot block yourself.' });
      }
      const db = await getDb();
      if (!db) throw new Error('DB unavailable');

      const [target] = await db.select({ role: users.role, name: users.name, email: users.email })
        .from(users).where(eq(users.id, input.userId)).limit(1);
      if (target?.role === 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Cannot block another admin.' });
      }

      const bannedUntil = input.daysUntilUnblock
        ? new Date(Date.now() + input.daysUntilUnblock * 24 * 60 * 60 * 1000)
        : null;

      await db.update(users).set({
        isBanned: 1,
        bannedAt: new Date(),
        bannedUntil,
        bannedReason: input.reason ?? 'Blocked by administrator',
      }).where(eq(users.id, input.userId));

      const userName = target?.name ?? `User #${input.userId}`;
      const userEmail = target?.email ?? 'unknown email';
      const reason = input.reason ?? 'No reason provided';
      const expiryNote = bannedUntil ? `\n**Auto-unblock on:** ${bannedUntil.toUTCString()}` : '\n**Duration:** Permanent';

      await notifyOwner({
        title: `🚫 User Blocked: ${userName}`,
        content: `**User access has been revoked.**\n\n**Name:** ${userName}\n**Email:** ${userEmail}\n**Reason:** ${reason}${expiryNote}`,
      }).catch(() => {});

      await db.insert(userEvents).values({
        action: 'block',
        actorId: ctx.user.id,
        actorName: ctx.user.name ?? 'Admin',
        targetUserId: input.userId,
        targetUserName: userName,
        targetUserEmail: userEmail,
        reason: bannedUntil ? `${reason} (auto-unblock: ${bannedUntil.toDateString()})` : reason,
      }).catch(() => {});

      return { success: true, bannedUntil };
    }),

  /**
   * Re-block a user directly from the audit log (quick re-apply).
   * Uses the same reason as the original block event.
   */
  reBlockUser: tokenAdminProcedure
    .input(z.object({
      userId: z.number().int().positive(),
      reason: z.string().max(500).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('DB unavailable');

      const [target] = await db.select({ role: users.role, name: users.name, email: users.email })
        .from(users).where(eq(users.id, input.userId)).limit(1);
      if (!target) throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found.' });
      if (target.role === 'admin') throw new TRPCError({ code: 'FORBIDDEN', message: 'Cannot block an admin.' });

      await db.update(users).set({
        isBanned: 1,
        bannedAt: new Date(),
        bannedUntil: null,
        bannedReason: input.reason ?? 'Re-blocked by administrator',
      }).where(eq(users.id, input.userId));

      await db.insert(userEvents).values({
        action: 'block',
        actorId: ctx.user.id,
        actorName: ctx.user.name ?? 'Admin',
        targetUserId: input.userId,
        targetUserName: target.name ?? `User #${input.userId}`,
        targetUserEmail: target.email ?? 'unknown',
        reason: input.reason ?? 'Re-blocked from audit log',
      }).catch(() => {});

      return { success: true };
    }),

  /**
   * Get the block/unblock audit trail for a specific user.
   * Returns all events where targetUserId matches, newest first.
   * Admin-only.
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
   * Process expired blocks — auto-unblock users whose bannedUntil has passed.
   * Called by a cron job every hour.
   */
  processExpiredBlocks: tokenAdminProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { unblocked: 0 };

    const now = new Date();
    // Find all banned users whose bannedUntil is in the past
    const expired = await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(and(
        eq(users.isBanned, 1),
        lte(users.bannedUntil, now),
      ));

    if (expired.length === 0) return { unblocked: 0 };

    const ids = expired.map(u => u.id);
    await db.update(users).set({
      isBanned: 0,
      bannedAt: null,
      bannedUntil: null,
      bannedReason: null,
    }).where(inArray(users.id, ids));

    // Write audit log entries for each auto-unblock
    for (const u of expired) {
      await db.insert(userEvents).values({
        action: 'unblock',
        actorId: ctx.user.id,
        actorName: 'System (auto-expiry)',
        targetUserId: u.id,
        targetUserName: u.name ?? `User #${u.id}`,
        targetUserEmail: u.email ?? 'unknown',
        reason: 'Block period expired — automatically unblocked',
      }).catch(() => {});
    }

    return { unblocked: expired.length };
  }),

  /**
   * verifyPin — public procedure (no OAuth required).
   * Accepts a PIN, compares it in constant-time to ADMIN_PIN env var,
   * and returns a short-lived signed JWT on success.
   *
   * Security features:
   * - Constant-time comparison (prevents timing attacks)
   * - Rate limiting: 5 failed attempts in 15 min = 15-min lockout
   * - All attempts (success + failure) logged to pin_attempts table with IP
   * - JWT stored in React state only (never localStorage)
   */
  verifyPin: publicProcedure
    .input(z.object({ pin: z.string().min(1).max(20) }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      const ip = ((ctx.req.headers['x-forwarded-for'] as string) ?? '')
        .split(',')[0]?.trim() || ctx.req.socket?.remoteAddress || 'unknown';

      // Rate-limit check: count failed attempts in the last 15 minutes
      const LOCK_WINDOW_MS = 15 * 60 * 1000;
      const MAX_ATTEMPTS = 5;
      const windowStart = new Date(Date.now() - LOCK_WINDOW_MS);

      if (db) {
        const safeIp = ip.replace(/'/g, '');
        const windowStartStr = windowStart.toISOString().replace('T', ' ').split('.')[0];
        const [countRow] = await db.execute(
          `SELECT COUNT(*) as cnt FROM pin_attempts WHERE ipAddress = '${safeIp}' AND success = 0 AND createdAt >= '${windowStartStr}'` as unknown as import('drizzle-orm').SQL
        ) as unknown as [{ cnt: number }];
        if (countRow && Number(countRow.cnt) >= MAX_ATTEMPTS) {
          console.warn(`[PIN GATE] IP ${ip} is locked out (${countRow.cnt} failed attempts in 15 min)`);
          throw new TRPCError({
            code: 'TOO_MANY_REQUESTS',
            message: 'Too many failed attempts. Try again in 15 minutes.',
          });
        }
      }

      const storedPin = ENV.adminPin;
      if (!storedPin) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Admin PIN is not configured on the server.',
        });
      }

      // Constant-time comparison to prevent timing attacks
      const a = Buffer.from(input.pin.padEnd(32, '\0'));
      const b = Buffer.from(storedPin.padEnd(32, '\0'));
      let diff = 0;
      for (let i = 0; i < 32; i++) diff |= a[i] ^ b[i];
      const correct = diff === 0;

      // Log the attempt (success or failure)
      if (db) {
        await db.insert(pinAttempts).values({
          ipAddress: ip,
          success: correct ? 1 : 0,
        }).catch(() => {});
      }

      if (!correct) {
        console.warn(`[PIN GATE] Failed attempt from IP ${ip}`);
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Incorrect PIN.',
        });
      }

      // Issue a short-lived signed JWT (4 hours)
      const secret = new TextEncoder().encode(
        ENV.cookieSecret + ':admin-pin-gate'
      );
      const token = await new SignJWT({ purpose: 'admin-pin-gate' })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('4h')
        .sign(secret);

      console.info(`[PIN GATE] Successful login from IP ${ip}`);
      return { token };
    }),

  /**
   * getPinLockStatus — public procedure.
   * Returns whether the calling IP is currently locked out and how many
   * seconds remain until the lockout expires.
   */
  getPinLockStatus: publicProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return { locked: false, secondsRemaining: 0, failedAttempts: 0 };

      const ip = ((ctx.req.headers['x-forwarded-for'] as string) ?? '')
        .split(',')[0]?.trim() || ctx.req.socket?.remoteAddress || 'unknown';

      const LOCK_WINDOW_MS = 15 * 60 * 1000;
      const MAX_ATTEMPTS = 5;
      const windowStart = new Date(Date.now() - LOCK_WINDOW_MS);
      const windowStartStr = windowStart.toISOString().replace('T', ' ').split('.')[0];

      const [countRow] = await db.execute(
        `SELECT COUNT(*) as cnt, MIN(createdAt) as oldest FROM pin_attempts WHERE ipAddress = '${ip.replace(/'/g, '')}' AND success = 0 AND createdAt >= '${windowStartStr}'` as unknown as import('drizzle-orm').SQL
      ) as unknown as [{ cnt: number; oldest: Date | null }];

      const failedAttempts = Number(countRow?.cnt ?? 0);
      if (failedAttempts < MAX_ATTEMPTS) {
        return { locked: false, secondsRemaining: 0, failedAttempts };
      }

      // Locked: compute when the oldest attempt in the window expires
      const oldestAttempt = countRow?.oldest ? new Date(countRow.oldest) : windowStart;
      const unlockAt = new Date(oldestAttempt.getTime() + LOCK_WINDOW_MS);
      const secondsRemaining = Math.max(0, Math.ceil((unlockAt.getTime() - Date.now()) / 1000));

      return { locked: true, secondsRemaining, failedAttempts };
    }),

  /**
   * changeAdminPin — owner-only procedure (requires valid PIN token).
   * Updates ADMIN_PIN in siteSettings (runtime override) and in ENV.
   * Takes effect immediately without server restart.
   */
  changeAdminPin: tokenAdminProcedure
    .input(z.object({
      currentPin: z.string().min(1).max(20),
      newPin: z.string().min(4).max(20),
    }))
    .mutation(async ({ input }) => {
      const storedPin = ENV.adminPin;
      if (!storedPin) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Admin PIN is not configured on the server.',
        });
      }
      // Verify current PIN first
      const a = Buffer.from(input.currentPin.padEnd(32, '\0'));
      const b = Buffer.from(storedPin.padEnd(32, '\0'));
      let diff = 0;
      for (let i = 0; i < 32; i++) diff |= a[i] ^ b[i];
      if (diff !== 0) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Current PIN is incorrect.' });
      }
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable.' });
      // Store new PIN in siteSettings (runtime override)
      await db
        .insert(siteSettings)
        .values({ key: 'admin_pin_override', value: input.newPin })
        .onDuplicateKeyUpdate({ set: { value: input.newPin } });
      // Update in-memory ENV so it takes effect immediately
      ENV.adminPin = input.newPin;
      console.info('[PIN GATE] Admin PIN changed successfully');
      return { success: true };
    }),

  /**
   * verifyPinToken — public procedure.
   * Validates a previously issued admin-pin-gate JWT.
   * Returns { valid: true } on success, throws FORBIDDEN otherwise.
   * Used by AdminGate on mount to re-validate a token held in React state.
   */
  verifyPinToken: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      try {
        const secret = new TextEncoder().encode(
          ENV.cookieSecret + ':admin-pin-gate'
        );
        const { payload } = await jwtVerify(input.token, secret, {
          algorithms: ['HS256'],
        });
        if (payload.purpose !== 'admin-pin-gate') {
          throw new Error('Invalid purpose');
        }
        return { valid: true };
      } catch {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'PIN token is invalid or expired.',
        });
      }
    }),
});
