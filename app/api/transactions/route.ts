import { NextResponse } from "next/server";
import { requireUserForRoute } from "@/lib/auth";
import { ENV } from "@/lib/env";
import { getHouseholdContext } from "@/lib/household";
import { getLinkedPaymentState, refreshMonthlyPlanItemStatus } from "@/lib/monthly-plan";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import {
  buildTransactionFeedEntries,
  makePayerLabelResolver,
  type TransactionListRow,
} from "@/lib/transactions-list";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);

const TX_LIST_SELECT =
  "id,user_id,category_id,amount,description,transaction_date,receipt_url,created_at,transaction_kind,monthly_plan_item_id,category:categories(name),plan_item:monthly_plan_items(title,section)";

/** Optional list filters shared across feed queries (category / date range). */
function addOptionalListFilters(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase filter builder chain
  q: any,
  categoryId: string | null,
  dateFrom: string | null,
  dateTo: string | null,
) {
  let query = q;
  if (categoryId) query = query.eq("category_id", categoryId);
  if (dateFrom) query = query.gte("transaction_date", dateFrom);
  if (dateTo) query = query.lte("transaction_date", dateTo);
  return query;
}

export async function GET(req: Request) {
  const { user, response } = await requireUserForRoute();
  if (!user) return response;
  const supabase = getSupabaseAdminClient();
  const context = await getHouseholdContext(user);
  const { searchParams } = new URL(req.url);

  const categoryId = searchParams.get("category_id");
  const dateFrom = searchParams.get("date_from");
  const dateTo = searchParams.get("date_to");
  const limit = Number(searchParams.get("limit") ?? 50);
  const sortDirection = searchParams.get("sort") === "asc" ? "asc" : "desc";
  const isAscending = sortDirection === "asc";
  const listLimit = Math.min(200, Math.max(1, limit));
  /** Fetch a wide window per slice so grouping linked rows still yields enough distinct feed cards after merge. */
  const fetchCap = Math.min(500, Math.max(80, listLimit * 25));

  const getPayerLabel = makePayerLabelResolver(context);

  let avulsoQuery = supabase
    .from("transactions")
    .select(TX_LIST_SELECT)
    .eq("user_id", user.id)
    .eq("transaction_kind", "avulso")
    .order("transaction_date", { ascending: isAscending })
    .order("created_at", { ascending: isAscending })
    .limit(fetchCap);
  avulsoQuery = addOptionalListFilters(avulsoQuery, categoryId, dateFrom, dateTo);

  let looseLinkedQuery = supabase
    .from("transactions")
    .select(TX_LIST_SELECT)
    .eq("user_id", user.id)
    .eq("transaction_kind", "linked_plan_item")
    .is("monthly_plan_item_id", null)
    .order("transaction_date", { ascending: isAscending })
    .order("created_at", { ascending: isAscending })
    .limit(fetchCap);
  looseLinkedQuery = addOptionalListFilters(looseLinkedQuery, categoryId, dateFrom, dateTo);

  let linkedQuery = supabase
    .from("transactions")
    .select(TX_LIST_SELECT)
    .eq("transaction_kind", "linked_plan_item")
    .not("monthly_plan_item_id", "is", null)
    .order("transaction_date", { ascending: isAscending })
    .order("created_at", { ascending: isAscending })
    .limit(fetchCap);

  if (context.household) {
    linkedQuery = linkedQuery.eq("household_id", context.household.id);
  } else {
    linkedQuery = linkedQuery.eq("user_id", user.id);
  }
  linkedQuery = addOptionalListFilters(linkedQuery, categoryId, dateFrom, dateTo);

  let linkedLegacyQuery: typeof avulsoQuery | null = null;
  if (context.household) {
    linkedLegacyQuery = supabase
      .from("transactions")
      .select(TX_LIST_SELECT)
      .eq("transaction_kind", "linked_plan_item")
      .not("monthly_plan_item_id", "is", null)
      .eq("user_id", user.id)
      .is("household_id", null)
      .order("transaction_date", { ascending: isAscending })
      .order("created_at", { ascending: isAscending })
      .limit(fetchCap);
    linkedLegacyQuery = addOptionalListFilters(linkedLegacyQuery, categoryId, dateFrom, dateTo);
  }

  const [avulsoRes, looseRes, linkedRes, legacyRes] = await Promise.all([
    avulsoQuery,
    looseLinkedQuery,
    linkedQuery,
    linkedLegacyQuery ?? Promise.resolve({ data: [] as TransactionListRow[], error: null }),
  ]);

  for (const r of [avulsoRes, looseRes, linkedRes, legacyRes]) {
    if (r.error) return NextResponse.json({ error: r.error.message }, { status: 400 });
  }

  const avulsoRows = (avulsoRes.data ?? []) as unknown as TransactionListRow[];
  const looseLinkedRows = (looseRes.data ?? []) as unknown as TransactionListRow[];
  let linkedRows = (linkedRes.data ?? []) as unknown as TransactionListRow[];
  if (context.household) {
    const legacy = (legacyRes.data ?? []) as unknown as TransactionListRow[];
    const seen = new Map<string, TransactionListRow>();
    for (const row of linkedRows) seen.set(row.id, row);
    for (const row of legacy) seen.set(row.id, row);
    linkedRows = [...seen.values()];
  }

  const entries = buildTransactionFeedEntries(avulsoRows, linkedRows, looseLinkedRows, {
    limit: listLimit,
    sort: sortDirection,
    getPayerLabel,
  });

  return NextResponse.json({ entries });
}

