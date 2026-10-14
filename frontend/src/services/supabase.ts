import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  'https://ckhfbgdvfltbsflfctos.supabase.co';

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNraGZiZ2R2Zmx0YnNmbGZjdG9zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE5NjMwNDIsImV4cCI6MjEwNzUzOTA0Mn0.9FZscVQOecg7pb61L-UXavHYdEtEwoJDRve4riXxH2k';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
