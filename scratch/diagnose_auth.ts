import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function diagnose() {
  console.log("🚀 Starting Auth & Profile Diagnostic...");

  // 1. Fetch all Auth users
  const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers();
  if (authError) {
    console.error("❌ Error fetching auth users:", authError);
    return;
  }

  // 2. Fetch all Profiles
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, name, role');
  if (profileError) {
    console.error("❌ Error fetching profiles:", profileError);
    return;
  }

  console.log(`\n📊 Stats:`);
  console.log(`Total Auth Users: ${authUsers.length}`);
  console.log(`Total Profiles: ${profiles?.length || 0}`);

  // 3. Find missing profiles
  const missingProfiles = authUsers.filter(au => !profiles?.some(p => p.id === au.id));
  
  if (missingProfiles.length > 0) {
    console.log(`\n⚠️ Found ${missingProfiles.length} users with Auth account but NO Profile:`);
    missingProfiles.forEach(u => {
      console.log(`- ${u.email} (ID: ${u.id})`);
    });
  } else {
    console.log("\n✅ No missing profiles found (all auth users have profiles).");
  }

  // 4. Find profiles without auth (should be 0)
  const missingAuth = profiles?.filter(p => !authUsers.some(au => au.id === p.id)) || [];
  if (missingAuth.length > 0) {
    console.log(`\n❌ Found ${missingAuth.length} profiles with NO Auth account:`);
    missingAuth.forEach(p => {
      console.log(`- ${p.email} (ID: ${p.id})`);
    });
  }

  // 5. Check for login issues (email confirmed status)
  const unconfirmed = authUsers.filter(u => !u.email_confirmed_at);
  if (unconfirmed.length > 0) {
    console.log(`\n⚠️ Found ${unconfirmed.length} users with unconfirmed email (may fail login if required):`);
    unconfirmed.forEach(u => {
      console.log(`- ${u.email}`);
    });
  }

  console.log("\n🏁 Diagnostic complete.");
}

diagnose();
