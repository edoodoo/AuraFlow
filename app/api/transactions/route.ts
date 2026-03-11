import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { requireUserForRoute } from "@/lib/auth";
import { ENV } from "@/lib/env";

export async function GET(req: Request) {
  const { user, response } = await requireUserForRoute();
  if (!user) return response;
  const supabase = await getSupabaseServerClient();
  const { searchParams } = new URL(req.url);

  const categoryId = searchParams.get("category_id");
  const dateFrom = searchParams.get("date_from");
  const dateTo = searchParams.get("date_to");
  const limit = Number(searchParams.get("limit") ?? 50);

  let query = supabase
    .from("transactions")
    .select("id,amount,description,transaction_date,receipt_url,category:categories(name)")
    .eq("user_id", user.id)
    .order("transaction_date", { ascending: false })
    .limit(Math.min(200, Math.max(1, limit)));

  if (categoryId) query = query.eq("category_id", categoryId);
  if (dateFrom) query = query.gte("transaction_date", dateFrom);
  if (dateTo) query = query.lte("transaction_date", dateTo);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ transactions: data ?? [] });
}

export async function POST(req: Request) {
  const { user, response } = await requireUserForRoute();
  if (!user) return response;
  const supabase = await getSupabaseServerClient();

  const formData = await req.formData();
  const category_id = String(formData.get("category_id") ?? "");
  const amountRaw = Number(formData.get("amount") ?? 0);
  const descriptionRaw = String(formData.get("description") ?? "").trim();
  const transaction_date = String(formData.get("transaction_date") ?? "");
  const receipt = formData.get("receipt") as File | null;

  if (!category_id || !Number.isFinite(amountRaw) || amountRaw <= 0 || !transaction_date) {
    return NextResponse.json({ error: "Campos obrigatórios inválidos." }, { status: 400 });
  }

  let receipt_url: string | null = null;
  if (receipt && receipt.size > 0) {
    const ext = receipt.name.split(".").pop() || "jpg";
    const path = `${user.id}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
    const bytes = await receipt.arrayBuffer();
    const { error: uploadError } = await supabase.storage.from(ENV.receiptsBucket).upload(path, bytes, {
      contentType: receipt.type || "image/jpeg",
      upsert: false,
    });
    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 400 });

    const { data: publicData } = supabase.storage.from(ENV.receiptsBucket).getPublicUrl(path);
    receipt_url = publicData.publicUrl ?? null;
  }

  const { data, error } = await supabase
    .from("transactions")
    .insert({
      user_id: user.id,
      category_id,
      amount: amountRaw,
      description: descriptionRaw || null,
      transaction_date,
      receipt_url,
    })
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ transaction: data }, { status: 201 });
}

