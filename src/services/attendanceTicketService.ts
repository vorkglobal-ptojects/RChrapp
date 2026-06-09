import { supabase } from '../lib/supabase';
import { AttendanceTicket, AttendanceTicketStatus } from '../types';

export async function getTickets(userId?: string): Promise<AttendanceTicket[]> {
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

  return (data || []).map((d: any) => ({
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
      }
      if (ticket.type === 'Check-Out' || ticket.type === 'Both') {
        updatePayload.check_out = ticket.requested_check_out;
      }
      
      const { error: attUpdateErr } = await supabase
        .from('attendance')
        .update(updatePayload)
        .eq('id', attendanceData.id);
        
      if (attUpdateErr) throw attUpdateErr;
    } else {
      // Insert new record if it doesn't exist
      const { error: attInsertErr } = await supabase
        .from('attendance')
        .insert({
          user_id: ticket.user_id,
          date: ticket.date,
          check_in: ticket.type === 'Check-Out' ? new Date().toISOString() : ticket.requested_time,
          check_out: (ticket.type === 'Check-Out' || ticket.type === 'Both') ? ticket.requested_check_out : null,
          is_late: false,
          is_early_out: false
        });
        
      if (attInsertErr) throw attInsertErr;
    }
  }
}
