import { NextResponse } from "next/server";
import { rebalancingCalcSchema } from "@/lib/validators";
import { requireRebalancingAccess } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { calculateRebalancing, type PortfolioAsset } from "@/lib/rebalancing";

export async function POST(req: Request) {
  const { user, response } = await requireRebalancingAccess();
  if (!user) return response;
  const supabase = getSupabaseAdminClient();

  const body = await req.json().catch(() => null);
  const parsed = rebalancingCalcSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Payload inválido", details: parsed.error.flatten() }, { status: 400 });

  const { contribution_amount } = parsed.data;

  // Fetch active assets
  const { data: assetRows, error: assetsErr } = await supabase
    .from("portfolio_assets")
    .select("id,ticker,label,target_pct,current_value_cad")
    .eq("user_id", user.id)
    .eq("is_active", true);

  if (assetsErr) return NextResponse.json({ error: assetsErr.message }, { status: 500 });

  const assets = assetRows ?? [];
  const total_invested = assets.reduce((sum, asset) => sum + Number(asset.current_value_cad ?? 0), 0);

  // Validate sum(target_pct) == 100 when assets exist
  if (assets.length > 0) {
    const sumPct = assets.reduce((s, a) => s + Number(a.target_pct), 0);
    if (Math.abs(sumPct - 100) > 0.01) {
      return NextResponse.json(
        { error: `A soma dos percentuais alvo deve ser 100%. Atual: ${sumPct.toFixed(2)}%` },
        { status: 400 },
      );
    }
  }

  // Build PortfolioAsset list (current_value estimated from total_invested * target_pct)
  // NOTE: current_value is derived from total_invested proportionally since we don't store individual positions
  const portfolioAssets: PortfolioAsset[] = assets.map((a) => ({
    id: a.id,
    ticker: a.ticker,
    label: a.label,
    target_pct: Number(a.target_pct),
    current_value: Number(a.current_value_cad ?? 0),
  }));

  const result = calculateRebalancing(total_invested, contribution_amount, portfolioAssets);

  // Build chart data
  const chart_data = result.orders.map((o) => ({
    ticker: o.ticker,
    target: o.target_pct,
    current: o.current_pct,
    post: o.post_pct,
  }));

  const snapshotTimestamp = new Date().toISOString();
  const { error: stateErr } = await supabase.from("portfolio_state").upsert(
    {
      user_id: user.id,
      total_invested,
      currency: "CAD",
      last_contribution_amount: contribution_amount,
      last_projected_total: result.projected_total,
      last_remaining: result.remaining,
      last_orders: result.orders,
      last_chart_data: chart_data,
      last_calculated_at: snapshotTimestamp,
      updated_at: snapshotTimestamp,
    },
    { onConflict: "user_id" },
  );

  if (stateErr) {
    return NextResponse.json({ error: stateErr.message }, { status: 500 });
  }

  return NextResponse.json({ ...result, chart_data });
}
