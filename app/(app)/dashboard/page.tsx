"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, CalendarRange, ReceiptText, Sparkles, TrendingUp, WalletCards } from "lucide-react";

const now = new Date();
const monthLabels = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);

type DashboardSummary = {
  total_planned: number;
  total_realized: number;
  fixed_count: number;
  usage_pct: number;
  avulso_total: number;
  avulso_count: number;
  top_categories: Array<{ category_id: string; category_name: string; realized_amount: number }>;
  pending_items: Array<{
    id: string;
    title: string;
    status: "pending" | "partial" | "paid";
    expected_amount: number;
    section: string;
    assigned_to: string;
    due_date: string | null;
  }>;
  paid_by: Array<{ user_id: string; label: string; total: number }>;
};

export default function DashboardPage() {
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [hasPlan, setHasPlan] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const paidBy = summary?.paid_by ?? [];
  const topCategories = summary?.top_categories ?? [];
  const pendingItems = summary?.pending_items ?? [];
  const avulsoTotal = summary?.avulso_total ?? 0;
  const remainingBudget = Math.max((summary?.total_planned ?? 0) - (summary?.total_realized ?? 0), 0);
  const budgetHealthLabel = useMemo(() => {
    if (!summary) return "Sem planejamento";
    if (summary.total_realized > summary.total_planned) return "Acima do previsto";
    if (summary.usage_pct > 80) return "Atenção ao ritmo";
    return "Mês sob controle";
  }, [summary]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/monthly-plan/summary?month=${month}&year=${year}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Falha ao carregar o resumo.");
      setSummary(data.summary ?? null);
      setHasPlan(Boolean(data.plan));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, year]);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <section className="glass-surface overflow-hidden p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <div className="soft-label text-slate-400">Dashboard mensal</div>
            <h1 className="mt-3 page-title text-white">Acompanhe o mês sem perder o foco no que realmente precisa ser pago.</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">
              A home ficou mais enxuta: o trabalho operacional acontece em `Mensal`; aqui você enxerga o que importa.
            </p>
          </div>
          <Link href="/monthly-plan" className="primary-button">
            Ir para o mensal
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="metric-card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="soft-label text-slate-400">Orçado no mês</div>
                <div className="mt-3 text-3xl font-semibold text-white">{formatCurrency(summary?.total_planned ?? 0)}</div>
              </div>
              <span className="rounded-2xl bg-cyan-400/10 p-3 text-cyan-300">
                <WalletCards size={18} />
              </span>
            </div>
            <p className="mt-3 text-sm text-slate-400">
              {hasPlan
                ? `Planejamento compartilhado ativo para ${monthLabels[month - 1]}.`
                : "Ainda não existe um mensal criado para este período."}
            </p>
          </div>
          <div className="metric-card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="soft-label text-slate-400">Orçamentos fixos</div>
                <div className="mt-3 text-3xl font-semibold text-white">{summary?.fixed_count ?? 0}</div>
              </div>
              <span className="rounded-2xl bg-violet-400/10 p-3 text-violet-300">
                <Sparkles size={18} />
              </span>
            </div>
            <p className="mt-3 text-sm text-slate-400">Itens que podem ser exportados automaticamente para o mês seguinte.</p>
          </div>
          <div className="metric-card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="soft-label text-slate-400">Ritmo do mês</div>
                <div className="mt-3 text-3xl font-semibold text-white">{summary ? `${summary.usage_pct.toFixed(0)}%` : "0%"}</div>
              </div>
              <span className="rounded-2xl bg-emerald-400/10 p-3 text-emerald-300">
                <TrendingUp size={18} />
              </span>
            </div>
            <p className="mt-3 text-sm text-slate-400">{budgetHealthLabel}</p>
          </div>
          <div className="metric-card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="soft-label text-slate-400">Gastos avulsos</div>
                <div className="mt-3 text-3xl font-semibold text-white">{formatCurrency(avulsoTotal)}</div>
              </div>
              <span className="rounded-2xl bg-amber-400/10 p-3 text-amber-300">
                <ReceiptText size={18} />
              </span>
            </div>
            <p className="mt-3 text-sm text-slate-400">
              Despesas fora do planejamento mensal registradas no periodo.
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="soft-label text-slate-400">Ritmo do mês</div>
                <div className="mt-2 text-2xl font-semibold text-white">{formatCurrency(summary?.total_realized ?? 0)}</div>
                <p className="mt-1 text-sm text-slate-400">
                  Realizado até agora de um total planejado de {formatCurrency(summary?.total_planned ?? 0)}.
                </p>
              </div>
              <div className="rounded-2xl bg-cyan-400/10 px-4 py-3 text-sm text-cyan-200">
                {budgetHealthLabel}
              </div>
            </div>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-900/70">
              <div
                className={(summary?.total_realized ?? 0) > (summary?.total_planned ?? 0) ? "h-full rounded-full bg-rose-400" : "h-full rounded-full bg-cyan-400"}
                style={{ width: `${summary?.usage_pct ?? 0}%` }}
              />
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm">
              <span className="text-slate-400">{summary?.usage_pct?.toFixed(0) ?? 0}% do orçamento utilizado</span>
              <span className="font-medium text-white">Saldo restante: {formatCurrency(remainingBudget)}</span>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
            <div className="flex items-center gap-2 text-white">
              <TrendingUp size={18} className="text-emerald-300" />
              <span className="font-semibold">Top categorias do mês</span>
            </div>
            <div className="mt-4 space-y-3">
              {topCategories.length > 0 ? (
                topCategories.map((row) => {
                  const rowPct = (summary?.total_planned ?? 0) > 0 ? Math.min(100, (row.realized_amount / (summary?.total_planned ?? 1)) * 100) : 0;
                  return (
                    <div key={row.category_id}>
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="text-slate-200">{row.category_name}</span>
                        <span className="font-medium text-white">{formatCurrency(row.realized_amount)}</span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-900/70">
                        <div className="h-full rounded-full bg-emerald-400" style={{ width: `${rowPct}%` }} />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-slate-400">Sem dados de gasto para este período ainda.</p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="glass-surface p-5 sm:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="soft-label text-slate-400">Período de análise</div>
            <div className="mt-2 flex items-center gap-2 text-white">
              <CalendarRange size={18} className="text-cyan-300" />
              <span className="text-lg font-semibold">
                {monthLabels[month - 1]} de {year}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 xl:w-[540px]">
            <select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
              {Array.from({ length: 12 }).map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {monthLabels[i]}
                </option>
              ))}
            </select>
            <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} />
            <button className="primary-button w-full" type="button" onClick={() => void loadData()}>
              <CalendarRange size={16} />
              Atualizar
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="glass-surface p-5 sm:p-6">
          <div className="soft-label text-slate-400">Pendências do mensal</div>
          <h2 className="mt-2 text-xl font-semibold text-white">Próximos itens para resolver</h2>
          <div className="mt-4 space-y-3">
            {pendingItems.length > 0 ? (
              pendingItems.map((item) => (
                <div key={item.id} className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="font-medium text-white">{item.title}</div>
                      <p className="mt-1 text-sm text-slate-400">
                        {item.assigned_to} · {item.section}
                        {item.due_date ? ` · vence em ${item.due_date}` : ""}
                      </p>
                    </div>
                    <span className="font-semibold text-white">{formatCurrency(item.expected_amount)}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-slate-950/20 p-5 text-sm text-slate-400">
                Sem pendências abertas neste período.
              </div>
            )}
          </div>
        </div>

        <div className="glass-surface p-5 sm:p-6">
          <div className="soft-label text-slate-400">Quem mais pagou no período</div>
          <h2 className="mt-2 text-xl font-semibold text-white">Divisão real do mês</h2>
          <div className="mt-4 space-y-3">
            {paidBy.length > 0 ? (
              paidBy.map((payer) => (
                <div key={payer.user_id} className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-200">{payer.label}</span>
                    <span className="font-semibold text-white">{formatCurrency(payer.total)}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-slate-950/20 p-5 text-sm text-slate-400">
                Ainda não existem lançamentos para dividir entre os cônjuges.
              </div>
            )}
          </div>
        </div>
      </section>

      {error && <p className="rounded-2xl bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{error}</p>}
      {loading && <p className="text-sm text-slate-400">Atualizando dashboard...</p>}
    </motion.div>
  );
}

