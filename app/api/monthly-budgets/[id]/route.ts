import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { requireUserForRoute } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Params) {
  const { user, response } = await requireUserForRoute();
  if (!user) return response;
  const supabase = await getSupabaseServerClient();
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const patch = {
    expected_amount: body.expected_amount,
    is_fixed: body.is_fixed,
    category_id: body.category_id,
    month: body.month,
    year: body.year,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("monthly_budgets")
    .update(patch)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ budget: data });
}

export async function DELETE(_req: Request, { params }: Params) {
  const { user, response } = await requireUserForRoute();
  if (!user) return response;
  const supabase = await getSupabaseServerClient();
  const { id } = await params;

  const { error } = await supabase.from("monthly_budgets").delete().eq("id", id).eq("user_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

