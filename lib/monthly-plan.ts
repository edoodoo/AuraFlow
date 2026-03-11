import { getSupabaseAdminClient } from "./supabase-admin";
import type { HouseholdContext } from "./household";

export const PLAN_SECTIONS = ["general", "investments", "emergency_reserve", "debts"] as const;
export type PlanSection = (typeof PLAN_SECTIONS)[number];

export const SECTION_LABELS: Record<PlanSection, string> = {
  general: "Gastos mensais",
  investments: "Investimentos",
  emergency_reserve: "Reserva de Emergência",
  debts: "Dívidas",
};

export type MonthlyPlan = {
  id: string;
  household_id: string;
  month: number;
  year: number;
  created_by: string;
};

export type MonthlyPlanItem = {
  id: string;
  monthly_plan_id: string;
  category_id: string | null;
  title: string;
  section: PlanSection;
  expected_amount: number;
  is_fixed: boolean;
  due_date: string | null;
  status: "pending" | "partial" | "paid";
  assigned_user_id: string | null;
  paid_by_user_id: string | null;
  paid_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  category: { name: string } | { name: string }[] | null;
};

export type HouseholdTransaction = {
  id: string;
  user_id: string;
  household_id: string | null;
  category_id: string;
  amount: number;
  description: string | null;
  transaction_date: string;
  receipt_url: string | null;
  transaction_kind: "avulso" | "linked_plan_item";
  monthly_plan_item_id: string | null;
  category: { name: string } | { name: string }[] | null;
};

export function getMonthDateRange(month: number, year: number) {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 0));

  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

export async function getOrCreateMonthlyPlan(context: HouseholdContext, month: number, year: number) {
  if (!context.household) {
    throw new Error("Crie um planejamento compartilhado antes de continuar.");
  }

  const admin = getSupabaseAdminClient();
  const { data: existing, error: existingError } = await admin
    .from("monthly_plans")
    .select("id,household_id,month,year,created_by")
    .eq("household_id", context.household.id)
    .eq("month", month)
    .eq("year", year)
    .maybeSingle<MonthlyPlan>();

  if (existingError) throw existingError;
  if (existing) return existing;

  const { data, error } = await admin
    .from("monthly_plans")
    .insert({
      household_id: context.household.id,
      month,
      year,
      created_by: context.user.id,
    })
    .select("id,household_id,month,year,created_by")
    .single<MonthlyPlan>();

  if (error) throw error;
  return data;
}

export async function getMonthlyPlan(context: HouseholdContext, month: number, year: number) {
  if (!context.household) return null;

  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from("monthly_plans")
    .select("id,household_id,month,year,created_by")
    .eq("household_id", context.household.id)
    .eq("month", month)
    .eq("year", year)
    .maybeSingle<MonthlyPlan>();

  if (error) throw error;
  return data;
}

export async function listMonthlyPlanItems(planId: string) {
  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from("monthly_plan_items")
    .select(
      "id,monthly_plan_id,category_id,title,section,expected_amount,is_fixed,due_date,status,assigned_user_id,paid_by_user_id,paid_at,notes,created_at,updated_at,category:categories(name)",
    )
    .eq("monthly_plan_id", planId)
    .order("section")
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true })
    .returns<MonthlyPlanItem[]>();

  if (error) throw error;
  return data ?? [];
}

export async function listHouseholdTransactions(context: HouseholdContext, month: number, year: number) {
  if (!context.household) return [];

  const admin = getSupabaseAdminClient();
  const { start, end } = getMonthDateRange(month, year);
  const { data, error } = await admin
    .from("transactions")
    .select(
      "id,user_id,household_id,category_id,amount,description,transaction_date,receipt_url,transaction_kind,monthly_plan_item_id,category:categories(name)",
    )
    .eq("household_id", context.household.id)
    .gte("transaction_date", start)
    .lte("transaction_date", end)
    .order("transaction_date", { ascending: false })
    .returns<HouseholdTransaction[]>();

  if (error) throw error;
  return data ?? [];
}

function getCategoryName(category: HouseholdTransaction["category"] | MonthlyPlanItem["category"]) {
  if (Array.isArray(category)) return category[0]?.name ?? "Sem categoria";
  return category?.name ?? "Sem categoria";
}

