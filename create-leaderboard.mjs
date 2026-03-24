import { createConnection } from "mysql2/promise";
import "dotenv/config";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL not set");

const conn = await createConnection(url);

// TiDB doesn't support DEFAULT ('[]') for JSON — use a workaround
const sql = `CREATE TABLE IF NOT EXISTS \`leaderboard_entries\` (
  \`id\` int AUTO_INCREMENT NOT NULL,
  \`userId\` int,
  \`anonHandle\` varchar(32) NOT NULL,
  \`streakDays\` int NOT NULL DEFAULT 0,
  \`patternsMastered\` int NOT NULL DEFAULT 0,
  \`mockSessions\` int NOT NULL DEFAULT 0,
  \`overallPct\` int NOT NULL DEFAULT 0,
  \`badges\` json NOT NULL,
  \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT \`leaderboard_entries_id\` PRIMARY KEY(\`id\`)
)`;

try {
  await conn.execute(sql);
  console.log("✅ leaderboard_entries created");
} catch (err) {
  if (err.errno === 1050) {
    console.log("ℹ️  leaderboard_entries — already exists");
  } else {
    console.error(`❌ ${err.message}`);
  }
}

await conn.end();
