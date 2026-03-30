import { NextResponse } from "next/server";
import { portfolioStateSchema } from "@/lib/validators";
import { requireRebalancingAccess } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export async function GET() {
  const { user, response } = await requireRebalancingAccess();
  if (!user) return response;
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from("portfolio_state")
    .select("id,total_invested,currency,updated_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Return default if not yet created
  if (!data) {
    return NextResponse.json({
      state: { total_invested: 0, currency: "CAD", updated_at: null },
    });
  }

  return NextResponse.json({ state: data });
}

export async function PUT(req: Request) {
  const { user, response } = await requireRebalancingAccess();
  if (!user) return response;
  const supabase = getSupabaseAdminClient();

  const body = await req.json().catch(() => null);
  const parsed = portfolioStateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Payload inválido", details: parsed.error.flatten() }, { status: 400 });

  const { data, error } = await supabase
    .from("portfolio_state")
    .upsert(
      {
        user_id: user.id,
        total_invested: parsed.data.total_invested,
        currency: "CAD",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    )
    .select("id,total_invested,currency,updated_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ state: data });
}
