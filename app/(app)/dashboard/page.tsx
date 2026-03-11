"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, RefreshCw } from "lucide-react";

type Category = { id: string; name: string; user_id: string | null };
type Budget = {
  id: string;
  category_id: string;
  expected_amount: number;
  is_fixed: boolean;
  month: number;
  year: number;
};

const now = new Date();

export default function DashboardPage() {
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categoryMap = useMemo(
    () =>
      categories.reduce<Record<string, string>>((acc, c) => {
        acc[c.id] = c.name;
        return acc;
      }, {}),
    [categories],
  );

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [cRes, bRes] = await Promise.all([
        fetch("/api/categories", { cache: "no-store" }),
        fetch(`/api/monthly-budgets?month=${month}&year=${year}`, { cache: "no-store" }),
      ]);
      if (!cRes.ok || !bRes.ok) throw new Error("Falha ao carregar dados.");
      const [cData, bData] = await Promise.all([cRes.json(), bRes.json()]);
      setCategories(cData.categories ?? []);
      setBudgets(bData.budgets ?? []);
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

  const createCategory = async (e: FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCategoryName }),
    });
    if (res.ok) {
      setNewCategoryName("");
      void loadData();
    }
  };

  const createBudget = async (categoryId: string) => {
    const exists = budgets.some((b) => b.category_id === categoryId);
    if (exists) return;
    await fetch("/api/monthly-budgets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category_id: categoryId,
        month,
        year,
        expected_amount: 0,
        is_fixed: false,
      }),
    });
    void loadData();
  };

  const updateBudget = async (id: string, patch: Partial<Budget>) => {
    await fetch(`/api/monthly-budgets/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    void loadData();
  };

  const exportToNextMonth = async () => {
    const d = new Date(year, month - 1, 1);
    d.setMonth(d.getMonth() + 1);
    const targetMonth = d.getMonth() + 1;
    const targetYear = d.getFullYear();
    await fetch("/api/monthly-budgets/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source_month: month,
        source_year: year,
        target_month: targetMonth,
        target_year: targetYear,
        only_fixed: true,
      }),
    });
    alert("Orçamentos fixos exportados para o próximo mês.");
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-semibold">Dashboard mensal</h1>
          <button
            onClick={exportToNextMonth}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            <RefreshCw size={14} />
            Exportar para o mês seguinte
          </button>
        </div>

        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {Array.from({ length: 12 }).map((_, i) => (
              <option key={i + 1} value={i + 1}>
                Mês {i + 1}
              </option>
            ))}
          </select>
          <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} />
        </div>

        <form onSubmit={createCategory} className="mb-4 flex gap-2">
          <input
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="Nova categoria"
            className="flex-1"
          />
          <button className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900">
            <Plus size={14} />
            Criar
          </button>
        </form>

        {error && <p className="mb-3 text-sm text-red-500">{error}</p>}
        {loading && <p className="mb-3 text-sm text-zinc-500">Carregando...</p>}

        <div className="space-y-2">
          <AnimatePresence>
            {categories.map((cat) => {
              const budget = budgets.find((b) => b.category_id === cat.id);
              return (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-1 gap-2 rounded-lg border border-zinc-200 p-3 md:grid-cols-[1fr_150px_120px_auto] dark:border-zinc-800"
                >
                  <div className="font-medium">{categoryMap[cat.id] ?? "Categoria"}</div>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Valor previsto"
                    value={budget?.expected_amount ?? ""}
                    onChange={(e) =>
                      budget
                        ? void updateBudget(budget.id, { expected_amount: Number(e.target.value) })
                        : void createBudget(cat.id)
                    }
                  />
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={budget?.is_fixed ?? false}
                      onChange={(e) =>
                        budget
                          ? void updateBudget(budget.id, { is_fixed: e.target.checked })
                          : void createBudget(cat.id)
                      }
                    />
                    Fixo
                  </label>
                  {!budget && (
                    <button
                      onClick={() => createBudget(cat.id)}
                      className="rounded-lg border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                    >
                      Adicionar orçamento
                    </button>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

