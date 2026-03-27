/**
 * push.ts — Web Push notification router
 *
 * Procedures:
 *   push.getVapidPublicKey  — public, returns VAPID public key for client subscription
 *   push.subscribe          — protected, saves a PushSubscription for the current user
 *   push.unsubscribe        — protected, removes the subscription for the current user/endpoint
 *   push.sendDeploy         — token-admin, sends a deploy notification to all owner subscriptions
 */

import { z } from "zod";
import webpush from "web-push";
import { eq, and } from "drizzle-orm";
import { publicProcedure, protectedProcedure, tokenAdminProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { pushSubscriptions, users } from "../../drizzle/schema";
import { ENV } from "../_core/env";

// Configure web-push once at module load (no-op if keys are missing in dev)
if (ENV.vapidPublicKey && ENV.vapidPrivateKey) {
  webpush.setVapidDetails(
    `mailto:${ENV.vapidEmail || "admin@metaengguide.pro"}`,
    ENV.vapidPublicKey,
    ENV.vapidPrivateKey
  );
}

const PushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
});

export const pushRouter = router({
  /**
   * Returns the VAPID public key so the browser can create a push subscription.
   */
  getVapidPublicKey: publicProcedure.query(() => ({
    publicKey: ENV.vapidPublicKey,
  })),

  /**
   * Saves (or updates) a push subscription for the current user.
   */
  subscribe: protectedProcedure
    .input(
      z.object({
        subscription: PushSubscriptionSchema,
        userAgent: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: false };

      const { endpoint, keys } = input.subscription;

      // Upsert: if this endpoint already exists for this user, update it
      const existing = await db
        .select({ id: pushSubscriptions.id })
        .from(pushSubscriptions)
        .where(
          and(
            eq(pushSubscriptions.userId, ctx.user.id),
            eq(pushSubscriptions.endpoint, endpoint)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(pushSubscriptions)
          .set({ p256dh: keys.p256dh, auth: keys.auth, userAgent: input.userAgent ?? null })
          .where(eq(pushSubscriptions.id, existing[0].id));
      } else {
        await db.insert(pushSubscriptions).values({
          userId: ctx.user.id,
          endpoint,
          p256dh: keys.p256dh,
          auth: keys.auth,
          userAgent: input.userAgent ?? null,
        });
      }

      return { success: true };
    }),

  /**
   * Removes a push subscription by endpoint.
   */
  unsubscribe: protectedProcedure
    .input(z.object({ endpoint: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: false };

      await db
        .delete(pushSubscriptions)
        .where(
          and(
            eq(pushSubscriptions.userId, ctx.user.id),
            eq(pushSubscriptions.endpoint, input.endpoint)
          )
        );

      return { success: true };
    }),

  /**
   * Checks if the current user has an active push subscription.
   */
  status: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { subscribed: false, count: 0 };

    const subs = await db
      .select({ id: pushSubscriptions.id })
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, ctx.user.id));

    return { subscribed: subs.length > 0, count: subs.length };
  }),

  /**
   * Admin-only: send a deploy notification to all owner push subscriptions.
   * Called by the deploy script via the admin secret token.
   */
  sendDeploy: tokenAdminProcedure
    .input(
      z.object({
        title: z.string().default("🚀 New version deployed"),
        body: z.string().default("A new version of the guide is now live."),
        url: z.string().default("https://metaengguide.pro"),
      })
    )
    .mutation(async ({ input }) => {
      if (!ENV.vapidPublicKey || !ENV.vapidPrivateKey) {
        return { sent: 0, failed: 0, error: "VAPID keys not configured" };
      }

      const db = await getDb();
      if (!db) return { sent: 0, failed: 0, error: "DB unavailable" };

      // Get all owner subscriptions (users with role="admin")
      const ownerSubs = await db
        .select({
          id: pushSubscriptions.id,
          endpoint: pushSubscriptions.endpoint,
          p256dh: pushSubscriptions.p256dh,
          auth: pushSubscriptions.auth,
        })
        .from(pushSubscriptions)
        .innerJoin(users, eq(pushSubscriptions.userId, users.id))
        .where(eq(users.role, "admin"));

      const payload = JSON.stringify({
        title: input.title,
        body: input.body,
        url: input.url,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        timestamp: Date.now(),
      });

      let sent = 0;
      let failed = 0;
      const staleIds: number[] = [];

      await Promise.all(
        ownerSubs.map(async (sub) => {
          try {
            await webpush.sendNotification(
              { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
              payload
            );
            sent++;
          } catch (err: unknown) {
            // 410 Gone = subscription expired, remove it
            if (err && typeof err === "object" && "statusCode" in err && (err as { statusCode: number }).statusCode === 410) {
              staleIds.push(sub.id);
            }
            failed++;
          }
        })
      );

      // Clean up expired subscriptions
      if (staleIds.length > 0) {
        await Promise.all(
          staleIds.map((id) =>
            db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, id))
          )
        );
      }

      return { sent, failed };
    }),
});
