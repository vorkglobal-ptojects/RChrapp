import { supabase } from '../lib/supabase';
export { supabase };
import { UserProfile, AttendanceRecord, LeaveRequest, Task, PayrollRecord, PerformanceRecord } from '../types';

// ─── Helpers ────────────────────────────────────────────────────────────────

export const EMPLOYEE_ORDER = [
  "Dahami Divyanjali",
  "Achini Vindya",
  "Dilini Sanarathna",
  "Chamilka Botheju",
  "A.V. Chamika Sonali",
  "D.A. Dilupa Thamari",
  "Harsha Thamali",
  "Sachini Nirasha",
  "Chaseera Sulani",
  "Geethangani Pieris",
  "W.K. Erandathi Perera",
  "W.A. Chandima Dilrukishi",
  "Rasika Priyangani",
  "A.M.N. Sanjana",
  "R.P. Ratnayake",
  "Nihal Malawana",
  "Syamalie Udumulla",
  "Nishanthi Kuruppu",
  "Nadeesha Dilhara",
  "Chathurika Madushani",
  "Maneesha H. Dias",
  "Imashi Pramodaya",
  "Aruni Indrachapa",
  "Tharushi Sadumini",
  "Lakshika Perera",
  "Tharushi Apsara",
  "D.M. Nilukshi Kawshalya",
  "Dilki Isanka"
];

function mapProfile(data: any): UserProfile {
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
  };
}

// ─── Employees / Users ───────────────────────────────────────────────────────

export async function getEmployees(): Promise<UserProfile[]> {
  const { data, error } = await supabase.from('profiles').select('*');
  if (error) throw error;
  
  const mapped = (data || []).map(mapProfile);
  
  return mapped.sort((a, b) => {
    // Sort logic: Owner/Super first, then HR, then the provided list
    const getScore = (p: UserProfile) => {
      if (p.role === 'owner') return -20;
      if (p.role === 'super') return -10;
      if (p.role === 'hr') return 0;
      const idx = EMPLOYEE_ORDER.indexOf(p.name);
      return idx === -1 ? 999 : idx + 1;
    };
    return getScore(a) - getScore(b);
  });
}

export async function getEmployee(uid: string): Promise<UserProfile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', uid).single();
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
    salary_b: 0,
    epf: data.epf,
    advances: data.advances || 0,
    cover: data.cover || 0,
    intensive: data.intensive || 0,
    travelling: data.travelling || 0,
    net: (data.salaryA || 0) + (data.intensive || 0) + (data.travelling || 0) - (data.epf || 0) - (data.advances || 0) - (data.cover || 0),
    performance_score: data.performanceScore,
    leave_quotas: data.leaveQuotas,
    used_leaves: data.usedLeaves,
    updated_at: new Date().toISOString(),
  };

  // We check for existence first so standard users (who can only UPDATE their own profile) 
  // don't try to INSERT (upsert triggers INSERT permission check in Supabase).
  const { data: existing } = await supabase.from('profiles').select('id').eq('id', uid).maybeSingle();
  
  if (existing) {
    const { error } = await supabase.from('profiles').update(payload).eq('id', uid);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('profiles').insert({ id: uid, ...payload });
    if (error) throw error;
  }
}

export async function deleteEmployee(uid: string): Promise<void> {
  const { error } = await supabase.from('profiles').delete().eq('id', uid);
  if (error) throw error;
}

export async function registerFullEmployee(emp: UserProfile, password?: string): Promise<void> {
  const finalPassword = password || 'employee123';
  
  // Supabase Auth handles user creation. 
  // Note: signUp creates a user in auth.users and triggers RLS/Triggers if set up.
  // In our case, we also need to manually insert into public.profiles if no trigger exists.
  const { data: authData, error: authError } = await supabase.auth.signUp({
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

  // Insert profile record
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
  });

  if (profileError) throw profileError;
}

