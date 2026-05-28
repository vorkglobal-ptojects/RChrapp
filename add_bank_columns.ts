import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://xtmzwvoloilxjcjgbgfx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0bXp3dm9sb2lseGpjamdiZ2Z4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTUzNzQyOSwiZXhwIjoyMDkxMTEzNDI5fQ._zPZrZmnecHTJRFQz87wEpw7cq7N3k98EOC7AvXfBIY'
);

async function migrate() {
  console.log('🔄 Adding bank detail columns to profiles table...\n');

  // Run each ALTER TABLE as a separate RPC call via the REST API
  const columns = [
    { name: 'bank_name', def: 'TEXT' },
    { name: 'bank_branch', def: 'TEXT' },
    { name: 'account_no', def: 'TEXT' },
    { name: 'account_holder_name', def: 'TEXT' },
    { name: 'sort_order', def: 'INTEGER DEFAULT 999' },
    { name: 'nic', def: 'TEXT' },
    { name: 'nickname', def: 'TEXT' },
  ];

  for (const col of columns) {
    const sql = `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ${col.name} ${col.def};`;
    const res = await fetch('https://xtmzwvoloilxjcjgbgfx.supabase.co/rest/v1/rpc/exec_sql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0bXp3dm9sb2lseGpjamdiZ2Z4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTUzNzQyOSwiZXhwIjoyMDkxMTEzNDI5fQ._zPZrZmnecHTJRFQz87wEpw7cq7N3k98EOC7AvXfBIY',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0bXp3dm9sb2lseGpjamdiZ2Z4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTUzNzQyOSwiZXhwIjoyMDkxMTEzNDI5fQ._zPZrZmnecHTJRFQz87wEpw7cq7N3k98EOC7AvXfBIY',
      },
      body: JSON.stringify({ query: sql }),
    });
    
    if (res.ok) {
      console.log(`  ✅ ${col.name} — added`);
    } else {
      // Try checking if column already exists by querying it
      console.log(`  ℹ️  ${col.name} — may already exist, checking...`);
    }
  }

  // Verify by reading a profile
  console.log('\n🔍 Verifying columns exist by querying profiles...');
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, bank_name, bank_branch, account_no, account_holder_name, sort_order, nic, nickname')
    .limit(3);

  if (error) {
    console.error('❌ Verification failed:', error.message);
    console.log('\n⚠️  The columns may not exist yet. Please run this SQL manually in Supabase SQL Editor:');
    console.log(`
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS bank_name TEXT,
  ADD COLUMN IF NOT EXISTS bank_branch TEXT,
  ADD COLUMN IF NOT EXISTS account_no TEXT,
  ADD COLUMN IF NOT EXISTS account_holder_name TEXT,
  ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 999,
  ADD COLUMN IF NOT EXISTS nic TEXT,
  ADD COLUMN IF NOT EXISTS nickname TEXT;
`);
  } else {
    console.log('✅ Columns verified successfully!');
    console.log(`   Found ${data?.length} profile(s)`);
    data?.forEach(p => {
      console.log(`   - ${p.name}: bank=${p.bank_name || 'not set'}, account=${p.account_no || 'not set'}`);
    });
  }
}

migrate().catch(console.error);
