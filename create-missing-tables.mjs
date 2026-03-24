import { createConnection } from "mysql2/promise";
import "dotenv/config";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL not set");

const conn = await createConnection(url);

const tables = [
  {
    name: "collab_rooms",
    sql: `CREATE TABLE IF NOT EXISTS \`collab_rooms\` (
      \`id\` int AUTO_INCREMENT NOT NULL,
      \`roomCode\` varchar(16) NOT NULL,
      \`questionId\` varchar(64),
      \`questionTitle\` text,
      \`mode\` enum('human','ai') NOT NULL DEFAULT 'human',
      \`status\` enum('waiting','active','ended') NOT NULL DEFAULT 'waiting',
      \`createdAt\` timestamp NOT NULL DEFAULT (now()),
      \`endedAt\` timestamp,
      CONSTRAINT \`collab_rooms_id\` PRIMARY KEY(\`id\`),
      CONSTRAINT \`collab_rooms_roomCode_unique\` UNIQUE(\`roomCode\`)
    )`
  },
  {
    name: "session_events",
    sql: `CREATE TABLE IF NOT EXISTS \`session_events\` (
      \`id\` int AUTO_INCREMENT NOT NULL,
      \`roomCode\` varchar(16) NOT NULL,
      \`eventType\` varchar(32) NOT NULL,
      \`payload\` json NOT NULL,
      \`actorName\` varchar(128),
      \`ts\` bigint NOT NULL,
      \`createdAt\` timestamp NOT NULL DEFAULT (now()),
      CONSTRAINT \`session_events_id\` PRIMARY KEY(\`id\`)
    )`
  },
  {
    name: "scorecards",
    sql: `CREATE TABLE IF NOT EXISTS \`scorecards\` (
      \`id\` int AUTO_INCREMENT NOT NULL,
      \`roomCode\` varchar(16) NOT NULL,
      \`scorerName\` varchar(128),
      \`candidateName\` varchar(128),
      \`requirementsScore\` int NOT NULL DEFAULT 3,
      \`architectureScore\` int NOT NULL DEFAULT 3,
      \`scalabilityScore\` int NOT NULL DEFAULT 3,
      \`communicationScore\` int NOT NULL DEFAULT 3,
      \`overallFeedback\` text,
      \`aiCoachingNote\` text,
      \`createdAt\` timestamp NOT NULL DEFAULT (now()),
      CONSTRAINT \`scorecards_id\` PRIMARY KEY(\`id\`)
    )`
  },
  {
    name: "leaderboard_entries",
    sql: `CREATE TABLE IF NOT EXISTS \`leaderboard_entries\` (
      \`id\` int AUTO_INCREMENT NOT NULL,
      \`userId\` int,
      \`anonHandle\` varchar(32) NOT NULL,
      \`streakDays\` int NOT NULL DEFAULT 0,
      \`patternsMastered\` int NOT NULL DEFAULT 0,
      \`mockSessions\` int NOT NULL DEFAULT 0,
      \`overallPct\` int NOT NULL DEFAULT 0,
      \`badges\` json NOT NULL DEFAULT ('[]'),
      \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT \`leaderboard_entries_id\` PRIMARY KEY(\`id\`)
    )`
  },
  {
    name: "mock_sessions",
    sql: `CREATE TABLE IF NOT EXISTS \`mock_sessions\` (
      \`id\` int AUTO_INCREMENT NOT NULL,
      \`userId\` int NOT NULL,
      \`sessionType\` varchar(32) NOT NULL,
      \`sessionId\` varchar(64) NOT NULL,
      \`sessionData\` json NOT NULL,
      \`createdAt\` timestamp NOT NULL DEFAULT (now()),
      CONSTRAINT \`mock_sessions_id\` PRIMARY KEY(\`id\`)
    )`
  },
  {
    name: "onboarding_progress",
    sql: `CREATE TABLE IF NOT EXISTS \`onboarding_progress\` (
      \`id\` int AUTO_INCREMENT NOT NULL,
      \`userId\` int NOT NULL,
      \`progress\` json NOT NULL,
      \`dismissed\` int NOT NULL DEFAULT 0,
      \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT \`onboarding_progress_id\` PRIMARY KEY(\`id\`),
      CONSTRAINT \`onboarding_progress_userId_unique\` UNIQUE(\`userId\`)
    )`
  },
  {
    name: "user_ratings",
    sql: `CREATE TABLE IF NOT EXISTS \`user_ratings\` (
      \`id\` int AUTO_INCREMENT NOT NULL,
      \`userId\` int NOT NULL,
      \`ratingType\` varchar(32) NOT NULL,
      \`ratings\` json NOT NULL,
      \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT \`user_ratings_id\` PRIMARY KEY(\`id\`)
    )`
  },
  {
    name: "site_feedback_status_updated_at",
    sql: `ALTER TABLE \`site_feedback\` ADD COLUMN IF NOT EXISTS \`status_updated_at\` bigint`
  }
];

for (const { name, sql } of tables) {
  try {
    await conn.execute(sql);
    console.log(`✅ ${name}`);
  } catch (err) {
    if (err.errno === 1060 || err.errno === 1050) {
      console.log(`ℹ️  ${name} — already exists`);
    } else {
      console.error(`❌ ${name}: ${err.message}`);
    }
  }
}

// Also add disclaimerAcknowledgedAt to users if not exists
try {
  await conn.execute("ALTER TABLE `users` ADD COLUMN `disclaimerAcknowledgedAt` timestamp");
  console.log("✅ users.disclaimerAcknowledgedAt added");
} catch (err) {
  if (err.errno === 1060) {
    console.log("ℹ️  users.disclaimerAcknowledgedAt — already exists");
  } else {
    console.error(`❌ users.disclaimerAcknowledgedAt: ${err.message}`);
  }
}

await conn.end();
console.log("\n✅ Done");
