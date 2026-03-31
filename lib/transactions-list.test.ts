import { describe, expect, it } from "vitest";
import type { HouseholdContext, HouseholdMember } from "./household";
import {
  buildTransactionFeedEntries,
  groupLinkedTransactionsByPlanItem,
  makePayerLabelResolver,
  type TransactionListRow,
} from "./transactions-list";

function baseRow(overrides: Partial<TransactionListRow> & Pick<TransactionListRow, "id">): TransactionListRow {
  return {
    user_id: "user-a",
    category_id: null,
    amount: 100,
    description: "same description everywhere",
    transaction_date: "2025-06-01",
    receipt_url: null,
    created_at: "2025-06-01T12:00:00.000Z",
    transaction_kind: "avulso",
    monthly_plan_item_id: null,
    plan_item: null,
    category: null,
    ...overrides,
  };
}

function minimalHouseholdContext(members: HouseholdMember[]): HouseholdContext {
  return {
    user: { id: "user-a" },
    household: {
      id: "hh-1",
      owner_user_id: "user-a",
      partner_email: null,
      created_at: "2025-01-01T00:00:00Z",
      members,
    },
    memberUserIds: members.map((m) => m.user_id),
    canManageHousehold: true,
  };
}

describe("groupLinkedTransactionsByPlanItem", () => {
  it("groups linked_plan_item rows strictly by monthly_plan_item_id", () => {
    const mpi = "mpi-1";
    const rows = [
      baseRow({
        id: "t1",
        transaction_kind: "linked_plan_item",
        monthly_plan_item_id: mpi,
        created_at: "2025-06-02T10:00:00.000Z",
        plan_item: { title: "Rent", section: "fixed" },
      }),
      baseRow({
        id: "t2",
        transaction_kind: "linked_plan_item",
        monthly_plan_item_id: mpi,
        created_at: "2025-06-01T10:00:00.000Z",
        plan_item: { title: "Rent", section: "fixed" },
      }),
    ];
    const map = groupLinkedTransactionsByPlanItem(rows);
    expect(map.size).toBe(1);
    expect(map.get(mpi)?.map((r) => r.id)).toEqual(["t2", "t1"]);
  });

  it("does not group avulso rows (no fuzzy key from description)", () => {
    const rows = [
      baseRow({
        id: "a1",
        transaction_kind: "avulso",
        monthly_plan_item_id: "mpi-should-not-matter",
        description: "linked lookalike",
      }),
    ];
    const map = groupLinkedTransactionsByPlanItem(rows);
    expect(map.size).toBe(0);
  });

  it("does not group linked_plan_item without monthly_plan_item_id (no heuristic grouping)", () => {
    const rows = [
      baseRow({
        id: "l1",
        transaction_kind: "linked_plan_item",
        monthly_plan_item_id: null,
        description: "orphan linked",
      }),
    ];
    const map = groupLinkedTransactionsByPlanItem(rows);
    expect(map.size).toBe(0);
  });

  it("same description/category but different monthly_plan_item_id yields separate groups", () => {
    const rows = [
      baseRow({
        id: "x1",
        transaction_kind: "linked_plan_item",
        monthly_plan_item_id: "mpi-a",
        category_id: "cat-1",
      }),
      baseRow({
        id: "x2",
        transaction_kind: "linked_plan_item",
        monthly_plan_item_id: "mpi-b",
        category_id: "cat-1",
      }),
    ];
    const map = groupLinkedTransactionsByPlanItem(rows);
    expect(map.size).toBe(2);
    expect(map.get("mpi-a")?.map((r) => r.id)).toEqual(["x1"]);
    expect(map.get("mpi-b")?.map((r) => r.id)).toEqual(["x2"]);
  });

  it("sorts rows within a group by created_at then id", () => {
    const mpi = "mpi-sort";
    const rows = [
      baseRow({
        id: "b",
        transaction_kind: "linked_plan_item",
        monthly_plan_item_id: mpi,
        created_at: "2025-06-01T12:00:00.000Z",
      }),
      baseRow({
        id: "a",
        transaction_kind: "linked_plan_item",
        monthly_plan_item_id: mpi,
        created_at: "2025-06-01T12:00:00.000Z",
      }),
      baseRow({
        id: "c",
        transaction_kind: "linked_plan_item",
        monthly_plan_item_id: mpi,
        created_at: "2025-06-01T11:00:00.000Z",
      }),
    ];
    const map = groupLinkedTransactionsByPlanItem(rows);
    expect(map.get(mpi)?.map((r) => r.id)).toEqual(["c", "a", "b"]);
  });
});

