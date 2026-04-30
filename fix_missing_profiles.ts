import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Full employee list with known details
const employeeData: Record<string, {
  name: string; username: string; role: string;
  branch: string; department: string;
}> = {
  'super@hrpulse.com':                   { name: 'Super Admin',             username: 'super',                   role: 'super',    branch: 'SUPER',         department: 'DevOps' },
  'owner@hrpulse.com':                   { name: 'Owner',                   username: 'owner',                   role: 'owner',    branch: 'HQ',            department: 'Management' },
  'hr@hrpulse.com':                      { name: 'HR Manager',              username: 'hr',                      role: 'hr',       branch: 'HQ',            department: 'Human Resources' },
  'erandi.perera@hrpulse.com':           { name: 'W.K. Erandi Perera',      username: 'erandi.perera',           role: 'employee', branch: 'Kiribathgoda',  department: 'General' },
  'dahami.divyanjali@hrpulse.com':       { name: 'Dahami Divyanjali',       username: 'dahami.divyanjali',       role: 'employee', branch: 'Kiribathgoda',  department: 'General' },
  'achini.vindya@hrpulse.com':           { name: 'Achini Vindya',           username: 'achini.vindya',           role: 'employee', branch: 'Kiribathgoda',  department: 'General' },
  'dilini.sanarathna@hrpulse.com':       { name: 'Dilini Sanarathna',       username: 'dilini.sanarathna',       role: 'employee', branch: 'Kiribathgoda',  department: 'General' },
  'chamika.bothogu@hrpulse.com':         { name: 'Chamika Bothogu',         username: 'chamika.bothogu',         role: 'employee', branch: 'Kiribathgoda',  department: 'General' },
  'a.v.chamika.sonali@hrpulse.com':      { name: 'A.V. Chamika Sonali',     username: 'a.v.chamika.sonali',      role: 'employee', branch: 'Kiribathgoda',  department: 'General' },
  'd.a.dilupa.thamari@hrpulse.com':      { name: 'D.A. Dilupa Thamari',     username: 'd.a.dilupa.thamari',      role: 'employee', branch: 'Kiribathgoda',  department: 'General' },
  'harsha.thamali@hrpulse.com':          { name: 'Harsha Thamali',          username: 'harsha.thamali',          role: 'employee', branch: 'Kiribathgoda',  department: 'General' },
  'sachini.nirasha@hrpulse.com':         { name: 'Sachini Nirasha',         username: 'sachini.nirasha',         role: 'employee', branch: 'Kiribathgoda',  department: 'General' },
  'chaseera.sulani@hrpulse.com':         { name: 'Chaseera Sulani',         username: 'chaseera.sulani',         role: 'employee', branch: 'Kiribathgoda',  department: 'General' },
  'geethangani.pieris@hrpulse.com':      { name: 'Geethangani Pieris',      username: 'geethangani.pieris',      role: 'employee', branch: 'Kiribathgoda',  department: 'General' },
  'w.a.chandima.dilrukshi@hrpulse.com':  { name: 'W.A. Chandima Dilrukshi', username: 'w.a.chandima.dilrukshi', role: 'employee', branch: 'Kiribathgoda',  department: 'General' },
  'rasika.priyangani@hrpulse.com':       { name: 'Rasika Priyangani',       username: 'rasika.priyangani',       role: 'employee', branch: 'Kiribathgoda',  department: 'General' },
  'amn.sanjana@hrpulse.com':             { name: 'A.M.N. Sanjana',          username: 'amn.sanjana',             role: 'employee', branch: 'Kiribathgoda',  department: 'General' },
  'rp.ratnayake@hrpulse.com':            { name: 'R.P. Ratnayake',          username: 'rp.ratnayake',            role: 'employee', branch: 'Kiribathgoda',  department: 'General' },
  'd.m.nilukshi.kawshalya@hrpulse.com':  { name: 'D.M. Nilukshi Kawshalya', username: 'd.m.nilukshi.kawshalya', role: 'employee', branch: 'Kiribathgoda',  department: 'General' },
  'nihal.malawana@hrpulse.com':          { name: 'Nihal Malawana',          username: 'nihal.malawana',          role: 'employee', branch: 'Kiribathgoda',  department: 'General' },
  'syamalie.udumulla@hrpulse.com':       { name: 'Syamalie Udumulla',       username: 'syamalie.udumulla',       role: 'employee', branch: 'Kiribathgoda',  department: 'General' },
  'nishanthi.kuruppu@hrpulse.com':       { name: 'Nishanthi Kuruppu',       username: 'nishanthi.kuruppu',       role: 'employee', branch: 'Kiribathgoda',  department: 'General' },
  'nadeesha.dihara@hrpulse.com':         { name: 'Nadeesha Dihara',         username: 'nadeesha.dihara',         role: 'employee', branch: 'Kiribathgoda',  department: 'General' },
  'chathurika.madushani@hrpulse.com':    { name: 'Chathurika Madushani',    username: 'chathurika.madushani',    role: 'employee', branch: 'Kiribathgoda',  department: 'General' },
  'maneesha.dias@hrpulse.com':           { name: 'Maneesha H. Dias',        username: 'maneesha.dias',           role: 'employee', branch: 'Kiribathgoda',  department: 'General' },
  'imashi.pramodaya@hrpulse.com':        { name: 'Imashi Pramodaya',        username: 'imashi.pramodaya',        role: 'employee', branch: 'Kiribathgoda',  department: 'General' },
  'aruni.indrachapa@hrpulse.com':        { name: 'Aruni Indrachapa',        username: 'aruni.indrachapa',        role: 'employee', branch: 'Kiribathgoda',  department: 'General' },
  'tharushi.apsara@hrpulse.com':         { name: 'Tharushi Apsara',         username: 'tharushi.apsara',         role: 'employee', branch: 'Kiribathgoda',  department: 'General' },
  'lakshika.perera@hrpulse.com':         { name: 'Lakshika Perera',         username: 'lakshika.perera',         role: 'employee', branch: 'Kiribathgoda',  department: 'General' },
  'dulki.isanka@hrpulse.com':            { name: 'Dulki Isanka',            username: 'dulki.isanka',            role: 'employee', branch: 'Kiribathgoda',  department: 'General' },
  'tharushi.sadumin@hrpulse.com':        { name: 'Tharushi Sadumin',        username: 'tharushi.sadumin',        role: 'employee', branch: 'Kiribathgoda',  department: 'General' },
};

