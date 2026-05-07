import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing env vars');
  process.exit(1);
}

async function checkSpec() {
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`
      }
    });
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const data: any = await res.json();
    console.log('PostgREST OpenAPI spec tables:', Object.keys(data.definitions || {}));
    console.log('PostgREST OpenAPI spec paths:', Object.keys(data.paths || {}));
  } catch (err: any) {
    console.error('Error fetching spec:', err.message);
  }
}

checkSpec();
