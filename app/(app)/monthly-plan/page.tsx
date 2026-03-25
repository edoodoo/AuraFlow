"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, CalendarRange, Link2, Plus, ReceiptText, RefreshCw, Trash2 } from "lucide-react";
import { CategoryCombobox } from "@/components/category-combobox";

type Category = {
  id: string;
  name: string;
  category_kind: "fixed" | "variable";
};

type MemberOption = {
  user_id: string;
  label: string;
  role: "owner" | "partner";
};

type Household = {
  id: string;
  partner_email: string | null;
  members: MemberOption[];
};

type Plan = {
  id: string;
  month: number;
  year: number;
};

type PlanItem = {
  id: string;
  monthly_plan_id: string;
  category_id: string | null;
  title: string;
  section: SectionKey;
  expected_amount: number;
  is_fixed: boolean;
  due_date: string | null;
  status: "pending" | "partial" | "paid";
  assigned_user_id: string | null;
  paid_by_user_id: string | null;
  paid_at: string | null;
  paid_amount: number;
  remaining_amount: number;
  notes: string | null;
  category: { name: string } | { name: string }[] | null;
};

type Summary = {
  monthly_income: number | null;
  total_planned: number;
  total_realized: number;
  fixed_count: number;
  usage_pct: number;
  planned_balance: number | null;
  available_balance: number | null;
  sections: Array<{ key: SectionKey; label: string; planned: number; realized: number; item_count: number }>;
  avulso_total: number;
  avulso_count: number;
  avulso_transactions: Array<{
    id: string;
    category_name: string;
    description: string | null;
    amount: number;
    transaction_date: string;
    user_label: string;
  }>;
};

type ApiPayload = {
  household: Household | null;
  member_options: MemberOption[];
  categories: Category[];
  plan: Plan | null;
  items: PlanItem[];
  summary: Summary | null;
};

type ItemDraft = {
  title: string;
  category_id: string;
  expected_amount: string;
  due_date: string;
  is_fixed: boolean;
  assigned_user_id: string;
  notes: string;
};

type SectionKey = "general" | "investments" | "emergency_reserve" | "debts";
type ItemFieldKey = "title" | "category_id" | "expected_amount" | "due_date" | "assigned_user_id";
type ItemFieldErrors = Partial<Record<ItemFieldKey, string>>;

const now = new Date();
const monthLabels = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const sections: Array<{ key: SectionKey; label: string; helper: string }> = [
  { key: "general", label: "Gastos mensais", helper: "Contas, mercado, lazer, moradia e rotina do mês." },
  { key: "investments", label: "Investimentos", helper: "Aportes planejados e investimentos recorrentes." },
  { key: "emergency_reserve", label: "Reserva de Emergência", helper: "Valores destinados ao colchão financeiro." },
  { key: "debts", label: "Dívidas", helper: "Parcelas, renegociações e passivos que exigem acompanhamento." },
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);

const formatCurrencyOrFallback = (value: number | null | undefined, fallback: string) =>
  value === null || value === undefined ? fallback : formatCurrency(value);

const fieldErrorClass = "border-rose-400/70 ring-1 ring-rose-400/40 focus:border-rose-300 focus:ring-rose-300/40";
const compactMonthlyFieldClass = "min-h-11 px-3 py-2 text-[13px]";
const compactMonthlyInlineFieldClass = "min-h-10 px-3 py-2 text-[13px]";
const compactMonthlySecondaryButtonClass = "inline-flex items-center justify-center gap-2 rounded-2xl px-3 py-2 text-sm font-medium";
const compactMonthlySummaryCardClass = "rounded-2xl bg-slate-950/40 px-4 py-2.5 text-[13px]";

function getCategoryName(category: PlanItem["category"]) {
  if (Array.isArray(category)) return category[0]?.name ?? "Sem categoria";
  return category?.name ?? "Sem categoria";
}

function getPaymentStatusLabel(item: PlanItem) {
  if (item.status === "paid") return "Pago";
  if (item.status === "partial") return `Parcial - ${formatCurrency(item.paid_amount)}`;
  return "Pendente";
}

