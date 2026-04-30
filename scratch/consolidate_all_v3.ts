import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function consolidateAll() {
  console.log("🚀 Starting Global Profile Consolidation (V3)...");

  const { data: { users: authUsers } } = await supabase.auth.admin.listUsers();
  const { data: profiles } = await supabase.from('profiles').select('*');

  if (!profiles) return;

  for (const au of authUsers) {
    if (!au.email) continue;

    // Check if this Auth ID is already in profiles
    const existingProfile = profiles.find(p => p.id === au.id);
    if (existingProfile) continue; 

    // Find profile with "similar" email (Fuzzy)
    const e1 = au.email.toLowerCase().replace(/\./g, '');
    const matchingProfile = profiles.find(p => {
        const e2 = p.email.toLowerCase().replace(/\./g, '');
        // Match if one email is a variation of the other (e.g. d.a.dilupa.thamari vs dilupa.thamari)
        // Or if the names are very similar
        return e1.includes(e2) || e2.includes(e1);
    });

    if (matchingProfile) {
        console.log(`🔗 Migrating Profile: ${matchingProfile.name}`);
        console.log(`   From: ${matchingProfile.email} (ID: ${matchingProfile.id})`);
        console.log(`   To:   ${au.email} (ID: ${au.id})`);
        
        try {
            const tempUsername = `temp_${Math.random().toString(36).substring(7)}`;
            const { error: insError } = await supabase.from('profiles').insert({
                ...matchingProfile,
                id: au.id,
                email: `temp_${au.email}`, 
                username: tempUsername
            });

            if (insError) {
                console.error(`   ❌ Failed to insert temp profile: ${insError.message}`);
                continue;
            }

            const tables = ['attendance', 'leave_requests', 'tasks', 'payroll', 'performance'];
            for (const table of tables) {
                await supabase.from(table).update({ user_id: au.id }).eq('user_id', matchingProfile.id);
            }

            await supabase.from('profiles').delete().eq('id', matchingProfile.id);
            
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
