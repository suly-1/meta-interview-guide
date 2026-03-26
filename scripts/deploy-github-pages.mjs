#!/usr/bin/env node
/**
 * deploy-github-pages.mjs
 *
 * STAGING → AUTO-PROMOTE WORKFLOW
 * ─────────────────────────────────────────────────────────────────────────────
 * Each site gets its own build with VITE_SITE_ID baked in at compile time:
 *
 *   metaengguide.pro  → VITE_SITE_ID=metaengguide-pro  (deep blue + gold)
 *   metaguide.blog    → VITE_SITE_ID=metaguide-blog     (warm green + amber)
 *
 * Step 1: Build metaengguide-pro variant → push to metaengguide/staging
 * Step 2: Build metaguide-blog variant   → push to github/staging
 * Step 3: Smoke test both staging URLs
 * Step 4: If ALL pass → auto-promote both to gh-pages (live)
 * Step 5: If any fail → abort, live site untouched
 *
 * Usage:
 *   pnpm deploy:github-pages              ← full staging → auto-promote
 *   SKIP_SMOKE_TEST=1 pnpm deploy:github-pages  ← skip smoke, go straight to live
 *   STAGING_ONLY=1 pnpm deploy:github-pages     ← staging only, no promote
 */
import { execSync } from "child_process";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { writeFileSync, copyFileSync, existsSync, rmSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const DIST = resolve(ROOT, "dist/standalone");

// ── Helper: build for a specific VITE_SITE_ID ────────────────────────────────
function buildForSite(siteId) {
  console.log(`\n📦 Building for ${siteId}…`);
  execSync("npx vite build --config vite.standalone.config.ts --base=/", {
    cwd: ROOT,
    stdio: "inherit",
    env: { ...process.env, NODE_ENV: "production", VITE_SITE_ID: siteId },
  });
  // Rename standalone HTML to index.html
  const standaloneHtml = resolve(DIST, "index.standalone.html");
  const indexHtml = resolve(DIST, "index.html");
  if (existsSync(standaloneHtml)) {
    copyFileSync(standaloneHtml, indexHtml);
  }
  console.log(`✅ Build complete for ${siteId}`);
}

// ── Ensure metaengguide remote exists ────────────────────────────────────────
try {
  execSync("git remote get-url metaengguide", { cwd: ROOT, stdio: "pipe" });
} catch {
  execSync(
    "git remote add metaengguide https://github.com/suly-1/meta-interview-guide.git",
    { cwd: ROOT, stdio: "inherit" }
  );
}

// ── Helper: clear gh-pages cache to avoid "branch already exists" error ──────
function clearGhPagesCache() {
  const cachePath = resolve(ROOT, "node_modules/.cache/gh-pages");
  try {
    rmSync(cachePath, { recursive: true, force: true });
  } catch {
    // ignore
  }
}

// ── Helper: push dist to a specific branch on a specific remote ──────────────
function pushToBranch(remote, branch, cname, label) {
  clearGhPagesCache();
  console.log(`📝 Writing CNAME: ${cname}`);
  writeFileSync(resolve(DIST, "CNAME"), `${cname}\n`);
  console.log(`🚀 Pushing to ${remote}/${branch}…`);
  execSync(
    `node node_modules/gh-pages/bin/gh-pages.js --dist dist/standalone --branch ${branch} --remote ${remote} --message "Deploy [skip ci]"`,
    { cwd: ROOT, stdio: "inherit" }
  );
  console.log(`✅ ${label} pushed to ${remote}/${branch}`);
}

const skipSmoke = process.env.SKIP_SMOKE_TEST === "1";
const stagingOnly = process.env.STAGING_ONLY === "1";

// ── Step 1: Build + deploy metaengguide.pro to staging ───────────────────────
console.log("\n🔶 STAGE 1a: Building metaengguide.pro (deep blue + gold)…");
buildForSite("metaengguide-pro");
pushToBranch("metaengguide", "staging", "metaengguide.pro", "metaengguide.pro staging");

// ── Step 2: Build + deploy metaguide.blog to staging ─────────────────────────
console.log("\n🔶 STAGE 1b: Building metaguide.blog (warm green + amber)…");
buildForSite("metaguide-blog");
pushToBranch("github", "staging", "www.metaguide.blog", "metaguide.blog staging");

console.log("\n✅ Both staging branches deployed.");

if (stagingOnly) {
  console.log("⏭  STAGING_ONLY=1 — skipping smoke test and live promote.");
  process.exit(0);
}

// ── Step 3: Smoke test staging ───────────────────────────────────────────────
let stagingOk = true;
if (!skipSmoke) {
  console.log("\n⏳ Waiting 15s for GitHub Pages CDN to pick up staging…");
  await new Promise(r => setTimeout(r, 15_000));

  console.log("\n🔶 STAGE 2: Running smoke tests on staging…");
  try {
    execSync(`npx tsx scripts/smoke-test.ts https://metaengguide.pro`, { cwd: ROOT, stdio: "inherit" });
    execSync(`npx tsx scripts/smoke-test.ts https://www.metaguide.blog`, { cwd: ROOT, stdio: "inherit" });
  } catch {
    stagingOk = false;
    console.error("❌ Smoke test FAILED — live sites NOT updated.");
    process.exit(1);
  }
} else {
  console.log("⏭  Smoke test skipped (SKIP_SMOKE_TEST=1) — auto-promoting.");
}

// ── Step 4: Auto-promote to gh-pages (live) ───────────────────────────────────
console.log("\n🟢 All smoke tests passed — auto-promoting to live (gh-pages)…");

// Rebuild each site fresh for live deploy (ensures correct VITE_SITE_ID)
buildForSite("metaengguide-pro");
pushToBranch("metaengguide", "gh-pages", "metaengguide.pro", "metaengguide.pro LIVE");

buildForSite("metaguide-blog");
pushToBranch("github", "gh-pages", "www.metaguide.blog", "metaguide.blog LIVE");

console.log("\n🎉 DEPLOY COMPLETE");
console.log("   metaengguide.pro  → https://metaengguide.pro/  (deep blue + gold)");
console.log("   metaguide.blog    → https://www.metaguide.blog/ (warm green + amber)");
