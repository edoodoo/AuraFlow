"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
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
  const [portfolioState, setPortfolioState] = useState<State>({ total_invested: 0, currency: "CAD", updated_at: null });
  const [totalInput, setTotalInput] = useState("");
  const [savingTotal, setSavingTotal] = useState(false);

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

  // Load portfolio state (auth enforced by layout.tsx server-side)
  useEffect(() => {
    fetch("/api/rebalancing/state")
      .then((r) => r.json())
      .then((data) => {
        if (data.state) {
          setPortfolioState(data.state);
          setTotalInput(String(data.state.total_invested));
        }
      })
      .catch(() => {});
  }, []);

  const saveTotalInvested = async (val: number) => {
    setSavingTotal(true);
    try {
      const res = await fetch("/api/rebalancing/state", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ total_invested: val }),
      });
      const data = await res.json();
      if (res.ok) setPortfolioState(data.state);
    } finally {
      setSavingTotal(false);
    }
  };

  const handleTotalBlur = async () => {
    const val = parseFloat(totalInput);
    if (isNaN(val) || val < 0) return;
    // Bug 4 fix: coerce both to Number before comparing (Supabase returns NUMERIC as string)
    if (val === Number(portfolioState.total_invested)) return;
    await saveTotalInvested(val);
  };

  const handleCalculate = async () => {
    const contrib = parseFloat(contribution);
    if (isNaN(contrib) || contrib <= 0) {
      setCalcError("Informe um valor de aporte válido.");
      return;
    }

    // Bug 3 fix: auto-save total_invested if user changed the field without blurring
    const currentInput = parseFloat(totalInput);
    if (!isNaN(currentInput) && currentInput >= 0 && currentInput !== Number(portfolioState.total_invested)) {
      await saveTotalInvested(currentInput);
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
          <input
            type="number"
            min="0"
            step="0.01"
            value={totalInput}
            onChange={(e) => setTotalInput(e.target.value)}
            onBlur={handleTotalBlur}
            className="w-full bg-transparent text-2xl font-bold text-white focus:outline-none"
            placeholder="0.00"
          />
          <div className="mt-1.5 text-[10px] text-slate-500">
            <span className="text-slate-400">Informado manualmente</span>
            {portfolioState.updated_at && (
              <> · Atualizado em {formatDate(portfolioState.updated_at)}</>
            )}
            {savingTotal && <> · Salvando...</>}
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
              : formatCAD((parseFloat(totalInput) || 0) + (parseFloat(contribution) || 0))}
          </div>
          <div className="mt-1.5 text-[10px] text-slate-500">Após este aporte</div>
        </div>
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

      {/* Results */}
      {orders.length > 0 && (
        <>
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
            // Re-run calculation if we had results
            if (orders.length > 0) void handleCalculate();
          }}
        />
      )}
    </div>
  );
}
