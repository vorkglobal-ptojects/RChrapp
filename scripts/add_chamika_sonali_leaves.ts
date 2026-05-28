import { supabase } from '../src/lib/supabase';

const USER_ID = '5ffa73e0-09d0-43d0-9ac6-c169406f3d53';
const USER_NAME = 'A.V. Chamika Sonali';

async function addChamikaSonaliLeaves() {
  const leaves = [
    {
      user_id: USER_ID,
      leave_type: 'Annual',
      start_date: '2026-01-23',
      end_date: '2026-01-23',
      reason: 'Full Day Leave',
      status: 'Approved',
      created_at: new Date().toISOString()
    },
    {
      user_id: USER_ID,
      leave_type: 'Annual',
      start_date: '2026-02-23',
      end_date: '2026-02-23',
      reason: 'Full Day Leave',
      status: 'Approved',
      created_at: new Date().toISOString()
    },
    {
      user_id: USER_ID,
      leave_type: 'Annual',
      start_date: '2026-03-25',
      end_date: '2026-03-25',
      reason: 'Full Day Leave',
      status: 'Approved',
      created_at: new Date().toISOString()
    },
    {
      user_id: USER_ID,
      leave_type: 'Annual',
      start_date: '2026-04-27',
      end_date: '2026-04-27',
      reason: 'Full Day Leave',
      status: 'Approved',
      created_at: new Date().toISOString()
    },
    {
      user_id: USER_ID,
      leave_type: 'Short',
      start_date: '2026-03-09',
      end_date: '2026-03-09',
      start_time: '15:00',
      end_time: '17:30',
      reason: 'Short Leave',
      status: 'Approved',
      created_at: new Date().toISOString()
    },
    {
      user_id: USER_ID,
      leave_type: 'Annual',
      start_date: '2026-01-27',
      end_date: '2026-01-27',
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
  console.log('Approved leaves added for Chamika Sonali');

  // Update used_leaves
  // Annual: 1.0*4 + 0.5 = 4.5
  // Short: 2.5/8 = 0.3125
  const newUsedLeaves = {
    sick: 0,
    short: 0.3125,
    annual: 4.5,
    casual: 0
  };

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ used_leaves: newUsedLeaves })
    .eq('id', USER_ID);

  if (updateError) {
    console.error('Error updating balance:', updateError);
  } else {
    console.log('Leave balance updated for Chamika Sonali');
  }
}

addChamikaSonaliLeaves();
