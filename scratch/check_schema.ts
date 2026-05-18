import { supabase } from '../src/lib/supabase';

async function checkSchema() {
  const { data, error } = await supabase.from('leave_requests').select('*').limit(1);
  console.log(data ? Object.keys(data[0]) : error);
}

checkSchema();
