import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function run() {
  const sql = `
    ALTER TABLE public.leave_requests 
    RENAME COLUMN is_urgent TO is_quota_exceeded;
  `;

  console.log('Trying rpc("run_sql")...');
  try {
    const { data, error } = await supabase.rpc('run_sql', { sql });
    console.log('Result run_sql:', { data, error });
  } catch (err: any) {
    console.error('Error run_sql:', err.message);
  }

  console.log('Trying rpc("exec_sql")...');
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    console.log('Result exec_sql:', { data, error });
  } catch (err: any) {
    console.error('Error exec_sql:', err.message);
  }
}

run();
