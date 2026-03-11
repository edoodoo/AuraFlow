import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ENV } from "./env";

export async function getSupabaseServerClient(): Promise<SupabaseClient> {
  if (!ENV.supabaseUrl || !ENV.supabaseAnonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  const cookieStore = await cookies();

  return createServerClient(ENV.supabaseUrl, ENV.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookieList) {
        try {
          cookieList.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // In server components, cookie writes can fail during render.
          // Supabase can still read the session for this request.
        }
      },
    },
  });
}

