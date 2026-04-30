import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function consolidateAll() {
  console.log("🚀 Starting Global Profile Consolidation...");

  const { data: { users: authUsers } } = await supabase.auth.admin.listUsers();
  const { data: profiles } = await supabase.from('profiles').select('*');

  if (!profiles) return;

  for (const au of authUsers) {
    if (!au.email) continue;

    // Check if this Auth ID is already in profiles
    const existingProfile = profiles.find(p => p.id === au.id);
    if (existingProfile) continue; // Already linked

    // If not linked, check if there's a profile with the same or similar email
    const fuzzyEmail = au.email.toLowerCase().replace(/\./g, '');
    const matchingProfile = profiles.find(p => {
        const pe = p.email.toLowerCase().replace(/\./g, '');
        return fuzzyEmail === pe;
    });

    if (matchingProfile) {
        console.log(`🔗 Linking Auth ID ${au.id} (${au.email}) to existing Profile for ${matchingProfile.name} (was ${matchingProfile.email})`);
        
        // Update the profile's ID
        // Note: We need to update all foreign keys first if they don't CASCADE
        // In this DB, they are ON DELETE CASCADE, but not necessarily ON UPDATE CASCADE.
        // Actually, we can just update the ID in profiles and it might work if we have no data on the OLD ID.
        
        // Let's check if the OLD ID has data
        const { count: attCount } = await supabase.from('attendance').select('*', { count: 'exact', head: true }).eq('user_id', matchingProfile.id);
        const { count: leaveCount } = await supabase.from('leave_requests').select('*', { count: 'exact', head: true }).eq('user_id', matchingProfile.id);
        
        console.log(`   - Data on old ID (${matchingProfile.id}): ${attCount} att, ${leaveCount} leaves`);

        // We can't just update the ID because it's the PK. 
        // We have to insert a NEW profile with the NEW ID and DELETE the old one,
        // BUT we must migrate data first.

        const newProfileData = { ...matchingProfile, id: au.id, email: au.email }; // Use the Auth email
        
        // 1. Insert new profile
        const { error: insError } = await supabase.from('profiles').insert(newProfileData);
        if (insError) {
            console.error(`   ❌ Failed to insert new profile: ${insError.message}`);
            continue;
        }

        // 2. Migrate data
        if ((attCount || 0) > 0) {
            await supabase.from('attendance').update({ user_id: au.id }).eq('user_id', matchingProfile.id);
            console.log(`   ✅ Migrated attendance`);
        }
        if ((leaveCount || 0) > 0) {
            await supabase.from('leave_requests').update({ user_id: au.id }).eq('user_id', matchingProfile.id);
            console.log(`   ✅ Migrated leaves`);
        }
        // ... tasks, payroll, etc.
        await supabase.from('tasks').update({ user_id: au.id }).eq('user_id', matchingProfile.id);
        await supabase.from('payroll').update({ user_id: au.id }).eq('user_id', matchingProfile.id);
        await supabase.from('performance').update({ user_id: au.id }).eq('user_id', matchingProfile.id);

        // 3. Delete old profile
        await supabase.from('profiles').delete().eq('id', matchingProfile.id);
        console.log(`   ✅ Deleted old profile record`);

        // 4. Optionally delete the old Auth account
        // const { error: delAuthErr } = await supabase.auth.admin.deleteUser(matchingProfile.id);
        // if (!delAuthErr) console.log(`   ✅ Deleted redundant Auth account ${matchingProfile.id}`);
    }
  }

  console.log("🏁 Consolidation complete.");
}

consolidateAll();
