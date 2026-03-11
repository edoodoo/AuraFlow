"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarRange, Plus, RefreshCw, Sparkles, Target, WalletCards } from "lucide-react";

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
const monthLabels = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);

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
  const totalBudget = useMemo(() => budgets.reduce((sum, budget) => sum + Number(budget.expected_amount || 0), 0), [budgets]);
  const fixedCount = useMemo(() => budgets.filter((budget) => budget.is_fixed).length, [budgets]);
  const categoriesWithBudget = useMemo(() => new Set(budgets.map((budget) => budget.category_id)).size, [budgets]);

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
      <section className="glass-surface overflow-hidden p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <div className="soft-label text-slate-400">Dashboard mensal</div>
            <h1 className="mt-3 page-title text-white">Planeje, acompanhe e leve o orçamento com você.</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">
              Visual premium no desktop e leitura rápida no iPhone para categorias, metas mensais e
              exportação dos lançamentos fixos.
            </p>
          </div>
          <button onClick={exportToNextMonth} className="secondary-button border-white/10 bg-white/5 text-white hover:bg-white/10">
            <RefreshCw size={15} />
            Exportar fixos para o próximo mês
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-[1.2fr_0.8fr] xl:grid-cols-3">
          <div className="metric-card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="soft-label text-slate-400">Orçado no mês</div>
                <div className="mt-3 text-3xl font-semibold text-white">{formatCurrency(totalBudget)}</div>
              </div>
              <span className="rounded-2xl bg-cyan-400/10 p-3 text-cyan-300">
                <WalletCards size={18} />
              </span>
            </div>
            <p className="mt-3 text-sm text-slate-400">{categoriesWithBudget} categorias já configuradas para {monthLabels[month - 1]}.</p>
          </div>
          <div className="metric-card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="soft-label text-slate-400">Orçamentos fixos</div>
                <div className="mt-3 text-3xl font-semibold text-white">{fixedCount}</div>
              </div>
              <span className="rounded-2xl bg-violet-400/10 p-3 text-violet-300">
                <Sparkles size={18} />
              </span>
            </div>
            <p className="mt-3 text-sm text-slate-400">Prontos para reaproveitar no próximo ciclo com um toque.</p>
          </div>
          <div className="metric-card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="soft-label text-slate-400">Categorias ativas</div>
                <div className="mt-3 text-3xl font-semibold text-white">{categories.length}</div>
              </div>
              <span className="rounded-2xl bg-emerald-400/10 p-3 text-emerald-300">
                <Target size={18} />
              </span>
            </div>
            <p className="mt-3 text-sm text-slate-400">Base pronta para acompanhar o combinado do casal.</p>
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
              Atualizar
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[0.72fr_1.28fr]">
        <div className="glass-surface p-5 sm:p-6">
          <div className="soft-label text-slate-400">Nova categoria</div>
          <h2 className="mt-2 text-xl font-semibold text-white">Expanda seu mapa financeiro</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Crie novas categorias para alimentar o dashboard, a comparação e os lançamentos.
          </p>

          <form onSubmit={createCategory} className="mt-5 space-y-3">
            <input
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Ex: Mercado, Pet, Assinaturas"
            />
            <button className="primary-button w-full">
              <Plus size={16} />
              Criar categoria
            </button>
          </form>

          {error && <p className="mt-4 rounded-2xl bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{error}</p>}
          {loading && <p className="mt-4 text-sm text-slate-400">Carregando orçamentos...</p>}
        </div>

        <div className="glass-surface p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <div className="soft-label text-slate-400">Categorias e metas</div>
              <h2 className="mt-2 text-xl font-semibold text-white">Configure os valores previstos do mês</h2>
            </div>
            <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-slate-300">
              {categories.length} itens
            </span>
          </div>

          <div className="space-y-3">
            <AnimatePresence>
              {categories.map((cat) => {
                const budget = budgets.find((b) => b.category_id === cat.id);
                return (
                  <motion.div
                    key={cat.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-[1.6rem] border border-white/10 bg-white/5 p-4"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <div className="text-base font-medium text-white">{categoryMap[cat.id] ?? "Categoria"}</div>
                        <div className="mt-1 text-sm text-slate-400">
                          {budget ? "Meta configurada para o período atual." : "Ainda sem orçamento para este mês."}
                        </div>
                      </div>
                      {!budget && (
                        <button
                          onClick={() => createBudget(cat.id)}
                          className="secondary-button border-white/10 bg-white/5 text-white hover:bg-white/10"
                        >
                          Adicionar orçamento
                        </button>
                      )}
                    </div>

                    {budget && (
                      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto]">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Valor previsto"
                          value={budget.expected_amount ?? ""}
                          onChange={(e) => void updateBudget(budget.id, { expected_amount: Number(e.target.value) })}
                        />
                        <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                          <input
                            type="checkbox"
                            checked={budget.is_fixed ?? false}
                            onChange={(e) => void updateBudget(budget.id, { is_fixed: e.target.checked })}
                          />
                          Repetir como fixo
                        </label>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </section>
    </motion.div>
  );
}

