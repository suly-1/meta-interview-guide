#!/usr/bin/env node
/**
 * deploy-github-pages.mjs
 *
 * Builds the Vite client app with the correct base path for GitHub Pages
 * and pushes the dist/public folder to the gh-pages branch.
 *
 * Usage:  pnpm deploy:github-pages
 */
import { execSync } from "child_process";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// ── Step 1: Build with GitHub Pages base path ──────────────────────────────
console.log("📦 Building for GitHub Pages (base: /meta-prep-guide/)…");
execSync("vite build --base=/meta-prep-guide/", {
  cwd: ROOT,
  stdio: "inherit",
  env: { ...process.env, NODE_ENV: "production" },
});

// ── Step 2: Deploy dist/public to gh-pages branch ─────────────────────────
console.log("🚀 Deploying to gh-pages branch…");
execSync(
  `node node_modules/gh-pages/bin/gh-pages.js --dist dist/public --branch gh-pages --message "Deploy to GitHub Pages [skip ci]"`,
  {
    cwd: ROOT,
    stdio: "inherit",
  }
);

console.log("✅ Deployed! Visit: https://suly-1.github.io/meta-prep-guide/");
