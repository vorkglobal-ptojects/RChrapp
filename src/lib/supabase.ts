import { createClient } from '@supabase/supabase-js';

// Clean any surrounding quotes, whitespace, or trailing slashes
const sanitize = (val: string | undefined): string => {
  if (!val) return '';
  return val.trim().replace(/^["']|["']$/g, '').replace(/\/$/, '');
};

const DEFAULT_SUPABASE_URL = 'https://ylnxvrcbvhpjtgozopdb.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlsbnh2cmNidmhwanRnb3pvcGRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQyMDQ4MzIsImV4cCI6MjEwOTc4MDgzMn0.-kqWTgI4k8tR78Hm-UXT_F71j2mbl5_TPskS0u_i8BM';

const resolveValidSupabaseUrl = (input: string | undefined): string => {
  const url = sanitize(input);
  if (!url || url.includes('placeholder')) {
    return DEFAULT_SUPABASE_URL;
  }

  // If someone accidentally pasted a dashboard URL (e.g. https://supabase.com/dashboard/project/ylnxvrcbvhpjtgozopdb)
  const dashboardMatch = url.match(/dashboard\/project\/([a-z0-9]+)/i);
  if (dashboardMatch && dashboardMatch[1]) {
    return `https://${dashboardMatch[1]}.supabase.co`;
  }

  // If it's a supabase.com URL but not an API endpoint, fallback to default
  if (url.includes('supabase.com') && !url.includes('.supabase.co')) {
    return DEFAULT_SUPABASE_URL;
  }

  // If it contains a .supabase.co hostname, extract just the origin
  const apiMatch = url.match(/https?:\/\/[a-z0-9\-]+\.supabase\.co/i);
  if (apiMatch) {
    return apiMatch[0];
  }

  return DEFAULT_SUPABASE_URL;
};

const rawUrl =
  (import.meta as any).env?.VITE_SUPABASE_URL ||
  (typeof process !== 'undefined' ? process.env?.VITE_SUPABASE_URL : undefined);

const rawKey =
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
  (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY ||
  (typeof process !== 'undefined' ? process.env?.VITE_SUPABASE_ANON_KEY : undefined);

const supabaseUrl = resolveValidSupabaseUrl(rawUrl);
const cleanKey = sanitize(rawKey);
const supabaseAnonKey = (cleanKey && !cleanKey.includes('placeholder')) ? cleanKey : DEFAULT_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});
