import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  (import.meta as any).env?.hrpulse_SUPABASE_URL ||
  (import.meta as any).env?.VITE_SUPABASE_URL ||
  (typeof process !== 'undefined' ? process.env?.VITE_SUPABASE_URL : undefined) ||
  '';

const supabaseAnonKey =
  (import.meta as any).env?.hrpulse_SUPABASE_ANON_KEY ||
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
  (typeof process !== 'undefined' ? process.env?.VITE_SUPABASE_ANON_KEY : undefined) ||
  '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('placeholder'));

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
);
