import { supabase } from '../src/lib/supabase';

const USER_ID = 'f445ae9e-7af2-43e3-8b5f-8d61538a0bb6';
const USER_NAME = 'Chaseera Sulani';

async function addChaseeraLeaves() {
  const dates = [
    '2026-01-08', '2026-01-13', '2026-01-14', '2026-01-15', '2026-01-16',
    '2026-02-02', '2026-03-07', '2026-03-19', '2026-03-31', '2026-03-30',
    '2026-04-02', '2026-04-03', '2026-04-04'
  ];

  const leaves = dates.map(date => ({
    user_id: USER_ID,
    leave_type: 'Annual',
    start_date: date,
    end_date: date,
    reason: 'Full Day Leave',
    status: 'Approved',
    created_at: new Date().toISOString()
  }));

  const { error: insertError } = await supabase.from('leave_requests').insert(leaves);
  if (insertError) {
    console.error('Error inserting leaves:', insertError);
    return;
  }
  console.log('Approved leaves added for Chaseera');

  // Update used_leaves
  const newUsedLeaves = {
    sick: 0,
    short: 0,
    annual: 13.0,
    casual: 0
  };

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ used_leaves: newUsedLeaves })
    .eq('id', USER_ID);

  if (updateError) {
    console.error('Error updating balance:', updateError);
  } else {
    console.log('Leave balance updated for Chaseera');
  }
}

addChaseeraLeaves();
