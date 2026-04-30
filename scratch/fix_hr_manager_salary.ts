import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fixNishanthi() {
  const newSalary = 33200;
  const intensive = 8000;
  const travelling = 3425;
  const epf = 2400;
  const net = newSalary + intensive + travelling - epf;

  const { error } = await supabase
    .from('profiles')
    .update({ 
      salary_a: newSalary,
      intensive: intensive,
      travelling: travelling,
      epf: epf,
      net: net
    })
    .eq('name', 'HR_Manager Nishanthi');

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Successfully updated HR_Manager Nishanthi to 33,200 salary and corrected Net Payout.');
  }
}

fixNishanthi();
