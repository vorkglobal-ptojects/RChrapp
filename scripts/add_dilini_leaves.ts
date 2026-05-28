import { supabase } from '../src/lib/supabase';

const USER_ID = 'efc3760d-daf0-4ed6-9965-75c6f283a5e2';
const USER_NAME = 'Dilini Sanarathna';

async function addDiliniLeaves() {
  const leave = {
    user_id: USER_ID,
    leave_type: 'Annual',
    start_date: '2026-04-03',
    end_date: '2026-04-03',
    reason: 'Full Day Leave',
    status: 'Approved',
    created_at: new Date().toISOString()
  };

  const { error: insertError } = await supabase.from('leave_requests').insert([leave]);
  if (insertError) {
    console.error('Error inserting leave:', insertError);
    return;
  }
  console.log('Approved leave added for Dilini');

  // Update used_leaves
  const newUsedLeaves = {
    sick: 0,
    short: 0,
    annual: 1.0,
    casual: 0
  };

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ used_leaves: newUsedLeaves })
    .eq('id', USER_ID);

  if (updateError) {
    console.error('Error updating balance:', updateError);
  } else {
    console.log('Leave balance updated for Dilini');
  }
}

addDiliniLeaves();
