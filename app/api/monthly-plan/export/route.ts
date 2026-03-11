import { NextResponse } from "next/server";
import { requireUserForRoute } from "@/lib/auth";
import { getHouseholdContext } from "@/lib/household";
import { getMonthlyPlan, getOrCreateMonthlyPlan, listMonthlyPlanItems } from "@/lib/monthly-plan";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { monthlyPlanExportSchema } from "@/lib/validators";

export async function POST(req: Request) {
  const { user, response } = await requireUserForRoute();
  if (!user) return response;

  const context = await getHouseholdContext(user);
  if (!context.household) {
    return NextResponse.json({ error: "Crie o planejamento compartilhado antes de exportar." }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const parsed = monthlyPlanExportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados de exportação inválidos." }, { status: 400 });
  }

  const sourcePlan = await getMonthlyPlan(context, parsed.data.source_month, parsed.data.source_year);
  if (!sourcePlan) {
    return NextResponse.json({ created: 0 });
  }

  const sourceItems = await listMonthlyPlanItems(sourcePlan.id);
  const fixedItems = sourceItems.filter((item) => item.is_fixed);
  if (fixedItems.length === 0) {
    return NextResponse.json({ created: 0 });
  }

  const targetPlan = await getOrCreateMonthlyPlan(context, parsed.data.target_month, parsed.data.target_year);
  const targetItems = await listMonthlyPlanItems(targetPlan.id);
  const existingKeys = new Set(targetItems.map((item) => `${item.title.toLowerCase()}::${item.section}`));

  const supabase = getSupabaseAdminClient();
  const rowsToInsert = fixedItems
    .filter((item) => !existingKeys.has(`${item.title.toLowerCase()}::${item.section}`))
    .map((item) => ({
      monthly_plan_id: targetPlan.id,
      category_id: item.category_id,
      title: item.title,
      section: item.section,
      expected_amount: item.expected_amount,
      is_fixed: true,
      due_date: item.due_date,
      status: "pending",
      assigned_user_id: item.assigned_user_id,
      paid_by_user_id: null,
      paid_at: null,
      notes: item.notes,
    }));

  if (rowsToInsert.length === 0) {
    return NextResponse.json({ created: 0 });
  }

  const { error } = await supabase.from("monthly_plan_items").insert(rowsToInsert);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ created: rowsToInsert.length });
}
