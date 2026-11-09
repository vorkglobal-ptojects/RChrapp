import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

// When restoring to the new project, you can provide NEW_SUPABASE_URL and NEW_SUPABASE_SERVICE_ROLE_KEY
// in your .env or as environment variables.
const targetUrl = process.env.NEW_SUPABASE_URL || process.env.VITE_SUPABASE_URL!;
const targetKey = process.env.NEW_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!;

const backupFile = path.join(process.cwd(), 'backup_data', 'supabase_backup_complete.json');

if (!fs.existsSync(backupFile)) {
  console.error('❌ Backup file not found at:', backupFile);
  process.exit(1);
}

const backup = JSON.parse(fs.readFileSync(backupFile, 'utf8'));

const targetSupabase = createClient(targetUrl, targetKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function restore() {
  console.log(`🚀 Starting Full Restore to Target Supabase: ${targetUrl}\n`);

  // 1. Restore Auth Users
  console.log(`1. Restoring ${backup.authUsers.length} Auth Users...`);
  const existingUsersRes = await targetSupabase.auth.admin.listUsers({ perPage: 1000 });
  const existingEmailMap = new Map(existingUsersRes.data?.users.map(u => [u.email?.toLowerCase(), u.id]) || []);

  const userIdMap = new Map<string, string>(); // oldUid -> newUid (usually identical)

  for (const user of backup.authUsers) {
    const email = user.email?.toLowerCase();
    if (!email) continue;

    if (existingEmailMap.has(email)) {
      const existingId = existingEmailMap.get(email)!;
      userIdMap.set(user.id, existingId);
      console.log(`   ↳ User ${email} already exists (${existingId}).`);
    } else {
      try {
        const { data: newUser, error: createErr } = await targetSupabase.auth.admin.createUser({
          id: user.id, // Preserves the exact same UUID
          email: user.email,
          password: user.known_password || 'employee123',
          email_confirm: true,
          user_metadata: user.user_metadata
        });

        if (createErr) {
          // If specifying ID isn't permitted on target, fallback without ID
          const fallback = await targetSupabase.auth.admin.createUser({
            email: user.email,
            password: user.known_password || 'employee123',
            email_confirm: true,
            user_metadata: user.user_metadata
          });
          if (fallback.error) {
            console.error(`   ❌ Error creating ${email}:`, fallback.error.message);
          } else {
            userIdMap.set(user.id, fallback.data.user.id);
            console.log(`   ✅ Created ${email} (new id: ${fallback.data.user.id})`);
          }
        } else {
          userIdMap.set(user.id, newUser.user.id);
          console.log(`   ✅ Created ${email} (preserved id: ${newUser.user.id})`);
        }
      } catch (err: any) {
        console.error(`   ❌ Exception creating ${email}:`, err.message);
      }
    }
  }

  // Helper for batch inserts
  async function batchInsert(tableName: string, rows: any[], batchSize = 250) {
    if (!rows || rows.length === 0) {
      console.log(`   ↳ ${tableName} has 0 rows, skipping.`);
      return;
    }

    console.log(`   Inserting ${rows.length} rows into '${tableName}' in batches of ${batchSize}...`);
    for (let i = 0; i < rows.length; i += batchSize) {
      const chunk = rows.slice(i, i + batchSize).map(row => {
        // Map user_id if needed
        const mapped = { ...row };
        if (mapped.user_id && userIdMap.has(mapped.user_id)) {
          mapped.user_id = userIdMap.get(mapped.user_id);
        }
        if (mapped.id && tableName === 'profiles' && userIdMap.has(mapped.id)) {
          mapped.id = userIdMap.get(mapped.id);
        }
        return mapped;
      });

      const { error } = await targetSupabase.from(tableName).upsert(chunk);
      if (error) {
        console.error(`   ❌ Error inserting batch into ${tableName} (${i}-${i + chunk.length}):`, error.message);
      }
    }
    console.log(`   ✅ Finished '${tableName}'.`);
  }

  // 2. Restore Tables in Dependency Order
  console.log('\n2. Restoring Database Tables...');
  await batchInsert('profiles', backup.tables.profiles || []);
  await batchInsert('payroll', backup.tables.payroll || []);
  await batchInsert('leave_requests', backup.tables.leave_requests || []);
  await batchInsert('advance_requests', backup.tables.advance_requests || []);
  await batchInsert('attendance', backup.tables.attendance || [], 500);
  await batchInsert('attendance_tickets', backup.tables.attendance_tickets || []);
  await batchInsert('tasks', backup.tables.tasks || []);
  await batchInsert('performance', backup.tables.performance || []);

  // 3. Restore Storage Files
  console.log('\n3. Restoring Storage Files...');
  const storageDir = path.join(process.cwd(), 'backup_data', 'storage');
  if (fs.existsSync(storageDir)) {
    const buckets = fs.readdirSync(storageDir);
    for (const b of buckets) {
      const bDir = path.join(storageDir, b);
      if (!fs.statSync(bDir).isDirectory()) continue;

      // Ensure bucket exists on target
      await targetSupabase.storage.createBucket(b, { public: true });

      function uploadRec(currPath: string, relPath: string) {
        const items = fs.readdirSync(currPath);
        for (const item of items) {
          const itemPath = path.join(currPath, item);
          const itemRel = relPath ? `${relPath}/${item}` : item;
          if (fs.statSync(itemPath).isDirectory()) {
            uploadRec(itemPath, itemRel);
          } else {
            const fileBuf = fs.readFileSync(itemPath);
            targetSupabase.storage.from(b).upload(itemRel, fileBuf, { upsert: true }).then(({ error }) => {
              if (error) console.error(`   ❌ Failed to upload ${b}/${itemRel}:`, error.message);
              else console.log(`   ✅ Uploaded ${b}/${itemRel}`);
            });
          }
        }
      }

      uploadRec(bDir, '');
    }
  }

  console.log('\n✨ Database and Storage Restore Completed Successfully!');
}

restore();
