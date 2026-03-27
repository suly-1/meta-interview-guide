import { z } from "zod";
import { notifyOwner } from "./notification";
import { adminProcedure, publicProcedure, router, tokenAdminProcedure } from "./trpc";

export const systemRouter = router({
  health: publicProcedure
    .input(
      z.object({
        timestamp: z.number().min(0, "timestamp cannot be negative"),
      })
    )
    .query(() => ({
      ok: true,
    })),

  notifyOwner: adminProcedure
    .input(
      z.object({
        title: z.string().min(1, "title is required"),
        content: z.string().min(1, "content is required"),
      })
    )
    .mutation(async ({ input }) => {
      const delivered = await notifyOwner(input);
      return {
        success: delivered,
      } as const;
    }),

  /**
   * checkpoint.notifyReady — fires a push notification to the project owner
   * immediately after a Manus checkpoint is saved, prompting them to click Publish.
   * Secured by x-admin-token header so it can be called from the sandbox CLI
   * without requiring a browser session.
   */
  checkpointReady: tokenAdminProcedure
    .input(
      z.object({
        description: z.string().optional(),
        versionId: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const desc = input.description ?? "New changes are ready";
      const versionNote = input.versionId ? `\n\nVersion ID: \`${input.versionId}\`` : "";
      const delivered = await notifyOwner({
        title: "✅ Checkpoint saved — ready to Publish",
        content: `${desc}${versionNote}\n\nOpen the Manus Management UI → click **Publish** to make it live on metaguide.one.`,
      });
      return { success: delivered } as const;
    }),
});
