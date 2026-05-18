import { supabase } from '../src/lib/supabase';

const USER_ID = 'b4e0dbc1-c34e-4e26-b408-ae479a3c7a4c';

async function addErandiLeaves() {
  const leaves = [
    {
      user_id: USER_ID,
      leave_type: 'Annual',
      start_date: '2026-03-09',
      end_date: '2026-03-09',
      reason: 'Full Day Leave',
      status: 'Approved',
      created_at: new Date().toISOString()
    },
    {
      user_id: USER_ID,
      leave_type: 'Annual',
      start_date: '2026-03-17',
      end_date: '2026-03-17',
      start_time: '13:00',
      end_time: '17:30',
      reason: 'Half Day Leave',
      status: 'Approved',
      created_at: new Date().toISOString()
    },
    {
      user_id: USER_ID,
      leave_type: 'Annual',
      start_date: '2026-04-05',
      end_date: '2026-04-05',
      reason: 'Full Day Leave',
      status: 'Approved',
      created_at: new Date().toISOString()
    },
    {
      user_id: USER_ID,
      leave_type: 'Annual',
      start_date: '2026-04-23',
      end_date: '2026-04-23',
      start_time: '13:00',
      end_time: '17:30',
      reason: 'Half Day Leave',
      status: 'Approved',
      created_at: new Date().toISOString()
    }
  ];

  const { error: insertError } = await supabase.from('leave_requests').insert(leaves);
  if (insertError) {
    console.error('Error inserting leaves:', insertError);
    return;
  }
  console.log('Approved leaves added for Erandi');

  // Update used_leaves
  // 1.0 (existing) + 1.0 + 1.0 (full) + 0.5 + 0.5 (half) = 4.0 annual
  const newUsedLeaves = {
    sick: 0,
    short: 0,
    annual: 4.0,
    casual: 0
  };

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ used_leaves: newUsedLeaves })
    .eq('id', USER_ID);

  if (updateError) {
    console.error('Error updating balance:', updateError);
  } else {
    console.log('Leave balance updated for Erandi');
  }
}

addErandiLeaves();
