import { supabase } from '../lib/supabase';
import { LeaveRequest } from '../types';

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
    isUrgent: d.is_urgent,
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
    is_urgent: leave.isUrgent,
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
  
  // Find pending leaves where end_date is today or in the past
  const { data: expired } = await supabase
    .from('leave_requests')
    .select('id')
    .eq('status', 'Pending')
    .lte('end_date', today);

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
