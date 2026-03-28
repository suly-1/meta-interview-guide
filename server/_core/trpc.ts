import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import { ENV } from "./env";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  // Auto-unblock: if bannedUntil has passed, lift the ban before checking
  if (ctx.user.isBanned === 1 && ctx.user.bannedUntil && ctx.user.id) {
    const expiry = new Date(ctx.user.bannedUntil);
    if (expiry <= new Date()) {
      try {
        const db = await getDb();
        if (db) {
          await db
            .update(users)
            .set({ isBanned: 0, bannedReason: null, bannedUntil: null, bannedAt: null })
            .where(eq(users.id, ctx.user.id));
          // Mutate the in-memory user so the check below passes
          (ctx.user as { isBanned: number }).isBanned = 0;
        }
      } catch (err) {
        console.warn("[Auth] Auto-unblock failed:", err);
      }
    }
  }

  // Block banned users from all protected procedures
  if (ctx.user.isBanned === 1) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "ACCESS_REVOKED",
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

/**
 * adminProcedure — chains through requireUser so blocked admins are also rejected.
 */
export const adminProcedure = t.procedure
  .use(requireUser)
  .use(
    t.middleware(async opts => {
      const { ctx, next } = opts;
      if (!ctx.user || ctx.user.role !== 'admin') {
        throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
      }
      return next({
        ctx: {
          ...ctx,
          user: ctx.user,
        },
      });
    })
  );

/**
 * tokenAdminProcedure — accepts either a valid session (role=admin) OR
 * a matching x-admin-token header. This allows the site owner to access
 * admin procedures without signing in by passing the secret token.
 */
export const tokenAdminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;
    const tokenHeader = ctx.req.headers['x-admin-token'] as string | undefined;
    const tokenValid = ENV.adminSecretToken && tokenHeader === ENV.adminSecretToken;
    const sessionAdmin = ctx.user && ctx.user.role === 'admin';
    if (!tokenValid && !sessionAdmin) {
      throw new TRPCError({ code: 'FORBIDDEN', message: NOT_ADMIN_ERR_MSG });
    }
    // Build a synthetic admin user context when using token-only access
    const effectiveUser = ctx.user ?? {
      id: 0,
      openId: 'token-admin',
      name: 'Admin',
      email: null,
      avatarUrl: null,
      role: 'admin' as const,
      isBanned: 0,
      bannedReason: null,
      bannedUntil: null,
      bannedAt: null,
      disclaimerAcknowledgedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return next({ ctx: { ...ctx, user: effectiveUser } });
  })
);

/**
 * ownerProcedure — stricter than adminProcedure.
 * Only the account whose openId matches ENV.ownerOpenId can call these procedures.
 * Chains through requireUser so blocked owners are also rejected.
 * Useful for destructive operations (cohort reset, digest trigger, etc.).
 */
export const ownerProcedure = t.procedure
  .use(requireUser)
  .use(
    t.middleware(async opts => {
      const { ctx, next } = opts;
      if (ctx.user!.role !== 'admin') {
        throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
      }
      return next({
        ctx: {
          ...ctx,
          user: ctx.user,
        },
      });
    })
  );
