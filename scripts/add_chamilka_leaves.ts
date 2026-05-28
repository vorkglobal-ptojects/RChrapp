import { supabase } from '../src/lib/supabase';

const USER_ID = '91d18bf1-1fd7-41f8-9a7b-c60a0b416fe5';
const USER_NAME = 'Chamilka Botheju';

async function addChamilkaLeaves() {
  const leaves = [
    {
      user_id: USER_ID,
      leave_type: 'Annual',
      start_date: '2026-02-14',
      end_date: '2026-02-14',
      reason: 'Full Day Leave',
      status: 'Approved',
      created_at: new Date().toISOString()
    },
    {
      user_id: USER_ID,
      leave_type: 'Annual',
      start_date: '2026-03-28',
      end_date: '2026-03-28',
      reason: 'Full Day Leave',
      status: 'Approved',
      created_at: new Date().toISOString()
    },
    {
      user_id: USER_ID,
      leave_type: 'Annual',
      start_date: '2026-02-21',
      end_date: '2026-02-21',
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
  console.log('Approved leaves added for Chamilka');

  // Update used_leaves
  // Total: 1.0 + 1.0 + 0.5 = 2.5 annual
  const newUsedLeaves = {
    sick: 0,
    short: 0,
    annual: 2.5,
    casual: 0
  };

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ used_leaves: newUsedLeaves })
    .eq('id', USER_ID);

  if (updateError) {
    console.error('Error updating balance:', updateError);
  } else {
    console.log('Leave balance updated for Chamilka');
  }
}

addChamilkaLeaves();
