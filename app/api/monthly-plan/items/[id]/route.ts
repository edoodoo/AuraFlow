import { NextResponse } from "next/server";
import { requireUserForRoute } from "@/lib/auth";
import { getHouseholdContext } from "@/lib/household";
import { refreshMonthlyPlanItemStatus } from "@/lib/monthly-plan";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { monthlyPlanItemUpdateSchema } from "@/lib/validators";

type Params = { params: Promise<{ id: string }> };

async function getOwnedItem(id: string, householdId: string) {
  const supabase = getSupabaseAdminClient();
  const { data: item, error } = await supabase
    .from("monthly_plan_items")
    .select("id,monthly_plan_id")
    .eq("id", id)
    .maybeSingle<{ id: string; monthly_plan_id: string }>();

  if (error) throw error;
  if (!item) return null;

  const { data: plan, error: planError } = await supabase
    .from("monthly_plans")
    .select("id,household_id")
    .eq("id", item.monthly_plan_id)
    .maybeSingle<{ id: string; household_id: string }>();

  if (planError) throw planError;
  if (!plan || plan.household_id !== householdId) return null;

  return item;
}

export async function PUT(req: Request, { params }: Params) {
  const { user, response } = await requireUserForRoute();
  if (!user) return response;

  const { id } = await params;
  const context = await getHouseholdContext(user);
  if (!context.household) {
    return NextResponse.json({ error: "Planejamento compartilhado não encontrado." }, { status: 404 });
  }

  const item = await getOwnedItem(id, context.household.id);
  if (!item) {
    return NextResponse.json({ error: "Item mensal não encontrado." }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const parsed = monthlyPlanItemUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados do item mensal inválidos." }, { status: 400 });
  }

  const patch = {
    category_id: parsed.data.category_id ?? undefined,
    title: parsed.data.title,
    section: parsed.data.section,
    expected_amount: parsed.data.expected_amount,
    is_fixed: parsed.data.is_fixed,
    due_date: parsed.data.due_date === undefined ? undefined : parsed.data.due_date || null,
    status: parsed.data.status,
    assigned_user_id: parsed.data.assigned_user_id === undefined ? undefined : parsed.data.assigned_user_id || null,
    paid_by_user_id: parsed.data.paid_by_user_id === undefined ? undefined : parsed.data.paid_by_user_id || null,
    paid_at: parsed.data.paid_at === undefined ? undefined : parsed.data.paid_at || null,
    notes: parsed.data.notes === undefined ? undefined : parsed.data.notes || null,
    updated_at: new Date().toISOString(),
  };

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("monthly_plan_items")
    .update(patch)
    .eq("id", id)
    .select(
      "id,monthly_plan_id,category_id,title,section,expected_amount,is_fixed,due_date,status,assigned_user_id,paid_by_user_id,paid_at,notes,created_at,updated_at,category:categories(name)",
    )
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ item: data });
}

export async function DELETE(_req: Request, { params }: Params) {
  const { user, response } = await requireUserForRoute();
  if (!user) return response;

  const { id } = await params;
  const context = await getHouseholdContext(user);
  if (!context.household) {
    return NextResponse.json({ error: "Planejamento compartilhado não encontrado." }, { status: 404 });
  }

  const item = await getOwnedItem(id, context.household.id);
  if (!item) {
    return NextResponse.json({ error: "Item mensal não encontrado." }, { status: 404 });
  }

  const supabase = getSupabaseAdminClient();
  const { data: linkedTransactions } = await supabase
    .from("transactions")
    .select("id")
    .eq("monthly_plan_item_id", id)
    .limit(1);

  if ((linkedTransactions ?? []).length > 0) {
    return NextResponse.json({ error: "Remova os lançamentos vinculados antes de excluir este item." }, { status: 400 });
  }

  const { error } = await supabase.from("monthly_plan_items").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  try {
    await refreshMonthlyPlanItemStatus(id);
  } catch {
    // The item no longer exists; ignore stale status recalculation.
  }

  return NextResponse.json({ ok: true });
}
