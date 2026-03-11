import { NextResponse } from "next/server";
import { categorySchema } from "@/lib/validators";
import { requireUserForRoute } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { getHouseholdContext, listVisibleCategories } from "@/lib/household";

export async function GET() {
  const { user, response } = await requireUserForRoute();
  if (!user) return response;
  const context = await getHouseholdContext(user);
  const categories = await listVisibleCategories(context);

  return NextResponse.json({ categories });
}

export async function POST(req: Request) {
  const { user, response } = await requireUserForRoute();
  if (!user) return response;
  const supabase = getSupabaseAdminClient();
  const body = await req.json().catch(() => null);
  const parsed = categorySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const { data, error } = await supabase
    .from("categories")
    .insert({ name: parsed.data.name, user_id: user.id })
    .select("id,name,user_id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ category: data }, { status: 201 });
}

