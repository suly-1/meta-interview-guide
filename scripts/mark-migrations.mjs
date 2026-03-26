import mysql2 from 'mysql2/promise';
import { readFileSync } from 'fs';

const rawUrl = process.env.DATABASE_URL;
const url = rawUrl.split('?')[0];
const m = url.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
const [, user, pwd, host, port, db] = m;

const conn = await mysql2.createConnection({
  host, port: +port, user, password: pwd, database: db,
  ssl: { rejectUnauthorized: false }
});

const journal = JSON.parse(readFileSync('drizzle/meta/_journal.json', 'utf8'));
const tags = journal.entries.map(e => e.tag);

for (let i = 0; i < tags.length; i++) {
  const tag = tags[i];
  const ts = 1000000000000 + i * 1000;
  try {
    await conn.execute(
      'INSERT IGNORE INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)',
      [tag, ts]
    );
    console.log('Marked:', tag);
  } catch (e) {
    console.log('Skip (exists):', tag, e.message.slice(0, 60));
  }
}

await conn.end();
console.log('Done — all migrations marked as applied');
