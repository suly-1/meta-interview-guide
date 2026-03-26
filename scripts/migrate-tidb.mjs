/**
 * Custom migration script for TiDB Cloud (handles SSL + statement-breakpoint correctly)
 * Usage: DATABASE_URL="mysql://..." node scripts/migrate-tidb.mjs
 */
import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.resolve(__dirname, "../drizzle");

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

// Parse the URL
const parsed = new URL(url);
const connectionConfig = {
  host: parsed.hostname,
  port: parseInt(parsed.port || "4000"),
  user: parsed.username,
  password: parsed.password,
  database: parsed.pathname.slice(1),
  ssl: { rejectUnauthorized: true },
};

console.log(`Connecting to ${parsed.hostname}:${parsed.port} / ${parsed.pathname.slice(1)}...`);

const conn = await mysql.createConnection(connectionConfig);

// Create migrations tracking table
await conn.execute(`
  CREATE TABLE IF NOT EXISTS __drizzle_migrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    hash VARCHAR(255) NOT NULL,
    created_at BIGINT
  )
`);

// Get applied migrations
const [applied] = await conn.execute("SELECT hash FROM __drizzle_migrations");
const appliedHashes = new Set(applied.map((r) => r.hash));

// Read journal
const journal = JSON.parse(
  fs.readFileSync(path.join(migrationsDir, "meta/_journal.json"), "utf8")
);

let count = 0;
let errors = 0;
for (const entry of journal.entries) {
  const sqlFile = path.join(migrationsDir, `${entry.tag}.sql`);
  if (!fs.existsSync(sqlFile)) {
    console.log(`  Skipping ${entry.tag} (no SQL file)`);
    continue;
  }
  const hash = entry.tag;
  if (appliedHashes.has(hash)) {
    console.log(`  Already applied: ${entry.tag}`);
    continue;
  }
  
  const rawSql = fs.readFileSync(sqlFile, "utf8");
  // Split on drizzle statement-breakpoint comments
  const statements = rawSql
    .split("--> statement-breakpoint")
    .map(s => s.trim())
    .filter(s => s.length > 0);
  
  console.log(`  Applying: ${entry.tag} (${statements.length} statements)`);
  let migrationOk = true;
  for (const stmt of statements) {
    try {
      await conn.execute(stmt);
    } catch (err) {
      // Ignore "already exists" errors for idempotency
      if (err.code === 'ER_TABLE_EXISTS_ERROR' || err.code === 'ER_DUP_FIELDNAME' || err.code === 'ER_DUP_KEYNAME') {
        console.log(`    Skipped (already exists): ${err.message.substring(0, 80)}`);
      } else {
        console.error(`    Error: ${err.message.substring(0, 120)}`);
        migrationOk = false;
      }
    }
  }
  
  if (migrationOk) {
    await conn.execute(
      "INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)",
      [hash, Date.now()]
    );
    count++;
  } else {
    errors++;
    // Still mark as applied to avoid re-running partial migrations
    await conn.execute(
      "INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)",
      [hash, Date.now()]
    );
  }
}

await conn.end();
console.log(`\nDone! Applied ${count} migration(s), ${errors} with partial errors.`);
