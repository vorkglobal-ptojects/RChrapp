
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function findUser() {
  const { data: user, error } = await supabase
    .from('profiles')
    .select('id, name, email')
    .eq('email', 'dahami.divyanjali@hrpulse.com')
    .single();

  if (error) {
    console.error('Error finding user:', error);
    return;
  }

  console.log('Found user:', user);
  return user;
}

findUser();
