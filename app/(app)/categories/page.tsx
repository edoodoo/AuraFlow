"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Tags, Trash2 } from "lucide-react";

type Category = {
  id: string;
  name: string;
  category_kind: "fixed" | "variable";
  user_id: string | null;
};

const kindLabels = {
  fixed: "Custo fixo",
  variable: "Variável",
} as const;

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<"fixed" | "variable">("fixed");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const grouped = useMemo(
    () => ({
      fixed: categories.filter((category) => category.category_kind === "fixed"),
      variable: categories.filter((category) => category.category_kind === "variable"),
    }),
    [categories],
  );

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/categories", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Falha ao carregar categorias.");
      setCategories(data.categories ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao carregar categorias.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const createCategory = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setError(null);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, kind }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Não foi possível criar a categoria.");
      setName("");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível criar a categoria.");
    }
  };

  const deleteCategory = async (id: string) => {
    setError(null);
    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Não foi possível remover a categoria.");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível remover a categoria.");
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <section className="glass-surface p-5 sm:p-6">
        <div className="max-w-3xl">
          <div className="soft-label text-slate-400">Categorias do planejamento</div>
          <h1 className="mt-3 page-title text-white">Gerencie categorias fixas e variáveis em uma tela dedicada.</h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            As categorias padrão já ajudam a começar rápido. Aqui você também pode criar categorias personalizadas para o casal.
          </p>
        </div>

        <form onSubmit={createCategory} className="mt-6 rounded-[1.75rem] border border-white/10 bg-white/5 p-4">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.4fr_0.8fr_auto]">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nova categoria" />
            <select value={kind} onChange={(e) => setKind(e.target.value as "fixed" | "variable")}>
              <option value="fixed">Custo fixo</option>
              <option value="variable">Variável</option>
            </select>
            <button className="primary-button">
              <Plus size={16} />
              Criar categoria
            </button>
          </div>
        </form>

        {error && <p className="mt-4 rounded-2xl bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{error}</p>}
        {loading && <p className="mt-4 text-sm text-slate-400">Carregando categorias...</p>}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {(["fixed", "variable"] as const).map((groupKey) => (
          <div key={groupKey} className="glass-surface p-5 sm:p-6">
            <div className="flex items-center gap-2 text-white">
              <Tags size={18} className={groupKey === "fixed" ? "text-cyan-300" : "text-violet-300"} />
              <h2 className="text-xl font-semibold">{kindLabels[groupKey]}</h2>
            </div>
            <p className="mt-2 text-sm text-slate-400">
              {groupKey === "fixed"
                ? "Custos recorrentes que tendem a se repetir mês a mês."
                : "Gastos de consumo e despesas mais oscilantes."}
            </p>

            <div className="mt-5 space-y-3">
              {grouped[groupKey].map((category) => (
                <div key={category.id} className="flex items-center justify-between gap-3 rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-3">
                  <div>
                    <div className="font-medium text-white">{category.name}</div>
                    <div className="mt-1 text-xs text-slate-400">
                      {category.user_id ? "Categoria personalizada" : "Categoria padrão"}
                    </div>
                  </div>
                  {category.user_id ? (
                    <button
                      type="button"
                      onClick={() => void deleteCategory(category.id)}
                      className="secondary-button border-rose-400/20 bg-rose-500/10 px-3 py-2 text-rose-200 hover:bg-rose-500/20"
                    >
                      <Trash2 size={14} />
                      Remover
                    </button>
                  ) : (
                    <span className="rounded-full bg-slate-950/40 px-3 py-1 text-xs text-slate-300">Padrão</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
    </motion.div>
  );
}
