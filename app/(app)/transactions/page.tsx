"use client";

import { FormEvent, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type Category = { id: string; name: string };
type Transaction = {
  id: string;
  amount: number;
  description: string | null;
  transaction_date: string;
  receipt_url: string | null;
  category: { name: string } | null;
};

export default function TransactionsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [form, setForm] = useState({
    category_id: "",
    amount: "",
    description: "",
    transaction_date: new Date().toISOString().slice(0, 10),
  });
  const [receipt, setReceipt] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [cRes, tRes] = await Promise.all([
        fetch("/api/categories", { cache: "no-store" }),
        fetch("/api/transactions?limit=20", { cache: "no-store" }),
      ]);
      if (!cRes.ok || !tRes.ok) throw new Error("Falha ao carregar.");
      const [cData, tData] = await Promise.all([cRes.json(), tRes.json()]);
      setCategories(cData.categories ?? []);
      setTransactions(tData.transactions ?? []);
      if (!form.category_id && cData.categories?.length) {
        setForm((prev) => ({ ...prev, category_id: cData.categories[0].id }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("category_id", form.category_id);
    formData.append("amount", form.amount);
    formData.append("description", form.description);
    formData.append("transaction_date", form.transaction_date);
    if (receipt) formData.append("receipt", receipt);

    const res = await fetch("/api/transactions", { method: "POST", body: formData });
    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      setError(payload.error ?? "Falha ao registrar gasto.");
      return;
    }
    setForm((prev) => ({ ...prev, amount: "", description: "" }));
    setReceipt(null);
    void loadData();
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="mb-4 text-xl font-semibold">Lançamento de gasto individual</h1>
        <form onSubmit={submit} className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <select
            required
            value={form.category_id}
            onChange={(e) => setForm((prev) => ({ ...prev, category_id: e.target.value }))}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            required
            type="number"
            step="0.01"
            placeholder="Valor"
            value={form.amount}
            onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
          />
          <input
            type="text"
            placeholder="Descrição"
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
          />
          <input
            type="date"
            value={form.transaction_date}
            onChange={(e) => setForm((prev) => ({ ...prev, transaction_date: e.target.value }))}
          />
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setReceipt(e.target.files?.[0] ?? null)}
            className="md:col-span-2"
          />
          {error && <p className="text-sm text-red-500 md:col-span-2">{error}</p>}
          <button className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900 md:col-span-2">
            Registrar gasto
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-3 text-lg font-semibold">Histórico recente</h2>
        {loading && <p className="text-sm text-zinc-500">Carregando...</p>}
        <AnimatePresence>
          {transactions.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-2 rounded-lg border border-zinc-200 p-3 text-sm dark:border-zinc-800"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium">{t.category?.name ?? "Sem categoria"}</span>
                <span>R$ {Number(t.amount).toFixed(2)}</span>
              </div>
              <p className="text-zinc-500">{t.description || "-"}</p>
              <div className="mt-1 flex items-center justify-between text-xs text-zinc-500">
                <span>{t.transaction_date}</span>
                {t.receipt_url ? (
                  <a className="underline" href={t.receipt_url} target="_blank" rel="noreferrer">
                    Ver recibo
                  </a>
                ) : (
                  <span>Sem recibo</span>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </section>
    </motion.div>
  );
}

