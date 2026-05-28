import { supabase } from '../src/lib/supabase';

const USER_ID = '9ab5246e-3b3c-462a-bed4-d92d8088ec88';

async function addChamikaLeaves() {
  const leaves = [
    {
      user_id: USER_ID,
      leave_type: 'Annual',
      start_date: '2026-02-04',
      end_date: '2026-02-04',
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
  console.log('Approved leaves added for Chamika Bothogu');

  // Update used_leaves
  // 1.0 (Feb 4) + 0.5 (Feb 21) + 1.0 (Mar 28) = 2.5 annual
  const { data: prof } = await supabase.from('profiles').select('used_leaves').eq('id', USER_ID).single();
  
  const currentAnnual = (prof?.used_leaves?.annual || 0);
  const newUsedLeaves = {
    ...(prof?.used_leaves || {}),
    annual: currentAnnual + 2.5
  };

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ used_leaves: newUsedLeaves })
    .eq('id', USER_ID);

  if (updateError) {
    console.error('Error updating balance:', updateError);
  } else {
    console.log('Leave balance updated for Chamika Bothogu:', newUsedLeaves);
  }
}

addChamikaLeaves();