async function auditAndFixProfiles() {
  console.log('🔍 Auditing ALL auth users vs profiles table...\n');
  console.log('='.repeat(65));

  // 1. Get all auth users
  const { data: { users: authUsers }, error: authErr } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (authErr) { console.error('❌ Could not list auth users:', authErr.message); process.exit(1); }
  console.log(`📋 Auth users found: ${authUsers.length}`);

  // 2. Get all existing profile IDs
  const { data: profiles, error: profErr } = await supabase.from('profiles').select('id, name, email');
  if (profErr) { console.error('❌ Could not fetch profiles:', profErr.message); process.exit(1); }
  const profileIds = new Set((profiles || []).map(p => p.id));
  console.log(`📋 Profiles in DB:   ${profileIds.size}`);

  // 3. Find auth users with NO profile
  const missing = authUsers.filter(u => !profileIds.has(u.id));
  console.log(`⚠️  Missing profiles: ${missing.length}\n`);
  console.log('='.repeat(65));

  if (missing.length === 0) {
    console.log('\n🎉 All auth users already have profiles! No action needed.\n');
    return;
  }

  // 4. Get current max sort_order once
  const { data: maxSortData } = await supabase
    .from('profiles').select('sort_order').order('sort_order', { ascending: false }).limit(1);
  let nextSort = maxSortData && maxSortData[0] ? maxSortData[0].sort_order + 1 : 1;

  console.log('\n🛠️  Creating missing profiles...\n');
  let fixed = 0, errored = 0;

  for (const authUser of missing) {
    const email = authUser.email?.toLowerCase() || '';
    const known = employeeData[email];

    const profileRow = {
      id:               authUser.id,
      name:             known?.name     || authUser.user_metadata?.name || email.split('@')[0],
      email:            email,
      username:         known?.username || email.split('@')[0],
      role:             known?.role     || authUser.user_metadata?.role || 'employee',
      branch:           known?.branch   || 'Kiribathgoda',
      department:       known?.department || 'General',
      status:           'Available',
      salary_a:         0,
      salary_b:         0,
      epf:              0,
      advances:         0,
      cover:            0,
      intensive:        0,
      travelling:       0,
      net:              0,
      performance_score: 0,
      sort_order:       nextSort++,
      leave_quotas:     { annual: 14, casual: 7, medical: 7 },
      used_leaves:      { annual: 0,  casual: 0,  medical: 0  },
    };

    const { error } = await supabase.from('profiles').insert(profileRow);
    if (error) {
      console.log(`❌ FAILED  ${(known?.name || email).padEnd(32)} | ${error.message}`);
      errored++;
    } else {
      console.log(`✅ CREATED ${(known?.name || email).padEnd(32)} | ${email}`);
      fixed++;
    }
  }

  // 5. Final verification — re-fetch profiles
  console.log('\n' + '='.repeat(65));
  console.log('\n🔐 Final verification — checking all auth users have profiles...\n');

  const { data: finalProfiles } = await supabase.from('profiles').select('id, name');
  const finalIds = new Set((finalProfiles || []).map(p => p.id));
  let allGood = true;

  for (const u of authUsers) {
    if (!finalIds.has(u.id)) {
      console.log(`🔴 STILL MISSING: ${u.email}`);
      allGood = false;
    }
  }

  console.log('\n' + '='.repeat(65));
  console.log(`\n📊 SUMMARY`);
  console.log(`  ✅ Profiles created : ${fixed}`);
  console.log(`  ❌ Errors           : ${errored}`);
  console.log(`  📋 Total in DB now  : ${finalIds.size}/${authUsers.length}`);
  if (allGood) {
    console.log('\n🎉 All users now have profiles — dashboards will load correctly!\n');
  } else {
    console.log('\n⚠️  Some profiles still missing. Check errors above.\n');
  }
}

auditAndFixProfiles().catch(console.error);
