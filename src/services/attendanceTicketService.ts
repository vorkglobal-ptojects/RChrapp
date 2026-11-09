import { supabase } from '../lib/supabase';
import { AttendanceTicket, AttendanceTicketStatus, UserProfile } from '../types';
import { isMainAdmin, isITTeamMember } from '../lib/utils';

export async function getTickets(userId?: string, currentUser?: UserProfile | null): Promise<AttendanceTicket[]> {
  let query = supabase.from('attendance_tickets').select(`
    *,
    user:user_id (
      name,
      branch
    )
  `);
  
  if (userId) {
    query = query.eq('user_id', userId);
  }
  
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;

  let records = (data || []).map((d: any) => ({
    id: d.id,
    userId: d.user_id,
    date: d.date,
    type: d.type,
    requestedTime: d.requested_time,
    requestedCheckOut: d.requested_check_out,
    reason: d.reason,
    status: d.status as AttendanceTicketStatus,
    approvedBy: d.approved_by,
    createdAt: d.created_at,
    updatedAt: d.updated_at,
    user: d.user
  }));

  if (currentUser && !isMainAdmin(currentUser)) {
    records = records.filter((t: any) => !isITTeamMember(t.user) || t.userId === currentUser.uid);
  }

  return records;
}

export async function createTicket(ticket: Omit<AttendanceTicket, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'user'>): Promise<void> {
  const { error } = await supabase.from('attendance_tickets').insert({
    user_id: ticket.userId,
    date: ticket.date,
    type: ticket.type,
    requested_time: ticket.requestedTime,
    requested_check_out: ticket.requestedCheckOut,
    reason: ticket.reason,
    status: 'Pending'
  });
  
  if (error) throw error;
}

export async function updateTicketStatus(ticketId: string, status: AttendanceTicketStatus, approverId: string): Promise<void> {
  // First update the ticket
  const { data: ticket, error: fetchError } = await supabase
    .from('attendance_tickets')
    .select('*')
    .eq('id', ticketId)
    .single();

  if (fetchError) throw fetchError;

  const { error: updateError } = await supabase
    .from('attendance_tickets')
    .update({
      status,
      approved_by: approverId,
      updated_at: new Date().toISOString()
    })
    .eq('id', ticketId);

  if (updateError) throw updateError;

  // If approved, apply the fix to the attendance table
  if (status === 'Approved' && ticket) {
    // Helper to calculate late/early
    const isTimeLate = (isoString: string) => {
      if (!isoString) return false;
      const date = new Date(isoString);
      const hour = date.getHours();
      const minute = date.getMinutes();
      return hour > 9 || (hour === 9 && minute > 10);
    };

    const isTimeEarlyOut = (isoString: string) => {
      if (!isoString) return false;
      const date = new Date(isoString);
      const hour = date.getHours();
      const minute = date.getMinutes();
      return hour < 17 || (hour === 17 && minute < 30);
    };

    // Check if attendance record exists for that date
    const { data: attendanceData } = await supabase
      .from('attendance')
      .select('*')
      .eq('user_id', ticket.user_id)
      .eq('date', ticket.date)
      .single();

    if (attendanceData) {
      // Update existing record
      const updatePayload: any = {};
      if (ticket.type === 'Check-In' || ticket.type === 'Both') {
        updatePayload.check_in = ticket.requested_time;
        updatePayload.is_late = isTimeLate(ticket.requested_time);
      }
      if (ticket.type === 'Check-Out' || ticket.type === 'Both') {
        updatePayload.check_out = ticket.requested_check_out;
        updatePayload.is_early_out = isTimeEarlyOut(ticket.requested_check_out);
      }
      
      const { error: attUpdateErr } = await supabase
        .from('attendance')
        .update(updatePayload)
        .eq('id', attendanceData.id);
        
      if (attUpdateErr) throw attUpdateErr;
    } else {
      // Insert new record if it doesn't exist
      const checkInTime = ticket.type === 'Check-Out' ? new Date().toISOString() : ticket.requested_time;
      const checkOutTime = (ticket.type === 'Check-Out' || ticket.type === 'Both') ? ticket.requested_check_out : null;

      const { error: attInsertErr } = await supabase
        .from('attendance')
        .insert({
          user_id: ticket.user_id,
          date: ticket.date,
          check_in: checkInTime,
          check_out: checkOutTime,
          is_late: isTimeLate(checkInTime),
          is_early_out: checkOutTime ? isTimeEarlyOut(checkOutTime) : false
        });
        
      if (attInsertErr) throw attInsertErr;
    }
  }
}
