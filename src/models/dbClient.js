import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const PLACEHOLDER_VALUES = new Set(['YOUR_SUPABASE_URL', 'YOUR_SUPABASE_ANON_KEY']);

function isConfigured(value) {
  return Boolean(value && !PLACEHOLDER_VALUES.has(value));
}

export const isSupabaseConfigured = isConfigured(supabaseUrl) && isConfigured(supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.error(
    'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
  );
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const getSupabaseConfig = () => ({
  isSupabaseConfigured,
  supabaseUrl: supabaseUrl || '',
  supabaseAnonKey: supabaseAnonKey ? '••••••••' : '',
});
