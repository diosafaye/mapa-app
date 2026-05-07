import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase URL or Anon Key! Check your .env file.");
}

const globalKey = '__supabase_singleton__';

if (!window[globalKey]) {
  window[globalKey] = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      storageKey: 'mapa-bohol-auth-key',
      
      lock: async (name, acquireTimeout, fn) => {
        return await fn();  // just run the function immediately, no locking
      },
    }
  });
}

export const supabase = window[globalKey];