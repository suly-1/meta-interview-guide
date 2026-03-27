import { z } from "zod";
import { ownerProcedure, router, publicProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { siteSettings, pinAttempts } from "../../drizzle/schema";
import { eq, desc, gte } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { notifyOwner } from "../_core/notification";
import { sendEmail } from "../email";
import { SignJWT, jwtVerify } from "jose";
import { ENV } from "../_core/env";

/** Read the IP allowlist from siteSettings (comma-separated CIDRs/IPs). */
async function getIpAllowlist(): Promise<string[]> {
  const db = await getDb();
  if (!db) return [];
  const [row] = await db
    .select({ value: siteSettings.value })
    .from(siteSettings)
    .where(eq(siteSettings.key, 'pin_ip_allowlist'))
    .limit(1);
  if (!row?.value) return [];
  return row.value.split(',').map(s => s.trim()).filter(Boolean);
}

/** Check if an IP is in the allowlist (exact match or CIDR /24 prefix match). */
function isIpAllowed(ip: string, allowlist: string[]): boolean {
  if (allowlist.length === 0) return false;
  for (const entry of allowlist) {
    if (entry === ip) return true;
    // Support simple /24 CIDR: 192.168.1.0/24 matches 192.168.1.*
    if (entry.endsWith('/24')) {
      const prefix = entry.slice(0, entry.lastIndexOf('.'));
      if (ip.startsWith(prefix + '.')) return true;
    }
  }
  return false;
}

export const adminPinRouter = router({
  /**
   * verifyPin — public procedure (no OAuth required).
   * Accepts a PIN, compares it in constant-time to ADMIN_PIN env var,
   * and returns a short-lived signed JWT on success.
   *
   * Security features:
   * - Constant-time comparison (prevents timing attacks)
   * - Rate limiting: 5 failed attempts in 15 min = 15-min lockout
   * - All attempts (success + failure) logged to pin_attempts table with IP
   * - JWT stored in React state only (never localStorage)
   */
  verifyPin: publicProcedure
    .input(z.object({ pin: z.string().min(1).max(20) }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      const ip = ((ctx.req.headers['x-forwarded-for'] as string) ?? '')
        .split(',')[0]?.trim() || ctx.req.socket?.remoteAddress || 'unknown';
      // IP allowlist check — skip PIN gate entirely for trusted IPs
      const allowlist = await getIpAllowlist();
      if (isIpAllowed(ip, allowlist)) {
        console.info(`[PIN GATE] Allowlisted IP ${ip} — issuing token without PIN check`);
        const secret = new TextEncoder().encode(ENV.cookieSecret + ':admin-pin-gate');
        const token = await new SignJWT({ purpose: 'admin-pin-gate' })
          .setProtectedHeader({ alg: 'HS256' })
          .setIssuedAt()
          .setExpirationTime('4h')
          .sign(secret);
        return { token };
      }
      // Rate-limit check: count failed attempts in the last 15 minutes
      const LOCK_WINDOW_MS = 15 * 60 * 1000;
      const MAX_ATTEMPTS = 5;
      const windowStart = new Date(Date.now() - LOCK_WINDOW_MS);
      if (db) {
        const safeIp = ip.replace(/'/g, '');
        const windowStartStr = windowStart.toISOString().replace('T', ' ').split('.')[0];
        const [countRow] = await db.execute(
          `SELECT COUNT(*) as cnt FROM pin_attempts WHERE ipAddress = '${safeIp}' AND success = 0 AND createdAt >= '${windowStartStr}'` as unknown as import('drizzle-orm').SQL
        ) as unknown as [{ cnt: number }];
        if (countRow && Number(countRow.cnt) >= MAX_ATTEMPTS) {
          console.warn(`[PIN GATE] IP ${ip} is locked out (${countRow.cnt} failed attempts in 15 min)`);
          throw new TRPCError({
            code: 'TOO_MANY_REQUESTS',
            message: 'Too many failed attempts. Try again in 15 minutes.',
          });
        }
      }
      const storedPin = ENV.adminPin;
      if (!storedPin) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Admin PIN is not configured on the server.',
        });
      }
      // Constant-time comparison to prevent timing attacks
      const a = Buffer.from(input.pin.padEnd(32, '\0'));
      const b = Buffer.from(storedPin.padEnd(32, '\0'));
      let diff = 0;
      for (let i = 0; i < 32; i++) diff |= a[i] ^ b[i];
      const correct = diff === 0;
      // Log the attempt (success or failure)
      if (db) {
        await db.insert(pinAttempts).values({
          ipAddress: ip,
          success: correct ? 1 : 0,
        }).catch(() => {});
      }
      if (!correct) {
        console.warn(`[PIN GATE] Failed attempt from IP ${ip}`);
        // Check total failed attempts in window — alert owner at 3 and 5
        if (db) {
          const safeIp2 = ip.replace(/'/g, '');
          const windowStartStr2 = new Date(Date.now() - 15 * 60 * 1000).toISOString().replace('T', ' ').split('.')[0];
          const [alertRow] = await db.execute(
            `SELECT COUNT(*) as cnt FROM pin_attempts WHERE ipAddress = '${safeIp2}' AND success = 0 AND createdAt >= '${windowStartStr2}'` as unknown as import('drizzle-orm').SQL
          ) as unknown as [{ cnt: number }];
          const totalFailed = Number(alertRow?.cnt ?? 0);
          if (totalFailed === 3 || totalFailed === 5) {
            const alertTitle = `⚠️ Admin PIN: ${totalFailed} failed attempt${totalFailed > 1 ? 's' : ''} from ${ip}`;
            const alertBody = `**${totalFailed} failed admin PIN attempt${totalFailed > 1 ? 's' : ''}** detected from IP **${ip}** within the last 15 minutes.\n\n${totalFailed >= 5 ? 'This IP is now **locked out for 15 minutes**.' : 'If this was not you, monitor for further attempts.'}\n\nTimestamp: ${new Date().toISOString()}`;
            // Manus inbox notification (always)
            notifyOwner({ title: alertTitle, content: alertBody }).catch(() => {});
            // SMTP email alert (if configured)
            const recipientEmail = process.env.DIGEST_RECIPIENT_EMAIL;
            if (recipientEmail) {
              sendEmail({
                to: recipientEmail,
                subject: alertTitle,
                text: alertBody.replace(/\*\*/g, ''),
                html: `<p>${alertBody.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>')}</p>`,
              }).catch(() => {});
            }
          }
        }
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Incorrect PIN.',
        });
      }
      // Issue a short-lived signed JWT (4 hours)
      const secret = new TextEncoder().encode(
        ENV.cookieSecret + ':admin-pin-gate'
      );
      const token = await new SignJWT({ purpose: 'admin-pin-gate' })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('4h')
        .sign(secret);
      console.info(`[PIN GATE] Successful login from IP ${ip}`);
      return { token };
    }),

  /**
   * getPinLockStatus — public procedure.
   * Returns whether the calling IP is currently locked out and how many
   * seconds remain until the lockout expires.
   */
  getPinLockStatus: publicProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return { locked: false, secondsRemaining: 0, failedAttempts: 0 };
      const ip = ((ctx.req.headers['x-forwarded-for'] as string) ?? '')
        .split(',')[0]?.trim() || ctx.req.socket?.remoteAddress || 'unknown';
      const LOCK_WINDOW_MS = 15 * 60 * 1000;
      const MAX_ATTEMPTS = 5;
      const windowStart = new Date(Date.now() - LOCK_WINDOW_MS);
      const windowStartStr = windowStart.toISOString().replace('T', ' ').split('.')[0];
      const [countRow] = await db.execute(
        `SELECT COUNT(*) as cnt, MIN(createdAt) as oldest FROM pin_attempts WHERE ipAddress = '${ip.replace(/'/g, '')}' AND success = 0 AND createdAt >= '${windowStartStr}'` as unknown as import('drizzle-orm').SQL
      ) as unknown as [{ cnt: number; oldest: Date | null }];
      const failedAttempts = Number(countRow?.cnt ?? 0);
      if (failedAttempts < MAX_ATTEMPTS) {
        return { locked: false, secondsRemaining: 0, failedAttempts };
      }
      // Locked: compute when the oldest attempt in the window expires
      const oldestAttempt = countRow?.oldest ? new Date(countRow.oldest) : windowStart;
      const unlockAt = new Date(oldestAttempt.getTime() + LOCK_WINDOW_MS);
      const secondsRemaining = Math.max(0, Math.ceil((unlockAt.getTime() - Date.now()) / 1000));
      return { locked: true, secondsRemaining, failedAttempts };
    }),

  /**
   * changeAdminPin — owner-only procedure (requires valid PIN token).
   * Updates ADMIN_PIN in siteSettings (runtime override) and in ENV.
   * Takes effect immediately without server restart.
   */
  changeAdminPin: ownerProcedure
    .input(z.object({
      currentPin: z.string().min(1).max(20),
      newPin: z.string().min(4).max(20),
    }))
    .mutation(async ({ input }) => {
      const storedPin = ENV.adminPin;
      if (!storedPin) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Admin PIN is not configured on the server.',
        });
      }
      // Verify current PIN first
      const a = Buffer.from(input.currentPin.padEnd(32, '\0'));
      const b = Buffer.from(storedPin.padEnd(32, '\0'));
      let diff = 0;
      for (let i = 0; i < 32; i++) diff |= a[i] ^ b[i];
      if (diff !== 0) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Current PIN is incorrect.' });
      }
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable.' });
      // Store new PIN in siteSettings (runtime override)
      await db
        .insert(siteSettings)
        .values({ key: 'admin_pin_override', value: input.newPin })
        .onDuplicateKeyUpdate({ set: { value: input.newPin } });
      // Update in-memory ENV so it takes effect immediately
      ENV.adminPin = input.newPin;
      console.info('[PIN GATE] Admin PIN changed successfully');
      return { success: true };
    }),

  /**
   * getPinAttemptHistory — returns the last 10 failed PIN attempts.
   * Used by Admin Settings to show the audit table.
   */
  getPinAttemptHistory: ownerProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    const rows = await db
      .select({
        id: pinAttempts.id,
        ipAddress: pinAttempts.ipAddress,
        success: pinAttempts.success,
        createdAt: pinAttempts.createdAt,
      })
      .from(pinAttempts)
      .where(eq(pinAttempts.success, 0))
      .orderBy(desc(pinAttempts.createdAt))
      .limit(10);
    return rows.map(row => ({
      id: row.id,
      ipAddress: row.ipAddress,
      createdAt: row.createdAt,
    }));
  }),

  /**
   * getIpAllowlist — returns the current IP allowlist.
   */
  getIpAllowlist: ownerProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { ips: [] };
    const [row] = await db
      .select({ value: siteSettings.value })
      .from(siteSettings)
      .where(eq(siteSettings.key, 'pin_ip_allowlist'))
      .limit(1);
    const ips = row?.value ? row.value.split(',').map(s => s.trim()).filter(Boolean) : [];
    return { ips };
  }),

  /**
   * setIpAllowlist — replaces the entire IP allowlist.
   * Accepts an array of IP strings (IPv4 exact or /24 CIDR).
   */
  setIpAllowlist: ownerProcedure
    .input(z.object({ ips: z.array(z.string().max(50)).max(50) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable.' });
      const value = input.ips.map(s => s.trim()).filter(Boolean).join(',');
      await db
        .insert(siteSettings)
        .values({ key: 'pin_ip_allowlist', value })
        .onDuplicateKeyUpdate({ set: { value } });
      console.info('[PIN GATE] IP allowlist updated:', value || '(empty)');
      return { success: true, count: input.ips.length };
    }),

  /**
   * getPinAttemptChart — returns failed attempt counts per day for the last 7 days.
   * Used by Admin Settings to render a bar chart.
   */
  getPinAttemptChart: ownerProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000);
    const rows = await db
      .select({
        id: pinAttempts.id,
        createdAt: pinAttempts.createdAt,
      })
      .from(pinAttempts)
      .where(gte(pinAttempts.createdAt, sevenDaysAgo))
      .orderBy(pinAttempts.createdAt);
    // Group by calendar day (local date string)
    const buckets: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86_400_000);
      const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      buckets[key] = 0;
    }
    for (const row of rows) {
      const key = new Date(row.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (key in buckets) buckets[key]++;
    }
    return Object.entries(buckets).map(([date, count]) => ({ date, count }));
  }),

  /**
   * verifyPinToken — public procedure.
   * Validates a previously issued admin-pin-gate JWT.
   * Returns { valid: true } on success, throws FORBIDDEN otherwise.
   * Used by AdminGate on mount to re-validate a token held in React state.
   */
  verifyPinToken: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      try {
        const secret = new TextEncoder().encode(
          ENV.cookieSecret + ':admin-pin-gate'
        );
        const { payload } = await jwtVerify(input.token, secret, {
          algorithms: ['HS256'],
        });
        if (payload.purpose !== 'admin-pin-gate') {
          throw new Error('Invalid purpose');
        }
        return { valid: true };
      } catch {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'PIN token is invalid or expired.',
        });
      }
    }),
});
