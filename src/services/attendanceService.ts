import { supabase } from '../lib/supabase';
import { AttendanceRecord } from '../types';

/**
 * Helper to get current time in Asia/Colombo for display, 
 * but always use UTC for storage in DB.
 */
export function getColomboTime(date: Date = new Date()): string {
  return date.toLocaleString('en-US', { timeZone: 'Asia/Colombo' });
}

export async function getAttendance(userId?: string): Promise<AttendanceRecord[]> {
  let query = supabase.from('attendance').select('*');
  if (userId) query = query.eq('user_id', userId);
  
  const { data, error } = await query.order('date', { ascending: false });
  if (error) throw error;

  return (data || []).map(d => ({
    id: d.id,
    userId: d.user_id,
    date: d.date,
    checkIn: d.check_in,
    checkOut: d.check_out,
    isLate: d.is_late,
    isEarlyOut: d.is_early_out
  }));
}

export async function checkIn(userId: string): Promise<void> {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  
  // Rule: Late if after 9:10 AM Colombo time
  const colomboNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Colombo' }));
  const isLate = colomboNow.getHours() > 9 || (colomboNow.getHours() === 9 && colomboNow.getMinutes() > 10);

  const { error } = await supabase.from('attendance').insert({
    user_id: userId,
    date: dateStr,
    check_in: now.toISOString(),
    is_late: isLate
  });
  
  if (error) throw error;
}

export async function checkOut(userId: string): Promise<void> {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];

  // Rule: Early out if before 5:30 PM Colombo time
  const colomboNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Colombo' }));
  const isEarlyOut = colomboNow.getHours() < 17 || (colomboNow.getHours() === 17 && colomboNow.getMinutes() < 30);

  const { error } = await supabase
    .from('attendance')
    .update({
      check_out: now.toISOString(),
      is_early_out: isEarlyOut
    })
    .eq('user_id', userId)
    .eq('date', dateStr);
    
  if (error) throw error;
}
