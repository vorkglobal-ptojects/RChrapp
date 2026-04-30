import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function diagnose() {
  console.log("🚀 Starting Detailed Auth & Profile Diagnostic...");

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

  // 3. Check for Duplicate Emails in Auth
  const emailMap = new Map<string, string[]>();
  authUsers.forEach(u => {
    if (u.email) {
      const ids = emailMap.get(u.email) || [];
      ids.push(u.id);
      emailMap.set(u.email, ids);
    }
  });

  const duplicateEmails = Array.from(emailMap.entries()).filter(([_, ids]) => ids.length > 1);
  if (duplicateEmails.length > 0) {
    console.log(`\n❌ Found ${duplicateEmails.length} emails with DUPLICATE Auth accounts:`);
    duplicateEmails.forEach(([email, ids]) => {
      console.log(`- ${email}:`);
      ids.forEach(id => {
        const hasProfile = profiles?.some(p => p.id === id);
        console.log(`  ↳ ID: ${id} [Profile: ${hasProfile ? '✅ YES' : '❌ NO'}]`);
      });
    });
  }

  // 4. Find Auth users missing profiles (and check if their email has a profile under a DIFFERENT ID)
  const missingProfiles = authUsers.filter(au => !profiles?.some(p => p.id === au.id));
  if (missingProfiles.length > 0) {
    console.log(`\n⚠️ Found ${missingProfiles.length} users with Auth account but NO Profile:`);
    missingProfiles.forEach(u => {
      const profileWithSameEmail = profiles?.find(p => p.email === u.email);
      console.log(`- ${u.email} (ID: ${u.id}) ${profileWithSameEmail ? `[Has profile under ID: ${profileWithSameEmail.id}]` : '[NO profile with this email exists]'}`);
    });
  }

  // 5. Check for Profiles missing Auth
  const missingAuth = profiles?.filter(p => !authUsers.some(au => au.id === p.id)) || [];
  if (missingAuth.length > 0) {
    console.log(`\n❌ Found ${missingAuth.length} profiles with NO Auth account:`);
    missingAuth.forEach(p => {
      console.log(`- ${p.email} (ID: ${p.id})`);
    });
  }

  console.log("\n🏁 Diagnostic complete.");
}

diagnose();
