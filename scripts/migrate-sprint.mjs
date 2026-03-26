import mysql2 from 'mysql2/promise';

const rawUrl = process.env.DATABASE_URL;
const url = rawUrl.split('?')[0]; // strip ssl query params
const m = url.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
const [, user, pwd, host, port, db] = m;

const conn = await mysql2.createConnection({
  host, port: +port, user, password: pwd, database: db,
  ssl: { rejectUnauthorized: false }
});

const stmts = [
  "ALTER TABLE sprint_plans MODIFY COLUMN targetLevel varchar(8) NOT NULL DEFAULT 'IC6'",
  "ALTER TABLE sprint_plans ADD COLUMN IF NOT EXISTS planId varchar(64)",
  "ALTER TABLE sprint_plans ADD COLUMN IF NOT EXISTS timeline varchar(32)",
  "ALTER TABLE sprint_plans ADD COLUMN IF NOT EXISTS planData json",
  "ALTER TABLE sprint_plans ADD COLUMN IF NOT EXISTS shareToken varchar(64)",
  "CREATE TABLE IF NOT EXISTS user_scores (id int AUTO_INCREMENT NOT NULL, userId int NOT NULL, patternRatings json NOT NULL, behavioralRatings json NOT NULL, starNotes json NOT NULL, patternTime json NOT NULL, interviewDate varchar(16), targetLevel varchar(8), updatedAt timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP, CONSTRAINT user_scores_id PRIMARY KEY(id), CONSTRAINT user_scores_userId_unique UNIQUE(userId))",
];

for (const s of stmts) {
  try {
    await conn.execute(s);
    console.log('OK:', s.slice(0, 70));
  } catch (e) {
    console.log('ERR:', e.message.slice(0, 100));
  }
}

// Mark migration 0014 as applied
try {
  const { readFileSync } = await import('fs');
  const journal = JSON.parse(readFileSync('drizzle/meta/_journal.json', 'utf8'));
  const last = journal.entries[journal.entries.length - 1];
  console.log('Last journal tag:', last.tag);
  const [rows] = await conn.execute('SELECT hash FROM __drizzle_migrations WHERE hash = ?', [last.tag]);
  if (rows.length === 0) {
    await conn.execute('INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)', [last.tag, Date.now()]);
    console.log('Marked migration as applied');
  } else {
    console.log('Migration already applied');
  }
} catch (e) {
  console.log('Journal mark error:', e.message);
}

await conn.end();
console.log('Done');
