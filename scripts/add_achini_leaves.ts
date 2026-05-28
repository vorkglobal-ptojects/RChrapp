import { supabase } from '../src/lib/supabase';

const USER_ID = 'c63433d3-2484-456f-892f-9ce047b6ad5e';
const USER_NAME = 'Achini Vindya';
const USER_EMAIL = 'achini.vindya@hrpulse.com';

async function addAchiniLeaves() {
  const leaves = [
    {
      user_id: USER_ID,
      leave_type: 'Annual',
      start_date: '2026-01-14',
      end_date: '2026-01-14',
      start_time: '13:00',
      end_time: '17:30',
      reason: 'Half Day Leave',
      status: 'Approved',
      created_at: new Date().toISOString()
    },
    {
      user_id: USER_ID,
      leave_type: 'Annual',
      start_date: '2026-03-24',
      end_date: '2026-03-24',
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
  console.log('Approved leaves added for Achini');

  // Update used_leaves
  // Current: {"sick":0,"short":0.25,"annual":0,"casual":0}
  // Adding 1.0 (Full day) + 0.5 (Half day) = 1.5 to annual
  const newUsedLeaves = {
    sick: 0,
    short: 0.25,
    annual: 1.5,
    casual: 0
  };

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ used_leaves: newUsedLeaves })
    .eq('id', USER_ID);

  if (updateError) {
    console.error('Error updating balance:', updateError);
  } else {
    console.log('Leave balance updated for Achini');
  }
}

addAchiniLeaves();
