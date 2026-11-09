import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const backupDir = path.join(process.cwd(), 'backup_data');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

// Known passwords dictionary from check_logins.ts & create_it_team.ts
const KNOWN_PASSWORDS: Record<string, string> = {
  'super@hrpulse.com': 'super@1234',
  'owner@hrpulse.com': 'owner@4321',
  'hr@hrpulse.com': 'hrpulse@4321',
  'dinushapushparajah@gmail.com': 'dinusha123',
  'dinusha.pushparajah@hrpulse.com': 'dinusha123',
  'nisal.sayuranga@hrpulse.com': 'nisal123',
  'jayaminda@hrpulse.com': 'jayaminda123',
  'sai.janani@hrpulse.com': 'janani123',
  'erandi.perera@hrpulse.com': 'erandi123',
  'dahami.divyanjali@hrpulse.com': 'dahami123',
  'achini.vindya@hrpulse.com': 'achini123',
  'dilini.sanarathna@hrpulse.com': 'dilini123',
  'chamika.bothogu@hrpulse.com': 'chamika123',
  'a.v.chamika.sonali@hrpulse.com': 'chamika123',
  'd.a.dilupa.thamari@hrpulse.com': 'dilupa123',
  'harsha.thamali@hrpulse.com': 'harsha123',
  'sachini.nirasha@hrpulse.com': 'sachini123',
  'chaseera.sulani@hrpulse.com': 'chaseera123',
  'geethangani.pieris@hrpulse.com': 'geethangani123',
  'w.a.chandima.dilrukshi@hrpulse.com': 'chandima123',
  'w.a.chandima.dilrukishi@hrpulse.com': 'chandima123',
  'rasika.priyangani@hrpulse.com': 'rasika123',
  'amn.sanjana@hrpulse.com': 'amn123',
  'rp.ratnayake@hrpulse.com': 'rp123',
  'd.m.nilukshi.kawshalya@hrpulse.com': 'nilukshi123',
  'nihal.malawana@hrpulse.com': 'nihal123',
  'syamalie.udumulla@hrpulse.com': 'syamalie123',
  'nishanthi.kuruppu@hrpulse.com': 'nishanthi123',
  'nadeesha.dihara@hrpulse.com': 'nadeesha123',
  'nadeesha.dilhara@hrpulse.com': 'nadeesha123',
  'chathurika.madushani@hrpulse.com': 'chathurika123',
  'maneesha.dias@hrpulse.com': 'maneesha123',
  'imashi.pramodaya@hrpulse.com': 'imashi123',
  'aruni.indrachapa@hrpulse.com': 'aruni123',
  'tharushi.apsara@hrpulse.com': 'tharushi123',
  'lakshika.perera@hrpulse.com': 'lakshika123',
  'dulki.isanka@hrpulse.com': 'dulki123',
  'tharushi.sadumin@hrpulse.com': 'tharushi123',
  'tharushi.sandumini@hrpulse.com': 'tharushi123',
  'chamilka.botheju@hrpulse.com': 'chamilka123'
};

async function fetchAllRows(tableName: string): Promise<any[]> {
  const allRows: any[] = [];
  const pageSize = 1000;
  let from = 0;
  let hasMore = true;

  while (hasMore) {
    const to = from + pageSize - 1;
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .range(from, to);

    if (error) {
      console.error(`Error fetching ${tableName} (${from}-${to}):`, error.message);
      break;
    }

    if (data && data.length > 0) {
      allRows.push(...data);
      if (data.length < pageSize) {
        hasMore = false;
      } else {
        from += pageSize;
      }
    } else {
      hasMore = false;
    }
  }

  return allRows;
}

async function runBackup() {
  console.log('📦 Starting Comprehensive Supabase Backup...\n');

  const backupData: Record<string, any> = {
    timestamp: new Date().toISOString(),
    sourceUrl: supabaseUrl,
    tables: {},
    authUsers: [],
    storage: {}
  };

  // 1. Backup Auth Users
  console.log('1. Exporting Auth Users...');
  const { data: authData, error: authError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (authError) {
    console.error('Failed to export auth users:', authError.message);
  } else {
    backupData.authUsers = authData.users.map(u => ({
      id: u.id,
      email: u.email,
      phone: u.phone,
      email_confirmed_at: u.email_confirmed_at,
      user_metadata: u.user_metadata,
      app_metadata: u.app_metadata,
      created_at: u.created_at,
      known_password: KNOWN_PASSWORDS[u.email || ''] || 'employee123'
    }));
    console.log(`   ✅ Exported ${backupData.authUsers.length} Auth Users.`);
  }

  // 2. Backup Database Tables
  const tables = [
    'profiles',
    'attendance',
    'attendance_tickets',
    'leave_requests',
    'advance_requests',
    'tasks',
    'payroll',
    'performance'
  ];

  for (const table of tables) {
    console.log(`2. Exporting table: ${table}...`);
    const rows = await fetchAllRows(table);
    backupData.tables[table] = rows;
    console.log(`   ✅ Exported ${rows.length} rows from ${table}.`);
  }

  // 3. Backup Storage Files
  console.log('3. Checking Storage Buckets...');
  const { data: buckets } = await supabase.storage.listBuckets();
  if (buckets) {
    for (const b of buckets) {
      const { data: files } = await supabase.storage.from(b.name).list();
      backupData.storage[b.name] = files || [];
      console.log(`   ✅ Bucket '${b.name}': ${files?.length || 0} items.`);
    }
  }

  // Save JSON Backup
  const jsonPath = path.join(backupDir, 'supabase_backup_complete.json');
  fs.writeFileSync(jsonPath, JSON.stringify(backupData, null, 2), 'utf8');
  console.log(`\n💾 Saved full JSON backup to: ${jsonPath} (${(fs.statSync(jsonPath).size / 1024).toFixed(1)} KB)`);

  console.log('\n🎉 Comprehensive Supabase Backup successfully completed!');
}

runBackup();
