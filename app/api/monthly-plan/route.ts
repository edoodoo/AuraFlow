import { NextResponse } from "next/server";
import { requireUserForRoute } from "@/lib/auth";
import { createOrUpdateHousehold, getHouseholdContext, listVisibleCategories } from "@/lib/household";
import { buildMonthlySummary, getMonthlyHouseholdIncome, getMonthlyPlan, getOrCreateMonthlyPlan, listHouseholdTransactions, listMonthlyPlanItems } from "@/lib/monthly-plan";
import { monthlyPlanRequestSchema } from "@/lib/validators";

function getMonthAndYear(url: string) {
  const { searchParams } = new URL(url);
  const now = new Date();
  const month = Number(searchParams.get("month") ?? now.getMonth() + 1);
  const year = Number(searchParams.get("year") ?? now.getFullYear());
  return { month, year };
}

export async function GET(req: Request) {
  const { user, response } = await requireUserForRoute();
  if (!user) return response;

  const { month, year } = getMonthAndYear(req.url);
  const context = await getHouseholdContext(user);
  const categories = await listVisibleCategories(context);

  if (!context.household) {
    return NextResponse.json({
      household: null,
      member_options: [{ user_id: user.id, label: user.email ?? "Você", role: "owner" }],
      categories,
      plan: null,
      items: [],
      summary: null,
    });
  }

  const plan = await getMonthlyPlan(context, month, year);
  const items = plan ? await listMonthlyPlanItems(plan.id) : [];
  const transactions = await listHouseholdTransactions(context, month, year);
  const monthlyIncome = await getMonthlyHouseholdIncome(context, month, year);
  const memberLabels = Object.fromEntries(
    context.household.members.map((member) => [member.user_id, member.email ?? "Usuário"]),
  );

  return NextResponse.json({
    household: context.household,
    member_options: context.household.members.map((member) => ({
      user_id: member.user_id,
      label: member.email ?? "Usuário",
      role: member.role,
    })),
    categories,
    plan,
    items,
    summary: buildMonthlySummary(items, transactions, memberLabels, monthlyIncome?.income_amount ?? null),
  });
}

export async function POST(req: Request) {
  try {
    const { user, response } = await requireUserForRoute();
    if (!user) return response;

    const body = await req.json().catch(() => null);
    const parsed = monthlyPlanRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados do mensal inválidos." }, { status: 400 });
    }

    const householdContext = await createOrUpdateHousehold(user, parsed.data.partner_email || null);
    const plan = await getOrCreateMonthlyPlan(householdContext, parsed.data.month, parsed.data.year);
    const items = await listMonthlyPlanItems(plan.id);
    const transactions = await listHouseholdTransactions(householdContext, parsed.data.month, parsed.data.year);
    const monthlyIncome = await getMonthlyHouseholdIncome(householdContext, parsed.data.month, parsed.data.year);
    const categories = await listVisibleCategories(householdContext);
    const memberLabels = Object.fromEntries(
      (householdContext.household?.members ?? []).map((member) => [member.user_id, member.email ?? "Usuário"]),
    );

    return NextResponse.json({
      household: householdContext.household,
      member_options: (householdContext.household?.members ?? []).map((member) => ({
        user_id: member.user_id,
        label: member.email ?? "Usuário",
        role: member.role,
      })),
      categories,
      plan,
      items,
      summary: buildMonthlySummary(items, transactions, memberLabels, monthlyIncome?.income_amount ?? null),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Não foi possível criar ou atualizar o mensal.",
      },
      { status: 400 },
    );
  }
}
