import { createClient } from "@supabase/supabase-js";
import { ENV } from "./env";

export function getSupabaseAdminClient() {
  if (!ENV.supabaseServiceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for admin actions.");
  }

  return createClient(ENV.supabaseUrl, ENV.supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

