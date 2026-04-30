import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkAllUsers() {
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const { data: profiles, error: profileError } = await supabase.from('profiles').select('id');
  
  if (authError || profileError) {
    console.error('Error fetching data', authError, profileError);
    return;
  }
  
  const profileIds = new Set(profiles.map(p => p.id));
  
  const missingProfiles = authUsers.users.filter(u => !profileIds.has(u.id));
  
  console.log(`Found ${missingProfiles.length} users missing profiles.`);
  
  for (const emp of missingProfiles) {
    console.log(`Missing: ${emp.email}`);
    // Just creating a basic profile for them
    const { error: insertError } = await supabase.from('profiles').insert({
      id: emp.id,
      name: emp.user_metadata?.name || emp.email?.split('@')[0],
      email: emp.email,
      username: emp.email?.split('@')[0].replace(/\./g, '_'),
      role: 'employee',
      status: 'Available',
      branch: 'Office',
      salary_a: 0,
      epf: 0,
      intensive: 0
    });
    if (insertError) {
      console.log('Error inserting:', insertError.message);
    } else {
      console.log('Fixed:', emp.email);
    }
  }
}

checkAllUsers();
