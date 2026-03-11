import { NextResponse } from "next/server";
import { requireUserForRoute } from "@/lib/auth";
import { getHouseholdContext } from "@/lib/household";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { monthlyPlanItemSchema } from "@/lib/validators";

export async function POST(req: Request) {
  const { user, response } = await requireUserForRoute();
  if (!user) return response;

  const body = await req.json().catch(() => null);
  const parsed = monthlyPlanItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados do item mensal inválidos." }, { status: 400 });
  }

  const context = await getHouseholdContext(user);
  if (!context.household) {
    return NextResponse.json({ error: "Crie o planejamento compartilhado antes de adicionar itens." }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  const { data: plan, error: planError } = await supabase
    .from("monthly_plans")
    .select("id,household_id")
    .eq("id", parsed.data.monthly_plan_id)
    .maybeSingle<{ id: string; household_id: string }>();

  if (planError) return NextResponse.json({ error: planError.message }, { status: 400 });
  if (!plan || plan.household_id !== context.household.id) {
    return NextResponse.json({ error: "Este mensal não pertence ao seu casal." }, { status: 403 });
  }

  const payload = {
    monthly_plan_id: parsed.data.monthly_plan_id,
    category_id: parsed.data.category_id ?? null,
    title: parsed.data.title,
    section: parsed.data.section,
    expected_amount: parsed.data.expected_amount,
    is_fixed: parsed.data.is_fixed ?? false,
    due_date: parsed.data.due_date || null,
    assigned_user_id: parsed.data.assigned_user_id ?? null,
    notes: parsed.data.notes || null,
  };

  const { data, error } = await supabase
    .from("monthly_plan_items")
    .insert(payload)
    .select(
      "id,monthly_plan_id,category_id,title,section,expected_amount,is_fixed,due_date,status,assigned_user_id,paid_by_user_id,paid_at,notes,created_at,updated_at,category:categories(name)",
    )
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ item: data }, { status: 201 });
}
