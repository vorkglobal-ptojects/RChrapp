import { supabase } from '../src/lib/supabase';

async function checkSchema() {
  const { data, error } = await supabase.from('leave_requests').select('*');
  console.log(data);
}

checkSchema();
