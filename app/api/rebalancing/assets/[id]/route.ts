import { NextResponse } from "next/server";
import { portfolioAssetSchema } from "@/lib/validators";
import { requireRebalancingAccess } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireRebalancingAccess();
  if (!user) return response;
  const supabase = getSupabaseAdminClient();
  const { id } = await params;

  const body = await req.json().catch(() => null);
  const parsed = portfolioAssetSchema.partial().safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Payload inválido", details: parsed.error.flatten() }, { status: 400 });

  const update: Record<string, unknown> = {};
  if (parsed.data.ticker !== undefined) update.ticker = parsed.data.ticker.toUpperCase();
  if (parsed.data.label !== undefined) update.label = parsed.data.label;
  if (parsed.data.target_pct !== undefined) update.target_pct = parsed.data.target_pct;
  if (parsed.data.is_active !== undefined) update.is_active = parsed.data.is_active;

  const { data, error } = await supabase
    .from("portfolio_assets")
    .update(update)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id,ticker,label,target_pct,is_active")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ asset: data });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireRebalancingAccess();
  if (!user) return response;
  const supabase = getSupabaseAdminClient();
  const { id } = await params;

  const { error } = await supabase
    .from("portfolio_assets")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
