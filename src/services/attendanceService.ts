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

  // Detect Sunday work reward on clock-in
  if (colomboNow.getDay() === 0) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('leave_quotas, extra_days')
        .eq('id', userId)
        .single();

      if (profile) {
        const quotas = profile.leave_quotas || { annual: 14, sick: 7, casual: 7, short: 8 };
        quotas.annual = (Number(quotas.annual) || 14) + 1;
        const currentExtraDays = (Number(profile.extra_days) || 0) + 1;

        // Try updating leave_quotas and extra_days
        const { error: upError } = await supabase
          .from('profiles')
          .update({
            leave_quotas: quotas,
            extra_days: currentExtraDays
          })
          .eq('id', userId);

        // Fallback: If extra_days column doesn't exist yet, update only leave_quotas
        if (upError && upError.message.includes('column "extra_days"')) {
          await supabase
            .from('profiles')
            .update({
              leave_quotas: quotas
            })
            .eq('id', userId);
        }
      }
    } catch (err) {
      console.error('Failed to reward Sunday leave quota on check in:', err);
    }
  }
}

export async function checkOut(userId: string): Promise<void> {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];

  // Rule: Early out if before 5:30 PM Colombo time
  const colomboNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Colombo' }));
  const isEarlyOut = colomboNow.getHours() < 17 || (colomboNow.getHours() === 17 && colomboNow.getMinutes() < 30);

  // Fetch existing attendance record first to ensure we only reward once
  const { data: existingAtt } = await supabase
    .from('attendance')
    .select('check_in, check_out')
    .eq('user_id', userId)
    .eq('date', dateStr)
    .single();

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