export async function POST(req: Request) {
  const { user, response } = await requireUserForRoute();
  if (!user) return response;
  const supabase = getSupabaseAdminClient();
  const context = await getHouseholdContext(user);

  const formData = await req.formData();
  let category_id = String(formData.get("category_id") ?? "");
  const amountRaw = Number(formData.get("amount") ?? 0);
  const descriptionRaw = String(formData.get("description") ?? "").trim();
  const transaction_date = String(formData.get("transaction_date") ?? "");
  const receipt = formData.get("receipt") as File | null;
  const transaction_kind = String(formData.get("transaction_kind") ?? "avulso") as "avulso" | "linked_plan_item";
  const monthly_plan_item_id = String(formData.get("monthly_plan_item_id") ?? "").trim() || null;

  if (!Number.isFinite(amountRaw) || amountRaw <= 0 || !transaction_date) {
    return NextResponse.json({ error: "Campos obrigatórios inválidos." }, { status: 400 });
  }

  let linkedItem:
    | {
        id: string;
        monthly_plan_id: string;
        category_id: string | null;
      }
    | null = null;

  if (transaction_kind === "linked_plan_item") {
    if (!monthly_plan_item_id || !context.household) {
      return NextResponse.json({ error: "Selecione um item do mensal para vincular o lançamento." }, { status: 400 });
    }

    const { data: item, error: itemError } = await supabase
      .from("monthly_plan_items")
      .select("id,monthly_plan_id,category_id")
      .eq("id", monthly_plan_item_id)
      .maybeSingle<{ id: string; monthly_plan_id: string; category_id: string | null }>();

    if (itemError) return NextResponse.json({ error: itemError.message }, { status: 400 });
    if (!item) return NextResponse.json({ error: "Item do mensal não encontrado." }, { status: 404 });

    const { data: plan, error: planError } = await supabase
      .from("monthly_plans")
      .select("id,household_id")
      .eq("id", item.monthly_plan_id)
      .maybeSingle<{ id: string; household_id: string }>();

    if (planError) return NextResponse.json({ error: planError.message }, { status: 400 });
    if (!plan || plan.household_id !== context.household.id) {
      return NextResponse.json({ error: "O item escolhido não pertence ao seu planejamento." }, { status: 403 });
    }

    const paymentState = await getLinkedPaymentState(item.id);
    if (paymentState.remaining_amount <= 0) {
      return NextResponse.json(
        {
          error: "Este item do mensal já está pago. Para registrar valor extra, use um lançamento avulso.",
        },
        { status: 400 },
      );
    }

    if (amountRaw > paymentState.remaining_amount) {
      return NextResponse.json(
        {
          error: `Faltam apenas ${formatCurrency(paymentState.remaining_amount)} para quitar este item. Ajuste o valor ou registre o excedente como lançamento avulso.`,
        },
        { status: 400 },
      );
    }

    linkedItem = item;
    category_id = item.category_id ?? category_id;
  }

  if (!category_id) {
    return NextResponse.json({ error: "Selecione uma categoria para registrar o gasto." }, { status: 400 });
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
      household_id: context.household?.id ?? null,
      category_id,
      amount: amountRaw,
      description: descriptionRaw || null,
      transaction_date,
      receipt_url,
      transaction_kind,
      monthly_plan_item_id: linkedItem?.id ?? null,
    })
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  if (linkedItem?.id) {
    await refreshMonthlyPlanItemStatus(linkedItem.id);
  }

  return NextResponse.json({ transaction: data }, { status: 201 });
}

