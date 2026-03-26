/**
 * scripts/smoke-test.ts
 *
 * Post-deploy smoke test: visits the 5 most critical pages of the deployed
 * site using a headless Chromium browser and asserts:
 *   1. The page loads with HTTP 200 (or 304)
 *   2. No uncaught JavaScript errors appear in the console
 *   3. The page title is not blank
 *   4. The page body is not empty
 *
 * Usage:
 *   npx tsx scripts/smoke-test.ts [baseUrl]
 *
 * Examples:
 *   npx tsx scripts/smoke-test.ts https://www.metaguide.blog
 *   npx tsx scripts/smoke-test.ts http://localhost:3000
 *
 * Exit codes:
 *   0 — all pages passed
 *   1 — one or more pages failed (details printed to stderr)
 *
 * This script is wired into the deploy:github-pages script so a failed
 * smoke test exits the deploy pipeline before users see broken pages.
 */

import { chromium, type Browser, type Page } from "@playwright/test";

// ── Configuration ─────────────────────────────────────────────────────────────

const BASE_URL = process.argv[2] ?? "https://www.metaguide.blog";

const CRITICAL_PAGES = [
  { path: "/", label: "Home (Overview tab)" },
  { path: "/#/admin/feedback", label: "Admin Feedback" },
  { path: "/#/admin/settings", label: "Admin Settings" },
  { path: "/?tab=coding", label: "Coding tab" },
  { path: "/?tab=overview", label: "Readiness / Overview tab" },
];

// Errors that are expected and should not fail the smoke test
const IGNORED_ERROR_PATTERNS = [
  /ResizeObserver loop/i,
  /Non-Error promise rejection/i,
  /Loading chunk/i,
  /Failed to fetch/i, // Expected when not logged in
  /Failed to load resource/i, // Expected in standalone (no backend)
  /400/, // Standalone build has no backend — API calls return 400
  /401/,
  /403/,
  /404/,
  /UNAUTHORIZED/i,
  /Please login/i,
  /api\/trpc/i, // tRPC calls not available in standalone
  /net::ERR/i, // Network errors expected in standalone
  /ERR_CONNECTION_REFUSED/i,
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function isIgnoredError(msg: string): boolean {
  return IGNORED_ERROR_PATTERNS.some(p => p.test(msg));
}

interface PageResult {
  label: string;
  url: string;
  passed: boolean;
  errors: string[];
  durationMs: number;
}

async function testPage(
  browser: Browser,
  path: string,
  label: string
): Promise<PageResult> {
  const url = `${BASE_URL}${path}`;
  const errors: string[] = [];
  const start = Date.now();

  const page: Page = await browser.newPage();

  // Collect console errors
  page.on("console", msg => {
    if (msg.type() === "error") {
      const text = msg.text();
      if (!isIgnoredError(text)) {
        errors.push(`Console error: ${text}`);
      }
    }
  });

  // Collect uncaught exceptions
  page.on("pageerror", err => {
    if (!isIgnoredError(err.message)) {
      errors.push(`Uncaught exception: ${err.message}`);
    }
  });

  try {
    const response = await page.goto(url, {
      waitUntil: "networkidle",
      timeout: 30_000,
    });

    const status = response?.status() ?? 0;
    if (status >= 400) {
      errors.push(`HTTP ${status} on ${url}`);
    }

    // Check page title is not blank
    const title = await page.title();
    if (!title || title.trim() === "") {
      errors.push("Page title is blank");
    }

    // Check body is not empty
    const bodyText = await page.evaluate(() => document.body?.innerText ?? "");
    if (!bodyText || bodyText.trim().length < 10) {
      errors.push("Page body appears empty");
    }

    // Wait a moment for any deferred errors
    await page.waitForTimeout(1_000);
  } catch (err) {
    errors.push(`Navigation failed: ${(err as Error).message}`);
  } finally {
    await page.close();
  }

  return {
    label,
    url,
    passed: errors.length === 0,
    errors,
    durationMs: Date.now() - start,
  };
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🔍 Smoke testing: ${BASE_URL}\n`);

  const browser = await chromium.launch({ headless: true });
  const results: PageResult[] = [];

  for (const { path, label } of CRITICAL_PAGES) {
    process.stdout.write(`  Testing: ${label}... `);
    const result = await testPage(browser, path, label);
    results.push(result);

    if (result.passed) {
      console.log(`✅ ${result.durationMs}ms`);
    } else {
      console.log(`❌ ${result.durationMs}ms`);
      result.errors.forEach(e => console.error(`     → ${e}`));
    }
  }

  await browser.close();

  const failed = results.filter(r => !r.passed);
  const passed = results.filter(r => r.passed);

  console.log(`\n─────────────────────────────────────────`);
  console.log(`  Results: ${passed.length}/${results.length} pages passed`);

  if (failed.length > 0) {
    console.error(
      `\n❌ SMOKE TEST FAILED — ${failed.length} page(s) have errors:`
    );
    failed.forEach(r => {
      console.error(`\n  ${r.label} (${r.url})`);
      r.errors.forEach(e => console.error(`    → ${e}`));
    });
    process.exit(1);
  } else {
    console.log(`\n✅ All smoke tests passed — safe to publish!\n`);
    process.exit(0);
  }
}

main().catch(err => {
  console.error("Smoke test runner crashed:", err);
  process.exit(1);
});