describe("buildTransactionFeedEntries", () => {
  const label = (uid: string) => (uid === "user-a" ? "Payer A" : "Payer B");

  it("keeps avulso as separate entries (not merged into aggregates)", () => {
    const avulso = [
      baseRow({ id: "av1", transaction_kind: "avulso", transaction_date: "2025-05-01" }),
    ];
    const linked = [
      baseRow({
        id: "lk1",
        transaction_kind: "linked_plan_item",
        monthly_plan_item_id: "mpi-1",
        transaction_date: "2025-06-15",
      }),
    ];
    const entries = buildTransactionFeedEntries(avulso, linked, [], {
      limit: 10,
      sort: "desc",
      getPayerLabel: label,
    });
    const kinds = entries.map((e) => e.kind);
    expect(kinds).toContain("avulso");
    expect(kinds).toContain("linked_aggregate");
    const av = entries.find((e) => e.kind === "avulso");
    expect(av && av.kind === "avulso" && av.transaction.id).toBe("av1");
  });

  it("aggregates multiple payments for the same monthly_plan_item_id", () => {
    const linked = [
      baseRow({
        id: "p1",
        user_id: "user-a",
        transaction_kind: "linked_plan_item",
        monthly_plan_item_id: "mpi-z",
        transaction_date: "2025-04-01",
        created_at: "2025-04-01T00:00:00Z",
      }),
      baseRow({
        id: "p2",
        user_id: "user-b",
        transaction_kind: "linked_plan_item",
        monthly_plan_item_id: "mpi-z",
        transaction_date: "2025-04-10",
        created_at: "2025-04-10T00:00:00Z",
      }),
    ];
    const entries = buildTransactionFeedEntries([], linked, [], {
      limit: 10,
      sort: "desc",
      getPayerLabel: label,
    });
    expect(entries).toHaveLength(1);
    expect(entries[0]?.kind).toBe("linked_aggregate");
    if (entries[0]?.kind === "linked_aggregate") {
      expect(entries[0].payments.map((p) => p.id).sort()).toEqual(["p1", "p2"]);
      expect(entries[0].payments.map((p) => p.payer_display_name)).toEqual(["Payer A", "Payer B"]);
    }
  });

  it("lists loose linked rows separately (not grouped by description)", () => {
    const loose = [
      baseRow({
        id: "loose1",
        transaction_kind: "linked_plan_item",
        monthly_plan_item_id: null,
        transaction_date: "2025-07-01",
      }),
    ];
    const entries = buildTransactionFeedEntries([], [], loose, {
      limit: 10,
      sort: "desc",
      getPayerLabel: label,
    });
    expect(entries).toHaveLength(1);
    expect(entries[0]?.kind).toBe("linked_loose");
  });

  it("orders feed by sort: desc uses max payment date for aggregates", () => {
    const agg = [
      baseRow({
        id: "a1",
        transaction_kind: "linked_plan_item",
        monthly_plan_item_id: "mpi-old",
        transaction_date: "2025-01-01",
        created_at: "2025-01-01T00:00:00Z",
      }),
      baseRow({
        id: "a2",
        transaction_kind: "linked_plan_item",
        monthly_plan_item_id: "mpi-new",
        transaction_date: "2025-03-01",
        created_at: "2025-03-01T00:00:00Z",
      }),
    ];
    const entries = buildTransactionFeedEntries([], agg, [], {
      limit: 10,
      sort: "desc",
      getPayerLabel: label,
    });
    const aggIds = entries
      .filter((e): e is Extract<typeof e, { kind: "linked_aggregate" }> => e.kind === "linked_aggregate")
      .map((e) => e.monthly_plan_item_id);
    expect(aggIds[0]).toBe("mpi-new");
    expect(aggIds[1]).toBe("mpi-old");
  });

  it("orders feed by sort: asc uses min payment date for aggregates", () => {
    const agg = [
      baseRow({
        id: "a1",
        transaction_kind: "linked_plan_item",
        monthly_plan_item_id: "mpi-old",
        transaction_date: "2025-01-01",
        created_at: "2025-01-01T00:00:00Z",
      }),
      baseRow({
        id: "a2",
        transaction_kind: "linked_plan_item",
        monthly_plan_item_id: "mpi-new",
        transaction_date: "2025-03-01",
        created_at: "2025-03-01T00:00:00Z",
      }),
    ];
    const entries = buildTransactionFeedEntries([], agg, [], {
      limit: 10,
      sort: "asc",
      getPayerLabel: label,
    });
    const aggIds = entries
      .filter((e): e is Extract<typeof e, { kind: "linked_aggregate" }> => e.kind === "linked_aggregate")
      .map((e) => e.monthly_plan_item_id);
    expect(aggIds[0]).toBe("mpi-old");
    expect(aggIds[1]).toBe("mpi-new");
  });

  it("respects limit", () => {
    const avulso = [baseRow({ id: "v1", transaction_kind: "avulso", transaction_date: "2025-01-01" })];
    const linked = [
      baseRow({
        id: "l1",
        transaction_kind: "linked_plan_item",
        monthly_plan_item_id: "mpi-1",
        transaction_date: "2025-02-01",
      }),
    ];
    const entries = buildTransactionFeedEntries(avulso, linked, [], {
      limit: 1,
      sort: "desc",
      getPayerLabel: label,
    });
    expect(entries).toHaveLength(1);
  });
});

describe("makePayerLabelResolver", () => {
  it("resolves display_name from household members and falls back to Usuário", () => {
    const ctx = minimalHouseholdContext([
      {
        user_id: "u-known",
        email: null,
        first_name: null,
        last_name: null,
        display_name: "Partner Name",
        role: "partner",
      },
    ]);
    const resolve = makePayerLabelResolver(ctx);
    expect(resolve("u-known")).toBe("Partner Name");
    expect(resolve("unknown-id")).toBe("Usuário");
  });
});
