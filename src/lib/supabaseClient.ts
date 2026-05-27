import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase URL or Anon Key in environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

let adminClient: SupabaseClient | null = null;

// Uses the service role key when configured to bypass RLS for admin reads (dev only).
export function getAdminSupabase(): SupabaseClient {
  if (supabaseServiceRoleKey) {
    if (!adminClient) {
      adminClient = createClient(supabaseUrl, supabaseServiceRoleKey);
    }
    return adminClient;
  }
  return supabase;
}