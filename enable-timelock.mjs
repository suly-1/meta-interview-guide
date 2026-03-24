import { createConnection } from 'mysql2/promise';
import { config } from 'dotenv';
config();

const conn = await createConnection(process.env.DATABASE_URL);

const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

// Enable the lock and set today as start date
await conn.execute(`UPDATE site_settings SET value = '1', updatedAt = NOW() WHERE \`key\` = 'lock_enabled'`);
await conn.execute(`UPDATE site_settings SET value = ?, updatedAt = NOW() WHERE \`key\` = 'lock_start_date'`, [today]);

// Add isLockedOverride row if it doesn't exist
await conn.execute(`
  INSERT INTO site_settings (\`key\`, value, updatedAt)
  VALUES ('is_locked_override', '0', NOW())
  ON DUPLICATE KEY UPDATE updatedAt = updatedAt
`);

// Verify
const [rows] = await conn.execute('SELECT * FROM site_settings');
console.log('Updated settings:');
rows.forEach(r => console.log(`  ${r.key} = ${r.value}`));

await conn.end();
console.log('\nTime-lock enabled! Site will lock on:', new Date(new Date(today).getTime() + 60 * 86400000).toDateString());
