import { supabase } from '../src/lib/supabase';

async function test() {
  const { data, error } = await supabase.from('profiles').select('*').ilike('name', '%dev_tester%');
  console.log(data);
}

test();
