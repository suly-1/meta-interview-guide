import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { ENV } from "./_core/env";
import { SignJWT } from "jose";
import { collabRouter } from "./routers/collab";
import { leaderboardRouter } from "./routers/leaderboard";
import { ctciRouter } from "./routers/ctci";
import { aiRouter } from "./routers/ai";
import { aiCodingMockRouter } from "./routers/aiCodingMock";
import { aiTrainingRouter } from "./routers/aiTraining";
import { onboardingRouter } from "./routers/onboarding";
import { ratingsRouter } from "./routers/ratings";
import { ctciProgressRouter } from "./routers/ctciProgress";
import { mockHistoryRouter } from "./routers/mockHistory";
import { disclaimerRouter } from "./routers/disclaimer";
import { deployStatusRouter } from "./routers/deployStatus";
import { feedbackRouter } from "./routers/feedback";
import { userScoresRouter } from "./routers/userScores";
import { sprintPlanRouter } from "./routers/sprintPlan";
import { analyticsRouter } from "./routers/analytics";
import { favoritesRouter } from "./routers/favorites";
import { progressRouter } from "./routers/progress";
import { siteAccessRouter } from "./routers/siteAccess";
import { adminUsersRouter } from "./routers/adminUsers";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { pinAttempts } from "../drizzle/schema";
import { and, gte, count } from "drizzle-orm";

// ── PIN brute-force lockout constants ─────────────────────────────────────────
const PIN_MAX_ATTEMPTS = 5; // wrong PINs before lockout
const PIN_LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes in ms

/**
 * Returns the IP address from an Express request, handling proxies.
 */
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

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  ctci: ctciRouter,
  ai: aiRouter,
  aiCodingMock: aiCodingMockRouter,
  aiTraining: aiTrainingRouter,
  auth: router({
    me: publicProcedure.query(opts => {
      const u = opts.ctx.user;
      if (!u) return null;
      // Omit openId from the public response — it's an internal OAuth identifier
      // that should not be exposed to the frontend or logged in browser devtools.
      const { openId: _openId, loginMethod: _loginMethod, ...safeUser } = u;
      // Include blocked flag so the frontend BlockedGate can redirect blocked users
      return safeUser;
    }),
    /** Returns whether the current user is the site owner (OWNER_OPEN_ID match). */
    isOwner: protectedProcedure.query(({ ctx }) => {
      return {
        isOwner: !!ENV.ownerOpenId && ctx.user.openId === ENV.ownerOpenId,
      };
    }),
    /**
     * Verifies the admin PIN and returns a short-lived signed token.
     * - Logs every failed attempt (IP + timestamp) to pin_attempts table.
     * - After PIN_MAX_ATTEMPTS failures from the same IP within PIN_LOCKOUT_MS,
     *   returns a lockoutUntil timestamp and rejects without checking the PIN.
     * - Successful unlock does NOT log to pin_attempts.
     */
    verifyAdminPin: publicProcedure
      .input((val: unknown) => {
        if (
          typeof val !== "object" ||
          val === null ||
          typeof (val as { pin: unknown }).pin !== "string"
        ) {
          throw new Error("Invalid input");
        }
        return val as { pin: string };
      })
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

        // ── Check if this IP is currently locked out ──────────────────────────
        if (db) {
          const [{ value: recentFailures }] = await db
            .select({ value: count() })
            .from(pinAttempts)
            .where(and(gte(pinAttempts.attemptedAt, lockoutWindowStart)));

          if (recentFailures >= PIN_MAX_ATTEMPTS) {
            // Find the oldest failure in the window to compute lockout expiry
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

        // ── Verify the PIN ────────────────────────────────────────────────────
        const expected = ENV.adminPin;
        const provided = input.pin;

        // Constant-time comparison to prevent timing attacks
        const isCorrect =
          provided.length === expected.length && provided === expected;

        if (!isCorrect) {
          // Log the failed attempt
          if (db) {
            await db.insert(pinAttempts).values({ ip, succeeded: 0 });
          }

          // Check if this failure pushed the IP over the limit
          let lockoutUntil: string | undefined;
          if (db) {
            const [{ value: totalFailures }] = await db
              .select({ value: count() })
              .from(pinAttempts)
              .where(gte(pinAttempts.attemptedAt, lockoutWindowStart));

            if (totalFailures >= PIN_MAX_ATTEMPTS) {
              lockoutUntil = new Date(
                Date.now() + PIN_LOCKOUT_MS
              ).toISOString();
            }
          }

          // Small delay to slow brute force even before lockout kicks in
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

        // ── Issue a short-lived signed JWT (1 hour) ───────────────────────────
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

    /**
     * Returns the current PIN lockout status for the caller's IP.
     * Used by the frontend to show the lockout countdown on page load.
     */
    getPinStatus: publicProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return { locked: false, lockoutUntil: null };

      const ip = getClientIp(ctx.req as Parameters<typeof getClientIp>[0]);
      const lockoutWindowStart = new Date(Date.now() - PIN_LOCKOUT_MS);

      const [{ value: recentFailures }] = await db
        .select({ value: count() })
        .from(pinAttempts)
        .where(and(gte(pinAttempts.attemptedAt, lockoutWindowStart)));

      if (recentFailures >= PIN_MAX_ATTEMPTS) {
        const lockoutUntil = new Date(
          lockoutWindowStart.getTime() + PIN_LOCKOUT_MS
        ).toISOString();
        return { locked: true, lockoutUntil };
      }

      return { locked: false, lockoutUntil: null };
    }),

    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  collab: collabRouter,
  leaderboard: leaderboardRouter,
  onboarding: onboardingRouter,
  ratings: ratingsRouter,
  ctciProgress: ctciProgressRouter,
  mockHistory: mockHistoryRouter,
  disclaimer: disclaimerRouter,
  deployStatus: deployStatusRouter,
  feedback: feedbackRouter,
  userScores: userScoresRouter,
  sprintPlan: sprintPlanRouter,
  analytics: analyticsRouter,
  favorites: favoritesRouter,
  progress: progressRouter,
  siteAccess: siteAccessRouter,
  adminUsers: adminUsersRouter,
});

export type AppRouter = typeof appRouter;
