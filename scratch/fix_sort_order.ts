import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function fixSortOrder() {
  await supabase.from('profiles').update({ sort_order: 11 }).eq('name', 'W.K. Erandi Perera');
  await supabase.from('profiles').update({ sort_order: 28 }).eq('name', 'Dulki Isanka');
  console.log('Fixed Dulki and Erandi');
}

fixSortOrder();
