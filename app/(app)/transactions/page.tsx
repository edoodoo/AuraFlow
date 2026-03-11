"use client";

import { FormEvent, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Camera, Link2, PlusCircle, ReceiptText, Wallet } from "lucide-react";

type Category = { id: string; name: string };
type PlanItem = {
  id: string;
  title: string;
  category_id: string | null;
  status: "pending" | "partial" | "paid";
  expected_amount: number;
  due_date: string | null;
  category: { name: string } | { name: string }[] | null;
};
type Transaction = {
  id: string;
  amount: number;
  description: string | null;
  transaction_date: string;
  receipt_url: string | null;
  transaction_kind: "avulso" | "linked_plan_item";
  monthly_plan_item_id: string | null;
  plan_item: { title: string; section: string } | { title: string; section: string }[] | null;
  category: { name: string } | null;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);

export default function TransactionsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [planItems, setPlanItems] = useState<PlanItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [form, setForm] = useState({
    transaction_kind: "avulso" as "avulso" | "linked_plan_item",
    monthly_plan_item_id: "",
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
      const [cRes, tRes, planRes] = await Promise.all([
        fetch("/api/categories", { cache: "no-store" }),
        fetch("/api/transactions?limit=20", { cache: "no-store" }),
        fetch("/api/monthly-plan", { cache: "no-store" }),
      ]);
      if (!cRes.ok || !tRes.ok || !planRes.ok) throw new Error("Falha ao carregar.");
      const [cData, tData, planData] = await Promise.all([cRes.json(), tRes.json(), planRes.json()]);
      setCategories(cData.categories ?? []);
      setTransactions(tData.transactions ?? []);
      setPlanItems(planData.items ?? []);
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
    formData.append("transaction_kind", form.transaction_kind);
    formData.append("monthly_plan_item_id", form.monthly_plan_item_id);
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
    setForm((prev) => ({ ...prev, amount: "", description: "", monthly_plan_item_id: "" }));
    setReceipt(null);
    void loadData();
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="glass-surface p-5 sm:p-6">
          <div className="soft-label text-slate-400">Novo lançamento</div>
          <h1 className="mt-2 text-2xl font-semibold text-white">Registrar gasto com foco no mobile</h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Cada login continua lançando seus próprios gastos, mas agora é possível marcar se foi um gasto avulso ou um pagamento ligado ao mensal.
          </p>

          <form onSubmit={submit} className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-200">Tipo de lançamento</label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, transaction_kind: "avulso", monthly_plan_item_id: "" }))}
                  className={[
                    "secondary-button justify-start border-white/10 bg-white/5 text-white hover:bg-white/10",
                    form.transaction_kind === "avulso" ? "ring-2 ring-cyan-400/40" : "",
                  ].join(" ")}
                >
                  Gasto avulso
                </button>
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, transaction_kind: "linked_plan_item" }))}
                  className={[
                    "secondary-button justify-start border-white/10 bg-white/5 text-white hover:bg-white/10",
                    form.transaction_kind === "linked_plan_item" ? "ring-2 ring-cyan-400/40" : "",
                  ].join(" ")}
                >
                  Vincular ao mensal
                </button>
              </div>
            </div>

            {form.transaction_kind === "linked_plan_item" && (
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-slate-200">Item do mensal</label>
                <select
                  required
                  value={form.monthly_plan_item_id}
                  onChange={(e) => {
                    const planItem = planItems.find((item) => item.id === e.target.value);
                    setForm((prev) => ({
                      ...prev,
                      monthly_plan_item_id: e.target.value,
                      category_id: planItem?.category_id ?? prev.category_id,
                      description: planItem ? `Pagamento do item mensal: ${planItem.title}` : prev.description,
                    }));
                  }}
                >
                  <option value="">Selecione um item do mensal</option>
                  {planItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title} · {formatCurrency(item.expected_amount)} · {item.status === "paid" ? "pago" : item.status === "partial" ? "parcial" : "pendente"}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-200">Categoria</label>
              <select
                value={form.category_id}
                onChange={(e) => setForm((prev) => ({ ...prev, category_id: e.target.value }))}
                required={form.transaction_kind === "avulso"}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-200">Valor</label>
              <input
                required
                type="number"
                step="0.01"
                placeholder="0,00"
                value={form.amount}
                onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-200">Data</label>
              <input
                type="date"
                value={form.transaction_date}
                onChange={(e) => setForm((prev) => ({ ...prev, transaction_date: e.target.value }))}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-200">Descrição</label>
              <input
                type="text"
                placeholder={
                  form.transaction_kind === "linked_plan_item"
                    ? "Ex: pagamento do aluguel, parcela, aporte do mês"
                    : "Ex: mercado da semana, gasolina, farmácia"
                }
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div className="md:col-span-2">
              <label className="flex flex-col gap-3 rounded-[1.6rem] border border-dashed border-white/15 bg-white/5 p-4 text-sm text-slate-300">
                <span className="flex items-center gap-2 text-slate-100">
                  <Camera size={16} className="text-cyan-300" />
                  Recibo ou comprovante
                </span>
                <span className="text-xs leading-5 text-slate-400">
                  No iPhone, o sistema pode abrir câmera ou galeria. No desktop, continua como upload normal.
                </span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => setReceipt(e.target.files?.[0] ?? null)}
                  className="text-xs text-slate-400"
                />
                {receipt && <span className="text-xs text-emerald-300">Arquivo selecionado: {receipt.name}</span>}
              </label>
            </div>
            {error && <p className="rounded-2xl bg-rose-500/10 px-4 py-3 text-sm text-rose-300 md:col-span-2">{error}</p>}
            <button className="primary-button md:col-span-2">
              <PlusCircle size={16} />
              Registrar gasto
            </button>
          </form>
        </div>

        <div className="glass-surface p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <div className="soft-label text-slate-400">Histórico recente</div>
              <h2 className="mt-2 text-2xl font-semibold text-white">Últimos lançamentos</h2>
            </div>
            <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-slate-300">
              {transactions.length} itens
            </span>
          </div>
          {loading && <p className="text-sm text-slate-400">Carregando...</p>}
          <AnimatePresence>
            <div className="space-y-3">
              {transactions.map((t) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-[1.6rem] border border-white/10 bg-white/5 p-4 text-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className="mt-1 rounded-2xl bg-cyan-400/10 p-2 text-cyan-300">
                        <Wallet size={16} />
                      </span>
                      <div>
                        <div className="font-medium text-white">{t.category?.name ?? "Sem categoria"}</div>
                        <p className="mt-1 text-slate-400">{t.description || "Sem descrição informada"}</p>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs">
                          <span className="rounded-full bg-white/5 px-2 py-1 text-slate-300">
                            {t.transaction_kind === "linked_plan_item" ? "Ligado ao mensal" : "Avulso"}
                          </span>
                          {t.plan_item && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-cyan-400/10 px-2 py-1 text-cyan-200">
                              <Link2 size={12} />
                              {Array.isArray(t.plan_item) ? t.plan_item[0]?.title : t.plan_item.title}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="text-base font-semibold text-white">{formatCurrency(Number(t.amount))}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3 text-xs text-slate-400">
                    <span>{t.transaction_date}</span>
                    {t.receipt_url ? (
                      <a
                        className="inline-flex items-center gap-1 font-medium text-cyan-300 hover:text-cyan-200"
                        href={t.receipt_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <ReceiptText size={14} />
                        Ver recibo
                      </a>
                    ) : (
                      <span>Sem recibo</span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        </div>
      </section>
    </motion.div>
  );
}

