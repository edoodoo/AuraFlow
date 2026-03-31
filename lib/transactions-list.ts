import type { HouseholdContext } from "./household";

/** One row as returned from Supabase for list queries (GET /api/transactions). */
export type TransactionListRow = {
  id: string;
  user_id: string;
  category_id: string | null;
  amount: number;
  description: string | null;
  transaction_date: string;
  receipt_url: string | null;
  created_at: string;
  transaction_kind: "avulso" | "linked_plan_item";
  monthly_plan_item_id: string | null;
  plan_item: { title: string; section: string } | { title: string; section: string }[] | null;
  /** Supabase may return a single object or an array for nested relations. */
  category: { name: string } | { name: string }[] | null;
};

export type LinkedPaymentLine = {
  id: string;
  user_id: string;
  payer_display_name: string;
  category_id: string | null;
  amount: number;
  description: string | null;
  transaction_date: string;
  receipt_url: string | null;
  created_at: string;
  category: { name: string } | { name: string }[] | null;
};

export type TransactionFeedEntry =
  | { kind: "avulso"; transaction: TransactionListRow }
  | {
      kind: "linked_aggregate";
      monthly_plan_item_id: string;
      plan_item: { title: string; section: string } | { title: string; section: string }[] | null;
      payments: LinkedPaymentLine[];
    }
  | { kind: "linked_loose"; transaction: TransactionListRow };

/**
 * Only rows with transaction_kind === 'linked_plan_item' AND non-null monthly_plan_item_id are grouped;
 * grouping key is strictly monthly_plan_item_id (no description/category heuristics).
 */
export function groupLinkedTransactionsByPlanItem(rows: TransactionListRow[]): Map<string, TransactionListRow[]> {
  const byPlan = new Map<string, TransactionListRow[]>();
  for (const row of rows) {
    if (row.transaction_kind !== "linked_plan_item" || !row.monthly_plan_item_id) continue;
    const list = byPlan.get(row.monthly_plan_item_id) ?? [];
    list.push(row);
    byPlan.set(row.monthly_plan_item_id, list);
  }
  for (const [, list] of byPlan) {
    list.sort((a, b) => {
      const byCreated = a.created_at.localeCompare(b.created_at);
      if (byCreated !== 0) return byCreated;
      return a.id.localeCompare(b.id);
    });
  }
  return byPlan;
}

function rowToPaymentLine(row: TransactionListRow, getPayerLabel: (userId: string) => string): LinkedPaymentLine {
  return {
    id: row.id,
    user_id: row.user_id,
    payer_display_name: getPayerLabel(row.user_id),
    category_id: row.category_id,
    amount: Number(row.amount),
    description: row.description,
    transaction_date: row.transaction_date,
    receipt_url: row.receipt_url,
    created_at: row.created_at,
    category: row.category,
  };
}

function primaryDateForEntry(entry: TransactionFeedEntry, sort: "asc" | "desc"): string {
  if (entry.kind === "avulso" || entry.kind === "linked_loose") {
    return entry.transaction.transaction_date;
  }
  const dates = entry.payments.map((p) => p.transaction_date);
  if (dates.length === 0) return "";
  if (sort === "desc") {
    return dates.reduce((a, b) => (a > b ? a : b));
  }
  return dates.reduce((a, b) => (a < b ? a : b));
}

function tiebreakForEntry(entry: TransactionFeedEntry, sort: "asc" | "desc"): string {
  if (entry.kind === "avulso" || entry.kind === "linked_loose") {
    return entry.transaction.created_at;
  }
  const times = entry.payments.map((p) => p.created_at);
  if (times.length === 0) return "";
  if (sort === "desc") {
    return times.reduce((a, b) => (a > b ? a : b));
  }
  return times.reduce((a, b) => (a < b ? a : b));
}

/**
 * Merges avulso rows, grouped linked rows, and loose linked rows into a single feed ordered by
 * activity date (aggregate uses the latest/earliest payment date depending on sort).
 */
export function buildTransactionFeedEntries(
  avulsoRows: TransactionListRow[],
  linkedRowsForGrouping: TransactionListRow[],
  looseLinkedRows: TransactionListRow[],
  options: { limit: number; sort: "asc" | "desc"; getPayerLabel: (userId: string) => string },
): TransactionFeedEntry[] {
  const byPlanItem = groupLinkedTransactionsByPlanItem(linkedRowsForGrouping);

  const entries: TransactionFeedEntry[] = [];

  for (const t of avulsoRows) {
    entries.push({ kind: "avulso", transaction: t });
  }

  for (const t of looseLinkedRows) {
    entries.push({ kind: "linked_loose", transaction: t });
  }

  for (const [monthlyPlanItemId, planRows] of byPlanItem) {
    const first = planRows[0];
    entries.push({
      kind: "linked_aggregate",
      monthly_plan_item_id: monthlyPlanItemId,
      plan_item: first?.plan_item ?? null,
      payments: planRows.map((row) => rowToPaymentLine(row, options.getPayerLabel)),
    });
  }

  const mult = options.sort === "desc" ? -1 : 1;
  entries.sort((a, b) => {
    const dateA = primaryDateForEntry(a, options.sort);
    const dateB = primaryDateForEntry(b, options.sort);
    const c = dateA.localeCompare(dateB);
    if (c !== 0) return mult * c;
    const tieA = tiebreakForEntry(a, options.sort);
    const tieB = tiebreakForEntry(b, options.sort);
    const t = tieA.localeCompare(tieB);
    if (t !== 0) return mult * t;
    const idA = a.kind === "linked_aggregate" ? a.monthly_plan_item_id : a.transaction.id;
    const idB = b.kind === "linked_aggregate" ? b.monthly_plan_item_id : b.transaction.id;
    return idA.localeCompare(idB);
  });

  return entries.slice(0, options.limit);
}

export function makePayerLabelResolver(context: HouseholdContext): (userId: string) => string {
  const members = context.household?.members ?? [];
  const map = new Map(members.map((m) => [m.user_id, m.display_name]));
  return (userId: string) => map.get(userId) ?? "Usuário";
}