function createBlankItemDraft(): ItemDraft {
  return {
    title: "",
    category_id: "",
    expected_amount: "",
    due_date: "",
    is_fixed: false,
    assigned_user_id: "",
    notes: "",
  };
}

function createBlankFieldErrors(): ItemFieldErrors {
  return {};
}

function validateItemDraft(draft: ItemDraft): ItemFieldErrors {
  const errors: ItemFieldErrors = {};

  if (!draft.title.trim()) {
    errors.title = "Informe o título.";
  } else if (draft.title.trim().length < 2) {
    errors.title = "Use pelo menos 2 caracteres.";
  }

  if (!draft.category_id) {
    errors.category_id = "Selecione a categoria.";
  }

  if (!draft.expected_amount.trim()) {
    errors.expected_amount = "Informe o valor.";
  } else if (Number(draft.expected_amount) <= 0) {
    errors.expected_amount = "Use um valor maior que zero.";
  }

  if (!draft.due_date) {
    errors.due_date = "Informe a data.";
  }

  if (!draft.assigned_user_id) {
    errors.assigned_user_id = "Selecione o responsável.";
  }

  return errors;
}

function getDraftInputClass(hasError: boolean) {
  return hasError ? fieldErrorClass : undefined;
}

function focusFirstInvalidField(scope: string, errors: ItemFieldErrors) {
  const firstField = (Object.keys(errors) as ItemFieldKey[])[0];
  if (!firstField || typeof document === "undefined") return;

  const element = document.querySelector<HTMLElement>(`[data-item-scope="${scope}"][data-field="${firstField}"]`);
  element?.focus();
  element?.scrollIntoView({ behavior: "smooth", block: "center" });
}

