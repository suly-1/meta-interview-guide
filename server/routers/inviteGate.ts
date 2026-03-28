/**
 * Invite Gate Router
 *
 * Access model per invite code:
 *   1. isBlocked = 1  → admin manually blocked — denied immediately
 *   2. isActive  = 0  → deactivated — denied
 *   3. maxUses exceeded → denied
 *   4. expiresAt set and past → denied (absolute override)
 *   5. accessWindowDays > 0 AND firstUsedAt set AND now > firstUsedAt + accessWindowDays → denied (per-code 60-day window)
 *   6. Otherwise → access granted
 *
 * On first successful use, firstUsedAt is stamped — this starts the per-code access window.
 * Admin can: block/unblock, extend window, reset window, set accessWindowDays.
 *
 * Rate limiting: 3 failed attempts from same IP in 5 min → server-side block.
 * Every attempt is logged (IP, submitted code, outcome, reason).
 */
import { z } from "zod";
import { adminProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { inviteCodes, inviteGateSettings, inviteAttempts } from "../../drizzle/schema";
import { eq, desc, and, gte, count, lt } from "drizzle-orm";

const MAX_ATTEMPTS = 3;
const WINDOW_MS    = 5 * 60 * 1000; // 5 minutes

/** Extract the real client IP, respecting Cloudflare and standard proxy headers */
function getClientIp(req: {
  headers: Record<string, string | string[] | undefined>;
  socket?: { remoteAddress?: string };
}): string {
  const cf = req.headers["cf-connecting-ip"];
  if (cf) return Array.isArray(cf) ? cf[0] : cf;
  const xff = req.headers["x-forwarded-for"];
  if (xff) {
    const first = Array.isArray(xff) ? xff[0] : xff;
    return first.split(",")[0].trim();
  }
  return req.socket?.remoteAddress ?? "unknown";
}

/** Compute the per-code window expiry date (null if no window configured) */
function codeWindowExpiry(row: {
  firstUsedAt: Date | null;
  accessWindowDays: number | null;
}): Date | null {
  if (!row.firstUsedAt) return null;
  const days = row.accessWindowDays ?? 60;
  if (days <= 0) return null;
  return new Date(row.firstUsedAt.getTime() + days * 86_400_000);
}

export const inviteGateRouter = router({
  // ── Public ────────────────────────────────────────────────────────────────

  /** Check if the invite gate is currently enabled */
  isEnabled: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { enabled: false };
    const [row] = await db.select().from(inviteGateSettings).limit(1);
    return { enabled: row ? row.enabled === 1 : false };
  }),

  /**
   * Verify an invite code.
   *
   * Returns:
   *   { ok: true, welcomeMessage, windowExpiresAt }  on success
   *   { ok: false, reason, windowExpiresAt? }         on failure
   *
   * On the FIRST successful use, stamps firstUsedAt to start the access window.
   * On subsequent uses, checks whether the window has expired.
   */
  verifyCode: publicProcedure
    .input(z.object({ code: z.string().min(1).max(32) }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return { ok: false as const, reason: "db_unavailable" as const };

      const ip = getClientIp(ctx.req as Parameters<typeof getClientIp>[0]);
      const windowStart = new Date(Date.now() - WINDOW_MS);
      const submittedCode = input.code.trim().toUpperCase();

      // ── Rate-limit check ────────────────────────────────────────────────
      const [{ value: recentFailures }] = await db
        .select({ value: count() })
        .from(inviteAttempts)
        .where(
          and(
            eq(inviteAttempts.ipAddress, ip),
            eq(inviteAttempts.success, 0),
            gte(inviteAttempts.createdAt, windowStart)
          )
        );

      if (recentFailures >= MAX_ATTEMPTS) {
        await db.insert(inviteAttempts).values({
          ipAddress: ip,
          submittedCode,
          success: 0,
          reason: "rate_limited",
        });
        return { ok: false as const, reason: "rate_limited" as const };
      }

      // ── Code lookup ──────────────────────────────────────────────────────
      const [row] = await db
        .select()
        .from(inviteCodes)
        .where(eq(inviteCodes.code, submittedCode))
        .limit(1);

      let failReason: string | null = null;

      if (!row) {
        failReason = "invalid";
      } else if (row.isBlocked) {
        failReason = "blocked";
      } else if (!row.isActive) {
        failReason = "inactive";
      } else if (row.maxUses && row.maxUses > 0 && row.useCount >= row.maxUses) {
        failReason = "exhausted";
      } else if (row.expiresAt && new Date(row.expiresAt) < new Date()) {
        failReason = "expired";
      } else {
        // Per-code access window check
        const windowExpiry = codeWindowExpiry({
          firstUsedAt: row.firstUsedAt,
          accessWindowDays: row.accessWindowDays,
        });
        if (windowExpiry && windowExpiry < new Date()) {
          failReason = "window_expired";
        }
      }

      if (failReason) {
        await db.insert(inviteAttempts).values({
          ipAddress: ip,
          submittedCode,
          success: 0,
          reason: failReason,
        });
        return {
          ok: false as const,
          reason: failReason as "invalid" | "inactive" | "expired" | "exhausted" | "blocked" | "window_expired",
        };
      }

      // ── Success ──────────────────────────────────────────────────────────
      const now = new Date();
      const isFirstUse = !row!.firstUsedAt;

      await db.insert(inviteAttempts).values({
        ipAddress: ip,
        submittedCode,
        success: 1,
        reason: "ok",
      });

      // Stamp firstUsedAt on first successful use, always increment useCount
      await db
        .update(inviteCodes)
        .set({
          useCount: row!.useCount + 1,
          ...(isFirstUse ? { firstUsedAt: now } : {}),
        })
        .where(eq(inviteCodes.id, row!.id));

      // Compute window expiry for the client (so it can show "access until X")
      const updatedFirstUsedAt = isFirstUse ? now : row!.firstUsedAt;
      const windowExpiry = codeWindowExpiry({
        firstUsedAt: updatedFirstUsedAt,
        accessWindowDays: row!.accessWindowDays,
      });

      return {
        ok: true as const,
        welcomeMessage: row!.welcomeMessage ?? null,
        windowExpiresAt: windowExpiry ? windowExpiry.toISOString() : null,
        accessWindowDays: row!.accessWindowDays ?? 60,
      };
    }),

  /**
   * Re-check access for a code that's already stored in the browser.
   * Called on every page load to enforce expiry and blocks without re-entering the code.
   */
  checkCodeAccess: publicProcedure
    .input(z.object({ code: z.string().min(1).max(32) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { ok: true as const }; // fail open if DB unavailable

      const submittedCode = input.code.trim().toUpperCase();
      const [row] = await db
        .select()
        .from(inviteCodes)
        .where(eq(inviteCodes.code, submittedCode))
        .limit(1);

      if (!row || !row.isActive) return { ok: false as const, reason: "invalid" as const };
      if (row.isBlocked)         return { ok: false as const, reason: "blocked" as const };
      if (row.expiresAt && new Date(row.expiresAt) < new Date())
        return { ok: false as const, reason: "expired" as const };

      const windowExpiry = codeWindowExpiry({
        firstUsedAt: row.firstUsedAt,
        accessWindowDays: row.accessWindowDays,
      });
      if (windowExpiry && windowExpiry < new Date())
        return { ok: false as const, reason: "window_expired" as const, windowExpiresAt: windowExpiry.toISOString() };

      return {
        ok: true as const,
        welcomeMessage: row.welcomeMessage ?? null,
        windowExpiresAt: windowExpiry ? windowExpiry.toISOString() : null,
        accessWindowDays: row.accessWindowDays ?? 60,
      };
    }),

  // ── Admin ─────────────────────────────────────────────────────────────────

  /** Toggle the invite gate on or off */
  setEnabled: adminProcedure
    .input(z.object({ enabled: z.boolean() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { ok: false };
      const [existing] = await db.select().from(inviteGateSettings).limit(1);
      if (existing) {
        await db
          .update(inviteGateSettings)
          .set({ enabled: input.enabled ? 1 : 0 })
          .where(eq(inviteGateSettings.id, existing.id));
      } else {
        await db.insert(inviteGateSettings).values({ enabled: input.enabled ? 1 : 0 });
      }
      return { ok: true };
    }),

  /** List all invite codes with computed window expiry */
  listCodes: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    const rows = await db.select().from(inviteCodes).orderBy(desc(inviteCodes.createdAt));
    return rows.map((row) => {
      const windowExpiry = codeWindowExpiry({
        firstUsedAt: row.firstUsedAt,
        accessWindowDays: row.accessWindowDays,
      });
      const now = new Date();
      const isWindowExpired = windowExpiry ? windowExpiry < now : false;
      const isAbsoluteExpired = row.expiresAt ? new Date(row.expiresAt) < now : false;
      return {
        ...row,
        windowExpiresAt: windowExpiry ? windowExpiry.toISOString() : null,
        isWindowExpired,
        isAbsoluteExpired,
        effectivelyExpired: isWindowExpired || isAbsoluteExpired,
      };
    });
  }),

  /** Create a new invite code */
  createCode: adminProcedure
    .input(
      z.object({
        code:             z.string().min(3).max(32).optional(),
        label:            z.string().max(128).optional(),
        welcomeMessage:   z.string().max(256).optional(),
        maxUses:          z.number().int().min(0).default(0),
        expiresAt:        z.string().optional(),
        accessWindowDays: z.number().int().min(0).max(730).default(60),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { ok: false, code: "" };
      const code = input.code
        ? input.code.trim().toUpperCase()
        : Math.random().toString(36).substring(2, 8).toUpperCase();
      await db.insert(inviteCodes).values({
        code,
        label:            input.label ?? null,
        welcomeMessage:   input.welcomeMessage ?? null,
        maxUses:          input.maxUses,
        useCount:         0,
        isActive:         1,
        isBlocked:        0,
        accessWindowDays: input.accessWindowDays,
        expiresAt:        input.expiresAt ? new Date(input.expiresAt) : null,
      });
      return { ok: true, code };
    }),

  /** Update label, welcome message, and access window for a code */
  updateCode: adminProcedure
    .input(
      z.object({
        id:               z.number(),
        label:            z.string().max(128).optional(),
        welcomeMessage:   z.string().max(256).optional(),
        accessWindowDays: z.number().int().min(0).max(730).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { ok: false };
      const updates: Record<string, unknown> = {};
      if (input.label            !== undefined) updates.label            = input.label ?? null;
      if (input.welcomeMessage   !== undefined) updates.welcomeMessage   = input.welcomeMessage ?? null;
      if (input.accessWindowDays !== undefined) updates.accessWindowDays = input.accessWindowDays;
      await db.update(inviteCodes).set(updates).where(eq(inviteCodes.id, input.id));
      return { ok: true };
    }),

  /**
   * Block a specific invite code immediately.
   * The code holder will see a "blocked" screen on next page load.
   */
  blockCode: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { ok: false };
      await db.update(inviteCodes).set({ isBlocked: 1 }).where(eq(inviteCodes.id, input.id));
      return { ok: true };
    }),

  /**
   * Unblock a specific invite code.
   * The code holder regains access immediately (subject to expiry/window).
   */
  unblockCode: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { ok: false };
      await db.update(inviteCodes).set({ isBlocked: 0 }).where(eq(inviteCodes.id, input.id));
      return { ok: true };
    }),

  /**
   * Extend (or reset) the access window for a code.
   * - resetWindow: clears firstUsedAt so the window starts fresh on next use
   * - extendDays: adds N days to the current window expiry
   * - setWindowDays: change the window length going forward
   */
  extendAccess: adminProcedure
    .input(
      z.object({
        id:           z.number(),
        resetWindow:  z.boolean().optional(),   // clear firstUsedAt → fresh 60-day window on next use
        extendDays:   z.number().int().min(1).max(730).optional(), // add N days to current expiry
        setWindowDays: z.number().int().min(0).max(730).optional(), // change window length
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { ok: false };

      const [row] = await db.select().from(inviteCodes).where(eq(inviteCodes.id, input.id)).limit(1);
      if (!row) return { ok: false };

      const updates: Record<string, unknown> = {};

      if (input.resetWindow) {
        updates.firstUsedAt = null; // window restarts on next use
      } else if (input.extendDays && row.firstUsedAt) {
        // Push firstUsedAt forward by extendDays (equivalent to extending the window)
        const newFirstUsedAt = new Date(row.firstUsedAt.getTime() + input.extendDays * 86_400_000);
        updates.firstUsedAt = newFirstUsedAt;
      }

      if (input.setWindowDays !== undefined) {
        updates.accessWindowDays = input.setWindowDays;
      }

      if (Object.keys(updates).length > 0) {
        await db.update(inviteCodes).set(updates).where(eq(inviteCodes.id, input.id));
      }

      return { ok: true };
    }),

  /** Deactivate (soft-delete) an invite code */
  deactivateCode: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { ok: false };
      await db.update(inviteCodes).set({ isActive: 0 }).where(eq(inviteCodes.id, input.id));
      return { ok: true };
    }),

  /** Hard-delete an invite code */
  deleteCode: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { ok: false };
      await db.delete(inviteCodes).where(eq(inviteCodes.id, input.id));
      return { ok: true };
    }),

  /**
   * List recent invite attempt log entries (newest first).
   * Includes IP (partially masked), submitted code, outcome, and timestamp.
   */
  listAttempts: adminProcedure
    .input(z.object({ limit: z.number().int().min(1).max(500).default(100) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const rows = await db
        .select()
        .from(inviteAttempts)
        .orderBy(desc(inviteAttempts.createdAt))
        .limit(input.limit);
      return rows.map((r) => ({
        id:            r.id,
        ipMasked:      maskIp(r.ipAddress),
        submittedCode: r.submittedCode ?? "—",
        success:       r.success === 1,
        reason:        r.reason ?? "—",
        createdAt:     r.createdAt,
      }));
    }),

  /** Clear attempt log entries older than N days (default: clear all) */
  clearAttempts: adminProcedure
    .input(z.object({ olderThanDays: z.number().int().min(0).default(0) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { ok: false, deleted: 0 };
      if (input.olderThanDays === 0) {
        await db.delete(inviteAttempts);
      } else {
        const cutoff = new Date(Date.now() - input.olderThanDays * 86_400_000);
        await db.delete(inviteAttempts).where(lt(inviteAttempts.createdAt, cutoff));
      }
      return { ok: true };
    }),
});

/** Show first two octets of IPv4, or first group of IPv6 */
function maskIp(ip: string): string {
  if (!ip || ip === "unknown") return "unknown";
  if (ip.includes(":")) {
    const parts = ip.split(":");
    return parts.slice(0, 2).join(":") + ":…";
  }
  const parts = ip.split(".");
  if (parts.length === 4) return `${parts[0]}.${parts[1]}.*.*`;
  return ip;
}
