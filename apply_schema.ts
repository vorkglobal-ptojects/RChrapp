import { Client } from 'pg';
import fs from 'fs';
import path from 'path';

const rawUrl = process.env.POSTGRES_URL_NON_POOLING || "postgres://postgres.ylnxvrcbvhpjtgozopdb:Cezu5hkCcuHJu4WT@aws-0-us-east-1.pooler.supabase.com:5432/postgres";
// Strip any ?sslmode=... from rawUrl
const cleanUrl = rawUrl.split('?')[0];

async function apply() {
  console.log('Connecting to PostgreSQL database...');
  const client = new Client({
    connectionString: cleanUrl,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✅ Connected successfully!');

    const schemaPath = path.join(process.cwd(), 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');

    console.log('Applying schema.sql...');
    await client.query(sql);
    console.log('✅ schema.sql executed successfully!');

    // Check tables
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    console.log('Public tables in database:', res.rows.map(r => r.table_name));

  } catch (err: any) {
    console.error('❌ Failed:', err.message);
  } finally {
    await client.end();
  }
}

apply();
