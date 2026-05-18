import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl =
  import.meta.env?.hrpulse_SUPABASE_URL ||
  import.meta.env?.VITE_SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  process.env.hrpulse_SUPABASE_URL;

const supabaseAnonKey =
  import.meta.env?.hrpulse_SUPABASE_ANON_KEY ||
  import.meta.env?.VITE_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.hrpulse_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase URL or Anon Key in environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
