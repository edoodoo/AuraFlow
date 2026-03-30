import { NextResponse } from "next/server";
import { portfolioAssetSchema } from "@/lib/validators";
import { requireRebalancingAccess } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export async function GET() {
  const { user, response } = await requireRebalancingAccess();
  if (!user) return response;
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from("portfolio_assets")
    .select("id,ticker,label,target_pct,is_active,created_at")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ assets: data ?? [] });
}

export async function POST(req: Request) {
  const { user, response } = await requireRebalancingAccess();
  if (!user) return response;
  const supabase = getSupabaseAdminClient();

  const body = await req.json().catch(() => null);
  const parsed = portfolioAssetSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Payload inválido", details: parsed.error.flatten() }, { status: 400 });

  const { data, error } = await supabase
    .from("portfolio_assets")
    .insert({
      user_id: user.id,
      ticker: parsed.data.ticker.toUpperCase(),
      label: parsed.data.label ?? null,
      target_pct: parsed.data.target_pct,
      is_active: parsed.data.is_active,
    })
    .select("id,ticker,label,target_pct,is_active,created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ asset: data }, { status: 201 });
}
