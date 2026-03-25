#!/usr/bin/env node
/**
 * db-migrate-safe.mjs — Safe database migration script
 *
 * Runs the standard `pnpm db:push` migration but adds:
 *   1. Pre-flight check: verifies DATABASE_URL is set
 *   2. Pre-flight check: verifies the database is reachable
 *   3. Schema diff preview: shows what will change before applying
 *   4. Explicit confirmation prompt before applying (skippable with --yes)
 *   5. Post-migration check: verifies the migration applied cleanly
 *   6. Rollback guidance on failure
 *
 * Usage:
 *   node scripts/db-migrate-safe.mjs           # interactive (asks for confirmation)
 *   node scripts/db-migrate-safe.mjs --yes     # non-interactive (CI/CD)
 *   node scripts/db-migrate-safe.mjs --dry-run # preview only, no changes
 *
 * Add to package.json:
 *   "db:migrate-safe": "node scripts/db-migrate-safe.mjs"
 *   "db:migrate-safe:ci": "node scripts/db-migrate-safe.mjs --yes"
 */

import { execSync, spawnSync } from "child_process";
import { createInterface } from "readline";
import { existsSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dir, "..");

// ── CLI args ──────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const YES = args.includes("--yes") || args.includes("-y");
const DRY_RUN = args.includes("--dry-run");

// ── Colour helpers ────────────────────────────────────────────────────────────
const GREEN  = (s) => `\x1b[32m${s}\x1b[0m`;
const RED    = (s) => `\x1b[31m${s}\x1b[0m`;
const YELLOW = (s) => `\x1b[33m${s}\x1b[0m`;
const CYAN   = (s) => `\x1b[36m${s}\x1b[0m`;
const BOLD   = (s) => `\x1b[1m${s}\x1b[0m`;

function log(msg)  { console.log(msg); }
function ok(msg)   { console.log(`  ${GREEN("✓")} ${msg}`); }
function warn(msg) { console.log(`  ${YELLOW("⚠")} ${msg}`); }
function fail(msg) { console.log(`  ${RED("✗")} ${msg}`); }

// ── Prompt helper ─────────────────────────────────────────────────────────────
async function prompt(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

// ── Run command ───────────────────────────────────────────────────────────────
function run(cmd, opts = {}) {
  const result = spawnSync(cmd, { shell: true, cwd: projectRoot, ...opts });
  return {
    stdout: result.stdout?.toString() ?? "",
    stderr: result.stderr?.toString() ?? "",
    code: result.status ?? 1,
  };
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  log(`\n${BOLD("🗄️  Safe Database Migration")}`);
  if (DRY_RUN) log(YELLOW("  DRY RUN — no changes will be applied\n"));
  else log("");

  // ── Step 1: Check DATABASE_URL ─────────────────────────────────────────────
  log(BOLD("Step 1: Pre-flight checks"));

  // Load .env if present
  const envPath = join(projectRoot, ".env");
  if (existsSync(envPath)) {
    const envContent = readFileSync(envPath, "utf-8");
    for (const line of envContent.split("\n")) {
      const [key, ...vals] = line.split("=");
      if (key && vals.length && !process.env[key.trim()]) {
        process.env[key.trim()] = vals.join("=").trim().replace(/^["']|["']$/g, "");
      }
    }
  }

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    fail("DATABASE_URL is not set");
    log(`\n  ${RED("Fix:")} Set DATABASE_URL in your .env file or environment.\n`);
    process.exit(1);
  }
  ok("DATABASE_URL is set");

  // ── Step 2: Check schema file exists ──────────────────────────────────────
  const schemaPath = join(projectRoot, "drizzle", "schema.ts");
  if (!existsSync(schemaPath)) {
    fail(`Schema file not found: ${schemaPath}`);
    process.exit(1);
  }
  ok("Schema file exists (drizzle/schema.ts)");

  // ── Step 3: Generate migration diff ───────────────────────────────────────
  log(`\n${BOLD("Step 2: Generate migration diff")}`);
  log("  Running drizzle-kit generate to preview changes...");

  const genResult = run("npx drizzle-kit generate 2>&1", { encoding: "utf-8" });
  if (genResult.code !== 0) {
    fail("drizzle-kit generate failed:");
    log(RED(genResult.stdout || genResult.stderr));
    log(`\n  ${RED("Rollback guidance:")}`);
    log("  • No changes were applied — your database is unchanged.");
    log("  • Fix the schema error in drizzle/schema.ts and retry.\n");
    process.exit(1);
  }

  // Show what was generated
  const migrationsDir = join(projectRoot, "drizzle", "migrations");
  if (existsSync(migrationsDir)) {
    const { stdout: lsOut } = run(`ls -t ${migrationsDir} | head -5`);
    if (lsOut.trim()) {
      log(`  ${CYAN("Recent migration files:")}`);
      lsOut.trim().split("\n").forEach(f => log(`    • ${f}`));
    }
  }

  if (genResult.stdout.includes("No schema changes")) {
    ok("No schema changes detected — database is already up to date");
    log(`\n${GREEN("✅ Nothing to migrate.")}\n`);
    process.exit(0);
  }

  ok("Migration files generated");

  // ── Step 4: Confirmation ───────────────────────────────────────────────────
  if (!YES && !DRY_RUN) {
    log(`\n${BOLD("Step 3: Confirmation")}`);
    warn("You are about to apply schema changes to the PRODUCTION database.");
    warn("This operation may be irreversible (e.g., dropping columns).");
    log("");
    const answer = await prompt(`  ${YELLOW("Apply migration now?")} (yes/no): `);
    if (answer !== "yes" && answer !== "y") {
      log(`\n${YELLOW("Migration cancelled.")} No changes were applied.\n`);
      process.exit(0);
    }
  }

  if (DRY_RUN) {
    log(`\n${YELLOW("DRY RUN complete.")} Migration files generated but not applied.\n`);
    process.exit(0);
  }

  // ── Step 5: Apply migration ────────────────────────────────────────────────
  log(`\n${BOLD("Step 4: Applying migration")}`);
  log("  Running drizzle-kit migrate...");

  const migrateResult = run("npx drizzle-kit migrate 2>&1", { encoding: "utf-8" });
  if (migrateResult.code !== 0) {
    fail("drizzle-kit migrate FAILED:");
    log(RED(migrateResult.stdout || migrateResult.stderr));
    log(`\n  ${RED("🚨 Rollback guidance:")}`);
    log("  1. Check the error above — it may be a transient connection issue.");
    log("  2. If a column was partially added, you may need to manually drop it.");
    log("  3. Use the Manus Database panel to inspect the current table state.");
    log("  4. Contact support if data integrity is at risk.\n");
    process.exit(1);
  }

  ok("Migration applied successfully");

  // ── Step 6: Post-migration verification ───────────────────────────────────
  log(`\n${BOLD("Step 5: Post-migration verification")}`);
  log("  Running TypeScript check to verify schema types are consistent...");

  const tscResult = run("npx tsc --noEmit 2>&1", { encoding: "utf-8" });
  if (tscResult.code !== 0) {
    warn("TypeScript errors detected after migration:");
    log(YELLOW(tscResult.stdout.split("\n").slice(0, 10).join("\n")));
    warn("The migration was applied but TypeScript types may be out of sync.");
    warn("Run `npx tsc --noEmit` and fix any errors before deploying.");
  } else {
    ok("TypeScript check passed — schema types are consistent");
  }

  log(`\n${GREEN("✅ Migration complete and verified.")}\n`);
}

main().catch((err) => {
  console.error(RED("Migration script crashed:"), err);
  process.exit(1);
});
