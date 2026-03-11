import { NextResponse } from "next/server";
import { categorySchema } from "@/lib/validators";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { requireUserForRoute } from "@/lib/auth";

export async function GET() {
  const { user, response } = await requireUserForRoute();
  if (!user) return response;
  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase
    .from("categories")
    .select("id,name,user_id")
    .or(`user_id.is.null,user_id.eq.${user.id}`)
    .order("name");

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ categories: data ?? [] });
}

export async function POST(req: Request) {
  const { user, response } = await requireUserForRoute();
  if (!user) return response;
  const supabase = await getSupabaseServerClient();
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

