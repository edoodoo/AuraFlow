import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { requireUserForRoute } from "@/lib/auth";

export async function GET(req: Request) {
  const { user, response } = await requireUserForRoute();
  if (!user) return response;
  const supabase = await getSupabaseServerClient();
  const { searchParams } = new URL(req.url);
  const month = Number(searchParams.get("month"));
  const year = Number(searchParams.get("year"));

  if (!month || !year) {
    return NextResponse.json({ error: "month e year são obrigatórios" }, { status: 400 });
  }

  const { data: budgets, error: budgetsError } = await supabase
    .from("monthly_budgets")
    .select("category_id,expected_amount,category:categories(name)")
    .eq("user_id", user.id)
    .eq("month", month)
    .eq("year", year);

  if (budgetsError) return NextResponse.json({ error: budgetsError.message }, { status: 400 });

  const dateStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const dateEnd = `${year}-${String(month).padStart(2, "0")}-31`;
  const { data: txs, error: txError } = await supabase
    .from("transactions")
    .select("category_id,amount,user_id")
    .eq("user_id", user.id)
    .gte("transaction_date", dateStart)
    .lte("transaction_date", dateEnd);

  if (txError) return NextResponse.json({ error: txError.message }, { status: 400 });

  const agg = new Map<
    string,
    { realized: number; contributors: Set<string> }
  >();
  for (const tx of txs ?? []) {
    const current = agg.get(tx.category_id) ?? { realized: 0, contributors: new Set<string>() };
    current.realized += Number(tx.amount ?? 0);
    current.contributors.add(tx.user_id);
    agg.set(tx.category_id, current);
  }

  const rows = (budgets ?? []).map((b) => {
    const entry = agg.get(b.category_id);
    const categoryName = Array.isArray(b.category)
      ? b.category[0]?.name
      : (b.category as { name?: string } | null)?.name;
    return {
      category_id: b.category_id,
      category_name: categoryName ?? "Sem categoria",
      expected_amount: Number(b.expected_amount ?? 0),
      realized_amount: Number(entry?.realized ?? 0),
      contributors: Array.from(entry?.contributors ?? []),
    };
  });

  return NextResponse.json({ rows });
}

