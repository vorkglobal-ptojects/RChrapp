import { supabase } from '../lib/supabase';
import { LeaveRequest } from '../types';
import { calculateLeaveDays } from '../lib/utils';

export async function getLeaves(userId?: string): Promise<LeaveRequest[]> {
  let query = supabase
    .from('leave_requests')
    .select('*, profiles:user_id(name, role, photo_url), approver:approved_by(name)');

  if (userId) query = query.eq('user_id', userId);

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;

  return (data || []).map(d => ({
    id: d.id,
    userId: d.user_id,
    leaveType: d.leave_type,
    startDate: d.start_date,
    endDate: d.end_date,
    startTime: d.start_time,
    endTime: d.end_time,
    reason: d.reason,
    status: d.status,
    approvedBy: (d.approver as any)?.name || d.approved_by,
    isQuotaExceeded: d.is_quota_exceeded,
    imageUrl: d.image_url,
    createdAt: d.created_at,
    userName: (d.profiles as any)?.name || 'Unknown',
    userRole: (d.profiles as any)?.role || 'employee',
    userPhoto: (d.profiles as any)?.photo_url
  }));
}

export async function submitLeave(leave: Partial<LeaveRequest>): Promise<void> {
  const { error } = await supabase.from('leave_requests').insert({
    user_id: leave.userId,
    leave_type: leave.leaveType,
    start_date: leave.startDate,
    end_date: leave.endDate,
    start_time: leave.startTime,
    end_time: leave.endTime,
    reason: leave.reason,
    status: 'Pending',
    is_quota_exceeded: leave.isQuotaExceeded,
    image_url: leave.imageUrl
  });
  if (error) throw error;
}

export async function updateLeaveStatus(id: string, status: 'Approved' | 'Rejected', adminId: string): Promise<void> {
  const { error } = await supabase
    .from('leave_requests')
    .update({ status, approved_by: adminId, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteLeave(id: string): Promise<void> {
  const { error } = await supabase.from('leave_requests').delete().eq('id', id);
  if (error) throw error;
}

export async function rejectExpiredLeaves(): Promise<void> {
  const today = new Date().toISOString().split('T')[0];

  // Find pending leaves where end_date is strictly in the past (NOT today)
  const { data: expired } = await supabase
    .from('leave_requests')
    .select('id')
    .eq('status', 'Pending')
    .lt('end_date', today);

  if (expired && expired.length > 0) {
    const ids = expired.map(l => l.id);
    await supabase
      .from('leave_requests')
      .update({
        status: 'Rejected',
        updated_at: new Date().toISOString()
      })
      .in('id', ids);

    console.log(`System: Auto-rejected ${expired.length} expired leave requests.`);
  }
}

export async function getMonthlyLeaveTotal(userId: string, month: number, year: number): Promise<number> {
  // Fetch all leaves for this user in the specified month
  const { data, error } = await supabase
    .from('leave_requests')
    .select('*')
    .eq('user_id', userId)
    .in('status', ['Pending', 'Approved']); // Consider both pending and approved towards the limit

  if (error) {
    console.error('Error fetching monthly leaves:', error);
    return 0;
  }

  let totalDays = 0;
  for (const req of data || []) {
    const [reqYear, reqMonth] = req.start_date.split('-').map(Number);
    if (reqMonth - 1 === month && reqYear === year) {
      totalDays += calculateLeaveDays(req.leave_type, req.start_date, req.end_date, req.start_time, req.end_time);
    }
  }
  return totalDays;
}

export async function approveLeaveRequest(req: LeaveRequest, adminId: string): Promise<void> {
  if (!req.id) throw new Error('Leave request ID is missing');

  // 1. Update status to Approved
  const { error: updateError } = await supabase
    .from('leave_requests')
    .update({ status: 'Approved', approved_by: adminId, updated_at: new Date().toISOString() })
    .eq('id', req.id);

  if (updateError) throw updateError;

  // 2. Fetch current profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('used_leaves, extra_days')
    .eq('id', req.userId)
    .single();

  if (profileError) throw profileError;

  // 3. Update used leaves
  const usedLeaves = profile?.used_leaves || { annual: 0, sick: 0, casual: 0, short: 0 };
  const leaveTypeKey = req.leaveType.toLowerCase() as keyof typeof usedLeaves;
  const daysTaken = calculateLeaveDays(req.leaveType, req.startDate, req.endDate, req.startTime, req.endTime);

  usedLeaves[leaveTypeKey] = (usedLeaves[leaveTypeKey] || 0) + daysTaken;

  const { error: profileUpdateError } = await supabase
    .from('profiles')
    .update({ used_leaves: usedLeaves })
    .eq('id', req.userId);

  if (profileUpdateError) throw profileUpdateError;
}

export async function cancelApprovedLeave(req: LeaveRequest, adminId: string): Promise<void> {
  if (!req.id) throw new Error('Leave request ID is missing');

  // 1. Update status to Cancelled
  const { error: updateError } = await supabase
    .from('leave_requests')
    .update({ status: 'Cancelled', approved_by: adminId, updated_at: new Date().toISOString() })
    .eq('id', req.id);

  if (updateError) throw updateError;

  // 2. Fetch current profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('used_leaves, extra_days')
    .eq('id', req.userId)
    .single();

  if (profileError) throw profileError;

  // 3. Update used leaves
  const usedLeaves = profile?.used_leaves || { annual: 0, sick: 0, casual: 0, short: 0 };
  const leaveTypeKey = req.leaveType.toLowerCase() as keyof typeof usedLeaves;
  const daysTaken = calculateLeaveDays(req.leaveType, req.startDate, req.endDate, req.startTime, req.endTime);

  usedLeaves[leaveTypeKey] = Math.max(0, (usedLeaves[leaveTypeKey] || 0) - daysTaken);

  const { error: profileUpdateError } = await supabase
    .from('profiles')
    .update({ used_leaves: usedLeaves })
    .eq('id', req.userId);

  if (profileUpdateError) throw profileUpdateError;
}
