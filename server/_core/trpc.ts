import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from "@shared/const";
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

  // Auto-unblock: if blockedUntil has passed, lift the block before checking
  const user = ctx.user as {
    blocked?: number;
    blockedUntil?: Date | null;
    id?: number;
  };

  if (user.blocked === 1 && user.blockedUntil && user.id) {
    const expiry = new Date(user.blockedUntil);
    if (expiry <= new Date()) {
      // Expiry has passed — auto-unblock in DB (fire-and-forget, non-fatal)
      try {
        const db = await getDb();
        if (db) {
          await db
            .update(users)
            .set({ blocked: 0, blockReason: null, blockedUntil: null })
            .where(eq(users.id, user.id));
          console.log(
            `[Auth] Auto-unblocked user #${user.id} (blockedUntil expired)`
          );
          // Treat as unblocked for this request
          user.blocked = 0;
        }
      } catch (err) {
        console.warn("[Auth] Auto-unblock failed:", err);
        // Fall through — still enforce the block if DB update failed
      }
    }
  }

  // Block access for users flagged by the owner
  if (user.blocked === 1) {
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

// adminProcedure chains through requireUser so blocked admins are also rejected
export const adminProcedure = t.procedure.use(requireUser).use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== "admin") {
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
 * ownerProcedure — only the account whose openId matches OWNER_OPEN_ID
 * can call this. Use for highly sensitive data (disclaimer audit log, etc.).
 */
// ownerProcedure chains through requireUser so blocked users can't bypass via owner path
export const ownerProcedure = t.procedure.use(requireUser).use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ENV.ownerOpenId || ctx.user!.openId !== ENV.ownerOpenId) {
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
 * tokenAdminProcedure — accepts EITHER:
 *  1. A valid Manus OAuth session with role=admin, OR
 *  2. A matching x-admin-token HTTP header (ENV.adminSecretToken)
 *
 * Required for admin panel procedures because the panel uses a localStorage
 * token (not an OAuth session). Using adminProcedure would cause FORBIDDEN
 * errors for token-only access.
 */
export const tokenAdminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;
    const tokenHeader = ctx.req.headers["x-admin-token"] as string | undefined;
    const tokenValid =
      Boolean(ENV.adminSecretToken) && tokenHeader === ENV.adminSecretToken;
    const sessionAdmin = ctx.user && ctx.user.role === "admin";
    if (!tokenValid && !sessionAdmin) {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    const effectiveUser = ctx.user ?? {
      id: 0,
      openId: "token-admin",
      name: "Admin",
      email: null,
      loginMethod: null,
      role: "admin" as const,
      blocked: 0,
      blockReason: null,
      blockedUntil: null,
      disclaimerAcknowledgedAt: null,
      lastSignedIn: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return next({ ctx: { ...ctx, user: effectiveUser } });
  })
);
