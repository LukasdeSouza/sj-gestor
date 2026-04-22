import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://pqvxrzidrklndbtppjhd.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.ANON_KEY;

if (!supabaseAnonKey) {
  console.warn("⚠️ [Supabase] ANON_KEY não encontrada no .env do frontend.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey || '');
