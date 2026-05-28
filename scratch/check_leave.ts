import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function run() {
  // Find ALL Rejected leaves with no approver (= Unapproved) from May 25
  const { data: leaves, error } = await supabase
    .from('leave_requests')
    .select('id, user_id, status, approved_by, start_date, leave_type, profiles:user_id(name)')
    .eq('status', 'Rejected')
    .is('approved_by', null);

  if (error) { console.error('Error:', error); return; }
  console.log('All Unapproved leaves (Rejected + no approver):');
  console.log(JSON.stringify(leaves, null, 2));

  if (!leaves || leaves.length === 0) {
    console.log('No unapproved leaves found!');
    return;
  }

  // Update ALL of them to Pending
  for (const leave of leaves) {
    const { error: upErr } = await supabase
      .from('leave_requests')
      .update({ status: 'Pending', approved_by: null })
      .eq('id', leave.id);

    if (upErr) {
      console.error(`Failed to update leave ${leave.id}:`, upErr.message);
    } else {
      console.log(`✅ Reverted leave ${leave.id} (${(leave.profiles as any)?.name}) to Pending`);
    }
  }
}

run();
