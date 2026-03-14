import { NextResponse } from "next/server";
import { requireUserForRoute } from "@/lib/auth";
import { getLinkedPaymentState, refreshMonthlyPlanItemStatus } from "@/lib/monthly-plan";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

type Params = { params: Promise<{ id: string }> };
const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);

export async function PUT(req: Request, { params }: Params) {
  const { user, response } = await requireUserForRoute();
  if (!user) return response;
  const supabase = getSupabaseAdminClient();
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const nextAmount = Number(body.amount);

  if (!Number.isFinite(nextAmount) || nextAmount <= 0) {
    return NextResponse.json({ error: "Informe um valor válido para o lançamento." }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("transactions")
    .select("monthly_plan_item_id")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle<{ monthly_plan_item_id: string | null }>();

  if (existing?.monthly_plan_item_id) {
    const paymentState = await getLinkedPaymentState(existing.monthly_plan_item_id, { excludeTransactionId: id });

    if (paymentState.remaining_amount <= 0) {
      return NextResponse.json(
        {
          error: "Este item do mensal já está pago. Para registrar valor extra, use um lançamento avulso.",
        },
        { status: 400 },
      );
    }

    if (nextAmount > paymentState.remaining_amount) {
      return NextResponse.json(
        {
          error: `Ao editar este lançamento, restam apenas ${formatCurrency(paymentState.remaining_amount)} para quitar o item. Ajuste o valor ou mova o excedente para um lançamento avulso.`,
        },
        { status: 400 },
      );
    }
  }

  const { data, error } = await supabase
    .from("transactions")
    .update({
      amount: nextAmount,
      description: body.description,
      transaction_date: body.transaction_date,
      category_id: body.category_id,
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  if (existing?.monthly_plan_item_id) {
    await refreshMonthlyPlanItemStatus(existing.monthly_plan_item_id);
  }
  if (data.monthly_plan_item_id && data.monthly_plan_item_id !== existing?.monthly_plan_item_id) {
    await refreshMonthlyPlanItemStatus(data.monthly_plan_item_id);
  }

  return NextResponse.json({ transaction: data });
}

export async function DELETE(_req: Request, { params }: Params) {
  const { user, response } = await requireUserForRoute();
  if (!user) return response;
  const supabase = getSupabaseAdminClient();
  const { id } = await params;

  const { data: existing } = await supabase
    .from("transactions")
    .select("monthly_plan_item_id")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle<{ monthly_plan_item_id: string | null }>();

  const { error } = await supabase.from("transactions").delete().eq("id", id).eq("user_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  if (existing?.monthly_plan_item_id) {
    await refreshMonthlyPlanItemStatus(existing.monthly_plan_item_id);
  }

  return NextResponse.json({ ok: true });
}

