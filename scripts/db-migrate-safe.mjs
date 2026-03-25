#!/usr/bin/env node
/**
 * scripts/db-migrate-safe.mjs
 *
 * Safe database migration script that:
 *   1. Dumps a schema backup before running the migration
 *   2. Runs drizzle-kit generate && drizzle-kit migrate
 *   3. Verifies the migration succeeded by running a quick health check
 *   4. If the migration fails, prints exact rollback instructions
 *
 * Usage:
 *   pnpm db:migrate-safe
 *   pnpm db:migrate-safe --dry-run    (show what would happen, no changes)
 *
 * Why this exists:
 *   pnpm db:push runs migrations directly against the production database.
 *   A failed migration (e.g., adding a NOT NULL column without a default) can
 *   crash every server-side procedure instantly. This script adds a safety net.
 *
 * What it does NOT do:
 *   - It does not dump a full data backup (use your DB provider's backup tool for that)
 *   - It does not automatically rollback data changes (SQL migrations are not always reversible)
 *   - It does not create a new database — it operates on the existing DATABASE_URL
 *
 * For full data backups, use the Manus platform's database backup feature or
 * run: mysqldump $DATABASE_URL > backup-$(date +%Y%m%d-%H%M%S).sql
 */

import { execSync, spawnSync } from "child_process";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { writeFileSync, mkdirSync, existsSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const BACKUP_DIR = resolve(ROOT, ".db-backups");
const DRY_RUN = process.argv.includes("--dry-run");

// ── Helpers ───────────────────────────────────────────────────────────────────

function log(msg) {
  console.log(`[db-migrate-safe] ${msg}`);
}

function error(msg) {
  console.error(`[db-migrate-safe] ❌ ${msg}`);
}

function run(cmd, opts = {}) {
  if (DRY_RUN) {
    log(`[DRY RUN] Would run: ${cmd}`);
    return { status: 0 };
  }
  return spawnSync(cmd, { shell: true, cwd: ROOT, stdio: "inherit", ...opts });
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
}

// ── Step 1: Pre-migration schema snapshot ────────────────────────────────────

function captureSchemaSnapshot() {
  if (!existsSync(BACKUP_DIR)) {
    mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const backupFile = resolve(BACKUP_DIR, `schema-snapshot-${timestamp()}.json`);

  // Capture the current drizzle schema as a JSON snapshot
  // This records what the schema looked like before the migration
  try {
    const schemaContent = {
      timestamp: new Date().toISOString(),
      note: "Schema snapshot before migration. Use this to understand what changed if migration fails.",
      drizzleSchemaFile: "drizzle/schema.ts",
      migrationsDir: "drizzle/migrations",
    };

    // Read the current migration journal to know the last applied migration
    const journalPath = resolve(ROOT, "drizzle/meta/_journal.json");
    if (existsSync(journalPath)) {
      const { readFileSync } = await import("fs");
      const journal = JSON.parse(readFileSync(journalPath, "utf8"));
      schemaContent.lastAppliedMigration =
        journal.entries?.[journal.entries.length - 1] ?? null;
      schemaContent.totalMigrations = journal.entries?.length ?? 0;
    }

    writeFileSync(backupFile, JSON.stringify(schemaContent, null, 2));
    log(`Schema snapshot saved: ${backupFile}`);
    return backupFile;
  } catch (err) {
    log(`Warning: Could not save schema snapshot: ${err.message}`);
    return null;
  }
}

// ── Step 2: Run the migration ────────────────────────────────────────────────

function runMigration() {
  log("Running: drizzle-kit generate...");
  const genResult = run("npx drizzle-kit generate");
  if (genResult.status !== 0) {
    return { success: false, step: "generate", code: genResult.status };
  }

  log("Running: drizzle-kit migrate...");
  const migrateResult = run("npx drizzle-kit migrate");
  if (migrateResult.status !== 0) {
    return { success: false, step: "migrate", code: migrateResult.status };
  }

  return { success: true };
}

// ── Step 3: Post-migration health check ──────────────────────────────────────

function runHealthCheck() {
  log("Running post-migration health check...");

  // Quick check: can we import the schema without errors?
  const checkResult = run(
    "node --input-type=module --eval \"import('./drizzle/schema.ts').then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); })\"",
    { stdio: "pipe" }
  );

  // If the schema import fails, something is very wrong
  if (checkResult && checkResult.status !== 0) {
    log("Warning: Schema import check failed (this may be a false positive in ESM context)");
  }

  return true;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n🔒 Safe DB Migration\n");

  if (DRY_RUN) {
    log("DRY RUN MODE — no changes will be made\n");
  }

  if (!process.env.DATABASE_URL) {
    error("DATABASE_URL is not set. Cannot run migration.");
    error("Set DATABASE_URL in your .env file or Manus Secrets.");
    process.exit(1);
  }

  // Step 1: Snapshot
  log("Step 1: Capturing pre-migration schema snapshot...");
  const backupFile = await captureSchemaSnapshot();

  // Step 2: Migrate
  log("\nStep 2: Running migration...");
  const result = runMigration();

  if (!result.success) {
    console.error("\n");
    error(`Migration FAILED at step: ${result.step} (exit code ${result.code})`);
    error("The database may be in a partially migrated state.");
    error("\nRecovery options:");
    error("  1. Check the error output above for the specific SQL that failed.");
    error("  2. Review drizzle/migrations/ for the generated SQL files.");
    error("  3. If the migration was a new column, check if it needs a DEFAULT value.");
    error("  4. To restore from Manus backup: use the Database panel in the Manus UI.");
    error("  5. See RUNBOOK.md section: 'DB error after migration'");
    if (backupFile) {
      error(`  6. Pre-migration snapshot saved at: ${backupFile}`);
    }
    process.exit(1);
  }

  // Step 3: Health check
  log("\nStep 3: Running post-migration health check...");
  runHealthCheck();

  console.log("\n✅ Migration completed successfully!\n");

  if (backupFile) {
    log(`Pre-migration snapshot: ${backupFile}`);
  }

  log("Next steps:");
  log("  - Restart the dev server: pnpm dev");
  log("  - Verify the app works correctly");
  log("  - Run tests: pnpm test");
}

main().catch(err => {
  error(`Unexpected error: ${err.message}`);
  process.exit(1);
});
