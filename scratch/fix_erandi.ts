import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function fixErandi() {
  const email = 'erandi.perera@hrpulse.com';
  console.log(`Checking for ${email}...`);

  // 1. Get Auth User
  const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
  const user = users.find(u => u.email === email);

  if (!user) {
    console.error("❌ Auth user not found for erandi.perera@hrpulse.com");
    return;
  }

  console.log(`Found Auth User: ${user.id}`);

  // 2. Create Profile
  const { error: profileError } = await supabase.from('profiles').upsert({
    id: user.id,
    name: 'W.K. Erandi Perera',
    email: email,
    username: 'erandi_perera',
    role: 'employee',
    branch: 'Kiribathgoda',
    join_date: '2026-02-03',
    salary_a: 27000,
    salary_b: 0,
    epf: 2400,
    advances: 0,
    cover: 0,
    intensive: 0,
    travelling: 1440,
    net: 26040,
    status: 'Available',
    must_reset_password: false
  });

  if (profileError) {
    console.error("❌ Error creating profile:", profileError.message);
  } else {
    console.log("✅ Profile created/updated successfully for Erandi Perera!");
  }
}

fixErandi();
