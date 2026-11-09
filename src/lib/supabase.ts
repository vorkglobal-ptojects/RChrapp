import { createClient } from '@supabase/supabase-js';

// Clean any surrounding quotes, whitespace, or trailing slashes
const sanitize = (val: string | undefined): string => {
  if (!val) return '';
  return val.trim().replace(/^["']|["']$/g, '').replace(/\/$/, '');
};

const DEFAULT_SUPABASE_URL = 'https://ylnxvrcbvhpjtgozopdb.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlsbnh2cmNidmhwanRnb3pvcGRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQyMDQ4MzIsImV4cCI6MjEwOTc4MDgzMn0.-kqWTgI4k8tR78Hm-UXT_F71j2mbl5_TPskS0u_i8BM';

const envUrl = sanitize(
  (import.meta as any).env?.VITE_SUPABASE_URL ||
  (typeof process !== 'undefined' ? process.env?.VITE_SUPABASE_URL : undefined)
);

const envKey = sanitize(
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
  (typeof process !== 'undefined' ? process.env?.VITE_SUPABASE_ANON_KEY : undefined)
);

const supabaseUrl = (envUrl && !envUrl.includes('placeholder')) ? envUrl : DEFAULT_SUPABASE_URL;
const supabaseAnonKey = (envKey && !envKey.includes('placeholder')) ? envKey : DEFAULT_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});
