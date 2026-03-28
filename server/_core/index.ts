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

  // Static changelog history — prepend a new entry here before each publish.
  // The frontend /changelog page reads this endpoint to build the What's New list.
  const CHANGELOG_HISTORY: Array<{ date: string; title: string; items: string[] }> = [
    {
      date: "2026-03-28",
      title: "Active Sessions, Version Banner & Security",
      items: [
        "Added Active Sessions admin dashboard — view all live browser sessions, revoke individual access",
        "Version Update Banner — users see a toast within 30 s of a new deployment going live",
        "Invite gate security: server-side rate limiting, 5-min IP lockout after 3 failed attempts",
        "Per-code 60-day access windows with admin extend / reset controls",
        "Panic button in Admin Settings — site-wide LOCK NOW / Unlock",
        "Animated feature tour on welcome screen after invite code entry",
        "Per-code custom welcome messages",
      ],
    },
    {
      date: "2026-03-27",
      title: "Code Practice & Game Modes",
      items: [
        "Speed Run, Tournament, Blitz, and Chaos game modes in Code Practice tab",
        "Monaco editor with Judge0 CE code execution (Python, JavaScript, Java, C++)",
        "Three-level AI hint system (nudge → approach → walkthrough)",
        "FAANG-style coding screen simulator",
        "Stats dashboard: problems solved, streaks, topic breakdown",
      ],
    },
    {
      date: "2026-03-26",
      title: "System Design, Collab Room & Behavioral",
      items: [
        "System Design tab with HLD/LLD frameworks and Meta-specific patterns",
        "Real-time Collab Room with shared whiteboard, timer, and chat",
        "Behavioral interview guide with STAR answer templates",
        "Tell Stories tab with structured narrative builder",
        "Drill Patterns reference with complexity cheat-sheets",
      ],
    },
    {
      date: "2026-03-25",
      title: "Initial Launch",
      items: [
        "Private invite-gate launch for L4–L7 study group",
        "Coding interview guide with 50-problem curated list",
        "AI-enabled round preparation content",
        "Study timeline and readiness tracker",
        "Dark / light theme toggle",
      ],
    },
  ];

  app.get("/api/changelog/history", (_req, res) => {
    res.json(CHANGELOG_HISTORY);
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
