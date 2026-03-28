import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { startWeeklyDigestCron } from "../weeklyDigest";
import { startWeeklyAnalyticsCron } from "../weeklyAnalytics";
import { startDailyAlertCron } from "../dailyAlert";
import { startInactivityAlertCron } from "../inactivityAlert";
import { startBlockExpiryCron } from "../blockExpiryJob";

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

// Rate limiter for AI endpoints (LLM cost protection)
const aiRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // max 20 AI calls per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many requests. Please wait a moment before trying again.",
  },
  skip: req => {
    // Skip rate limiting for localhost in development
    const ip = req.ip || req.socket.remoteAddress || "";
    return (
      process.env.NODE_ENV === "development" &&
      (ip === "127.0.0.1" || ip === "::1" || ip === "::ffff:127.0.0.1")
    );
  },
});

// General API rate limiter
const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // max 500 requests per 15 min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again later." },
});

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Trust the first proxy hop (required when running behind Manus reverse proxy)
  app.set("trust proxy", 1);

  // Security headers (helmet)
  app.use(
    helmet({
      // Custom CSP that allows Google Fonts, inline scripts, and external connections
      contentSecurityPolicy:
        process.env.NODE_ENV === "production"
          ? {
              directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
                styleSrc: [
                  "'self'",
                  "'unsafe-inline'",
                  "https://fonts.googleapis.com",
                ],
                fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
                imgSrc: ["'self'", "data:", "https:", "blob:"],
                connectSrc: ["'self'", "https:", "wss:"],
                frameSrc: ["'self'"],
                objectSrc: ["'none'"],
                upgradeInsecureRequests: [],
              },
            }
          : false,
      crossOriginEmbedderPolicy: false, // needed for OAuth iframe flows
    })
  );

  // Body parser — 10mb for normal JSON, 50mb only for upload routes
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ limit: "10mb", extended: true }));

  // Apply general rate limit to all API routes
  app.use("/api/", apiRateLimit);

  // Apply stricter rate limit to AI procedures
  app.use("/api/trpc/ai.", aiRateLimit);

  // Health check endpoint (used by Render and other hosting platforms)
  app.get("/api/health", (_req, res) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Version endpoint — returns a build hash so the frontend can detect new deployments
  // The hash is baked in at build time via VITE_BUILD_HASH env var; falls back to startup time
  const BUILD_HASH =
    process.env.VITE_BUILD_HASH ??
    process.env.CHECKPOINT_VERSION ??
    Date.now().toString(36);
  app.get("/api/version", (_req, res) => {
    res.json({ hash: BUILD_HASH });
  });

  // Changelog endpoint — returns the latest update message shown in the update toast
  // Update CHANGELOG_MESSAGE whenever you deploy a meaningful update
  const CHANGELOG_MESSAGE =
    process.env.CHANGELOG_MESSAGE ?? "New features and improvements deployed.";
  app.get("/api/changelog", (_req, res) => {
    res.json({ message: CHANGELOG_MESSAGE, hash: BUILD_HASH });
  });

  // Changelog history — prepend a new entry here before each publish
  // Format: { hash, date, title, items: string[] }
  const CHANGELOG_HISTORY = [
    {
      hash: BUILD_HASH,
      date: new Date().toISOString().slice(0, 10),
      title: "Latest release",
      items: [CHANGELOG_MESSAGE],
    },
  ];
  app.get("/api/changelog/history", (_req, res) => {
    res.json(CHANGELOG_HISTORY);
  });

  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
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

  // Start background jobs
  startWeeklyDigestCron();
  startWeeklyAnalyticsCron();
  startDailyAlertCron();
  startInactivityAlertCron();
  startBlockExpiryCron();
}

startServer().catch(console.error);
