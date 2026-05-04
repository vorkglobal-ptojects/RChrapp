import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function fixAll() {
  console.log('🚀 Starting Global Profile Fix...\n');

  // 1. Get all Auth Users
  const { data: { users: authUsers }, error: authErr } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (authErr) throw authErr;
  console.log(`📊 Total Auth Users: ${authUsers.length}`);

  // 2. Get all Profiles
  const { data: profiles, error: profErr } = await supabase.from('profiles').select('*');
  if (profErr) throw profErr;
  console.log(`📊 Total Profiles:    ${profiles.length}`);

  const profileById = new Map(profiles.map(p => [p.id, p]));
  const profileByEmail = new Map(profiles.map(p => [p.email.toLowerCase(), p]));

  let fixedCount = 0;
  let createdCount = 0;

  for (const user of authUsers) {
    const email = user.email!.toLowerCase();
    const existingById = profileById.get(user.id);
    const existingByEmail = profileByEmail.get(email);

    if (existingById) {
      // Profile exists with correct ID
      if (existingById.email.toLowerCase() !== email) {
        console.log(`🔧 Updating email for ${user.id}: ${existingById.email} -> ${email}`);
        await supabase.from('profiles').update({ email }).eq('id', user.id);
        fixedCount++;
      }
      continue;
    }

    if (existingByEmail) {
      // Profile exists with correct email but WRONG ID
      console.log(`🔧 Mismatch for ${email}: Profile ID ${existingByEmail.id} vs Auth ID ${user.id}`);
      
      // Update the ID. Since it's a PK and referenced by other tables, 
      // we need to update the related tables first if ON UPDATE CASCADE is missing.
      const tables = ['attendance', 'leave_requests', 'tasks', 'payroll', 'performance'];
      for (const table of tables) {
        const { error } = await supabase.from(table).update({ user_id: user.id }).eq('user_id', existingByEmail.id);
        if (error) console.error(`   ❌ Error updating ${table}:`, error.message);
      }

      // Now update the profile ID
      const { error } = await supabase.from('profiles').update({ id: user.id }).eq('id', existingByEmail.id);
      if (error) {
        console.error(`   ❌ Error updating profile ID:`, error.message);
      } else {
        console.log(`   ✅ Successfully migrated profile ID for ${email}`);
        fixedCount++;
      }
      continue;
    }

    // No profile found at all
    console.log(`🆕 Creating missing profile for: ${email} (${user.id})`);
    
    // Get next sort_order
    const { data: maxSort } = await supabase.from('profiles').select('sort_order').order('sort_order', { ascending: false }).limit(1);
    const nextSort = maxSort && maxSort[0] ? maxSort[0].sort_order + 1 : 1;

    const { error } = await supabase.from('profiles').insert({
      id: user.id,
      name: user.user_metadata?.name || email.split('@')[0],
      email: email,
      username: email.split('@')[0],
      role: user.user_metadata?.role || 'employee',
      branch: 'Kiribathgoda',
      status: 'Available',
      salary_a: 0,
      salary_b: 0,
      epf: 0,
      advances: 0,
      cover: 0,
      intensive: 0,
      travelling: 0,
      net: 0,
      performance_score: 0,
      sort_order: nextSort,
      leave_quotas: { annual: 14, casual: 7, medical: 7 },
      used_leaves: { annual: 0, casual: 0, medical: 0 }
    });

    if (error) {
      console.error(`   ❌ Error creating profile:`, error.message);
    } else {
      console.log(`   ✅ Created profile for ${email}`);
      createdCount++;
    }
  }

  console.log('\n' + '='.repeat(40));
  console.log(`✨ FINISHED`);
  console.log(`✅ Profiles Updated: ${fixedCount}`);
  console.log(`✅ Profiles Created: ${createdCount}`);
  
  // Final verify
  const { data: finalProfiles } = await supabase.from('profiles').select('id');
  console.log(`📊 Final Profiles:   ${finalProfiles.length}`);
}

fixAll().catch(console.error);
