import { NextResponse } from "next/server";
import { requireUserForRoute } from "@/lib/auth";
import { getHouseholdContext } from "@/lib/household";
import { buildComparisonRows, getMonthlyPlan, listHouseholdTransactions, listMonthlyPlanItems } from "@/lib/monthly-plan";

export async function GET(req: Request) {
  const { user, response } = await requireUserForRoute();
  if (!user) return response;
  const { searchParams } = new URL(req.url);
  const month = Number(searchParams.get("month"));
  const year = Number(searchParams.get("year"));

  if (!month || !year) {
    return NextResponse.json({ error: "month e year são obrigatórios" }, { status: 400 });
  }

  const context = await getHouseholdContext(user);
  if (!context.household) {
    return NextResponse.json({ rows: [], household: null });
  }

  const plan = await getMonthlyPlan(context, month, year);
  const items = plan ? await listMonthlyPlanItems(plan.id) : [];
  const transactions = await listHouseholdTransactions(context, month, year);
  const memberLabels = Object.fromEntries(
    context.household.members.map((member) => [member.user_id, member.display_name]),
  );
  const rows = buildComparisonRows(items, transactions, memberLabels);

  return NextResponse.json({ rows });
}

