import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

// Build the CSP header value — permissive enough for Google Fonts, inline scripts
// (SW kill-switch), and the Manus analytics/API endpoints.
// The Manus platform Cloudflare layer may apply a restrictive default-src 'self'
// policy; this header overrides it at the Express app level.
function buildCspHeader(): string {
  const analyticsEndpoint = process.env.VITE_ANALYTICS_ENDPOINT || "";
  const connectExtra = analyticsEndpoint ? ` ${analyticsEndpoint}` : "";

  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://manus-analytics.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    `connect-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com https://*.manus.im https://*.manus.space https://*.manuspre.computer https://*.manus.computer https://*.manuscomputer.ai https://manus-analytics.com wss:${connectExtra}`,
    "img-src 'self' data: blob: https:",
    "media-src 'self' blob:",
    "worker-src 'self' blob:",
  ].join("; ");
}

export function serveStatic(app: Express) {
  const distPath =
    process.env.NODE_ENV === "development"
      ? path.resolve(import.meta.dirname, "../..", "dist", "public")
      : path.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  // Apply CSP before serving static files so every response (HTML, JS, CSS)
  // carries the correct policy header.
  app.use((_req, res, next) => {
    res.setHeader("Content-Security-Policy", buildCspHeader());
    next();
  });

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
