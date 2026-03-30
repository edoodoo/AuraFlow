import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { isRebalancingAllowed } from "@/lib/feature-flags";

/**
 * Server-side authorization gate.
 * Runs BEFORE any client code renders — unauthenticated or unauthorized users
 * are redirected to /dashboard and never see the page HTML.
 */
export default async function RebalancingLayout({ children }: { children: React.ReactNode }) {
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user || !isRebalancingAllowed(data.user.email)) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
