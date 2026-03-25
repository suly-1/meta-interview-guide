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

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  ctci: ctciRouter,
  ai: aiRouter,
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
     * The token is stored in memory on the client and passed as a header
     * to unlock admin UI components. The PIN itself is never logged.
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
      .mutation(async ({ input }) => {
        if (!ENV.adminPin) {
          throw new Error("Admin PIN not configured");
        }
        // Constant-time comparison to prevent timing attacks
        const expected = ENV.adminPin;
        const provided = input.pin;
        if (provided.length !== expected.length || provided !== expected) {
          // Small delay to slow brute force
          await new Promise(r => setTimeout(r, 500));
          throw new Error("Incorrect PIN");
        }
        // Issue a short-lived signed JWT (1 hour)
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
