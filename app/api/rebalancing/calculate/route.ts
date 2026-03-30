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

  // Fetch state
  const { data: stateRow, error: stateErr } = await supabase
    .from("portfolio_state")
    .select("total_invested")
    .eq("user_id", user.id)
    .maybeSingle();

  if (stateErr) return NextResponse.json({ error: stateErr.message }, { status: 500 });
  // Supabase returns NUMERIC as string via PostgREST — coerce to number to prevent string concatenation
  const total_invested = Number(stateRow?.total_invested ?? 0);

  // Fetch active assets
  const { data: assetRows, error: assetsErr } = await supabase
    .from("portfolio_assets")
    .select("id,ticker,label,target_pct")
    .eq("user_id", user.id)
    .eq("is_active", true);

  if (assetsErr) return NextResponse.json({ error: assetsErr.message }, { status: 500 });

  const assets = assetRows ?? [];

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
    current_value: total_invested > 0 ? (total_invested * Number(a.target_pct)) / 100 : 0,
  }));

  const result = calculateRebalancing(total_invested, contribution_amount, portfolioAssets);

  // Build chart data
  const chart_data = result.orders.map((o) => ({
    ticker: o.ticker,
    target: o.target_pct,
    current: o.current_pct,
    post: o.post_pct,
  }));

  return NextResponse.json({ ...result, chart_data });
}
