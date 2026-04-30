
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function cleanup() {
  console.log('🚀 Starting Cleanup & Fix...');

  // 1. Delete Tharushi users from Auth (to clear the 406 block)
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) throw listError;

  const tharushis = users.filter(u => 
    u.email?.toLowerCase().includes('tharushi') || 
    u.user_metadata?.name?.toLowerCase().includes('tharushi')
  );

  console.log(`Found ${tharushis.length} Tharushi accounts in Auth.`);

  for (const t of tharushis) {
    console.log(`Deleting Auth user: ${t.email} (${t.id})...`);
    await supabase.auth.admin.deleteUser(t.id);
  }

  // 2. Delete Tharushi profiles
  const { error: profDelError } = await supabase
    .from('profiles')
    .delete()
    .ilike('name', '%tharushi%');
  
  if (profDelError) console.error('Error deleting profiles:', profDelError);
  else console.log('Tharushi profiles cleared.');

  // 3. Fix Nishanthi salary to 33,200
  const { error: nishError } = await supabase
    .from('profiles')
    .update({ salary_a: 33200, net: 33200 - 2400 }) // Simple net calc for now
    .ilike('name', '%nishanthi%');

  if (nishError) console.error('Error updating Nishanthi:', nishError);
  else console.log('Nishanthi salary updated to 33,200.');

  console.log('✅ Cleanup complete.');
}

cleanup().catch(console.error);
