/**
 * adminPin router — standalone PIN verification for the admin panel.
 *
 * verifyPin        (public) → verifies PIN, returns signed JWT
 * checkLockout     (public) → returns current lockout status for caller IP
 * verifyPinToken   (public) → validates a previously issued JWT
 * getPinAttemptChart (tokenAdminProcedure) → 7-day bar chart of failed attempts
 */
import { z } from "zod";
import { publicProcedure, tokenAdminProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { pinAttempts } from "../../drizzle/schema";
import { and, gte, count, eq, desc } from "drizzle-orm";
import { ENV } from "../_core/env";
import { TRPCError } from "@trpc/server";
import { SignJWT, jwtVerify } from "jose";

const PIN_MAX_ATTEMPTS = 5;
const PIN_LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

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

export const adminPinRouter = router({
  /**
   * Verify the admin PIN. Returns a signed JWT on success.
   * Enforces IP-based lockout after PIN_MAX_ATTEMPTS failures.
   */
  verifyPin: publicProcedure
    .input(z.object({ pin: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      if (!ENV.adminPin) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Admin PIN not configured",
        });
      }
      const db = await getDb();
      const ip = getClientIp(ctx.req as Parameters<typeof getClientIp>[0]);
      const lockoutWindowStart = new Date(Date.now() - PIN_LOCKOUT_MS);

      if (db) {
        const [{ value: recentFailures }] = await db
          .select({ value: count() })
          .from(pinAttempts)
          .where(
            and(
              eq(pinAttempts.ip, ip),
              gte(pinAttempts.attemptedAt, lockoutWindowStart),
              eq(pinAttempts.succeeded, 0)
            )
          );
        if (recentFailures >= PIN_MAX_ATTEMPTS) {
          const lockoutUntil = new Date(
            lockoutWindowStart.getTime() + PIN_LOCKOUT_MS
          );
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: JSON.stringify({
              locked: true,
              lockoutUntil: lockoutUntil.toISOString(),
            }),
          });
        }
      }

      const isCorrect =
        input.pin.length === ENV.adminPin.length && input.pin === ENV.adminPin;

      if (!isCorrect) {
        if (db) {
          await db.insert(pinAttempts).values({ ip, succeeded: 0 });
        }
        let lockoutUntil: string | undefined;
        if (db) {
          const [{ value: totalFailures }] = await db
            .select({ value: count() })
            .from(pinAttempts)
            .where(
              and(
                eq(pinAttempts.ip, ip),
                gte(pinAttempts.attemptedAt, lockoutWindowStart),
                eq(pinAttempts.succeeded, 0)
              )
            );
          if (totalFailures >= PIN_MAX_ATTEMPTS) {
            lockoutUntil = new Date(Date.now() + PIN_LOCKOUT_MS).toISOString();
          }
        }
        await new Promise(r => setTimeout(r, 500));
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: JSON.stringify({
            locked: !!lockoutUntil,
            lockoutUntil,
            message: "Incorrect PIN",
          }),
        });
      }

      // Log success
      if (db) {
        await db.insert(pinAttempts).values({ ip, succeeded: 1 });
      }

      const secret = new TextEncoder().encode(
        ENV.cookieSecret || "admin-pin-fallback"
      );
      const token = await new SignJWT({ adminUnlocked: true })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("1h")
        .sign(secret);
      return { token };
    }),

  /** Returns current lockout status for the caller's IP. */
  checkLockout: publicProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { locked: false, lockoutUntil: null };
    const ip = getClientIp(ctx.req as Parameters<typeof getClientIp>[0]);
    const lockoutWindowStart = new Date(Date.now() - PIN_LOCKOUT_MS);
    const [{ value: recentFailures }] = await db
      .select({ value: count() })
      .from(pinAttempts)
      .where(
        and(
          eq(pinAttempts.ip, ip),
          gte(pinAttempts.attemptedAt, lockoutWindowStart),
          eq(pinAttempts.succeeded, 0)
        )
      );
    if (recentFailures >= PIN_MAX_ATTEMPTS) {
      const lockoutUntil = new Date(
        lockoutWindowStart.getTime() + PIN_LOCKOUT_MS
      ).toISOString();
      return { locked: true, lockoutUntil };
    }
    return { locked: false, lockoutUntil: null };
  }),

  /** Validates a previously issued admin PIN JWT. */
  verifyPinToken: publicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const secret = new TextEncoder().encode(
          ENV.cookieSecret || "admin-pin-fallback"
        );
        await jwtVerify(input.token, secret);
        return { valid: true };
      } catch {
        return { valid: false };
      }
    }),

  /** Returns a 7-day bar chart of failed PIN attempts (admin only). */
  getPinAttemptChart: tokenAdminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { days: [] };
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const rows = await db
      .select({
        attemptedAt: pinAttempts.attemptedAt,
        succeeded: pinAttempts.succeeded,
      })
      .from(pinAttempts)
      .where(gte(pinAttempts.attemptedAt, sevenDaysAgo))
      .orderBy(desc(pinAttempts.attemptedAt));

    // Group by day
    const dayMap: Record<string, { failed: number; succeeded: number }> = {};
    for (const row of rows) {
      const day = new Date(row.attemptedAt).toISOString().slice(0, 10);
      if (!dayMap[day]) dayMap[day] = { failed: 0, succeeded: 0 };
      if (row.succeeded === 1) dayMap[day].succeeded++;
      else dayMap[day].failed++;
    }
    const days = Object.entries(dayMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, counts]) => ({ date, ...counts }));
    return { days };
  }),
});
