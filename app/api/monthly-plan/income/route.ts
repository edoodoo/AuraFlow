import { NextResponse } from "next/server";
import { requireUserForRoute } from "@/lib/auth";
import { getHouseholdContext } from "@/lib/household";
import { upsertMonthlyHouseholdIncome } from "@/lib/monthly-plan";
import { monthlyIncomeSchema } from "@/lib/validators";

export async function PUT(req: Request) {
  try {
    const { user, response } = await requireUserForRoute();
    if (!user) return response;

    const context = await getHouseholdContext(user);
    if (!context.household) {
      return NextResponse.json(
        { error: "Crie ou vincule o mensal antes de informar a renda do casal." },
        { status: 400 },
      );
    }

    const body = await req.json().catch(() => null);
    const parsed = monthlyIncomeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados da renda mensal inválidos." }, { status: 400 });
    }

    const income = await upsertMonthlyHouseholdIncome(
      context,
      parsed.data.month,
      parsed.data.year,
      parsed.data.income_amount,
    );

    return NextResponse.json({ income });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Não foi possível salvar a renda mensal." },
      { status: 400 },
    );
  }
}
