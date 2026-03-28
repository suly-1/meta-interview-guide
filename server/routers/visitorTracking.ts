// Visitor tracking router — heartbeat + admin stats
import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { upsertVisitorSession, getVisitorStats } from "../db";
import { TRPCError } from "@trpc/server";

export const visitorTrackingRouter = router({
  /**
   * Called every 30 seconds by any connected browser.
   * Creates the session row on first call, updates lastHeartbeatAt on subsequent calls.
   */
  heartbeat: publicProcedure
    .input(
      z.object({
        sessionId: z.string().min(8).max(128),
        inviteCode: z.string().max(64).optional(),
        currentTab: z.string().max(64).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const ua = (ctx.req as { headers?: Record<string, string> }).headers?.[
        "user-agent"
      ]?.slice(0, 512);
      await upsertVisitorSession(input.sessionId, {
        inviteCode: input.inviteCode,
        userAgent: ua,
        currentTab: input.currentTab,
      });
      return { ok: true };
    }),

  /**
   * Admin-only: returns live visitor stats.
   * Refreshed every 30 seconds by the admin dashboard widget.
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    const stats = await getVisitorStats();
    return (
      stats ?? {
        total: 0,
        active: 0,
        today: 0,
        week: 0,
        perCode: [] as { code: string; count: number }[],
      }
    );
  }),
});
