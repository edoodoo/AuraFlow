"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CalendarRange, TrendingUp } from "lucide-react";

type Row = {
  category_id: string;
  category_name: string;
  section: string;
  expected_amount: number;
  realized_amount: number;
  contributors: string[];
  items_pending: number;
  payer_breakdown: Array<{ user_id: string; label: string; total: number }>;
};

const now = new Date();
const monthLabels = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);

export default function ComparisonPage() {
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await fetch(`/api/reports/comparison?month=${month}&year=${year}`, { cache: "no-store" });
    const data = await res.json();
    setRows(data.rows ?? []);
    setLoading(false);
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, year]);

  return (
    <div className="glass-surface p-5 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="soft-label text-slate-400">Planejado vs realizado</div>
          <h1 className="mt-2 text-2xl font-semibold text-white">Comparação de gastos</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            Veja onde o mês está equilibrado e onde o casal já passou do previsto.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:w-[360px]">
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {Array.from({ length: 12 }).map((_, i) => (
              <option key={i + 1} value={i + 1}>
                {monthLabels[i]}
              </option>
            ))}
          </select>
          <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} />
        </div>
      </div>

      <div className="mt-5 rounded-[1.6rem] border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
        <div className="flex items-center gap-2">
          <CalendarRange size={16} className="text-cyan-300" />
          Analisando {monthLabels[month - 1]} de {year}
        </div>
      </div>

      {loading ? (
        <p className="mt-5 text-sm text-slate-400">Carregando comparação...</p>
      ) : (
        <div className="mt-5 space-y-3">
          {rows.map((row) => {
            const pct = row.expected_amount > 0 ? (row.realized_amount / row.expected_amount) * 100 : 0;
            const exceeded = row.realized_amount > row.expected_amount;
            return (
              <div
                key={row.category_id}
                className={[
                  "rounded-[1.6rem] border p-4",
                  exceeded
                    ? "border-rose-400/20 bg-rose-500/10"
                    : "border-white/10 bg-white/5",
                ].join(" ")}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-medium text-white">{row.category_name}</span>
                      {exceeded ? (
                        <AlertTriangle size={15} className="text-rose-300" />
                      ) : (
                        <TrendingUp size={15} className="text-emerald-300" />
                      )}
                    </div>
                    <p className="mt-2 text-sm text-slate-400">
                      Pagamentos lançados por: {row.contributors.length > 0 ? row.contributors.join(", ") : "Sem lançamentos"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Seção: {row.section} · Itens ainda pendentes: {row.items_pending}
                    </p>
                    {row.payer_breakdown.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        {row.payer_breakdown.map((payer) => (
                          <span key={payer.user_id} className="rounded-full bg-slate-950/40 px-2 py-1 text-slate-300">
                            {payer.label}: {formatCurrency(payer.total)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className={["text-sm font-semibold", exceeded ? "text-rose-300" : "text-white"].join(" ")}>
                    {formatCurrency(row.realized_amount)} / {formatCurrency(row.expected_amount)}
                  </span>
                </div>

                <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-900/80">
                  <div
                    className={exceeded ? "h-full rounded-full bg-rose-400" : "h-full rounded-full bg-emerald-400"}
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>

                <div className="mt-3 flex items-center justify-between gap-3 text-xs">
                  <span className="text-slate-400">{pct.toFixed(0)}% do orçamento utilizado</span>
                  {exceeded && <span className="font-medium text-rose-300">Atenção: categoria excedida</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

