"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";

type Row = {
  category_id: string;
  category_name: string;
  expected_amount: number;
  realized_amount: number;
  contributors: string[];
};

const now = new Date();

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
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <h1 className="mb-4 text-xl font-semibold">Comparação de gastos</h1>
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
          {Array.from({ length: 12 }).map((_, i) => (
            <option key={i + 1} value={i + 1}>
              Mês {i + 1}
            </option>
          ))}
        </select>
        <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} />
      </div>

      {loading ? (
        <p className="text-sm text-zinc-500">Carregando comparação...</p>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => {
            const pct = row.expected_amount > 0 ? (row.realized_amount / row.expected_amount) * 100 : 0;
            const exceeded = row.realized_amount > row.expected_amount;
            return (
              <div
                key={row.category_id}
                className={[
                  "rounded-lg border p-3",
                  exceeded
                    ? "border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950/30"
                    : "border-zinc-200 dark:border-zinc-800",
                ].join(" ")}
              >
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{row.category_name}</span>
                    {exceeded && <AlertTriangle size={14} className="text-red-500" />}
                  </div>
                  <span className={exceeded ? "font-medium text-red-500" : ""}>
                    R$ {row.realized_amount.toFixed(2)} / R$ {row.expected_amount.toFixed(2)}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                  <div
                    className={exceeded ? "h-full bg-red-500" : "h-full bg-emerald-500"}
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-zinc-500">
                  Responsáveis: {row.contributors.length > 0 ? row.contributors.join(", ") : "Sem lançamentos"}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

