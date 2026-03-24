import { createConnection } from "mysql2/promise";
import { readFileSync } from "fs";
import "dotenv/config";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL not set");

const conn = await createConnection(url);

// Apply the pending migration
const sql = readFileSync("./drizzle/0005_petite_lord_hawal.sql", "utf8").trim();
console.log("Applying:", sql);

try {
  await conn.execute(sql);
  console.log("✅ Migration applied successfully");
} catch (err) {
  if (err.code === "ER_DUP_FIELDNAME") {
    console.log("ℹ️  Column already exists, skipping");
  } else {
    console.error("❌ Migration failed:", err.message);
    process.exit(1);
  }
}

await conn.end();
