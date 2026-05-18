import { supabase } from '../src/lib/supabase';

interface Profile {
  id: string;
  used_leaves: Record<string, number>;
}

async function getUserProfile(email: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, used_leaves')
    .eq('email', email)
    .single();
  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
  return data as Profile;
}

async function addApprovedLeaves(userId: string) {
  const leaves = [
    {
      user_id: userId,
      leave_type: 'Annual',
      start_date: '2026-02-27',
      end_date: '2026-02-27',
      start_time: null,
      end_time: null,
      reason: 'Taken full day',
      status: 'Approved',
    },
    {
      user_id: userId,
      leave_type: 'Short',
      start_date: '2026-02-26',
      end_date: '2026-02-26',
      start_time: '15:00',
      end_time: '17:30',
      reason: 'Taken short leave',
      status: 'Approved',
    },
    {
      user_id: userId,
      leave_type: 'Annual',
      start_date: '2026-04-03',
      end_date: '2026-04-03',
      start_time: null,
      end_time: null,
      reason: 'Taken full day',
      status: 'Approved',
    },
  ];
  const { error } = await supabase.from('leave_requests').insert(leaves);
  if (error) console.error('Insert leaves error:', error);
  else console.log('Approved leaves added');
}

async function updateLeaveBalance(profile: Profile) {
  const newUsed = {
    ...profile.used_leaves,
    annual: (profile.used_leaves?.annual || 0) + 2,
    short: (profile.used_leaves?.short || 0) + 1,
  };
  const { error } = await supabase
    .from('profiles')
    .update({ used_leaves: newUsed })
    .eq('id', profile.id);
  if (error) console.error('Update balance error:', error);
  else console.log('Leave balance updated');
}

async function main() {
  const email = 'dahami.divyanjali@hrpulse.com';
  const profile = await getUserProfile(email);
  if (!profile) return;
  await addApprovedLeaves(profile.id);
  await updateLeaveBalance(profile);
}

main().catch(console.error);
