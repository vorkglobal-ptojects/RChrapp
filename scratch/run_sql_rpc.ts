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
  console.log('Reverting unapproved leave for Tharushi Apsara...');
  try {
    const { data: users, error: userError } = await supabase
      .from('profiles')
      .select('id, name')
      .ilike('name', '%Tharushi Apsara%');

    if (userError) throw userError;
    
    if (!users || users.length === 0) {
      console.log('User Tharushi Apsara not found.');
      return;
    }

    const userId = users[0].id;

    const { data: updateData, error: updateError } = await supabase
      .from('leave_requests')
      .update({ status: 'Pending', approved_by: null })
      .eq('user_id', userId)
      .eq('start_date', '2026-05-25')
      .eq('status', 'Rejected');

    if (updateError) throw updateError;

    console.log('Successfully reverted leave to Pending!');
  } catch (err: any) {
    console.error('Exception:', err.message);
  }
}

run();
