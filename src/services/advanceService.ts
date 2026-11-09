import { supabase } from '../lib/supabase';
import { AdvanceRequest, UserProfile } from '../types';
import { isMainAdmin, isITTeamMember } from '../lib/utils';

export async function getAdvances(userId?: string, currentUser?: UserProfile | null): Promise<AdvanceRequest[]> {
  let query = supabase
    .from('advance_requests')
    .select('*, profiles:user_id(name, role, branch, photo_url), approver:approved_by(name)');
  
  if (userId) query = query.eq('user_id', userId);
  
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;

  let records = (data || []).map(d => ({
    id: d.id,
    userId: d.user_id,
    amount: Number(d.amount),
    reason: d.reason,
    status: d.status,
    approvedBy: (d.approver as any)?.name || d.approved_by,
    createdAt: d.created_at,
    updatedAt: d.updated_at,
    userName: (d.profiles as any)?.name || 'Unknown',
    userRole: (d.profiles as any)?.role || 'employee',
    userPhoto: (d.profiles as any)?.photo_url,
    branch: (d.profiles as any)?.branch
  }));

  if (currentUser && !isMainAdmin(currentUser)) {
    records = records.filter(a => !isITTeamMember(a) || a.userId === currentUser.uid);
  }

  return records;
}

export async function submitAdvance(advance: Partial<AdvanceRequest>): Promise<void> {
  const { error } = await supabase.from('advance_requests').insert({
    user_id: advance.userId,
    amount: advance.amount,
    reason: advance.reason,
    status: 'Pending'
  });
  if (error) throw error;
}

export async function updateAdvanceStatus(
  id: string,
  status: 'Approved' | 'Rejected',
  adminId: string,
  employeeId?: string,
  amount?: number
): Promise<void> {
  const { error: updateError } = await supabase
    .from('advance_requests')
    .update({ status, approved_by: adminId, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (updateError) throw updateError;

  // If approved and we have employeeId and amount, update the employee's profile advances and net salary
  if (status === 'Approved' && employeeId && amount) {
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('advances, salary_a, intensive, travelling, epf, cover')
      .eq('id', employeeId)
      .single();
    
    if (fetchError) throw fetchError;

    const currentAdvances = Number(profile.advances) || 0;
    const newAdvances = currentAdvances + Number(amount);

    const salaryA = Number(profile.salary_a) || 0;
    const intensive = Number(profile.intensive) || 0;
    const travelling = Number(profile.travelling) || 0;
    const epf = Number(profile.epf) || 0;
    const cover = Number(profile.cover) || 0;
    const newNet = salaryA + intensive + travelling - epf - newAdvances - cover;

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ advances: newAdvances, net: newNet })
      .eq('id', employeeId);
    
    if (profileError) throw profileError;
  }
}

export async function deleteAdvance(id: string): Promise<void> {
  const { error } = await supabase.from('advance_requests').delete().eq('id', id);
  if (error) throw error;
}