export async function refreshMonthlyPlanItemStatus(itemId: string) {
  const admin = getSupabaseAdminClient();
  const { data: item, error: itemError } = await admin
    .from("monthly_plan_items")
    .select("id,expected_amount")
    .eq("id", itemId)
    .single<{ id: string; expected_amount: number }>();

  if (itemError) throw itemError;

  const { data: transactions, error: txError } = await admin
    .from("transactions")
    .select("amount,user_id,transaction_date")
    .eq("monthly_plan_item_id", itemId)
    .returns<Array<{ amount: number; user_id: string; transaction_date: string }>>();

  if (txError) throw txError;

  const totalPaid = (transactions ?? []).reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);
  const status = totalPaid <= 0 ? "pending" : totalPaid < Number(item.expected_amount || 0) ? "partial" : "paid";
  const payerIds = Array.from(new Set((transactions ?? []).map((transaction) => transaction.user_id)));
  const paidByUserId = payerIds.length === 1 ? payerIds[0] : null;
  const paidAt =
    transactions && transactions.length > 0
      ? [...transactions]
          .sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime())[0]
          .transaction_date
      : null;

  const { error: updateError } = await admin
    .from("monthly_plan_items")
    .update({
      status,
      paid_by_user_id: paidByUserId,
      paid_at: paidAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", itemId);

  if (updateError) throw updateError;
}

export function buildMonthlySummary(
  items: MonthlyPlanItem[],
  transactions: HouseholdTransaction[],
  memberLabels: Record<string, string>,
) {
  const totalPlanned = items.reduce((sum, item) => sum + Number(item.expected_amount || 0), 0);
  const totalRealized = transactions.reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);
  const fixedCount = items.filter((item) => item.is_fixed).length;
  const topCategoryMap = new Map<string, { category_name: string; realized_amount: number }>();

  for (const transaction of transactions) {
    const categoryName = getCategoryName(transaction.category);
    const current = topCategoryMap.get(transaction.category_id) ?? {
      category_name: categoryName,
      realized_amount: 0,
    };
    current.realized_amount += Number(transaction.amount || 0);
    topCategoryMap.set(transaction.category_id, current);
  }

  const pendingItems = items
    .filter((item) => item.status !== "paid")
    .sort((a, b) => Number(b.expected_amount) - Number(a.expected_amount))
    .slice(0, 5)
    .map((item) => ({
      id: item.id,
      title: item.title,
      status: item.status,
      expected_amount: Number(item.expected_amount || 0),
      section: item.section,
      assigned_to: item.assigned_user_id ? memberLabels[item.assigned_user_id] ?? "Responsável não encontrado" : "Sem responsável",
      due_date: item.due_date,
    }));

  const sectionMap = new Map<PlanSection, { planned: number; realized: number; item_count: number }>();
  for (const section of PLAN_SECTIONS) {
    sectionMap.set(section, { planned: 0, realized: 0, item_count: 0 });
  }

  for (const item of items) {
    const section = sectionMap.get(item.section)!;
    section.planned += Number(item.expected_amount || 0);
    section.item_count += 1;
  }

  for (const transaction of transactions) {
    const item = transaction.monthly_plan_item_id ? items.find((candidate) => candidate.id === transaction.monthly_plan_item_id) : null;
    const sectionKey = item?.section ?? "general";
    const section = sectionMap.get(sectionKey)!;
    section.realized += Number(transaction.amount || 0);
  }

  const paidByMap = new Map<string, number>();
  for (const transaction of transactions) {
    const current = paidByMap.get(transaction.user_id) ?? 0;
    paidByMap.set(transaction.user_id, current + Number(transaction.amount || 0));
  }

  return {
    total_planned: totalPlanned,
    total_realized: totalRealized,
    fixed_count: fixedCount,
    usage_pct: totalPlanned > 0 ? Math.min(100, (totalRealized / totalPlanned) * 100) : 0,
    top_categories: [...topCategoryMap.entries()]
      .map(([category_id, value]) => ({
        category_id,
        ...value,
      }))
      .sort((a, b) => b.realized_amount - a.realized_amount)
      .slice(0, 4),
    pending_items: pendingItems,
    sections: PLAN_SECTIONS.map((section) => ({
      key: section,
      label: SECTION_LABELS[section],
      ...(sectionMap.get(section) ?? { planned: 0, realized: 0, item_count: 0 }),
    })),
    paid_by: [...paidByMap.entries()].map(([user_id, total]) => ({
      user_id,
      label: memberLabels[user_id] ?? "Usuário",
      total,
    })),
  };
}

export function buildComparisonRows(
  items: MonthlyPlanItem[],
  transactions: HouseholdTransaction[],
  memberLabels: Record<string, string>,
) {
  const rows = new Map<
    string,
    {
      category_id: string;
      category_name: string;
      section: PlanSection;
      expected_amount: number;
      realized_amount: number;
      contributors: string[];
      items_pending: number;
      payer_breakdown: Array<{ user_id: string; label: string; total: number }>;
    }
  >();
  const payerMaps = new Map<string, Map<string, number>>();

  for (const item of items) {
    const categoryId = item.category_id ?? `uncategorized-${item.section}`;
    const categoryName = getCategoryName(item.category);
    const current = rows.get(categoryId) ?? {
      category_id: categoryId,
      category_name: categoryName,
      section: item.section,
      expected_amount: 0,
      realized_amount: 0,
      contributors: [],
      items_pending: 0,
        payer_breakdown: [],
    };
    current.expected_amount += Number(item.expected_amount || 0);
    if (item.status !== "paid") current.items_pending += 1;
    rows.set(categoryId, current);
    if (!payerMaps.has(categoryId)) {
      payerMaps.set(categoryId, new Map());
    }
  }

  for (const transaction of transactions) {
    const categoryId = transaction.category_id;
    const categoryName = getCategoryName(transaction.category);
    const item = transaction.monthly_plan_item_id ? items.find((candidate) => candidate.id === transaction.monthly_plan_item_id) : null;
    const current = rows.get(categoryId) ?? {
      category_id: categoryId,
      category_name: categoryName,
      section: item?.section ?? "general",
      expected_amount: 0,
      realized_amount: 0,
      contributors: [],
      items_pending: 0,
        payer_breakdown: [],
    };
    current.realized_amount += Number(transaction.amount || 0);
    const contributorLabel = memberLabels[transaction.user_id] ?? "Usuário";
    if (!current.contributors.includes(contributorLabel)) {
      current.contributors.push(contributorLabel);
    }
    rows.set(categoryId, current);

    const payerMap = payerMaps.get(categoryId) ?? new Map<string, number>();
    payerMap.set(transaction.user_id, (payerMap.get(transaction.user_id) ?? 0) + Number(transaction.amount || 0));
    payerMaps.set(categoryId, payerMap);
  }

  return [...rows.values()]
    .map((row) => ({
      ...row,
      payer_breakdown: [...(payerMaps.get(row.category_id) ?? new Map()).entries()]
        .map(([user_id, total]) => ({
          user_id,
          label: memberLabels[user_id] ?? "Usuário",
          total,
        }))
        .sort((a, b) => b.total - a.total),
    }))
    .sort((a, b) => b.realized_amount - a.realized_amount);
}
