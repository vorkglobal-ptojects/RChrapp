import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 4 accounts missing from Auth entirely
const toCreate = [
  { name: 'Chamika Bothogu',         email: 'chamika.bothogu@hrpulse.com',        password: 'chamika123' },
  { name: 'W.A. Chandima Dilrukshi', email: 'w.a.chandima.dilrukshi@hrpulse.com', password: 'chandima123' },
  { name: 'Nadeesha Dihara',         email: 'nadeesha.dihara@hrpulse.com',        password: 'nadeesha123' },
  { name: 'Tharushi Sadumin',        email: 'tharushi.sadumin@hrpulse.com',       password: 'tharushi123' },
];

// 3 accounts that exist but have wrong passwords
const toResetPassword = [
  { name: 'A.V. Chamika Sonali',     email: 'a.v.chamika.sonali@hrpulse.com',     password: 'chamika123' },
  { name: 'D.A. Dilupa Thamari',     email: 'd.a.dilupa.thamari@hrpulse.com',     password: 'dilupa123' },
  { name: 'D.M. Nilukshi Kawshalya', email: 'd.m.nilukshi.kawshalya@hrpulse.com', password: 'nilukshi123' },
];

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fixAll() {
  console.log('🚀 HR Pulse — Account Fix Script\n');
  console.log('='.repeat(60));

  // ── STEP 1: Create missing accounts ─────────────────────────────
  console.log('\n📋 STEP 1: Creating 4 missing accounts...\n');

  for (const acc of toCreate) {
    try {
      const { data, error } = await supabase.auth.admin.createUser({
        email: acc.email,
        password: acc.password,
        email_confirm: true,
        user_metadata: { name: acc.name, role: 'employee' }
      });

      if (error) {
        // If already exists somehow, just update password
        if (error.message.includes('already')) {
          console.log(`⚠️  ${acc.name} — already exists, skipping create`);
        } else {
          console.log(`❌ ${acc.name} — Error: ${error.message}`);
        }
      } else {
        console.log(`✅ Created: ${acc.name.padEnd(30)} | ${acc.email}`);
      }
    } catch (err: any) {
      console.log(`❌ ${acc.name} — Unexpected error: ${err.message}`);
    }
    await sleep(300);
  }

  // ── STEP 2: Reset passwords ──────────────────────────────────────
  console.log('\n📋 STEP 2: Resetting 3 passwords...\n');

  // Get all users to find their IDs
  const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const userMap = new Map(users.map(u => [u.email?.toLowerCase(), u.id]));

  for (const acc of toResetPassword) {
    const uid = userMap.get(acc.email.toLowerCase());
    if (!uid) {
      console.log(`❌ ${acc.name} — not found in auth, cannot reset`);
      continue;
    }
    const { error } = await supabase.auth.admin.updateUserById(uid, {
      password: acc.password,
      email_confirm: true,
    });
    if (error) {
      console.log(`❌ ${acc.name} — Reset failed: ${error.message}`);
    } else {
      console.log(`✅ Reset:   ${acc.name.padEnd(30)} | ${acc.email} → ${acc.password}`);
    }
    await sleep(300);
  }

  // ── STEP 3: Verify all 31 logins ────────────────────────────────
  console.log('\n📋 STEP 3: Verifying all 31 logins...\n');

  const anonKey = process.env.VITE_SUPABASE_ANON_KEY!;
  const supabaseUrl = process.env.VITE_SUPABASE_URL!;
  const { createClient: cc } = await import('@supabase/supabase-js');

  const allAccounts = [
    { name: 'Super Admin',              email: 'super@hrpulse.com',                   password: 'super@1234' },
    { name: 'Owner',                    email: 'owner@hrpulse.com',                   password: 'owner@4321' },
    { name: 'HR Manager',               email: 'hr@hrpulse.com',                      password: 'hrpulse@4321' },
    { name: 'W.K. Erandi Perera',       email: 'erandi.perera@hrpulse.com',           password: 'erandi123' },
    { name: 'Dahami Divyanjali',        email: 'dahami.divyanjali@hrpulse.com',       password: 'dahami123' },
    { name: 'Achini Vindya',            email: 'achini.vindya@hrpulse.com',           password: 'achini123' },
    { name: 'Dilini Sanarathna',        email: 'dilini.sanarathna@hrpulse.com',       password: 'dilini123' },
    { name: 'Chamika Bothogu',          email: 'chamika.bothogu@hrpulse.com',         password: 'chamika123' },
    { name: 'A.V. Chamika Sonali',      email: 'a.v.chamika.sonali@hrpulse.com',      password: 'chamika123' },
    { name: 'D.A. Dilupa Thamari',      email: 'd.a.dilupa.thamari@hrpulse.com',      password: 'dilupa123' },
    { name: 'Harsha Thamali',           email: 'harsha.thamali@hrpulse.com',          password: 'harsha123' },
    { name: 'Sachini Nirasha',          email: 'sachini.nirasha@hrpulse.com',         password: 'sachini123' },
    { name: 'Chaseera Sulani',          email: 'chaseera.sulani@hrpulse.com',         password: 'chaseera123' },
    { name: 'Geethangani Pieris',       email: 'geethangani.pieris@hrpulse.com',      password: 'geethangani123' },
    { name: 'W.A. Chandima Dilrukshi',  email: 'w.a.chandima.dilrukshi@hrpulse.com',  password: 'chandima123' },
    { name: 'Rasika Priyangani',        email: 'rasika.priyangani@hrpulse.com',       password: 'rasika123' },
    { name: 'A.M.N. Sanjana',           email: 'amn.sanjana@hrpulse.com',            password: 'amn123' },
    { name: 'R.P. Ratnayake',           email: 'rp.ratnayake@hrpulse.com',           password: 'rp123' },
    { name: 'D.M. Nilukshi Kawshalya',  email: 'd.m.nilukshi.kawshalya@hrpulse.com', password: 'nilukshi123' },
    { name: 'Nihal Malawana',           email: 'nihal.malawana@hrpulse.com',          password: 'nihal123' },
    { name: 'Syamalie Udumulla',        email: 'syamalie.udumulla@hrpulse.com',       password: 'syamalie123' },
    { name: 'Nishanthi Kuruppu',        email: 'nishanthi.kuruppu@hrpulse.com',       password: 'nishanthi123' },
    { name: 'Nadeesha Dihara',          email: 'nadeesha.dihara@hrpulse.com',         password: 'nadeesha123' },
    { name: 'Chathurika Madushani',     email: 'chathurika.madushani@hrpulse.com',    password: 'chathurika123' },
    { name: 'Maneesha H. Dias',         email: 'maneesha.dias@hrpulse.com',           password: 'maneesha123' },
    { name: 'Imashi Pramodaya',         email: 'imashi.pramodaya@hrpulse.com',        password: 'imashi123' },
    { name: 'Aruni Indrachapa',         email: 'aruni.indrachapa@hrpulse.com',        password: 'aruni123' },
    { name: 'Tharushi Apsara',          email: 'tharushi.apsara@hrpulse.com',         password: 'tharushi123' },
    { name: 'Lakshika Perera',          email: 'lakshika.perera@hrpulse.com',         password: 'lakshika123' },
    { name: 'Dulki Isanka',             email: 'dulki.isanka@hrpulse.com',            password: 'dulki123' },
    { name: 'Tharushi Sadumin',         email: 'tharushi.sadumin@hrpulse.com',        password: 'tharushi123' },
  ];

  let passed = 0, failed = 0;
  const failedList: string[] = [];

  for (const acc of allAccounts) {
    const client = cc(supabaseUrl, anonKey, { auth: { persistSession: false } });
    const { error } = await client.auth.signInWithPassword({ email: acc.email, password: acc.password });
    if (error) {
      console.log(`🔴 FAIL  ${acc.name.padEnd(30)} | ${error.message}`);
      failedList.push(acc.name);
      failed++;
    } else {
      console.log(`🟢 OK    ${acc.name}`);
      passed++;
    }
    await sleep(350);
  }

  console.log('\n' + '='.repeat(60));
  console.log(`\n🎯 FINAL RESULT: ${passed}/31 logins working\n`);
  if (failed === 0) {
    console.log('🎉 All 31 accounts are working perfectly!\n');
  } else {
    console.log(`⚠️  Still failing (${failed}): ${failedList.join(', ')}\n`);
  }
}

fixAll().catch(console.error);
