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
    .select("id,total_invested,currency,updated_at,last_contribution_amount,last_projected_total,last_remaining,last_orders,last_chart_data,last_calculated_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: assetRows, error: assetsErr } = await supabase
    .from("portfolio_assets")
    .select("current_value_cad,updated_at")
    .eq("user_id", user.id)
    .eq("is_active", true);

  if (assetsErr) return NextResponse.json({ error: assetsErr.message }, { status: 500 });

  const total_invested = (assetRows ?? []).reduce((sum, asset) => sum + Number(asset.current_value_cad ?? 0), 0);
  const lastPortfolioUpdate = (assetRows ?? []).reduce<string | null>((latest, asset) => {
    if (!asset.updated_at) return latest;
    if (!latest) return asset.updated_at;
    return new Date(asset.updated_at) > new Date(latest) ? asset.updated_at : latest;
  }, null);

  // Return default if not yet created
  if (!data) {
    return NextResponse.json({
      state: {
        total_invested,
        currency: "CAD",
        updated_at: lastPortfolioUpdate,
        last_contribution_amount: null,
        last_projected_total: null,
        last_remaining: null,
        last_orders: [],
        last_chart_data: [],
        last_calculated_at: null,
      },
    });
  }

  return NextResponse.json({
    state: {
      ...data,
      total_invested,
      updated_at: lastPortfolioUpdate ?? data.updated_at,
      last_orders: data.last_orders ?? [],
      last_chart_data: data.last_chart_data ?? [],
    },
  });
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
