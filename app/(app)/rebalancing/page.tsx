"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { BarChart3, Scale, Table2, TrendingUp, Wallet } from "lucide-react";
import { PortfolioManager } from "@/components/portfolio-manager";
import type { PurchaseOrder } from "@/lib/rebalancing";

// Dynamic import para evitar SSR crash do recharts
const RebalancingChart = dynamic(() => import("./rebalancing-chart").then((m) => m.RebalancingChart), {
  ssr: false,
  loading: () => <div className="h-64 animate-pulse rounded-2xl bg-white/5" />,
});

type State = {
  total_invested: number;
  currency: string;
  updated_at: string | null;
  last_contribution_amount: number | null;
  last_projected_total: number | null;
  last_remaining: number | null;
  last_orders: PurchaseOrder[];
  last_chart_data: ChartEntry[];
  last_calculated_at: string | null;
};

type AssetSnapshot = {
  id: string;
  ticker: string;
  label: string | null;
  target_pct: number;
  current_value_cad: number;
  is_active: boolean;
};

type ChartEntry = {
  ticker: string;
  target: number;
  current: number;
  post: number;
};

const formatCAD = (v: number) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(v);

const formatDate = (iso: string | null) => {
  if (!iso) return null;
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
};

export default function RebalancingPage() {
  // Portfolio state
  const [portfolioState, setPortfolioState] = useState<State>({
    total_invested: 0,
    currency: "CAD",
    updated_at: null,
    last_contribution_amount: null,
    last_projected_total: null,
    last_remaining: null,
    last_orders: [],
    last_chart_data: [],
    last_calculated_at: null,
  });
  const [assets, setAssets] = useState<AssetSnapshot[]>([]);
  const [loadingPortfolio, setLoadingPortfolio] = useState(true);

  // Contribution
  const [contribution, setContribution] = useState("300");

  // Calculation result
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [chartData, setChartData] = useState<ChartEntry[]>([]);
  const [projectedTotal, setProjectedTotal] = useState<number | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [calcError, setCalcError] = useState<string | null>(null);

  // View toggle
  const [view, setView] = useState<"chart" | "table">("chart");

  // Portfolio manager modal
  const [showManager, setShowManager] = useState(false);

  const loadPageData = async () => {
    setLoadingPortfolio(true);
    try {
      const [stateRes, assetsRes] = await Promise.all([
        fetch("/api/rebalancing/state"),
        fetch("/api/rebalancing/assets"),
      ]);
      const [stateData, assetsData] = await Promise.all([stateRes.json(), assetsRes.json()]);

      if (stateRes.ok && stateData.state) {
        setPortfolioState(stateData.state);
        if (stateData.state.last_contribution_amount !== null) {
          setContribution(String(stateData.state.last_contribution_amount));
        }
        setOrders(stateData.state.last_orders ?? []);
        setChartData(stateData.state.last_chart_data ?? []);
        setProjectedTotal(stateData.state.last_projected_total ?? null);
        setRemaining(stateData.state.last_remaining ?? null);
      }

      if (assetsRes.ok) {
        setAssets(assetsData.assets ?? []);
      }
    } finally {
      setLoadingPortfolio(false);
    }
  };

  useEffect(() => {
    void loadPageData();
  }, []);

  const totalInvested = useMemo(
    () => assets.reduce((sum, asset) => sum + Number(asset.current_value_cad ?? 0), 0),
    [assets],
  );

  const currentHoldings = useMemo(() => {
    return assets
      .map((asset) => {
        const currentValue = Number(asset.current_value_cad ?? 0);
        const currentPct = totalInvested > 0 ? (currentValue / totalInvested) * 100 : 0;
        const deltaPct = currentPct - asset.target_pct;
        const status =
          currentValue <= 0
            ? "Sem posição"
            : deltaPct > 0.25
              ? "Over"
              : deltaPct < -0.25
                ? "Under"
                : "No alvo";

        return {
          ...asset,
          currentValue,
          currentPct,
          deltaPct,
          status,
        };
      })
      .sort((a, b) => b.currentValue - a.currentValue);
  }, [assets, totalInvested]);

  const hasSuggestedView = projectedTotal !== null;

  const handleCalculate = async () => {
    const contrib = parseFloat(contribution);
    if (isNaN(contrib) || contrib <= 0) {
      setCalcError("Informe um valor de aporte válido.");
      return;
    }

    setCalculating(true);
    setCalcError(null);
    try {
      const res = await fetch("/api/rebalancing/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contribution_amount: contrib }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao calcular.");
      setOrders(data.orders ?? []);
      setChartData(data.chart_data ?? []);
      setProjectedTotal(data.projected_total);
      setRemaining(data.remaining);
      setPortfolioState((prev) => ({
        ...prev,
        total_invested: totalInvested,
        last_contribution_amount: contrib,
        last_projected_total: data.projected_total,
        last_remaining: data.remaining,
        last_orders: data.orders ?? [],
        last_chart_data: data.chart_data ?? [],
        last_calculated_at: new Date().toISOString(),
      }));
    } catch (err) {
      setCalcError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setCalculating(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="glass-surface p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500/30 to-violet-500/30 ring-1 ring-white/10">
            <Scale size={18} className="text-sky-400" />
          </span>
          <div>
            <h1 className="text-lg font-semibold text-white">Balanço de Carteira</h1>
            <p className="text-xs text-slate-400">Rebalanceamento via aportes — sem vender ativos</p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {/* Total Investido */}
        <div className="glass-surface p-4">
          <div className="mb-1 flex items-center gap-2 text-xs text-slate-400">
            <Wallet size={13} />
            Total Investido (CAD)
          </div>
          <div className="text-2xl font-bold text-white">{formatCAD(totalInvested)}</div>
          <div className="mt-1.5 text-[10px] text-slate-500">
            <span className="text-slate-400">Derivado da carteira atual</span>
            {portfolioState.updated_at && (
              <> · Atualizado em {formatDate(portfolioState.updated_at)}</>
            )}
          </div>
        </div>

        {/* Novo Aporte */}
        <div className="glass-surface p-4">
          <div className="mb-1 flex items-center gap-2 text-xs text-slate-400">
            <TrendingUp size={13} />
            Novo Aporte (CAD)
          </div>
          <input
            type="number"
            min="0"
            step="0.01"
            value={contribution}
            onChange={(e) => setContribution(e.target.value)}
            className="w-full bg-transparent text-2xl font-bold text-white focus:outline-none"
            placeholder="300.00"
          />
          <div className="mt-1.5 text-[10px] text-slate-500">Valor a investir neste ciclo</div>
        </div>

        {/* Patrimônio Projetado */}
        <div className="glass-surface p-4">
          <div className="mb-1 flex items-center gap-2 text-xs text-slate-400">
            <Scale size={13} />
            Patrimônio Projetado (CAD)
          </div>
          <div className="text-2xl font-bold text-sky-400">
            {projectedTotal !== null
              ? formatCAD(projectedTotal)
              : formatCAD(totalInvested + (parseFloat(contribution) || 0))}
          </div>
          <div className="mt-1.5 text-[10px] text-slate-500">Após este aporte</div>
        </div>
      </div>

      {/* Current portfolio */}
      <div className="glass-surface p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-white">Carteira Atual</h2>
            <p className="mt-1 text-xs text-slate-400">
              Esta visão usa o valor atual em CAD informado para cada ETF no gerenciador.
            </p>
          </div>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-slate-300">
            {assets.length} ativos
          </span>
        </div>

        {loadingPortfolio ? (
          <div className="py-8 text-center text-sm text-slate-500">Carregando carteira atual...</div>
        ) : currentHoldings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-center text-sm text-slate-500">
            Nenhum ativo cadastrado. Use "Gerenciar Portfólio" para montar sua carteira.
          </div>
        ) : (
          <div className="space-y-3">
            {currentHoldings.map((asset) => (
              <div key={asset.id} className="rounded-2xl border border-white/5 bg-white/5 px-4 py-3">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-white">{asset.ticker}</span>
                      <span
                        className={[
                          "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                          asset.status === "Over"
                            ? "bg-red-400/10 text-red-300"
                            : asset.status === "Under"
                              ? "bg-amber-400/10 text-amber-300"
                              : asset.status === "No alvo"
                                ? "bg-emerald-400/10 text-emerald-300"
                                : "bg-white/10 text-slate-300",
                        ].join(" ")}
                      >
                        {asset.status}
                      </span>
                    </div>
                    {asset.label && <div className="mt-1 text-xs text-slate-400">{asset.label}</div>}
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-white">{formatCAD(asset.currentValue)}</div>
                    <div className="text-[11px] text-slate-400">
                      {asset.currentPct.toFixed(1)}% atual · alvo {asset.target_pct.toFixed(1)}%
                    </div>
                  </div>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-slate-400 to-sky-500"
                    style={{ width: `${Math.min(100, asset.currentPct)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CTA Calculate */}
      <button
        onClick={handleCalculate}
        disabled={calculating}
        className="w-full rounded-2xl bg-gradient-to-r from-sky-500/30 to-violet-500/30 py-4 text-sm font-semibold text-white ring-1 ring-white/10 transition hover:from-sky-500/40 hover:to-violet-500/40 disabled:opacity-50"
      >
        {calculating ? "Calculando..." : "Calcular Aporte Inteligente"}
      </button>

      {calcError && (
        <div className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-400">
          {calcError}
        </div>
      )}

      {!hasSuggestedView && (
        <div className="rounded-2xl border border-dashed border-white/10 px-4 py-5 text-sm text-slate-400">
          Calcule o aporte inteligente para ver a sugestão pós-aporte com gráfico, tabela e ordens de compra.
        </div>
      )}

      {/* Suggested results */}
      {hasSuggestedView && (
        <>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-white">Sugestão pós-aporte</h2>
              <p className="mt-1 text-xs text-slate-400">
                Compara a carteira atual com a distribuição sugerida após aplicar o aporte.
              </p>
            </div>
            {portfolioState.last_calculated_at && (
              <span className="text-[11px] text-slate-500">
                Último cálculo em {formatDate(portfolioState.last_calculated_at)}
              </span>
            )}
          </div>

          {/* View toggle */}
          <div className="flex items-center gap-2">
            <div className="flex rounded-2xl border border-white/10 bg-white/5 p-1">
              <button
                onClick={() => setView("chart")}
                className={[
                  "flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition",
                  view === "chart" ? "bg-white/10 text-white" : "text-slate-400 hover:text-white",
                ].join(" ")}
              >
                <BarChart3 size={13} />
                Gráfico
              </button>
              <button
                onClick={() => setView("table")}
                className={[
                  "flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition",
                  view === "table" ? "bg-white/10 text-white" : "text-slate-400 hover:text-white",
                ].join(" ")}
              >
                <Table2 size={13} />
                Tabela
              </button>
            </div>
            {remaining !== null && remaining > 0.01 && (
              <span className="ml-auto text-xs text-slate-400">
                Restante não alocado: <span className="text-amber-400">{formatCAD(remaining)}</span>
              </span>
            )}
          </div>

          {/* Chart view */}
          {view === "chart" && <RebalancingChart data={chartData} />}

          {/* Table view */}
          {view === "table" && (
            <div className="glass-surface overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-xs text-slate-400">
                    <th className="px-4 py-3 text-left">#</th>
                    <th className="px-4 py-3 text-left">Ativo</th>
                    <th className="px-4 py-3 text-right">Alvo%</th>
                    <th className="px-4 py-3 text-right">Atual%</th>
                    <th className="px-4 py-3 text-right">Gap (CAD)</th>
                    <th className="px-4 py-3 text-right">Ordem</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o, i) => (
                    <tr key={o.asset_id} className="border-b border-white/5 last:border-0">
                      <td className="px-4 py-3 text-slate-500">{i + 1}</td>
                      <td className="px-4 py-3">
                        <span className="font-mono font-semibold text-white">{o.ticker}</span>
                        {o.label && <span className="ml-1 text-xs text-slate-400">{o.label}</span>}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-300">{o.target_pct.toFixed(1)}%</td>
                      <td className="px-4 py-3 text-right text-slate-300">{o.current_pct.toFixed(1)}%</td>
                      <td className={["px-4 py-3 text-right", o.gap_absolute < 0 ? "text-red-400" : "text-slate-300"].join(" ")}>
                        {formatCAD(o.gap_absolute)}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-emerald-400">
                        {o.purchase_amount > 0 ? formatCAD(o.purchase_amount) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Order Cards */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Ordens de Compra</h3>
            {orders.filter((o) => o.purchase_amount > 0).length === 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-400">
                Nenhuma compra sugerida no momento. Revise os valores atuais da carteira ou o aporte informado.
              </div>
            )}
            {orders
              .filter((o) => o.purchase_amount > 0)
              .map((o) => {
                const gapPct = Math.min(100, Math.abs(o.gap_fill_pct));
                return (
                  <div key={o.asset_id} className="glass-surface p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <div>
                        <span className="font-mono font-bold text-white">{o.ticker}</span>
                        {o.label && <span className="ml-2 text-xs text-slate-400">{o.label}</span>}
                      </div>
                      <span className="text-base font-bold text-emerald-400">{formatCAD(o.purchase_amount)}</span>
                    </div>
                    <div className="mb-2 flex justify-between text-xs text-slate-400">
                      <span>Atual: {o.current_pct.toFixed(1)}%</span>
                      <span>Pós-aporte: {o.post_pct.toFixed(1)}%</span>
                      <span>Alvo: {o.target_pct.toFixed(1)}%</span>
                    </div>
                    {/* Gap fill bar */}
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 transition-all"
                        style={{ width: `${gapPct}%` }}
                      />
                    </div>
                    <div className="mt-1 text-right text-[10px] text-slate-500">
                      {o.gap_fill_pct.toFixed(0)}% do gap coberto
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Total bar */}
          <div className="glass-surface flex items-center justify-between px-5 py-4">
            <span className="text-sm text-slate-400">Total alocado</span>
            <span className="text-base font-bold text-white">
              {formatCAD(orders.reduce((s, o) => s + o.purchase_amount, 0))}
              <span className="ml-2 text-xs font-normal text-slate-400">
                de {formatCAD(parseFloat(contribution) || 0)}
              </span>
            </span>
          </div>
        </>
      )}

      {/* Manage portfolio link */}
      <button
        onClick={() => setShowManager(true)}
        className="w-full rounded-2xl border border-dashed border-white/10 py-4 text-sm text-slate-400 hover:border-sky-500/30 hover:text-sky-400"
      >
        Gerenciar Portfólio →
      </button>

      {showManager && (
        <PortfolioManager
          onClose={() => setShowManager(false)}
          onSaved={() => {
            void loadPageData();
            if (hasSuggestedView) void handleCalculate();
          }}
        />
      )}
    </div>
  );
}
