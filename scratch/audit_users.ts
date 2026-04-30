import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function generateReport() {
  console.log("Generating Audit Report...");

  const { data: { users: authUsers } } = await supabase.auth.admin.listUsers();
  const { data: profiles } = await supabase.from('profiles').select('*');
  const { data: attendance } = await supabase.from('attendance').select('user_id');
  const { data: leaves } = await supabase.from('leave_requests').select('user_id');
  const { data: tasks } = await supabase.from('tasks').select('user_id');

  const dataCounts = new Map<string, number>();
  [...(attendance || []), ...(leaves || []), ...(tasks || [])].forEach(r => {
    dataCounts.set(r.user_id, (dataCounts.get(r.user_id) || 0) + 1);
  });

  const report = authUsers.map(au => {
    const profile = profiles?.find(p => p.id === au.id);
    const count = dataCounts.get(au.id) || 0;
    
    // Check for "related" profile by fuzzy email match
    const relatedProfile = profiles?.find(p => {
        if (p.id === au.id) return false;
        const e1 = au.email?.toLowerCase().replace(/\./g, '') || '';
        const e2 = p.email.toLowerCase().replace(/\./g, '') || '';
        return e1.includes(e2) || e2.includes(e1);
    });

    return {
      email: au.email,
      id: au.id,
      hasProfile: !!profile,
      profileEmail: profile?.email,
      profileName: profile?.name,
      dataRecords: count,
      potentialMismatch: relatedProfile ? {
        email: relatedProfile.email,
        id: relatedProfile.id,
        name: relatedProfile.name
      } : null
    };
  });

  console.log(JSON.stringify(report, null, 2));
}

generateReport();
