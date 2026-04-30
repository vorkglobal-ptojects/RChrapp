import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function syncPayroll() {
  const { data: emps } = await supabase
    .from('profiles')
    .select('id, name, salary_a, intensive, travelling, epf, advances, cover')
    .ilike('name', '%Nishanthi%');

  if (!emps || emps.length === 0) return;
  const emp = emps[0];

  console.log(`Syncing payroll for ${emp.name} (April 2026)...`);

  // 1. Check if April 2026 payroll exists
  const { data: payrolls } = await supabase
    .from('payroll')
    .select('*')
    .eq('user_id', emp.id)
    .eq('month', 4)
    .eq('year', 2026);

  if (payrolls && payrolls.length > 0) {
    const p = payrolls[0];
    const newSalary = 33200;
    const net = newSalary + (p.intensive || 0) + (p.travelling || 0) - (p.epf || 0) - (p.advances || 0) - (p.cover || 0);
    
    const { error: updateError } = await supabase
      .from('payroll')
      .update({ 
        salary_a: newSalary,
        net_salary: net
      })
      .eq('id', p.id);

    if (updateError) console.error('Error updating payroll:', updateError);
    else console.log(`Successfully updated April payroll for ${emp.name}. New Net: ${net}`);
  } else {
    console.log('No April payroll found to update.');
  }
}

syncPayroll();
