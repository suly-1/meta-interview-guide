import "dotenv/config";
import express from "express";
import { registerFeedbackDigestCron } from "../emailDigest";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);

  // ── Version / Changelog endpoints ─────────────────────────────────────────
  // BUILD_HASH is baked in at deploy time. Falls back to server start time so
  // every cold-start produces a new hash even without a CI pipeline.
  const BUILD_HASH =
    process.env.VITE_BUILD_HASH ??
    process.env.CHECKPOINT_VERSION ??
    Date.now().toString(36);

  app.get("/api/version", (_req, res) => {
    res.json({ hash: BUILD_HASH });
  });

  // Update CHANGELOG_MESSAGE in your environment variables whenever you deploy
  // a meaningful update. The frontend toast will display this string.
  const CHANGELOG_MESSAGE =
    process.env.CHANGELOG_MESSAGE ?? "New features and improvements deployed.";

  app.get("/api/changelog", (_req, res) => {
    res.json({ message: CHANGELOG_MESSAGE, hash: BUILD_HASH });
  });

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);

// Register weekly feedback digest cron (Mondays 08:00 UTC)
registerFeedbackDigestCron();

// ---------------------------------------------------------------------------
// Auto-unblock cron: check every hour for expired bans and lift them.
//
// Uses `withDb` so that a stale connection (ECONNRESET after long idle) is
// automatically detected, the pool is reset, and the query is retried once
// before giving up — preventing the hourly error spam in the logs.
// ---------------------------------------------------------------------------
import { withDb } from "../db";
import { users, userEvents } from "../../drizzle/schema";
import { and, eq, lte, inArray } from "drizzle-orm";

async function processExpiredBlocks() {
  try {
    await withDb(async (db) => {
      const now = new Date();
      const expired = await db
        .select({ id: users.id, name: users.name, email: users.email })
        .from(users)
        .where(and(eq(users.isBanned, 1), lte(users.bannedUntil, now)));

      if (expired.length === 0) return;

      const ids = expired.map(u => u.id);
      await db
        .update(users)
        .set({ isBanned: 0, bannedAt: null, bannedUntil: null, bannedReason: null })
        .where(inArray(users.id, ids));

      for (const u of expired) {
        await db.insert(userEvents).values({
          action: 'unblock',
          actorId: 0,
          actorName: 'System (auto-expiry)',
          targetUserId: u.id,
          targetUserName: u.name ?? `User #${u.id}`,
          targetUserEmail: u.email ?? 'unknown',
          reason: 'Block period expired — automatically unblocked',
        }).catch(() => {});
      }

      console.log(`[AutoUnblock] Unblocked ${expired.length} user(s) with expired blocks`);
    });
  } catch (err) {
    console.error('[AutoUnblock] Error processing expired blocks:', err);
  }
}

// Run immediately on startup, then every hour
processExpiredBlocks();
setInterval(processExpiredBlocks, 60 * 60 * 1000);
