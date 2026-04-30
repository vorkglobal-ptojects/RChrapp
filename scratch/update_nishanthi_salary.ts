import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function updateSalary() {
  const { data: emps, error: findError } = await supabase
    .from('profiles')
    .select('id, name, salary_a, intensive, travelling, epf, advances, cover')
    .ilike('name', '%Nishanthi%');

  if (findError) {
    console.error('Error finding employee:', findError);
    return;
  }

  if (!emps || emps.length === 0) {
    console.log('Employee not found');
    return;
  }

  const emp = emps[0];
  console.log(`Found: ${emp.name}, Current Salary: ${emp.salary_a}`);

  const newSalary = 33200;
  const net = newSalary + (emp.intensive || 0) + (emp.travelling || 0) - (emp.epf || 0) - (emp.advances || 0) - (emp.cover || 0);

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ 
      salary_a: newSalary,
      net: net
    })
    .eq('id', emp.id);

  if (updateError) {
    console.error('Error updating salary:', updateError);
  } else {
    console.log(`Successfully updated ${emp.name} salary to ${newSalary}. New Net: ${net}`);
  }
}

updateSalary();
