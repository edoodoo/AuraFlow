import { NextResponse } from "next/server";
import { requireUserForRoute } from "@/lib/auth";
import { getHouseholdContext } from "@/lib/household";
import { buildMonthlySummary, getMonthlyHouseholdIncome, getMonthlyPlan, listHouseholdTransactions, listMonthlyPlanItems } from "@/lib/monthly-plan";

export async function GET(req: Request) {
  const { user, response } = await requireUserForRoute();
  if (!user) return response;

  const { searchParams } = new URL(req.url);
  const now = new Date();
  const month = Number(searchParams.get("month") ?? now.getMonth() + 1);
  const year = Number(searchParams.get("year") ?? now.getFullYear());
  const context = await getHouseholdContext(user);

  if (!context.household) {
    return NextResponse.json({
      household: null,
      plan: null,
      summary: {
        total_planned: 0,
        total_realized: 0,
        fixed_count: 0,
        usage_pct: 0,
        top_categories: [],
        pending_items: [],
        sections: [],
        paid_by: [],
        avulso_total: 0,
        avulso_count: 0,
        avulso_transactions: [],
        monthly_income: null,
        planned_balance: null,
        available_balance: null,
      },
    });
  }

  const plan = await getMonthlyPlan(context, month, year);
  const items = plan ? await listMonthlyPlanItems(plan.id) : [];
  const transactions = await listHouseholdTransactions(context, month, year);
  const monthlyIncome = await getMonthlyHouseholdIncome(context, month, year);
  const memberLabels = Object.fromEntries(
    context.household.members.map((member) => [member.user_id, member.display_name]),
  );

  return NextResponse.json({
    household: {
      ...context.household,
      members: context.household.members.map((member) => ({
        user_id: member.user_id,
        label: member.display_name,
        role: member.role,
      })),
    },
    plan,
    summary: buildMonthlySummary(items, transactions, memberLabels, monthlyIncome?.income_amount ?? null),
  });
}
