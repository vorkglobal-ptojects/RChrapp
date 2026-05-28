import { supabase } from '../src/lib/supabase';
console.log('Supabase URL:', (supabase as any).url ?? 'undefined');
console.log('Supabase Key (first 8 chars):', (supabase as any).supabaseKey?.slice(0, 8) ?? 'undefined');
