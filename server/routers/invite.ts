/**
 * Invite Gate Router
 *
 * Provides server-side enforcement for the invite code gate:
 *  - verifyCode: validates the submitted code against VITE_INVITE_CODE (env)
 *    AND the invite_codes table (per-code custom messages).
 *    Enforces a 3-attempt IP-based lockout (5-minute cooldown) and logs
 *    every attempt (success + failure) to invite_attempt_log.
 *  - getWelcomeMessage: returns the cohort name + welcome message for a
 *    given code so the frontend can show a personalised greeting.
 */
import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { inviteAttemptLog, inviteCodes } from "../../drizzle/schema";
import { and, gte, count, eq, desc } from "drizzle-orm";
import { ENV } from "../_core/env";

const MAX_ATTEMPTS = 3;
const LOCKOUT_MS = 5 * 60 * 1000; // 5 minutes

/** Extract the real client IP, respecting common proxy headers. */
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

export const inviteRouter = router({
  /**
   * Verify an invite code.
   *
   * Returns:
   *  - { valid: true, cohortName, welcomeMessage } on success
   *  - Throws FORBIDDEN if the code is wrong
   *  - Throws TOO_MANY_REQUESTS if the IP is locked out
   */
  verifyCode: publicProcedure
    .input(
      z.object({
        code: z.string().min(1).max(64),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable.",
        });
      const ip = getClientIp(ctx.req as Parameters<typeof getClientIp>[0]);
      const userAgent =
        (ctx.req.headers["user-agent"] as string | undefined) ?? "";
      const windowStart = new Date(Date.now() - LOCKOUT_MS);

      // ── Check IP lockout ─────────────────────────────────────────────────
      const [{ failCount }] = await db
        .select({ failCount: count() })
        .from(inviteAttemptLog)
        .where(
          and(
            eq(inviteAttemptLog.ip, ip),
            eq(inviteAttemptLog.success, false),
            gte(inviteAttemptLog.createdAt, windowStart)
          )
        );

      if (failCount >= MAX_ATTEMPTS) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: `Too many failed attempts. Please wait 5 minutes before trying again.`,
        });
      }

      // ── Validate code ────────────────────────────────────────────────────
      const envCode = ENV.inviteCode ?? "";
      const submittedCode = input.code.trim().toUpperCase();
      const expectedCode = envCode.trim().toUpperCase();

      const isValid = expectedCode.length > 0 && submittedCode === expectedCode;

      // ── Log the attempt ──────────────────────────────────────────────────
      await db.insert(inviteAttemptLog).values({
        ip,
        codeTried: input.code.trim().slice(0, 64),
        success: isValid,
        userAgent: userAgent.slice(0, 256),
      });

      if (!isValid) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Invalid invite code.",
        });
      }

      // ── Fetch per-code welcome message from DB ───────────────────────────
      const [codeRow] = await db
        .select()
        .from(inviteCodes)
        .where(
          and(
            eq(inviteCodes.code, input.code.trim()),
            eq(inviteCodes.active, true)
          )
        )
        .limit(1);

      return {
        valid: true as const,
        cohortName: codeRow?.cohortName ?? null,
        welcomeMessage: codeRow?.welcomeMessage ?? null,
      };
    }),

  /**
   * Get the remaining lockout time (in seconds) for the calling IP.
   * Returns 0 if not locked out.
   */
  getLockoutStatus: publicProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { lockedOut: false, secondsRemaining: 0, attemptsUsed: 0 };
    const ip = getClientIp(ctx.req as Parameters<typeof getClientIp>[0]);
    const windowStart = new Date(Date.now() - LOCKOUT_MS);

    const [{ failCount }] = await db
      .select({ failCount: count() })
      .from(inviteAttemptLog)
      .where(
        and(
          eq(inviteAttemptLog.ip, ip),
          eq(inviteAttemptLog.success, false),
          gte(inviteAttemptLog.createdAt, windowStart)
        )
      );

    if (failCount < MAX_ATTEMPTS) {
      return { lockedOut: false, secondsRemaining: 0, attemptsUsed: failCount };
    }

    // Find the timestamp of the most recent failed attempt to compute remaining time
    const [latest] = await db
      .select({ createdAt: inviteAttemptLog.createdAt })
      .from(inviteAttemptLog)
      .where(
        and(
          eq(inviteAttemptLog.ip, ip),
          eq(inviteAttemptLog.success, false),
          gte(inviteAttemptLog.createdAt, windowStart)
        )
      )
      .orderBy(desc(inviteAttemptLog.createdAt))
      .limit(1);

    const lockoutEndsAt = latest
      ? new Date(latest.createdAt).getTime() + LOCKOUT_MS
      : Date.now();
    const secondsRemaining = Math.max(
      0,
      Math.ceil((lockoutEndsAt - Date.now()) / 1000)
    );

    return {
      lockedOut: secondsRemaining > 0,
      secondsRemaining,
      attemptsUsed: failCount,
    };
  }),
});
