import { supabase } from '../src/lib/supabase';

const USER_ID = '1f5f23dd-c3e5-4aed-94a1-90c66ed7abc1';
const USER_NAME = 'D.A. Dilupa Thamari';

async function addDilupaLeaves() {
  const leaves = [
    {
      user_id: USER_ID,
      leave_type: 'Annual',
      start_date: '2026-01-31',
      end_date: '2026-01-31',
      start_time: '13:00',
      end_time: '17:30',
      reason: 'Half Day Leave',
      status: 'Approved',
      created_at: new Date().toISOString()
    },
    {
      user_id: USER_ID,
      leave_type: 'Annual',
      start_date: '2026-02-19',
      end_date: '2026-02-19',
      start_time: '13:00',
      end_time: '17:30',
      reason: 'Half Day Leave',
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
      start_date: '2026-03-16',
      end_date: '2026-03-16',
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
    }
  ];

  const { error: insertError } = await supabase.from('leave_requests').insert(leaves);
  if (insertError) {
    console.error('Error inserting leaves:', insertError);
    return;
  }
  console.log('Approved leaves added for Dilupa');

  // Update used_leaves
  // Current: {"sick":0,"short":0,"annual":2,"casual":0}
  // Adding: 1.5 (half days) + 2.0 (full days) = 3.5
  // New Total: 2 + 3.5 = 5.5
  const newUsedLeaves = {
    sick: 0,
    short: 0,
    annual: 5.5,
    casual: 0
  };

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ used_leaves: newUsedLeaves })
    .eq('id', USER_ID);

  if (updateError) {
    console.error('Error updating balance:', updateError);
  } else {
    console.log('Leave balance updated for Dilupa');
  }
}

addDilupaLeaves();
