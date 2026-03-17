"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Camera, EllipsisVertical, Link2, Pencil, PlusCircle, ReceiptText, Save, Trash2, Wallet, X } from "lucide-react";
import { CategoryCombobox } from "@/components/category-combobox";

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
  category_id: string | null;
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

type TransactionDraft = {
  category_id: string;
  amount: string;
  transaction_date: string;
  description: string;
};

type Notice = {
  type: "success" | "error";
  message: string;
};

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
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState<TransactionDraft | null>(null);
  const [editingError, setEditingError] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [savingEditId, setSavingEditId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [historyNotice, setHistoryNotice] = useState<Notice | null>(null);
  const selectedPlanItem = planItems.find((item) => item.id === form.monthly_plan_item_id) ?? null;
  const hasPaidPlanItems = planItems.some((item) => item.status === "paid");
  const categoryOptions = useMemo(
    () =>
      categories.map((category) => ({
        value: category.id,
        label: category.name,
        keywords: category.name,
      })),
    [categories],
  );

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

  useEffect(() => {
    if (form.transaction_kind !== "linked_plan_item" || !selectedPlanItem || selectedPlanItem.status !== "paid") return;

    setForm((prev) => ({
      ...prev,
      monthly_plan_item_id: "",
    }));
    setError("Este item do mensal já está pago. Para registrar valor extra, use Gasto avulso.");
  }, [form.transaction_kind, selectedPlanItem]);

  const startEditing = (transaction: Transaction) => {
    setActiveMenuId(null);
    setPendingDeleteId(null);
    setHistoryNotice(null);
    setEditingError(null);
    setEditingId(transaction.id);
    setEditingDraft({
      category_id: transaction.category_id ?? "",
      amount: transaction.amount ? String(transaction.amount) : "",
      transaction_date: transaction.transaction_date,
      description: transaction.description ?? "",
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingDraft(null);
    setEditingError(null);
  };

  const saveEdit = async (transaction: Transaction) => {
    if (!editingDraft || editingId !== transaction.id) return;

    const parsedAmount = Number(editingDraft.amount);
    if (!editingDraft.category_id || !editingDraft.transaction_date || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setEditingError("Preencha categoria, valor e data com informações válidas antes de salvar.");
      return;
    }

    setSavingEditId(transaction.id);
    setEditingError(null);
    setHistoryNotice(null);
    try {
      const res = await fetch(`/api/transactions/${transaction.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category_id: editingDraft.category_id,
          amount: parsedAmount,
          transaction_date: editingDraft.transaction_date,
          description: editingDraft.description.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Não foi possível atualizar o lançamento.");
      await loadData();
      cancelEditing();
      setHistoryNotice({ type: "success", message: "Lançamento atualizado com sucesso." });
    } catch (err) {
      setEditingError(err instanceof Error ? err.message : "Não foi possível atualizar o lançamento.");
    } finally {
      setSavingEditId(null);
    }
  };

  const removeTransaction = async (transactionId: string) => {
    setRemovingId(transactionId);
    setHistoryNotice(null);
    setEditingError(null);
    try {
      const res = await fetch(`/api/transactions/${transactionId}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Não foi possível excluir o lançamento.");
      await loadData();
      if (editingId === transactionId) {
        cancelEditing();
      }
      setPendingDeleteId(null);
      setActiveMenuId(null);
      setHistoryNotice({ type: "success", message: "Lançamento excluído com sucesso." });
    } catch (err) {
      setHistoryNotice({
        type: "error",
        message: err instanceof Error ? err.message : "Não foi possível excluir o lançamento.",
      });
    } finally {
      setRemovingId(null);
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();

    if (form.transaction_kind === "linked_plan_item" && selectedPlanItem?.status === "paid") {
      setError("Este item do mensal já está pago. Para registrar valor extra, use Gasto avulso.");
      return;
    }

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
    setError(null);
    setHistoryNotice(null);
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
                    <option key={item.id} value={item.id} disabled={item.status === "paid"}>
                      {item.title} · {formatCurrency(item.expected_amount)} · {item.status === "paid" ? "PAGO" : item.status === "partial" ? "parcial" : "pendente"}
                    </option>
                  ))}
                </select>
                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
                  <span className="font-semibold text-emerald-200">PAGO</span> aparece desabilitado quando a conta ja foi quitada.
                  Para registrar valor extra, use <span className="font-semibold text-emerald-50">Gasto avulso</span>.
                </div>
                {hasPaidPlanItems && (
                  <p className="text-xs text-slate-400">
                    Itens quitados continuam visiveis apenas como referencia e nao aceitam novo vinculo.
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-200">Categoria</label>
              <CategoryCombobox
                value={form.category_id}
                onChange={(nextValue) => setForm((prev) => ({ ...prev, category_id: nextValue }))}
                options={categoryOptions}
                placeholder="Selecione a categoria"
                required={form.transaction_kind === "avulso"}
              />
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
          {historyNotice && (
            <p
              className={[
                "mb-4 rounded-2xl border px-4 py-3 text-sm",
                historyNotice.type === "success"
                  ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-100"
                  : "border-rose-400/20 bg-rose-500/10 text-rose-200",
              ].join(" ")}
            >
              {historyNotice.message}
            </p>
          )}
          <AnimatePresence>
            <div className="space-y-3">
              {transactions.map((t) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative rounded-[1.6rem] border border-white/10 bg-white/5 p-4 text-sm"
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
                    <div className="flex items-start gap-2">
                      <span className="text-base font-semibold text-white">{formatCurrency(Number(t.amount))}</span>
                      <div className="relative">
                        <button
                          type="button"
                          aria-label="Abrir ações do lançamento"
                          onClick={() => {
                            setActiveMenuId((prev) => (prev === t.id ? null : t.id));
                            setPendingDeleteId(null);
                          }}
                          className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
                        >
                          <EllipsisVertical size={16} />
                        </button>
                        {activeMenuId === t.id && (
                          <div className="absolute right-0 top-11 z-10 w-44 rounded-2xl border border-white/10 bg-slate-950/95 p-2 shadow-2xl">
                            <button
                              type="button"
                              onClick={() => startEditing(t)}
                              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-slate-200 transition hover:bg-white/10"
                            >
                              <Pencil size={14} />
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setPendingDeleteId(t.id);
                                setActiveMenuId(null);
                              }}
                              className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-rose-200 transition hover:bg-rose-500/10"
                            >
                              <Trash2 size={14} />
                              Excluir
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {editingId === t.id && editingDraft ? (
                    <div className="mt-4 rounded-[1.4rem] border border-white/10 bg-slate-950/40 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-white">Editar lançamento</p>
                          <p className="mt-1 text-xs leading-5 text-slate-400">
                            Você pode ajustar categoria, valor, data e descrição sem sair desta tela.
                          </p>
                        </div>
                        <button type="button" onClick={cancelEditing} className="rounded-full border border-white/10 p-2 text-slate-300 hover:bg-white/10 hover:text-white">
                          <X size={14} />
                        </button>
                      </div>

                      {t.transaction_kind === "linked_plan_item" && (
                        <p className="mt-3 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-xs text-cyan-100">
                          Este lançamento continua ligado ao mensal. O vínculo e o recibo permanecem como estão nesta edição.
                        </p>
                      )}

                      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-200">Categoria</label>
                          <CategoryCombobox
                            value={editingDraft.category_id}
                            onChange={(nextValue) => {
                              setEditingDraft((prev) => (prev ? { ...prev, category_id: nextValue } : prev));
                              setEditingError(null);
                            }}
                            options={categoryOptions}
                            placeholder="Selecione a categoria"
                            disabled={savingEditId === t.id}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-200">Valor</label>
                          <input
                            type="number"
                            step="0.01"
                            value={editingDraft.amount}
                            onChange={(e) => {
                              setEditingDraft((prev) => (prev ? { ...prev, amount: e.target.value } : prev));
                              setEditingError(null);
                            }}
                            disabled={savingEditId === t.id}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-200">Data</label>
                          <input
                            type="date"
                            value={editingDraft.transaction_date}
                            onChange={(e) => {
                              setEditingDraft((prev) => (prev ? { ...prev, transaction_date: e.target.value } : prev));
                              setEditingError(null);
                            }}
                            disabled={savingEditId === t.id}
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-sm font-medium text-slate-200">Descrição</label>
                          <input
                            type="text"
                            value={editingDraft.description}
                            onChange={(e) => {
                              setEditingDraft((prev) => (prev ? { ...prev, description: e.target.value } : prev));
                              setEditingError(null);
                            }}
                            disabled={savingEditId === t.id}
                            placeholder="Descreva o lançamento"
                          />
                        </div>
                      </div>

                      {editingError && (
                        <p className="mt-3 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{editingError}</p>
                      )}

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap gap-2 text-xs text-slate-400">
                          <span className="rounded-full bg-white/5 px-3 py-2">Tipo: {t.transaction_kind === "linked_plan_item" ? "Ligado ao mensal" : "Avulso"}</span>
                          {t.receipt_url && (
                            <a className="inline-flex items-center gap-1 rounded-full bg-white/5 px-3 py-2 text-cyan-300 hover:text-cyan-200" href={t.receipt_url} target="_blank" rel="noreferrer">
                              <ReceiptText size={14} />
                              Ver recibo atual
                            </a>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={cancelEditing}
                            disabled={savingEditId === t.id}
                            className="secondary-button border-white/10 bg-white/5 text-white hover:bg-white/10"
                          >
                            <X size={14} />
                            Cancelar
                          </button>
                          <button type="button" onClick={() => void saveEdit(t)} disabled={savingEditId === t.id} className="primary-button">
                            <Save size={14} />
                            {savingEditId === t.id ? "Salvando..." : "Salvar"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
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
                  )}

                  {pendingDeleteId === t.id && (
                    <div className="mt-4 rounded-[1.4rem] border border-rose-400/20 bg-rose-500/10 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="text-sm text-rose-100">
                          <p className="font-medium text-rose-50">Excluir este lançamento?</p>
                          <p className="mt-1 text-rose-200/90">A exclusão atualiza o histórico e pode alterar o status do item vinculado no mensal.</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => setPendingDeleteId(null)}
                            disabled={removingId === t.id}
                            className="secondary-button border-white/10 bg-white/5 text-white hover:bg-white/10"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={() => void removeTransaction(t.id)}
                            disabled={removingId === t.id}
                            className="secondary-button border-rose-400/20 bg-rose-500/10 text-rose-100 hover:bg-rose-500/20"
                          >
                            {removingId === t.id ? (
                              "Excluindo..."
                            ) : (
                              <>
                                <Trash2 size={14} />
                                Excluir agora
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        </div>
      </section>
    </motion.div>
  );
}