export async function uploadAvatar(uid: string, file: File): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${uid}/avatar.${fileExt}`;
  const filePath = `${fileName}`;

  // 1. Upload the file
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, { 
      upsert: true,
      contentType: file.type 
    });

  if (uploadError) throw uploadError;

  // 2. Get the public URL
  const { data } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath);

  return data.publicUrl;
}

export async function addIncentiveDeduction(
  uid: string, amount: number, type: 'incentive' | 'deduction'
): Promise<boolean> {
  const emp = await getEmployee(uid);
  if (!emp) return false;

  const field = type === 'incentive' ? 'intensive' : 'advances';
  const updated = {
    ...emp,
    [field]: (emp[field] || 0) + amount,
  };
  updated.net = (updated.salaryA || 0) + (updated.intensive || 0) + (updated.travelling || 0) 
    - 2400 - (updated.advances || 0) - (updated.cover || 0);

  await saveEmployee(updated);
  return true;
}

// ─── Attendance ──────────────────────────────────────────────────────────────

export async function getAttendance(uid?: string): Promise<AttendanceRecord[]> {
  let query = supabase.from('attendance').select('*').order('date', { ascending: false });
  if (uid) {
    query = query.eq('user_id', uid);
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(d => ({
    id: d.id.toString(),
    userId: d.user_id,
    date: d.date,
    checkIn: d.check_in,
    checkOut: d.check_out,
    isLate: d.is_late,
    isEarlyOut: d.is_early_out
  }));
}

export async function saveAttendance(record: Omit<AttendanceRecord, 'id'>): Promise<string> {
  const { data, error } = await supabase.from('attendance').insert({
    user_id: record.userId,
    date: record.date,
    check_in: record.checkIn,
    check_out: record.checkOut,
    is_late: record.isLate,
    is_early_out: record.isEarlyOut
  }).select().single();
  
  if (error) throw error;
  return data.id.toString();
}

export async function updateAttendance(id: string, updates: Partial<AttendanceRecord>): Promise<void> {
  const { error } = await supabase.from('attendance').update({
    check_out: updates.checkOut,
    is_early_out: updates.isEarlyOut
  }).eq('id', id);
  if (error) throw error;
}

function getLocalToday(): string {
  return new Intl.DateTimeFormat('en-CA', { 
    timeZone: 'Asia/Colombo', 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit' 
  }).format(new Date());
}

export async function checkIn(uid: string): Promise<boolean> {
  const today = getLocalToday();
  const existing = await getAttendance(uid);
  if (existing.find(a => a.date === today)) return false;

  const now = new Date();
  const slTime = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Colombo',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false
  }).format(now);
  
  const [hours, minutes] = slTime.split(':').map(Number);
  const isLate = hours > 9 || (hours === 9 && minutes > 10);
  
  await saveAttendance({ 
    userId: uid, 
    date: today, 
    checkIn: now.toISOString(), 
    isLate, 
    isEarlyOut: false 
  });
  return true;
}

export async function checkOut(uid: string): Promise<boolean> {
  const today = getLocalToday();
  const all = await getAttendance(uid);
  const existing = all.find(a => a.date === today && !a.checkOut);
  if (!existing?.id) return false;

  const now = new Date();
  const slTime = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Colombo',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false
  }).format(now);
  
  const [hours, minutes] = slTime.split(':').map(Number);
  const isEarlyOut = hours < 17 || (hours === 17 && minutes < 15);
  
  await updateAttendance(existing.id, { 
    checkOut: now.toISOString(), 
    isEarlyOut 
  });
  return true;
}

// ─── Leave Requests ──────────────────────────────────────────────────────────

export async function getLeaves(uid?: string): Promise<LeaveRequest[]> {
  // Join with profiles to get the user's name and role
  let query = supabase
    .from('leave_requests')
    .select(`
      *,
      requester:user_id (
        name,
        role
      ),
      approver:approved_by (
        name,
        role
      )
    `)
    .order('created_at', { ascending: false });

  if (uid) {
    query = query.eq('user_id', uid);
  }
  const { data, error } = await query;
  if (error) throw error;
  
  return (data || []).map(d => {
    const requester = d.requester as any;
    const approver = d.approver as any;
    return {
      id: d.id.toString(),
      userId: d.user_id,
      userName: requester?.name || 'Unknown',
      userRole: requester?.role || 'employee',
      leaveType: d.leave_type,
      startDate: d.start_date,
      endDate: d.end_date,
      startTime: d.start_time,
      endTime: d.end_time,
      reason: d.reason,
      status: d.status,
      approvedBy: approver ? `${approver.name} (${approver.role.toUpperCase()})` : d.approved_by,
      createdAt: d.created_at,
      isUrgent: d.is_urgent,
      imageUrl: d.image_url
    } as LeaveRequest;
  });
}

export async function saveLeave(req: Omit<LeaveRequest, 'id'>): Promise<string> {
  const { data, error } = await supabase.from('leave_requests').insert({
    user_id: req.userId,
    leave_type: req.leaveType,
    start_date: req.startDate,
    end_date: req.endDate,
    start_time: req.startTime,
    end_time: req.endTime,
    reason: req.reason,
    status: req.status,
    is_urgent: req.isUrgent,
    image_url: req.imageUrl
  }).select().single();
  
  if (error) throw error;
  return data.id.toString();
}

export async function updateLeave(
  id: string, status: 'Approved' | 'Rejected', approvedBy: string
): Promise<void> {
  // 1. Get the request details first
  const { data: req, error: fetchError } = await supabase
    .from('leave_requests')
    .select('*')
    .eq('id', id)
    .single();
  
  if (fetchError) throw fetchError;

  // 2. Update the status
  const { error } = await supabase.from('leave_requests').update({ 
    status, 
    approved_by: approvedBy,
    updated_at: new Date().toISOString()
  }).eq('id', id);
  if (error) throw error;

  // 3. Sync the user's used leaves balance
  await syncLeaveBalance(req.user_id);
}

export async function deleteLeave(id: string): Promise<void> {
  // Get request details first to know the userId
  const { data: req } = await supabase.from('leave_requests').select('user_id').eq('id', id).single();
  
  const { error } = await supabase.from('leave_requests').delete().eq('id', id);
  if (error) throw error;

  // Sync balance after deletion
  if (req?.user_id) {
    await syncLeaveBalance(req.user_id);
  }
}

export async function syncLeaveBalance(userId: string): Promise<void> {
  // Fetch all approved leaves for this user
  const { data: leaves, error: fetchError } = await supabase
    .from('leave_requests')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'Approved');

  if (fetchError) throw fetchError;

  const used = { annual: 0, sick: 0, casual: 0, short: 0 };
  
  (leaves || []).forEach(req => {
    const start = new Date(req.start_date);
    const end = new Date(req.end_date);
    let diffDays = 0;

    if (req.leave_type === 'Short') {
      // Calculate hours between startTime and endTime
      const [h1, m1] = (req.start_time || '09:00').split(':').map(Number);
      const [h2, m2] = (req.end_time || '17:00').split(':').map(Number);
      const totalMinutes = (h2 * 60 + m2) - (h1 * 60 + m1);
      const hours = Math.max(0, totalMinutes / 60);
      diffDays = hours / 8; // Assume 8 working hours = 1 day
    } else {
      diffDays = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    }
    
    const typeKey = req.leave_type.toLowerCase() as keyof typeof used;
    if (used.hasOwnProperty(typeKey)) {
      used[typeKey] += diffDays;
    }
  });

  // Update profile with the recalculated total
  await supabase.from('profiles').update({ used_leaves: used }).eq('id', userId);
}

export async function deleteAttendance(id: string): Promise<void> {
  const { error } = await supabase.from('attendance').delete().eq('id', id);
  if (error) throw error;
}

export async function updateLeaveRequest(id: string, req: Partial<LeaveRequest>): Promise<void> {
  const payload: any = {};
  if (req.leaveType) payload.leave_type = req.leaveType;
  if (req.startDate) payload.start_date = req.startDate;
  if (req.endDate) payload.end_date = req.endDate;
  if (req.startTime) payload.start_time = req.startTime;
  if (req.endTime) payload.end_time = req.endTime;
  if (req.reason) payload.reason = req.reason;
  if (req.status) payload.status = req.status;
  if (req.isUrgent !== undefined) payload.is_urgent = req.isUrgent;
  if (req.imageUrl) payload.image_url = req.imageUrl;
  
  payload.updated_at = new Date().toISOString();

  const { error } = await supabase.from('leave_requests').update(payload).eq('id', id);
  if (error) throw error;

  // Sync balance if we have the userId (we might need to fetch it if not provided in req)
  if (req.userId) {
    await syncLeaveBalance(req.userId);
  } else {
    const { data: existing } = await supabase.from('leave_requests').select('user_id').eq('id', id).single();
    if (existing?.user_id) {
      await syncLeaveBalance(existing.user_id);
    }
  }
}

// ─── Tasks ───────────────────────────────────────────────────────────────────

export async function getTasks(uid: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', uid)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(d => ({
    id: d.id.toString(),
    userId: d.user_id,
    title: d.title,
    completed: d.completed,
    createdAt: d.created_at
  }));
}

export async function saveTask(task: Omit<Task, 'id'>): Promise<string> {
  const { data, error } = await supabase.from('tasks').insert({
    user_id: task.userId,
    title: task.title,
    completed: task.completed
  }).select().single();
  if (error) throw error;
  return data.id.toString();
}

export async function toggleTask(id: string): Promise<void> {
  const { data: task, error: fetchError } = await supabase.from('tasks').select('completed').eq('id', id).single();
  if (fetchError) throw fetchError;
  const { error } = await supabase.from('tasks').update({ completed: !task.completed }).eq('id', id);
  if (error) throw error;
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) throw error;
}

// ─── Payroll ─────────────────────────────────────────────────────────────────

export async function getPayroll(uid?: string): Promise<PayrollRecord[]> {
  const employees = await getEmployees();
  
  let query = supabase
    .from('payroll')
    .select('*, prof:profiles(name, role), profiles(name, role)')
    .order('created_at', { ascending: false });
    
  if (uid) {
    query = query.eq('user_id', uid);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  
  return (data || []).map(d => {
    // Try multiple possible join keys from Supabase
    const rawProfile = d.prof || d.profiles;
    const profile = Array.isArray(rawProfile) ? rawProfile[0] : rawProfile;
    
    // Final fallback: If join failed, look up in the employees list we fetched earlier
    let name = (profile as any)?.name;
    if (!name) {
      const match = employees.find(e => e.uid === d.user_id);
      name = match?.name;
    }

    return {
      id: d.id.toString(),
      userId: d.user_id,
      userName: name || 'Unknown',
      month: d.month,
      year: d.year,
      salaryA: Number(d.salary_a),
      salaryB: Number(d.salary_b),
      epf: Number(d.epf),
      advances: Number(d.advances),
      cover: Number(d.cover),
      intensive: Number(d.intensive),
      travelling: Number(d.travelling),
      netSalary: Number(d.net_salary),
      createdAt: d.created_at,
      role: (profile as any)?.role
    };
  });

  // Apply custom sorting
  return mapped.sort((a, b) => {
    const getScore = (name: string, role?: string) => {
      if (role === 'owner') return -20;
      if (role === 'super') return -10;
      if (role === 'hr') return 0;
      const idx = EMPLOYEE_ORDER.indexOf(name);
      return idx === -1 ? 999 : idx + 1;
    };
    const scoreA = getScore(a.userName, (a as any).role);
    const scoreB = getScore(b.userName, (b as any).role);
    return scoreA - scoreB;
  });
}

export async function generatePayroll(month: number, year: number): Promise<void> {
  const employees = await getEmployees();
  const { data: existing, error: pError } = await supabase.from('payroll').select('user_id').eq('month', month).eq('year', year);
  if (pError) throw pError;

  for (const emp of employees) {
    // Skip payroll generation for super and owner, but include HR
    if (['super', 'owner'].includes(emp.role)) continue;
    
    const exists = existing?.find(p => p.user_id === emp.uid);
    if (!exists) {
      const epf = Number(emp.epf); // Use the EPF from the employee's profile
      const { error } = await supabase.from('payroll').insert({
        user_id: emp.uid,
        month,
        year,
        salary_a: emp.salaryA,
        salary_b: 0,
        epf,
        advances: emp.advances || 0,
        cover: emp.cover || 0,
        intensive: emp.intensive || 0,
        travelling: emp.travelling || 0,
        net_salary: (emp.salaryA || 0) + (emp.intensive || 0) + (emp.travelling || 0) - epf - (emp.advances || 0) - (emp.cover || 0),
        status: 'Pending',
        branch: emp.branch
      });
      if (error) console.error(`Failed to generate payroll for ${emp.uid}`, error);
    }
  }
}

export async function updatePayroll(id: string, updates: Partial<PayrollRecord>): Promise<void> {
  const payload: any = {};
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.salaryA !== undefined) payload.salary_a = updates.salaryA;
  if (updates.salaryB !== undefined) payload.salary_b = updates.salaryB;
  if (updates.epf !== undefined) payload.epf = updates.epf;
  if (updates.advances !== undefined) payload.advances = updates.advances;
  if (updates.cover !== undefined) payload.cover = updates.cover;
  if (updates.intensive !== undefined) payload.intensive = updates.intensive;
  if (updates.travelling !== undefined) payload.travelling = updates.travelling;
  if (updates.netSalary !== undefined) payload.net_salary = updates.netSalary;
  // Intentionally omit updated_at as it might not be a column in the database

  const { error } = await supabase.from('payroll').update(payload).eq('id', id);
  if (error) throw error;
}

// ─── Performance ─────────────────────────────────────────────────────────────

export async function getPerformance(uid?: string): Promise<PerformanceRecord[]> {
  let query = supabase.from('performance').select('*').order('created_at', { ascending: false });
  if (uid) {
    query = query.eq('user_id', uid);
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(d => ({
    id: d.id.toString(),
    userId: d.user_id,
    userName: '', // Join
    evaluatorId: d.evaluator_id,
    evaluatorName: '', // Join
    score: d.score,
    rating: d.rating,
    feedback: d.feedback,
    hrFeedback: d.hr_feedback,
    selfEvaluation: d.self_evaluation,
    goals: d.goals,
    status: d.status,
    createdAt: d.created_at
  } as PerformanceRecord));
}

export async function savePerformance(record: Omit<PerformanceRecord, 'id'>): Promise<string> {
  const { data, error } = await supabase.from('performance').insert({
    user_id: record.userId,
    evaluator_id: record.evaluatorId,
    score: record.score,
    rating: record.rating,
    feedback: record.feedback,
    hr_feedback: record.hrFeedback,
    self_evaluation: record.selfEvaluation,
    goals: record.goals,
    status: record.status
  }).select().single();
  
  if (error) throw error;
  return data.id.toString();
}

export async function updatePerformance(id: string, updates: Partial<PerformanceRecord>): Promise<void> {
  const { error } = await supabase.from('performance').update({
    score: updates.score,
    rating: updates.rating,
    feedback: updates.feedback,
    hr_feedback: updates.hrFeedback,
    self_evaluation: updates.selfEvaluation,
    goals: updates.goals,
    status: updates.status
  }).eq('id', id);
  if (error) throw error;
}
