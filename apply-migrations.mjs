import { createConnection } from "mysql2/promise";
import { readFileSync, readdirSync } from "fs";
import { createHash } from "crypto";
import "dotenv/config";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL not set");

const conn = await createConnection(url);

// Get already-applied migration hashes
const [applied] = await conn.execute("SELECT hash FROM __drizzle_migrations");
const appliedHashes = new Set(applied.map(r => r.hash));

// Get all SQL migration files sorted
const files = readdirSync("./drizzle")
  .filter(f => f.endsWith(".sql"))
  .sort();

for (const file of files) {
  const content = readFileSync(`./drizzle/${file}`, "utf8").trim();
  const hash = createHash("sha256").update(content).digest("hex");
  
  if (appliedHashes.has(hash)) {
    console.log(`⏭️  Already applied: ${file}`);
    continue;
  }
  
  console.log(`📦 Applying: ${file}`);
  
  // Drizzle uses "--> statement-breakpoint" as a separator
  // Split on that marker, then also split on semicolons within each block
  const blocks = content
    .split(/--> statement-breakpoint/g)
    .map(b => b.trim())
    .filter(Boolean);
  
  for (const block of blocks) {
    // Each block may have multiple statements separated by semicolons
    const statements = block.split(";").map(s => s.trim()).filter(Boolean);
    for (const stmt of statements) {
      try {
        await conn.execute(stmt);
        console.log(`  ✅ ${stmt.substring(0, 80).replace(/\s+/g, ' ')}...`);
      } catch (err) {
        if (
          err.code === "ER_DUP_FIELDNAME" ||
          err.code === "ER_TABLE_EXISTS_ERROR" ||
          err.errno === 1060 || // duplicate column
          err.errno === 1050    // table already exists
        ) {
          console.log(`  ℹ️  Already exists, skipping`);
        } else {
          console.error(`  ❌ Failed (${err.code}): ${err.message.substring(0, 120)}`);
        }
      }
    }
  }
  
  // Record this migration as applied
  const now = Date.now();
  await conn.execute(
    "INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)",
    [hash, now]
  );
  console.log(`  ✅ Recorded: ${file}`);
}

await conn.end();
console.log("\n✅ All migrations processed");
