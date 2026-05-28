import { supabase } from '../lib/supabase';
import { UserProfile } from '../types';

export function mapProfile(data: any): UserProfile {
  return {
    uid: data.id,
    name: data.name,
    email: data.email,
    username: data.username,
    role: data.role,
    branch: data.branch,
    department: data.department,
    phone: data.phone,
    photoUrl: data.photo_url,
    status: data.status,
    joinDate: data.join_date,
    salaryA: Number(data.salary_a),
    salaryB: Number(data.salary_b),
    epf: Number(data.epf),
    advances: Number(data.advances),
    cover: Number(data.cover),
    intensive: Number(data.intensive),
    travelling: Number(data.travelling),
    net: Number(data.net),
    performanceScore: Number(data.performance_score),
    leaveQuotas: data.leave_quotas,
    usedLeaves: data.used_leaves,
    sortOrder: data.sort_order,
    bankName: data.bank_name,
    bankBranch: data.bank_branch,
    accountNo: data.account_no,
    accountHolderName: data.account_holder_name,
    nic: data.nic,
    nickname: data.nickname,
    extraDays: data.extra_days ? Number(data.extra_days) : 0
  };
}

export async function getEmployees(): Promise<UserProfile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('sort_order', { ascending: true });
  
  if (error) throw error;
  return (data || []).map(mapProfile);
}

export async function getEmployee(uid: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', uid)
    .single();
  
  if (error) return null;
  return mapProfile(data);
}

export async function saveEmployee(emp: UserProfile): Promise<void> {
  const { uid, ...data } = emp;
  const payload = {
    name: data.name,
    email: data.email,
    username: data.username,
    role: data.role,
    branch: data.branch,
    department: data.department,
    phone: data.phone,
    photo_url: data.photoUrl,
    status: data.status,
    join_date: data.joinDate,
    salary_a: data.salaryA,
    salary_b: data.salaryB,
    epf: data.epf,
    advances: data.advances,
    cover: data.cover,
    intensive: data.intensive,
    travelling: data.travelling,
    net: data.net,
    performance_score: data.performanceScore,
    leave_quotas: data.leaveQuotas,
    used_leaves: data.usedLeaves,
    sort_order: (data as any).sortOrder,
    bank_name: data.bankName || null,
    bank_branch: data.bankBranch || null,
    account_no: data.accountNo || null,
    account_holder_name: data.accountHolderName || null,
    nic: data.nic || null,
    nickname: data.nickname || null,
    extra_days: data.extraDays || 0
  };

  const { error } = await supabase.from('profiles').update(payload).eq('id', uid);
  if (error) throw error;
}

export async function updateProfileStatus(uid: string, status: UserProfile['status']): Promise<void> {
  const { error } = await supabase.from('profiles').update({ status }).eq('id', uid);
  if (error) throw error;
}

export async function deleteEmployee(uid: string): Promise<void> {
  const { error } = await supabase.from('profiles').delete().eq('id', uid);
  if (error) throw error;
}

export async function registerFullEmployee(emp: UserProfile, password?: string): Promise<void> {
  const finalPassword = password || 'employee123';
  
  // Use a temporary client for signUp to avoid changing the main session
  const { createClient } = await import('@supabase/supabase-js');
  const supabaseUrl = (import.meta as any).env.hrpulse_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = (import.meta as any).env.hrpulse_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  const tempSupabase = createClient(
    supabaseUrl,
    supabaseAnonKey,
    { auth: { persistSession: false } }
  );

  const { data: authData, error: authError } = await tempSupabase.auth.signUp({
    email: emp.email,
    password: finalPassword,
    options: {
      data: {
        name: emp.name,
        role: emp.role
      }
    }
  });

  if (authError) throw authError;
  if (!authData.user) throw new Error('Failed to create login account');

  // Find the current max sort order to append this employee to the end
  const { data: maxSortData } = await supabase
    .from('profiles')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1);
  
  const nextSortOrder = maxSortData && maxSortData[0] ? (maxSortData[0].sort_order + 1) : 1;

  const { error: profileError } = await supabase.from('profiles').insert({
    id: authData.user.id,
    name: emp.name,
    email: emp.email,
    username: emp.username,
    role: emp.role,
    branch: emp.branch,
    department: emp.department,
    phone: emp.phone,
    photo_url: emp.photoUrl,
    status: emp.status || 'Available',
    join_date: emp.joinDate,
    salary_a: emp.salaryA,
    salary_b: 0,
    epf: emp.epf,
    advances: emp.advances || 0,
    cover: emp.cover || 0,
    intensive: emp.intensive || 0,
    travelling: emp.travelling || 0,
    net: (emp.salaryA || 0) + (emp.intensive || 0) + (emp.travelling || 0) - (emp.epf || 0) - (emp.advances || 0) - (emp.cover || 0),
    performance_score: emp.performanceScore,
    leave_quotas: emp.leaveQuotas,
    used_leaves: emp.usedLeaves,
    sort_order: nextSortOrder,
    bank_name: emp.bankName || null,
    bank_branch: emp.bankBranch || null,
    account_no: emp.accountNo || null,
    account_holder_name: emp.accountHolderName || null,
    nic: emp.nic || null,
    nickname: emp.nickname || null,
    extra_days: emp.extraDays || 0
  });

  if (profileError) throw profileError;
}

export async function uploadAvatar(uid: string, file: File): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${uid}/avatar.${fileExt}`;
  const filePath = `${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, { 
      upsert: true,
      contentType: file.type 
    });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath);

  return data.publicUrl;
}
