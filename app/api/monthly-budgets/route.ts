import { NextResponse } from "next/server";
import { monthlyBudgetSchema } from "@/lib/validators";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { requireUserForRoute } from "@/lib/auth";

export async function GET(req: Request) {
  const { user, response } = await requireUserForRoute();
  if (!user) return response;
  const supabase = await getSupabaseServerClient();
  const { searchParams } = new URL(req.url);
  const month = Number(searchParams.get("month"));
  const year = Number(searchParams.get("year"));

  let query = supabase
    .from("monthly_budgets")
    .select("id,user_id,category_id,month,year,expected_amount,is_fixed,created_at,updated_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (!Number.isNaN(month) && month > 0) query = query.eq("month", month);
  if (!Number.isNaN(year) && year > 0) query = query.eq("year", year);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ budgets: data ?? [] });
}

export async function POST(req: Request) {
  const { user, response } = await requireUserForRoute();
  if (!user) return response;
  const supabase = await getSupabaseServerClient();
  const body = await req.json().catch(() => null);
  const parsed = monthlyBudgetSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const { data, error } = await supabase
    .from("monthly_budgets")
    .insert({ ...parsed.data, user_id: user.id })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ budget: data }, { status: 201 });
}

