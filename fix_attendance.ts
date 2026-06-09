import * as dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL as string;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function fixAttendance() {
  // Find Chamika's UID
  const { data: profiles, error: profileErr } = await supabase
    .from('profiles')
    .select('id, email, name')
    .ilike('name', '%Chamika%');

  if (profileErr) {
    console.error('Error fetching profile:', profileErr);
    return;
  }

  if (!profiles || profiles.length === 0) {
    console.log('No profile found for Chamika');
    return;
  }

  const userId = profiles[0].id;
  console.log('Found Chamika User ID:', userId);

  // Yesterday's date
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  const todayStr = today.toISOString().split('T')[0];

  // Set yesterday's checkout to 17:30
  const yesterdayCheckout = new Date(yesterdayStr + 'T17:30:00+05:30').toISOString();
  
  // Set today's checkin to 08:30
  const todayCheckin = new Date(todayStr + 'T08:30:00+05:30').toISOString();

  // Find yesterday's record
  const { data: yesterdayRecord } = await supabase
    .from('attendance')
    .select('*')
    .eq('user_id', userId)
    .eq('date', yesterdayStr)
    .single();

  if (yesterdayRecord) {
    const { error: updateErr } = await supabase
      .from('attendance')
      .update({ check_out: yesterdayCheckout })
      .eq('id', yesterdayRecord.id);
    if (updateErr) console.error('Error updating yesterday:', updateErr);
    else console.log('Updated yesterday checkout to 5:30 PM');
  } else {
    console.log('No attendance record found for yesterday');
  }

  // Find today's record
  const { data: todayRecord } = await supabase
    .from('attendance')
    .select('*')
    .eq('user_id', userId)
    .eq('date', todayStr)
    .single();

  if (todayRecord) {
    const { error: updateErr } = await supabase
      .from('attendance')
      .update({ check_in: todayCheckin, is_late: false })
      .eq('id', todayRecord.id);
    if (updateErr) console.error('Error updating today:', updateErr);
    else console.log('Updated today checkin to 8:30 AM');
  } else {
    // Insert today's record
    const { error: insertErr } = await supabase
      .from('attendance')
      .insert({
        user_id: userId,
        date: todayStr,
        check_in: todayCheckin,
        is_late: false,
        is_early_out: false
      });
    if (insertErr) console.error('Error inserting today:', insertErr);
    else console.log('Inserted today checkin');
  }
}

fixAttendance();
