import { NextResponse } from "next/server";
import { categorySchema } from "@/lib/validators";
import { requireUserForRoute } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { getHouseholdContext, userCanManageCategory } from "@/lib/household";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Params) {
  const { user, response } = await requireUserForRoute();
  if (!user) return response;
  const supabase = getSupabaseAdminClient();
  const context = await getHouseholdContext(user);
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = categorySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const canManage = await userCanManageCategory(id, context);
  if (!canManage) {
    return NextResponse.json({ error: "Categoria não disponível para este planejamento." }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("categories")
    .update({ name: parsed.data.name, category_kind: parsed.data.kind })
    .eq("id", id)
    .select("id,name,category_kind,user_id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ category: data });
}

export async function DELETE(_req: Request, { params }: Params) {
  const { user, response } = await requireUserForRoute();
  if (!user) return response;
  const supabase = getSupabaseAdminClient();
  const context = await getHouseholdContext(user);
  const { id } = await params;

  const canManage = await userCanManageCategory(id, context);
  if (!canManage) {
    return NextResponse.json({ error: "Categoria não disponível para este planejamento." }, { status: 403 });
  }

  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

