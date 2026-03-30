export type PortfolioAsset = {
  id: string;
  ticker: string;
  label: string | null;
  target_pct: number;
  current_value: number;
};

export type PurchaseOrder = {
  asset_id: string;
  ticker: string;
  label: string | null;
  target_pct: number;
  current_pct: number;
  post_pct: number;
  gap_absolute: number;
  purchase_amount: number;
  gap_fill_pct: number;
};

export type RebalancingResult = {
  projected_total: number;
  orders: PurchaseOrder[];
  remaining: number;
};

const round2 = (n: number) => Math.round(n * 100) / 100;

export function calculateRebalancing(
  total_invested: number,
  contribution_amount: number,
  assets: PortfolioAsset[],
): RebalancingResult {
  if (assets.length === 0) {
    return { projected_total: total_invested + contribution_amount, orders: [], remaining: contribution_amount };
  }

  const projected_total = total_invested + contribution_amount;

  const raw = assets.map((a) => {
    const target_value = projected_total * (a.target_pct / 100);
    const gap = target_value - a.current_value;
    const purchase = Math.max(0, gap);
    return { asset: a, target_value, gap, purchase };
  });

  const totalPurchases = raw.reduce((s, r) => s + r.purchase, 0);

  // Scale proportionally if purchases exceed contribution
  const scale = totalPurchases > 0 && totalPurchases > contribution_amount
    ? contribution_amount / totalPurchases
    : totalPurchases > 0 ? 1 : 0;

  const orders: PurchaseOrder[] = raw
    .map((r) => {
      const purchase_amount = round2(r.purchase * scale);
      const post_value = r.asset.current_value + purchase_amount;
      const current_pct = total_invested > 0 ? round2((r.asset.current_value / total_invested) * 100) : 0;
      const post_pct = projected_total > 0 ? round2((post_value / projected_total) * 100) : 0;
      const gap_fill_pct = r.gap > 0 ? round2((purchase_amount / r.gap) * 100) : 0;

      return {
        asset_id: r.asset.id,
        ticker: r.asset.ticker,
        label: r.asset.label,
        target_pct: r.asset.target_pct,
        current_pct,
        post_pct,
        gap_absolute: round2(r.gap),
        purchase_amount,
        gap_fill_pct,
      };
    })
    .sort((a, b) => b.purchase_amount - a.purchase_amount || a.gap_absolute - b.gap_absolute); // highest purchase first, then most negative gap

  const allocated = orders.reduce((s, o) => s + o.purchase_amount, 0);
  return { projected_total: round2(projected_total), orders, remaining: round2(contribution_amount - allocated) };
}
