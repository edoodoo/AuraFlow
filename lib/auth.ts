import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "./supabase-server";
import { isRebalancingAllowed } from "./feature-flags";

export async function requireUserForRoute() {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return { user: null, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  return { user: data.user, response: null };
}

/** Authenticated + authorized for rebalancing. Returns 401 if unauthenticated, 403 if not allowed. */
export async function requireRebalancingAccess() {
  const { user, response } = await requireUserForRoute();
  if (!user) return { user: null, response };

  if (!isRebalancingAllowed(user.email)) {
    return { user: null, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { user, response: null };
}