export default function MonthlyPlanPage() {
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [partnerEmail, setPartnerEmail] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [memberOptions, setMemberOptions] = useState<MemberOption[]>([]);
  const [household, setHousehold] = useState<Household | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [items, setItems] = useState<PlanItem[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [newItems, setNewItems] = useState<Record<SectionKey, ItemDraft>>({
    general: createBlankItemDraft(),
    investments: createBlankItemDraft(),
    emergency_reserve: createBlankItemDraft(),
    debts: createBlankItemDraft(),
  });
  const [itemDrafts, setItemDrafts] = useState<Record<string, ItemDraft>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [incomeValue, setIncomeValue] = useState("");
  const [incomeError, setIncomeError] = useState<string | null>(null);
  const [incomeSaving, setIncomeSaving] = useState(false);
  const [newItemErrors, setNewItemErrors] = useState<Record<SectionKey, ItemFieldErrors>>({
    general: createBlankFieldErrors(),
    investments: createBlankFieldErrors(),
    emergency_reserve: createBlankFieldErrors(),
    debts: createBlankFieldErrors(),
  });
  const [sectionErrors, setSectionErrors] = useState<Partial<Record<SectionKey, string>>>({});
  const [itemErrors, setItemErrors] = useState<Record<string, ItemFieldErrors>>({});
  const [itemErrorMessages, setItemErrorMessages] = useState<Record<string, string>>({});
  const [itemSuccessMessages, setItemSuccessMessages] = useState<Record<string, string>>({});
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const groupedItems = useMemo(
    () =>
      sections.map((section) => ({
        ...section,
        items: items.filter((item) => item.section === section.key),
      })),
    [items],
  );
  const categoryOptions = useMemo(
    () =>
      categories.map((category) => ({
        value: category.id,
        label: `${category.name} · ${category.category_kind === "fixed" ? "fixo" : "variável"}`,
        keywords: `${category.name} ${category.category_kind === "fixed" ? "fixo" : "variável"}`,
      })),
    [categories],
  );

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/monthly-plan?month=${month}&year=${year}`, { cache: "no-store" });
      const data: ApiPayload = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error ?? "Falha ao carregar o planejamento.");

      setHousehold(data.household);
      setPartnerEmail(data.household?.partner_email ?? "");
      setMemberOptions(data.member_options ?? []);
      setCategories(data.categories ?? []);
      setPlan(data.plan);
      setItems(data.items ?? []);
      setSummary(data.summary ?? null);
      setIncomeValue(data.summary?.monthly_income ? String(data.summary.monthly_income) : "");
      setIncomeError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao carregar o planejamento.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, year]);

  useEffect(() => {
    setExportNotice(null);
  }, [month, year]);

  useEffect(() => {
    const drafts = Object.fromEntries(
      items.map((item) => [
        item.id,
        {
          title: item.title,
          category_id: item.category_id ?? "",
          expected_amount: item.expected_amount ? String(item.expected_amount) : "",
          due_date: item.due_date ?? "",
          is_fixed: item.is_fixed,
          assigned_user_id: item.assigned_user_id ?? "",
          notes: item.notes ?? "",
        },
      ]),
    );

    setItemDrafts(drafts);
  }, [items]);

  const ensurePlan = async (e?: FormEvent) => {
    e?.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/monthly-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month,
          year,
          partner_email: partnerEmail,
        }),
      });

      const data: (ApiPayload & { error?: string }) | { error?: string } = await res.json().catch(() => ({
        error: "Não foi possível processar a resposta do servidor.",
      }));
      if (!res.ok) throw new Error(data.error ?? "Não foi possível preparar o mensal.");
      const payload = data as ApiPayload;

      setHousehold(payload.household);
      setMemberOptions(payload.member_options ?? []);
      setCategories(payload.categories ?? []);
      setPlan(payload.plan);
      setItems(payload.items ?? []);
      setSummary(payload.summary ?? null);
      setIncomeValue(payload.summary?.monthly_income ? String(payload.summary.monthly_income) : "");
      setIncomeError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível preparar o mensal.");
    } finally {
      setSaving(false);
    }
  };

  const saveIncome = async () => {
    if (!household) {
      setIncomeError("Crie ou vincule o mensal antes de informar a renda do casal.");
      return;
    }

    const parsedIncome = Number(incomeValue);
    if (!incomeValue.trim() || !Number.isFinite(parsedIncome) || parsedIncome <= 0) {
      setIncomeError("Informe a renda total do casal com um valor maior que zero.");
      return;
    }

    setIncomeSaving(true);
    setIncomeError(null);
    try {
      const res = await fetch("/api/monthly-plan/income", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month,
          year,
          income_amount: parsedIncome,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Não foi possível salvar a renda mensal.");
      await loadData();
    } catch (err) {
      setIncomeError(err instanceof Error ? err.message : "Não foi possível salvar a renda mensal.");
    } finally {
      setIncomeSaving(false);
    }
  };

  const createItem = async (section: SectionKey) => {
    if (!plan) {
      setError("Crie o mensal antes de adicionar itens.");
      return;
    }

    const draft = newItems[section];
    const validationErrors = validateItemDraft(draft);
    if (Object.keys(validationErrors).length > 0) {
      setNewItemErrors((prev) => ({ ...prev, [section]: validationErrors }));
      setSectionErrors((prev) => ({
        ...prev,
        [section]: "Preencha os campos destacados antes de adicionar o item.",
      }));
      focusFirstInvalidField(`new-${section}`, validationErrors);
      return;
    }

    setSaving(true);
    setError(null);
    setSectionErrors((prev) => ({ ...prev, [section]: undefined }));
    try {
      const res = await fetch("/api/monthly-plan/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monthly_plan_id: plan.id,
          title: draft.title,
          category_id: draft.category_id || null,
          section,
          expected_amount: Number(draft.expected_amount || 0),
          is_fixed: draft.is_fixed,
          due_date: draft.due_date || null,
          assigned_user_id: draft.assigned_user_id || null,
          notes: draft.notes || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Não foi possível criar o item.");

      setNewItems((prev) => ({
        ...prev,
        [section]: createBlankItemDraft(),
      }));
      setNewItemErrors((prev) => ({ ...prev, [section]: createBlankFieldErrors() }));
      await loadData();
    } catch (err) {
      setSectionErrors((prev) => ({
        ...prev,
        [section]: err instanceof Error ? err.message : "Não foi possível criar o item.",
      }));
    } finally {
      setSaving(false);
    }
  };

  const saveItem = async (itemId: string) => {
    const draft = itemDrafts[itemId];
    const validationErrors = validateItemDraft(draft);
    if (Object.keys(validationErrors).length > 0) {
      setItemErrors((prev) => ({ ...prev, [itemId]: validationErrors }));
      setItemSuccessMessages((prev) => ({ ...prev, [itemId]: "" }));
      setItemErrorMessages((prev) => ({
        ...prev,
        [itemId]: "Preencha os campos destacados antes de salvar o item.",
      }));
      focusFirstInvalidField(`item-${itemId}`, validationErrors);
      return;
    }

    setSaving(true);
    setError(null);
    setItemErrorMessages((prev) => ({ ...prev, [itemId]: "" }));
    setItemSuccessMessages((prev) => ({ ...prev, [itemId]: "" }));
    try {
      const res = await fetch(`/api/monthly-plan/items/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: draft.title,
          category_id: draft.category_id || null,
          expected_amount: Number(draft.expected_amount || 0),
          due_date: draft.due_date || null,
          is_fixed: draft.is_fixed,
          assigned_user_id: draft.assigned_user_id || null,
          notes: draft.notes || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Não foi possível atualizar o item.");
      setItemErrors((prev) => ({ ...prev, [itemId]: createBlankFieldErrors() }));
      await loadData();
      setItemSuccessMessages((prev) => ({ ...prev, [itemId]: "Item salvo com sucesso." }));
    } catch (err) {
      setItemSuccessMessages((prev) => ({ ...prev, [itemId]: "" }));
      setItemErrorMessages((prev) => ({
        ...prev,
        [itemId]: err instanceof Error ? err.message : "Não foi possível atualizar o item.",
      }));
    } finally {
      setSaving(false);
    }
  };

  const removeItem = async (itemId: string) => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/monthly-plan/items/${itemId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Não foi possível remover o item.");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível remover o item.");
    } finally {
      setSaving(false);
    }
  };

  const exportNextMonth = async () => {
    const nextDate = new Date(year, month - 1, 1);
    nextDate.setMonth(nextDate.getMonth() + 1);

    setSaving(true);
    setError(null);
    setExportNotice(null);
    try {
      const res = await fetch("/api/monthly-plan/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source_month: month,
          source_year: year,
          target_month: nextDate.getMonth() + 1,
          target_year: nextDate.getFullYear(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Não foi possível exportar os itens fixos.");
      await loadData();
      const created = Number(data.created ?? 0);
      const itemLabel = created === 1 ? "item fixo foi enviado" : "itens fixos foram enviados";
      setExportNotice(`Exportação concluída. ${created} ${itemLabel} para ${monthLabels[nextDate.getMonth()]} de ${nextDate.getFullYear()}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível exportar os itens fixos.");
    } finally {
      setSaving(false);
    }
  };

  const updateDraft = (itemId: string, patch: Partial<ItemDraft>) => {
    setItemDrafts((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        ...patch,
      },
    }));
    if (Object.keys(patch).length > 0) {
      setItemErrors((prev) => {
        const current = { ...(prev[itemId] ?? {}) };
        for (const key of Object.keys(patch) as ItemFieldKey[]) {
          delete current[key];
        }
        return { ...prev, [itemId]: current };
      });
      setItemErrorMessages((prev) => ({ ...prev, [itemId]: "" }));
      setItemSuccessMessages((prev) => ({ ...prev, [itemId]: "" }));
    }
  };

  const updateNewItem = (section: SectionKey, patch: Partial<ItemDraft>) => {
    setNewItems((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        ...patch,
      },
    }));
    if (Object.keys(patch).length > 0) {
      setNewItemErrors((prev) => {
        const current = { ...(prev[section] ?? {}) };
        for (const key of Object.keys(patch) as ItemFieldKey[]) {
          delete current[key];
        }
        return { ...prev, [section]: current };
      });
      setSectionErrors((prev) => ({ ...prev, [section]: undefined }));
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <section className="glass-surface p-5 sm:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <div className="soft-label text-slate-400">Planejamento mensal compartilhado</div>
            <h1 className="mt-3 page-title text-white">Cadastre o mensal do casal e acompanhe o que foi pago.</h1>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Aqui ficam os itens do mês, o vínculo do cônjuge, as categorias, as seções especiais e a exportação dos fixos.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 xl:w-[560px]">
            <select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
              {monthLabels.map((label, index) => (
                <option key={label} value={index + 1}>
                  {label}
                </option>
              ))}
            </select>
            <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} />
            <button type="button" className="secondary-button border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => void loadData()}>
              Atualizar visão
            </button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-[1fr_0.9fr]">
          <form onSubmit={ensurePlan} className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
            <div className="flex items-center gap-2 text-white">
              <Link2 size={18} className="text-cyan-300" />
              <span className="font-semibold">Vínculo do cônjuge</span>
            </div>
            <p className="mt-2 text-sm text-slate-400">
              Um cônjuge cria o mensal e pode vincular o outro pelo e-mail. O vinculado passa a ver o mesmo dashboard e o mesmo mensal.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto]">
              <input
                type="email"
                placeholder="email-do-conjuge@exemplo.com"
                value={partnerEmail}
                onChange={(e) => setPartnerEmail(e.target.value)}
              />
              <button className="primary-button min-w-[220px]">
                {plan ? "Atualizar vínculo e manter mensal" : "Criar mensal e vincular"}
              </button>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-300">
              {memberOptions.map((member) => (
                <span key={member.user_id} className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                  {member.label} · {member.role === "owner" ? "criador" : "cônjuge"}
                </span>
              ))}
              {!household && <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-amber-200">Ainda sem vínculo compartilhado</span>}
            </div>
          </form>

          <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
            <div className="flex items-center gap-2 text-white">
              <CalendarRange size={18} className="text-violet-300" />
              <span className="font-semibold">
                {monthLabels[month - 1]} de {year}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-400">
              Informe a soma de salarios e extras do casal para melhorar a leitura do mensal e do dashboard.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto]">
              <input
                type="number"
                step="0.01"
                placeholder="Renda total do casal no mês"
                value={incomeValue}
                onChange={(e) => {
                  setIncomeValue(e.target.value);
                  setIncomeError(null);
                }}
                disabled={!household || incomeSaving}
                className={incomeError ? fieldErrorClass : undefined}
              />
              <button type="button" className="primary-button min-w-[180px]" onClick={() => void saveIncome()} disabled={!household || incomeSaving}>
                {summary?.monthly_income ? "Atualizar renda" : "Salvar renda"}
              </button>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-slate-400">
                {!household
                  ? "Crie ou vincule o mensal primeiro para registrar a renda do casal."
                  : "Use o valor total do casal para este periodo. Ele pode ser atualizado se entrarem novos extras."}
              </p>
              <button
                type="button"
                onClick={exportNextMonth}
                disabled={!plan || saving}
                className="secondary-button border-white/10 bg-white/5 text-white hover:bg-white/10 disabled:opacity-50"
              >
                <RefreshCw size={15} />
                Exportar fixos
              </button>
            </div>
            {incomeError && <p className="mt-3 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{incomeError}</p>}
            {exportNotice && <p className="mt-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">{exportNotice}</p>}
          </div>
        </div>

        {summary && (
          <div className="mt-5 space-y-3">
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
              <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/30 p-4">
                <div className="soft-label text-slate-400">Planejado</div>
                <div className="mt-2 text-2xl font-semibold text-white">{formatCurrency(summary.total_planned)}</div>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/30 p-4">
                <div className="soft-label text-slate-400">Realizado</div>
                <div className="mt-2 text-2xl font-semibold text-white">{formatCurrency(summary.total_realized)}</div>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/30 p-4">
                <div className="soft-label text-slate-400">Avulsos</div>
                <div className="mt-2 text-2xl font-semibold text-white">{formatCurrency(summary.avulso_total)}</div>
                <p className="mt-2 text-xs text-slate-500">{summary.avulso_count} lancamentos fora do mensal</p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/30 p-4">
                <div className="soft-label text-slate-400">Saldo disponível</div>
                <div className="mt-2 text-2xl font-semibold text-white">
                  {formatCurrencyOrFallback(summary.available_balance, "Informe a renda")}
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Saldo previsto: {formatCurrencyOrFallback(summary.planned_balance, "informe a renda")}
                </p>
              </div>
            </div>
            {summary.monthly_income === null && (
              <p className="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
                Informe a renda total do casal neste mes para liberar o saldo disponivel e melhorar a leitura do topo.
              </p>
            )}
          </div>
        )}
      </section>

      <section className="glass-surface p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="soft-label text-slate-400">Seções do mensal</div>
            <h2 className="mt-2 text-xl font-semibold text-white">Leitura rápida do planejamento</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Use a tela de categorias para cadastrar e organizar os tipos fixos e variáveis. Aqui você acompanha como cada seção está distribuída.
            </p>
          </div>
          <Link href="/categories" className="secondary-button border-white/10 bg-white/5 text-white hover:bg-white/10">
            Abrir categorias
            <ArrowRight size={16} />
          </Link>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-4">
          {summary?.sections?.map((section) => (
            <div key={section.key} className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
              <div className="font-medium text-white">{section.label}</div>
              <p className="mt-2 text-sm text-slate-400">
                Planejado {formatCurrency(section.planned)} · Realizado {formatCurrency(section.realized)}
              </p>
              <p className="mt-1 text-xs text-slate-500">{section.item_count} itens nessa seção</p>
            </div>
          )) ?? <p className="text-sm text-slate-400">Crie o mensal para visualizar os blocos operacionais do período.</p>}
        </div>
      </section>

      {error && <p className="rounded-2xl bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{error}</p>}
      {loading && <p className="text-sm text-slate-400">Carregando planejamento...</p>}

      <section className="space-y-6">
        {groupedItems.map((section) => (
          <div key={section.key} className="glass-surface p-5 sm:p-6">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="soft-label text-slate-400">{section.label}</div>
                <h3 className="mt-2 text-2xl font-semibold text-white">{section.label}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{section.helper}</p>
              </div>
              <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-slate-300">
                {section.items.length} itens
              </span>
            </div>

            <div className="mt-5 rounded-[1.6rem] border border-white/10 bg-white/5 p-4">
              <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1.05fr_1.2fr_0.68fr_0.8fr_1.12fr]">
                <input
                  data-item-scope={`new-${section.key}`}
                  data-field="title"
                  placeholder="Título do item"
                  value={newItems[section.key].title}
                  onChange={(e) => updateNewItem(section.key, { title: e.target.value })}
                  className={[compactMonthlyFieldClass, getDraftInputClass(Boolean(newItemErrors[section.key].title))].filter(Boolean).join(" ")}
                />
                <CategoryCombobox
                  dataScope={`new-${section.key}`}
                  dataField="category_id"
                  value={newItems[section.key].category_id}
                  onChange={(nextValue) => updateNewItem(section.key, { category_id: nextValue })}
                  options={categoryOptions}
                  placeholder="Selecione a categoria"
                  compact
                  panelClassName="xl:min-w-[22rem]"
                  className={getDraftInputClass(Boolean(newItemErrors[section.key].category_id))}
                />
                <input
                  data-item-scope={`new-${section.key}`}
                  data-field="expected_amount"
                  type="number"
                  step="0.01"
                  placeholder="Valor previsto"
                  value={newItems[section.key].expected_amount}
                  onChange={(e) => updateNewItem(section.key, { expected_amount: e.target.value })}
                  className={[compactMonthlyFieldClass, getDraftInputClass(Boolean(newItemErrors[section.key].expected_amount))].filter(Boolean).join(" ")}
                />
                <input
                  data-item-scope={`new-${section.key}`}
                  data-field="due_date"
                  type="date"
                  value={newItems[section.key].due_date}
                  onChange={(e) => updateNewItem(section.key, { due_date: e.target.value })}
                  className={[compactMonthlyFieldClass, getDraftInputClass(Boolean(newItemErrors[section.key].due_date))].filter(Boolean).join(" ")}
                />
                <select
                  data-item-scope={`new-${section.key}`}
                  data-field="assigned_user_id"
                  value={newItems[section.key].assigned_user_id}
                  onChange={(e) => updateNewItem(section.key, { assigned_user_id: e.target.value })}
                  className={[compactMonthlyFieldClass, getDraftInputClass(Boolean(newItemErrors[section.key].assigned_user_id))].filter(Boolean).join(" ")}
                >
                  <option value="">Selecione o responsável</option>
                  {memberOptions.map((member) => (
                    <option key={member.user_id} value={member.user_id}>
                      {member.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-[auto_minmax(0,1fr)_auto] xl:items-center">
                <label className="flex items-center gap-2 text-[13px] text-slate-300">
                  <input
                    type="checkbox"
                    checked={newItems[section.key].is_fixed}
                    onChange={(e) => updateNewItem(section.key, { is_fixed: e.target.checked })}
                  />
                  Repetir nos próximos meses
                </label>
                <input
                  className={`w-full max-w-none ${compactMonthlyInlineFieldClass}`}
                  placeholder="Observações rápidas"
                  value={newItems[section.key].notes}
                  onChange={(e) => updateNewItem(section.key, { notes: e.target.value })}
                />
                <button
                  type="button"
                  className="primary-button justify-self-start px-4 xl:justify-self-end"
                  onClick={() => void createItem(section.key)}
                  disabled={!plan || saving}
                >
                  <Plus size={16} />
                  Add
                </button>
              </div>
              {sectionErrors[section.key] && (
                <p className="mt-3 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                  {sectionErrors[section.key]}
                </p>
              )}
            </div>

            <div className="mt-5 space-y-3">
              <AnimatePresence>
                {section.items.map((item) => {
                  const draft = itemDrafts[item.id] ?? createBlankItemDraft();
                  const currentItemErrors = itemErrors[item.id] ?? {};
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-[1.6rem] border border-white/10 bg-white/5 p-4"
                    >
                      <div className="grid grid-cols-1 gap-3 2xl:grid-cols-[1.05fr_1.2fr_0.68fr_0.8fr_1.12fr_auto]">
                        <input
                          data-item-scope={`item-${item.id}`}
                          data-field="title"
                          value={draft.title}
                          onChange={(e) => updateDraft(item.id, { title: e.target.value })}
                          className={[compactMonthlyFieldClass, getDraftInputClass(Boolean(currentItemErrors.title))].filter(Boolean).join(" ")}
                        />
                        <CategoryCombobox
                          dataScope={`item-${item.id}`}
                          dataField="category_id"
                          value={draft.category_id}
                          onChange={(nextValue) => updateDraft(item.id, { category_id: nextValue })}
                          options={categoryOptions}
                          placeholder="Selecione a categoria"
                          compact
                          panelClassName="2xl:min-w-[22rem]"
                          className={getDraftInputClass(Boolean(currentItemErrors.category_id))}
                        />
                        <input
                          data-item-scope={`item-${item.id}`}
                          data-field="expected_amount"
                          type="number"
                          step="0.01"
                          value={draft.expected_amount}
                          onChange={(e) => updateDraft(item.id, { expected_amount: e.target.value })}
                          className={[compactMonthlyFieldClass, getDraftInputClass(Boolean(currentItemErrors.expected_amount))].filter(Boolean).join(" ")}
                        />
                        <input
                          data-item-scope={`item-${item.id}`}
                          data-field="due_date"
                          type="date"
                          value={draft.due_date}
                          onChange={(e) => updateDraft(item.id, { due_date: e.target.value })}
                          className={[compactMonthlyFieldClass, getDraftInputClass(Boolean(currentItemErrors.due_date))].filter(Boolean).join(" ")}
                        />
                        <select
                          data-item-scope={`item-${item.id}`}
                          data-field="assigned_user_id"
                          value={draft.assigned_user_id}
                          onChange={(e) => updateDraft(item.id, { assigned_user_id: e.target.value })}
                          className={[compactMonthlyFieldClass, getDraftInputClass(Boolean(currentItemErrors.assigned_user_id))].filter(Boolean).join(" ")}
                        >
                          <option value="">Selecione o responsável</option>
                          {memberOptions.map((member) => (
                            <option key={member.user_id} value={member.user_id}>
                              {member.label}
                            </option>
                          ))}
                        </select>
                        <button type="button" className="secondary-button border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => void saveItem(item.id)}>
                          Salvar
                        </button>
                      </div>

                      {itemErrorMessages[item.id] && (
                        <p className="mt-3 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                          {itemErrorMessages[item.id]}
                        </p>
                      )}
                      {itemSuccessMessages[item.id] && (
                        <p className="mt-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
                          {itemSuccessMessages[item.id]}
                        </p>
                      )}

                      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-[auto_1fr_auto_auto] lg:items-center">
                        <label className="flex items-center gap-2 text-[13px] text-slate-300">
                          <input
                            type="checkbox"
                            checked={draft.is_fixed}
                            onChange={(e) => updateDraft(item.id, { is_fixed: e.target.checked })}
                          />
                          Fixo
                        </label>
                        <input className={compactMonthlyInlineFieldClass} value={draft.notes} onChange={(e) => updateDraft(item.id, { notes: e.target.value })} placeholder="Observações" />
                        <span className="rounded-full bg-slate-950/40 px-3 py-1.5 text-xs text-slate-300">
                          {getCategoryName(item.category)}
                        </span>
                        <button
                          type="button"
                          className={`${compactMonthlySecondaryButtonClass} border border-rose-400/20 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20`}
                          onClick={() => void removeItem(item.id)}
                        >
                          <Trash2 size={14} />
                          Remover
                        </button>
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                        <div className={compactMonthlySummaryCardClass}>
                          <div className="text-slate-400">Previsto</div>
                          <div className="mt-1 font-medium text-white">{formatCurrency(item.expected_amount)}</div>
                        </div>
                        <div className={compactMonthlySummaryCardClass}>
                          <div className="text-slate-400">Status</div>
                          <div className="mt-1 font-medium text-white">{getPaymentStatusLabel(item)}</div>
                        </div>
                        <div className={compactMonthlySummaryCardClass}>
                          <div className="text-slate-400">Quem pagou / data</div>
                          <div className="mt-1 font-medium text-white">
                            {item.paid_by_user_id
                              ? `${memberOptions.find((member) => member.user_id === item.paid_by_user_id)?.label ?? "Usuário"} · ${item.paid_at ?? "--"}`
                              : "Ainda sem pagamento vinculado"}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {section.items.length === 0 && (
                <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-slate-950/20 p-5 text-sm text-slate-400">
                  Nenhum item cadastrado nesta seção ainda.
                </div>
              )}
            </div>
          </div>
        ))}

        <div className="glass-surface p-5 sm:p-6">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="soft-label text-slate-400">Fora do planejamento</div>
              <h3 className="mt-2 text-2xl font-semibold text-white">Gastos avulsos</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Lancamentos avulsos do mes ficam visiveis aqui sem contaminar as contas planejadas do mensal.
              </p>
            </div>
            <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-slate-300">
              {summary?.avulso_count ?? 0} lancamentos
            </span>
          </div>

          <div className="mt-5 rounded-[1.6rem] border border-amber-400/15 bg-amber-400/10 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-white">
                <ReceiptText size={18} className="text-amber-300" />
                <span className="font-semibold">Total avulso do periodo</span>
              </div>
              <span className="text-lg font-semibold text-white">{formatCurrency(summary?.avulso_total ?? 0)}</span>
            </div>
            <p className="mt-2 text-sm text-amber-100/80">
              Quando um valor nao pertence a nenhuma conta do mensal, ele entra como gasto avulso e fica separado da execucao planejada.
            </p>
          </div>

          <div className="mt-5 space-y-3">
            {(summary?.avulso_transactions ?? []).map((transaction) => (
              <div key={transaction.id} className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="font-medium text-white">{transaction.category_name}</div>
                    <p className="mt-1 text-sm text-slate-400">
                      {transaction.description || "Sem descricao informada"}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      {transaction.user_label} · {transaction.transaction_date}
                    </p>
                  </div>
                  <span className="text-base font-semibold text-white">{formatCurrency(transaction.amount)}</span>
                </div>
              </div>
            ))}

            {(summary?.avulso_transactions ?? []).length === 0 && (
              <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-slate-950/20 p-5 text-sm text-slate-400">
                Nenhum gasto avulso registrado neste periodo.
              </div>
            )}
          </div>
        </div>
      </section>
    </motion.div>
  );
}
