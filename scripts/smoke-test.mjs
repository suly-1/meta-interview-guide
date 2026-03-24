/**
 * smoke-test.mjs
 *
 * Serves the production build (dist/public/) on a local HTTP server, opens it
 * in headless Chromium via Playwright, and asserts that:
 *
 *   1. The page loads without any uncaught JavaScript errors
 *   2. React mounts and renders at least one child inside #root
 *   3. No critical assets (JS/CSS) return 4xx / 5xx
 *
 * Exit codes:
 *   0 — all checks passed  → safe to deploy
 *   1 — one or more checks failed → block deploy
 *
 * Usage:
 *   node scripts/smoke-test.mjs            # test dist/public (default)
 *   node scripts/smoke-test.mjs --dir path/to/build
 *   node scripts/smoke-test.mjs --url https://metaengguide.pro   # test live site
 */

import { chromium } from "playwright";
import { createServer } from "http";
import { readFileSync, existsSync } from "fs";
import { join, extname } from "path";
import { fileURLToPath } from "url";

// ─── CLI args ────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const dirIdx = args.indexOf("--dir");
const urlIdx = args.indexOf("--url");

const __dir = fileURLToPath(new URL(".", import.meta.url));
const projectRoot = join(__dir, "..");
const buildDir =
  dirIdx >= 0 ? args[dirIdx + 1] : join(projectRoot, "dist", "public");
const liveUrl = urlIdx >= 0 ? args[urlIdx + 1] : null;

// ─── MIME types ──────────────────────────────────────────────────────────────
const MIME = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".mjs": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".ico": "image/x-icon",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ttf": "font/ttf",
};

// ─── Local HTTP server ────────────────────────────────────────────────────────
function startServer(dir) {
  return new Promise((resolve) => {
    const server = createServer((req, res) => {
      // Strip query string
      let urlPath = req.url.split("?")[0];

      // SPA fallback: serve index.html for any path without an extension
      const ext = extname(urlPath);
      if (!ext || urlPath === "/") urlPath = "/index.html";

      const filePath = join(dir, urlPath);
      if (existsSync(filePath)) {
        const mime = MIME[extname(filePath)] || "application/octet-stream";
        res.writeHead(200, { "Content-Type": mime });
        res.end(readFileSync(filePath));
      } else {
        res.writeHead(404);
        res.end("Not found");
      }
    });

    server.listen(0, "127.0.0.1", () => {
      resolve({ server, port: server.address().port });
    });
  });
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  const isLiveTest = Boolean(liveUrl);
  let server = null;
  let port = null;
  let targetUrl;

  if (isLiveTest) {
    targetUrl = liveUrl;
    console.log(`\n🌐  Testing live URL: ${targetUrl}`);
  } else {
    if (!existsSync(buildDir)) {
      console.error(`\n❌  Build directory not found: ${buildDir}`);
      console.error("    Run  pnpm run build  first.");
      process.exit(1);
    }
    ({ server, port } = await startServer(buildDir));
    targetUrl = `http://127.0.0.1:${port}/`;
    console.log(`\n🚀  Serving ${buildDir} on ${targetUrl}`);
  }

  const browser = await chromium.launch({
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
    ],
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // ── Collect evidence ────────────────────────────────────────────────────────
  const jsErrors = [];
  const assetFailures = [];

  page.on("pageerror", (err) => {
    jsErrors.push(err.message);
  });

  page.on("requestfailed", (req) => {
    const url = req.url();
    // Only flag asset failures (JS/CSS), not API calls or analytics
    if (/\.(js|css|mjs)(\?|$)/.test(url)) {
      assetFailures.push({ url, reason: req.failure()?.errorText });
    }
  });

  page.on("response", (res) => {
    const url = res.url();
    const status = res.status();
    if (status >= 400 && /\.(js|css|mjs)(\?|$)/.test(url)) {
      assetFailures.push({ url, status });
    }
  });

  // ── Navigate ─────────────────────────────────────────────────────────────────
  console.log("⏳  Loading page...");
  try {
    await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 30_000 });
  } catch (e) {
    // Navigation errors (e.g. redirects) are OK as long as the page loads
    console.warn("  Navigation warning:", e.message.split("\n")[0]);
  }

  // Wait for React to mount — poll for #root to have children, up to 15s
  console.log("⏳  Waiting for React to mount...");
  try {
    await page.waitForFunction(
      () => {
        const root = document.getElementById("root");
        return root && root.children.length > 0;
      },
      { timeout: 15_000, polling: 300 }
    );
  } catch {
    // Timeout is expected if React never mounts — we'll catch it in assertions
  }

  // ── Assertions ───────────────────────────────────────────────────────────────
  const rootChildCount = await page.evaluate(() => {
    const root = document.getElementById("root");
    return root ? root.children.length : -1;
  });

  const pageTitle = await page.title();
  const readyState = await page.evaluate(() => document.readyState);

  // ── Report ───────────────────────────────────────────────────────────────────
  console.log("\n📋  Smoke Test Results");
  console.log("─".repeat(50));
  console.log(`  Page title    : ${pageTitle || "(empty)"}`);
  console.log(`  Ready state   : ${readyState}`);
  console.log(`  #root children: ${rootChildCount}`);
  console.log(`  JS errors     : ${jsErrors.length}`);
  console.log(`  Asset failures: ${assetFailures.length}`);

  let failed = false;

  if (jsErrors.length > 0) {
    console.error("\n❌  JavaScript errors detected:");
    jsErrors.forEach((e) => console.error(`     • ${e.substring(0, 200)}`));
    failed = true;
  }

  if (assetFailures.length > 0) {
    console.error("\n❌  Asset load failures:");
    assetFailures.forEach((f) =>
      console.error(`     • ${f.url} (${f.status || f.reason})`)
    );
    failed = true;
  }

  if (rootChildCount < 1) {
    console.error(
      "\n❌  React did not mount: #root has no children (blank page)."
    );
    failed = true;
  }

  await browser.close();
  if (server) server.close();

  if (failed) {
    console.error(
      "\n🚫  Smoke test FAILED — deploy blocked. Fix the issues above.\n"
    );
    process.exit(1);
  } else {
    console.log(
      "\n✅  Smoke test PASSED — build is safe to deploy.\n"
    );
    process.exit(0);
  }
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
