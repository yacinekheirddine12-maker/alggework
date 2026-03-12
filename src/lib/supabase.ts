import { createClient } from '@supabase/supabase-js';

const getSupabaseConfig = () => {
  // Support both Vite (import.meta.env) and Node.js (process.env)
  const url = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || process.env.VITE_SUPABASE_URL || '';
  const key = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || process.env.VITE_SUPABASE_ANON_KEY || '';
  return { url, key };
};

const { url, key } = getSupabaseConfig();

export const isSupabaseConfigured = url && key && !url.includes('placeholder');

export const supabase = createClient(
  url || 'https://placeholder-project.supabase.co',
  key || 'placeholder-key'
);
