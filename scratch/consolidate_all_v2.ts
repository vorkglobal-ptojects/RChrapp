import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function consolidateAll() {
  console.log("🚀 Starting Global Profile Consolidation (V2)...");

  const { data: { users: authUsers } } = await supabase.auth.admin.listUsers();
  const { data: profiles } = await supabase.from('profiles').select('*');

  if (!profiles) return;

  for (const au of authUsers) {
    if (!au.email) continue;

    // Check if this Auth ID is already in profiles
    const existingProfile = profiles.find(p => p.id === au.id);
    if (existingProfile) continue; 

    // Find profile with "similar" email
    const fuzzyEmail = au.email.toLowerCase().replace(/\./g, '');
    const matchingProfile = profiles.find(p => {
        const pe = p.email.toLowerCase().replace(/\./g, '');
        return fuzzyEmail === pe;
    });

    if (matchingProfile) {
        console.log(`🔗 Migrating Profile: ${matchingProfile.name}`);
        console.log(`   From: ${matchingProfile.email} (ID: ${matchingProfile.id})`);
        console.log(`   To:   ${au.email} (ID: ${au.id})`);
        
        try {
            // 1. Create a dummy profile for the NEW ID to satisfy FKs during migration
            // We use a unique temporary username
            const tempUsername = `temp_${Math.random().toString(36).substring(7)}`;
            const { error: insError } = await supabase.from('profiles').insert({
                ...matchingProfile,
                id: au.id,
                email: `temp_${au.email}`, // Temporary email to avoid unique constraint
                username: tempUsername
            });

            if (insError) {
                console.error(`   ❌ Failed to insert temp profile: ${insError.message}`);
                continue;
            }

            // 2. Migrate all data
            const tables = ['attendance', 'leave_requests', 'tasks', 'payroll', 'performance'];
            for (const table of tables) {
                const { error: updErr, count } = await supabase.from(table).update({ user_id: au.id }).eq('user_id', matchingProfile.id);
                if (updErr) console.error(`   ⚠️ Error migrating ${table}: ${updErr.message}`);
                else console.log(`   ✅ Migrated ${table}`);
            }

            // 3. Delete old profile
            const { error: delErr } = await supabase.from('profiles').delete().eq('id', matchingProfile.id);
            if (delErr) {
                console.error(`   ❌ Failed to delete old profile: ${delErr.message}`);
            } else {
                console.log(`   ✅ Deleted old profile`);
            }

            // 4. Update new profile to correct email and username
            const { error: finalErr } = await supabase.from('profiles').update({
                email: au.email,
                username: matchingProfile.username
            }).eq('id', au.id);

            if (finalErr) console.error(`   ❌ Failed to finalize profile: ${finalErr.message}`);
            else console.log(`   ✨ Successfully consolidated account for ${matchingProfile.name}`);

        } catch (err) {
            console.error(`   💥 Unexpected error:`, err);
        }
    }
  }

  console.log("🏁 Consolidation complete.");
}

consolidateAll();
