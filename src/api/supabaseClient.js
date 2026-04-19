import { createClient } from '@supabase/supabase-js'; // Fix: Correct package name

// These draw the secret keys from your .env file
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if keys are missing (helps you debug faster)
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase URL or Anon Key! Check your .env file.");
}

// This is the specific "supabase" object your other files are looking for
export const supabase = createClient(supabaseUrl, supabaseAnonKey);