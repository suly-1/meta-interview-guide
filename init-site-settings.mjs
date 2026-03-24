import { createConnection } from 'mysql2/promise';
import { config } from 'dotenv';
config();

const conn = await createConnection(process.env.DATABASE_URL);

// Check the table structure
const [cols] = await conn.execute('DESCRIBE site_settings');
console.log('site_settings columns:', JSON.stringify(cols.map(c => c.Field), null, 2));

// Check existing rows
const [rows] = await conn.execute('SELECT * FROM site_settings LIMIT 10');
console.log('existing rows:', JSON.stringify(rows, null, 2));

await conn.end();
