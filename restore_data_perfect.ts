import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const targetUrl = process.env.VITE_SUPABASE_URL!;
const targetKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const targetSupabase = createClient(targetUrl, targetKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const backup = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'backup_data', 'supabase_backup_complete.json'), 'utf8'));

async function run() {
  console.log('🚀 Ensuring all Auth Users exist...');
  const existingUsersRes = await targetSupabase.auth.admin.listUsers({ perPage: 1000 });
  const existingEmailMap = new Map(existingUsersRes.data?.users.map(u => [u.email?.toLowerCase(), u.id]) || []);

  for (const user of backup.authUsers) {
    const email = user.email?.toLowerCase();
    if (!email) continue;
    let pwd = user.known_password || 'employee123';
    if (pwd.length < 6) {
      pwd = pwd + '456'; // Ensure >= 6 characters for Supabase password policy
      user.known_password = pwd;
    }

    if (existingEmailMap.has(email)) {
      const existingId = existingEmailMap.get(email)!;
      await targetSupabase.auth.admin.updateUserById(existingId, {
        password: pwd,
        email_confirm: true,
        user_metadata: user.user_metadata
      });
      console.log(`   Updated ${email} (${existingId})`);
    } else {
      const { data, error } = await targetSupabase.auth.admin.createUser({
        id: user.id,
        email: user.email,
        password: pwd,
        email_confirm: true,
        user_metadata: user.user_metadata
      });
      if (error) {
        console.error(`   ❌ Failed to create ${email}:`, error.message);
      } else {
        console.log(`   ✅ Created ${email} (${data.user.id})`);
      }
    }
  }

  // Helper for batch inserts
  async function batchInsert(tableName: string, rows: any[], batchSize = 100) {
    if (!rows || rows.length === 0) return;
    console.log(`\nInserting ${rows.length} rows into '${tableName}'...`);
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < rows.length; i += batchSize) {
      const chunk = rows.slice(i, i + batchSize);
      const { data, error } = await targetSupabase.from(tableName).upsert(chunk);
      if (error) {
        console.error(`   ❌ Error in ${tableName} (${i}-${i + chunk.length}):`, error.message);
        // Fallback row-by-row to see exact failure
        for (const row of chunk) {
          const { error: rErr } = await targetSupabase.from(tableName).upsert([row]);
          if (rErr) {
            failCount++;
            console.error(`      Failed row ID ${row.id || row.user_id}:`, rErr.message);
          } else {
            successCount++;
          }
        }
      } else {
        successCount += chunk.length;
      }
    }
    console.log(`   ✅ Finished '${tableName}': ${successCount} inserted, ${failCount} failed.`);
  }

  console.log('\n2. Restoring Tables...');
  await batchInsert('profiles', backup.tables.profiles || []);
  await batchInsert('payroll', backup.tables.payroll || []);
  await batchInsert('leave_requests', backup.tables.leave_requests || []);
  await batchInsert('advance_requests', backup.tables.advance_requests || []);
  await batchInsert('attendance', backup.tables.attendance || [], 200);
  await batchInsert('attendance_tickets', backup.tables.attendance_tickets || []);
  await batchInsert('tasks', backup.tables.tasks || []);
  await batchInsert('performance', backup.tables.performance || []);

  console.log('\n✨ All data tables restored successfully!');
}

run();
