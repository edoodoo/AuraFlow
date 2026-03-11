import { NextResponse } from "next/server";
import { requireUserForRoute } from "@/lib/auth";
import { refreshMonthlyPlanItemStatus } from "@/lib/monthly-plan";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Params) {
  const { user, response } = await requireUserForRoute();
  if (!user) return response;
  const supabase = getSupabaseAdminClient();
  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const { data: existing } = await supabase
    .from("transactions")
    .select("monthly_plan_item_id")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle<{ monthly_plan_item_id: string | null }>();

  const { data, error } = await supabase
    .from("transactions")
    .update({
      amount: body.amount,
      description: body.description,
      transaction_date: body.transaction_date,
      category_id: body.category_id,
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  if (existing?.monthly_plan_item_id) {
    await refreshMonthlyPlanItemStatus(existing.monthly_plan_item_id);
  }
  if (data.monthly_plan_item_id && data.monthly_plan_item_id !== existing?.monthly_plan_item_id) {
    await refreshMonthlyPlanItemStatus(data.monthly_plan_item_id);
  }

  return NextResponse.json({ transaction: data });
}

export async function DELETE(_req: Request, { params }: Params) {
  const { user, response } = await requireUserForRoute();
  if (!user) return response;
  const supabase = getSupabaseAdminClient();
  const { id } = await params;

  const { data: existing } = await supabase
    .from("transactions")
    .select("monthly_plan_item_id")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle<{ monthly_plan_item_id: string | null }>();

  const { error } = await supabase.from("transactions").delete().eq("id", id).eq("user_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  if (existing?.monthly_plan_item_id) {
    await refreshMonthlyPlanItemStatus(existing.monthly_plan_item_id);
  }

  return NextResponse.json({ ok: true });
}

