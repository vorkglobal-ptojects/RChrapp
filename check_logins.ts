import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY!;

// Admin client for listing users
const adminClient = createClient(supabaseUrl, serviceRoleKey);

const accounts = [
  { name: 'Super Admin',              email: 'super@hrpulse.com',                    password: 'super@1234' },
  { name: 'Owner',                    email: 'owner@hrpulse.com',                    password: 'owner@4321' },
  { name: 'HR Manager',               email: 'hr@hrpulse.com',                       password: 'hrpulse@4321' },
  { name: 'W.K. Erandi Perera',       email: 'erandi.perera@hrpulse.com',            password: 'erandi123' },
  { name: 'Dahami Divyanjali',        email: 'dahami.divyanjali@hrpulse.com',        password: 'dahami123' },
  { name: 'Achini Vindya',            email: 'achini.vindya@hrpulse.com',            password: 'achini123' },
  { name: 'Dilini Sanarathna',        email: 'dilini.sanarathna@hrpulse.com',        password: 'dilini123' },
  { name: 'Chamika Bothogu',          email: 'chamika.bothogu@hrpulse.com',          password: 'chamika123' },
  { name: 'A.V. Chamika Sonali',      email: 'a.v.chamika.sonali@hrpulse.com',       password: 'chamika123' },
  { name: 'D.A. Dilupa Thamari',      email: 'd.a.dilupa.thamari@hrpulse.com',       password: 'dilupa123' },
  { name: 'Harsha Thamali',           email: 'harsha.thamali@hrpulse.com',           password: 'harsha123' },
  { name: 'Sachini Nirasha',          email: 'sachini.nirasha@hrpulse.com',          password: 'sachini123' },
  { name: 'Chaseera Sulani',          email: 'chaseera.sulani@hrpulse.com',          password: 'chaseera123' },
  { name: 'Geethangani Pieris',       email: 'geethangani.pieris@hrpulse.com',       password: 'geethangani123' },
  { name: 'W.A. Chandima Dilrukshi',  email: 'w.a.chandima.dilrukshi@hrpulse.com',   password: 'chandima123' },
  { name: 'Rasika Priyangani',        email: 'rasika.priyangani@hrpulse.com',        password: 'rasika123' },
  { name: 'A.M.N. Sanjana',           email: 'amn.sanjana@hrpulse.com',             password: 'amn123' },
  { name: 'R.P. Ratnayake',           email: 'rp.ratnayake@hrpulse.com',            password: 'rp123' },
  { name: 'D.M. Nilukshi Kawshalya',  email: 'd.m.nilukshi.kawshalya@hrpulse.com',  password: 'nilukshi123' },
  { name: 'Nihal Malawana',           email: 'nihal.malawana@hrpulse.com',           password: 'nihal123' },
  { name: 'Syamalie Udumulla',        email: 'syamalie.udumulla@hrpulse.com',        password: 'syamalie123' },
  { name: 'Nishanthi Kuruppu',        email: 'nishanthi.kuruppu@hrpulse.com',        password: 'nishanthi123' },
  { name: 'Nadeesha Dihara',          email: 'nadeesha.dihara@hrpulse.com',          password: 'nadeesha123' },
  { name: 'Chathurika Madushani',     email: 'chathurika.madushani@hrpulse.com',     password: 'chathurika123' },
  { name: 'Maneesha H. Dias',         email: 'maneesha.dias@hrpulse.com',            password: 'maneesha123' },
  { name: 'Imashi Pramodaya',         email: 'imashi.pramodaya@hrpulse.com',         password: 'imashi123' },
  { name: 'Aruni Indrachapa',         email: 'aruni.indrachapa@hrpulse.com',         password: 'aruni123' },
  { name: 'Tharushi Apsara',          email: 'tharushi.apsara@hrpulse.com',          password: 'tharushi123' },
  { name: 'Lakshika Perera',          email: 'lakshika.perera@hrpulse.com',          password: 'lakshika123' },
  { name: 'Dulki Isanka',             email: 'dulki.isanka@hrpulse.com',             password: 'dulki123' },
  { name: 'Tharushi Sadumin',         email: 'tharushi.sadumin@hrpulse.com',         password: 'tharushi123' },
];

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function checkLogins() {
  console.log('🔍 Fetching all auth users from Supabase...\n');

  // Get all auth users via admin API
  const { data: { users: authUsers }, error: listError } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
  if (listError) {
    console.error('❌ Failed to list users:', listError.message);
    process.exit(1);
  }

  const authEmails = new Set(authUsers.map(u => u.email?.toLowerCase()));
  console.log(`📋 Found ${authUsers.length} users in Supabase Auth\n`);
  console.log('='.repeat(75));

  const missing: typeof accounts = [];
  const working: typeof accounts = [];

  // Step 1: Check which emails exist in auth
  for (const acc of accounts) {
    const exists = authEmails.has(acc.email.toLowerCase());
    if (!exists) {
      missing.push(acc);
      console.log(`❌ [#${accounts.indexOf(acc)+1}] ${acc.name.padEnd(30)} | ${acc.email} — NOT IN AUTH`);
    } else {
      working.push(acc);
      console.log(`✅ [#${accounts.indexOf(acc)+1}] ${acc.name.padEnd(30)} | ${acc.email} — EXISTS`);
    }
  }

  console.log('\n' + '='.repeat(75));

  // Step 2: Test actual sign-in for existing accounts (with rate-limit delay)
  console.log('\n🔐 Testing actual sign-in for existing accounts...\n');
  const loginFailed: { acc: typeof accounts[0], reason: string }[] = [];
  const loginOk: typeof accounts = [];

  for (const acc of working) {
    // Use a fresh anon client per request to avoid session conflicts
    const client = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });
    const { error } = await client.auth.signInWithPassword({ email: acc.email, password: acc.password });
    if (error) {
      loginFailed.push({ acc, reason: error.message });
      console.log(`🔴 FAIL  ${acc.name.padEnd(30)} | ${acc.email} → ${error.message}`);
    } else {
      loginOk.push(acc);
      console.log(`🟢 OK    ${acc.name.padEnd(30)} | ${acc.email}`);
    }
    await sleep(400); // avoid rate limiting
  }

  // Summary
  console.log('\n' + '='.repeat(75));
  console.log('\n📊 SUMMARY\n');
  console.log(`  ✅ Login OK       : ${loginOk.length}`);
  console.log(`  🔴 Login Failed   : ${loginFailed.length}`);
  console.log(`  ❌ Not in Auth    : ${missing.length}`);

  if (missing.length > 0) {
    console.log('\n⚠️  MISSING FROM SUPABASE AUTH:');
    missing.forEach(m => console.log(`   - ${m.name} (${m.email})`));
  }

  if (loginFailed.length > 0) {
    console.log('\n⚠️  WRONG PASSWORD / LOGIN FAILED:');
    loginFailed.forEach(({ acc, reason }) => console.log(`   - ${acc.name} (${acc.email}): ${reason}`));
  }

  if (missing.length === 0 && loginFailed.length === 0) {
    console.log('\n🎉 All logins are working perfectly!');
  }
}

checkLogins().catch(console.error);
