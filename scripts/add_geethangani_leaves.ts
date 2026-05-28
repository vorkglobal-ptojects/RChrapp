import { supabase } from '../src/lib/supabase';

const USER_ID = 'c26ccde5-b278-4652-ac34-18859ceecc47';

async function addGeethanganiLeaves() {
  const leaves = [
    {
      user_id: USER_ID,
      leave_type: 'Short',
      start_date: '2026-01-28',
      end_date: '2026-01-28',
      start_time: '15:00',
      end_time: '17:30',
      reason: 'Short Leave',
      status: 'Approved',
      created_at: new Date().toISOString()
    },
    {
      user_id: USER_ID,
      leave_type: 'Short',
      start_date: '2026-02-03',
      end_date: '2026-02-03',
      start_time: '15:00',
      end_time: '17:30',
      reason: 'Short Leave',
      status: 'Approved',
      created_at: new Date().toISOString()
    }
  ];

  const { error: insertError } = await supabase.from('leave_requests').insert(leaves);
  if (insertError) {
    console.error('Error inserting leaves:', insertError);
    return;
  }
  console.log('Approved leaves added for Geethangani');

  // Update used_leaves
  // 2.5h + 2.5h = 5.0h = 5/8 = 0.625 days
  const newUsedLeaves = {
    sick: 0,
    short: 0.625,
    annual: 0,
    casual: 0
  };

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ used_leaves: newUsedLeaves })
    .eq('id', USER_ID);

  if (updateError) {
    console.error('Error updating balance:', updateError);
  } else {
    console.log('Leave balance updated for Geethangani');
  }
}

addGeethanganiLeaves();
