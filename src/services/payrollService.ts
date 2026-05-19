import { supabase } from '../lib/supabase';
import { PayrollRecord } from '../types';
import { getEmployees } from './userService';

export async function getPayroll(userId?: string): Promise<PayrollRecord[]> {
  let query = supabase.from('payroll').select('*, profiles(name, role, branch, sort_order)');
  if (userId) query = query.eq('user_id', userId);
  
  const { data, error } = await query;
  if (error) throw error;

  const records = (data || []).map(d => ({
    id: d.id,
    userId: d.user_id,
    userName: d.profiles?.name,
    month: d.month,
    year: d.year,
    salaryA: Number(d.salary_a),
    salaryB: Number(d.salary_b),
    epf: Number(d.epf),
    advances: Number(d.advances),
    cover: Number(d.cover),
    intensive: Number(d.intensive),
    travelling: Number(d.travelling),
    extraDays: d.extra_days ? Number(d.extra_days) : 0,
    netSalary: Number(d.net_salary),
    status: d.status,
    createdAt: d.created_at,
    branch: d.branch || d.profiles?.branch,
    sortOrder: d.profiles?.sort_order ?? 999
  }));

  // Sort by sortOrder
  return records.sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function generatePayroll(month: number, year: number): Promise<void> {
  const employees = await getEmployees();
  const { data: existing, error: pError } = await supabase.from('payroll').select('user_id').eq('month', month).eq('year', year);
  if (pError) throw pError;

  for (const emp of employees) {
    if (['super', 'owner'].includes(emp.role)) continue;
    
    const exists = existing?.find(p => p.user_id === emp.uid);
    if (!exists) {
      const { error } = await supabase.from('payroll').insert({
        user_id: emp.uid,
        month,
        year,
        salary_a: emp.salaryA,
        salary_b: 0,
        epf: emp.epf,
        advances: emp.advances || 0,
        cover: emp.cover || 0,
        intensive: emp.intensive || 0,
        travelling: emp.travelling || 0,
        extra_days: emp.extraDays || 0,
        net_salary: (emp.salaryA || 0) + (emp.intensive || 0) + (emp.travelling || 0) - emp.epf - (emp.advances || 0) - (emp.cover || 0),
        status: 'Pending',
        branch: emp.branch
      });
      if (error) console.error(`Failed to generate payroll for ${emp.uid}`, error);
    }
  }
}

export async function savePayroll(record: Partial<PayrollRecord>): Promise<void> {
  const { error } = await supabase.from('payroll').insert({
    user_id: record.userId,
    month: record.month,
    year: record.year,
    salary_a: record.salaryA,
    salary_b: record.salaryB || 0,
    epf: record.epf,
    advances: record.advances || 0,
    cover: record.cover || 0,
    intensive: record.intensive || 0,
    travelling: record.travelling || 0,
    extra_days: record.extraDays || 0,
    net_salary: record.netSalary,
    status: record.status || 'Pending',
    branch: record.branch
  });
  if (error) throw error;
}

export async function updatePayroll(id: string, updates: Partial<PayrollRecord>): Promise<void> {
  const payload: any = {};
  if (updates.salaryA !== undefined) payload.salary_a = updates.salaryA;
  if (updates.salaryB !== undefined) payload.salary_b = updates.salaryB;
  if (updates.epf !== undefined) payload.epf = updates.epf;
  if (updates.advances !== undefined) payload.advances = updates.advances;
  if (updates.cover !== undefined) payload.cover = updates.cover;
  if (updates.intensive !== undefined) payload.intensive = updates.intensive;
  if (updates.travelling !== undefined) payload.travelling = updates.travelling;
  if (updates.extraDays !== undefined) payload.extra_days = updates.extraDays;
  if (updates.netSalary !== undefined) payload.net_salary = updates.netSalary;
  if (updates.status !== undefined) payload.status = updates.status;

  const { error } = await supabase.from('payroll').update(payload).eq('id', id);
  if (error) throw error;
}
