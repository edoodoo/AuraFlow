import { NextResponse } from "next/server";
import { monthlyBudgetExportSchema } from "@/lib/validators";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { requireUserForRoute } from "@/lib/auth";

export async function POST(req: Request) {
  const { user, response } = await requireUserForRoute();
  if (!user) return response;
  const supabase = await getSupabaseServerClient();
  const body = await req.json().catch(() => null);
  const parsed = monthlyBudgetExportSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const { source_month, source_year, target_month, target_year, only_fixed } = parsed.data;
  let sourceQuery = supabase
    .from("monthly_budgets")
    .select("category_id,expected_amount,is_fixed")
    .eq("user_id", user.id)
    .eq("month", source_month)
    .eq("year", source_year);

  if (only_fixed) {
    sourceQuery = sourceQuery.eq("is_fixed", true);
  }

  const { data: sourceRows, error: sourceError } = await sourceQuery;
  if (sourceError) return NextResponse.json({ error: sourceError.message }, { status: 400 });

  if (!sourceRows?.length) {
    return NextResponse.json({ created: 0 });
  }

  const { data: existingRows, error: existingError } = await supabase
    .from("monthly_budgets")
    .select("category_id")
    .eq("user_id", user.id)
    .eq("month", target_month)
    .eq("year", target_year);
  if (existingError) return NextResponse.json({ error: existingError.message }, { status: 400 });

  const existing = new Set((existingRows ?? []).map((r) => r.category_id));
  const toInsert = sourceRows
    .filter((row) => !existing.has(row.category_id))
    .map((row) => ({
      user_id: user.id,
      category_id: row.category_id,
      month: target_month,
      year: target_year,
      expected_amount: row.expected_amount,
      is_fixed: row.is_fixed,
    }));

  if (!toInsert.length) {
    return NextResponse.json({ created: 0 });
  }

  const { error: insertError } = await supabase.from("monthly_budgets").insert(toInsert);
  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 400 });

  return NextResponse.json({ created: toInsert.length });
}

