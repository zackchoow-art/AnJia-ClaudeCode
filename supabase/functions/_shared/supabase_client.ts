// ============================================================================
// Shared Supabase client
// ============================================================================

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

let supabaseClient: SupabaseClient | null = null;

/**
 * 获取Supabase客户端单例
 * 使用Service Role Key以bypass RLS(Edge Functions有完整权限)
 */
export function getSupabaseClient(): SupabaseClient {
  if (supabaseClient) return supabaseClient;
  
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase configuration');
  }
  
  supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  
  return supabaseClient;
}

/**
 * 获取受限的客户端(尊重RLS)
 * 使用用户的JWT token
 */
export function getUserSupabaseClient(authToken: string): SupabaseClient {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase configuration');
  }
  
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: { Authorization: `Bearer ${authToken}` }
    }
  });
}
