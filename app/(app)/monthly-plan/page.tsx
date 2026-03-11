"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarRange, Link2, Plus, RefreshCw, Tags, Trash2 } from "lucide-react";

type Category = {
  id: string;
  name: string;
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
  notes: string | null;
  category: { name: string } | { name: string }[] | null;
};

type Summary = {
  total_planned: number;
  total_realized: number;
  fixed_count: number;
  usage_pct: number;
  sections: Array<{ key: SectionKey; label: string; planned: number; realized: number; item_count: number }>;
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

function getCategoryName(category: PlanItem["category"]) {
  if (Array.isArray(category)) return category[0]?.name ?? "Sem categoria";
  return category?.name ?? "Sem categoria";
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
  const [categoryName, setCategoryName] = useState("");
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

  const groupedItems = useMemo(
    () =>
      sections.map((section) => ({
        ...section,
        items: items.filter((item) => item.section === section.key),
      })),
    [items],
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

      const data: ApiPayload & { error?: string } = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Não foi possível preparar o mensal.");

      setHousehold(data.household);
      setMemberOptions(data.member_options ?? []);
      setCategories(data.categories ?? []);
      setPlan(data.plan);
      setItems(data.items ?? []);
      setSummary(data.summary ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível preparar o mensal.");
    } finally {
      setSaving(false);
    }
  };

  const createCategory = async (e: FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) return;

    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: categoryName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Não foi possível criar a categoria.");
      setCategoryName("");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível criar a categoria.");
    } finally {
      setSaving(false);
    }
  };

  const createItem = async (section: SectionKey) => {
    if (!plan) {
      setError("Crie o mensal antes de adicionar itens.");
      return;
    }

    const draft = newItems[section];
    setSaving(true);
    setError(null);
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
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível criar o item.");
    } finally {
      setSaving(false);
    }
  };

  const saveItem = async (itemId: string) => {
    const draft = itemDrafts[itemId];
    setSaving(true);
    setError(null);
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
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível atualizar o item.");
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
      alert(`Exportação concluída. ${data.created ?? 0} itens fixos enviados para o próximo mês.`);
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
  };

  const updateNewItem = (section: SectionKey, patch: Partial<ItemDraft>) => {
    setNewItems((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        ...patch,
      },
    }));
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
              O mensal é a tela operacional do casal. Use o dashboard apenas para leitura rápida do período.
            </p>
            <button
              type="button"
              onClick={exportNextMonth}
              disabled={!plan || saving}
              className="secondary-button mt-4 w-full border-white/10 bg-white/5 text-white hover:bg-white/10 disabled:opacity-50"
            >
              <RefreshCw size={15} />
              Exportar fixos para o próximo mês
            </button>
          </div>
        </div>

        {summary && (
          <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-4">
            <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/30 p-4">
              <div className="soft-label text-slate-400">Planejado</div>
              <div className="mt-2 text-2xl font-semibold text-white">{formatCurrency(summary.total_planned)}</div>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/30 p-4">
              <div className="soft-label text-slate-400">Realizado</div>
              <div className="mt-2 text-2xl font-semibold text-white">{formatCurrency(summary.total_realized)}</div>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/30 p-4">
              <div className="soft-label text-slate-400">Fixos</div>
              <div className="mt-2 text-2xl font-semibold text-white">{summary.fixed_count}</div>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/30 p-4">
              <div className="soft-label text-slate-400">Uso do orçamento</div>
              <div className="mt-2 text-2xl font-semibold text-white">{summary.usage_pct.toFixed(0)}%</div>
            </div>
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[0.72fr_1.28fr]">
        <div className="glass-surface p-5 sm:p-6">
          <div className="soft-label text-slate-400">Categorias compartilhadas</div>
          <h2 className="mt-2 text-xl font-semibold text-white">Gerar novas categorias</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Crie categorias que poderão ser usadas nos itens mensais, nos lançamentos e na comparação.
          </p>
          <form onSubmit={createCategory} className="mt-5 space-y-3">
            <input
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="Ex: Escola, Plano de saúde, Academia"
            />
            <button className="primary-button w-full">
              <Tags size={16} />
              Criar categoria
            </button>
          </form>
          <div className="mt-5 flex flex-wrap gap-2">
            {categories.map((category) => (
              <span key={category.id} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
                {category.name}
              </span>
            ))}
          </div>
        </div>

        <div className="glass-surface p-5 sm:p-6">
          <div className="soft-label text-slate-400">Seções do mensal</div>
          <h2 className="mt-2 text-xl font-semibold text-white">Leitura rápida do planejamento</h2>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            {summary?.sections?.map((section) => (
              <div key={section.key} className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                <div className="font-medium text-white">{section.label}</div>
                <p className="mt-2 text-sm text-slate-400">
                  Planejado {formatCurrency(section.planned)} · Realizado {formatCurrency(section.realized)}
                </p>
                <p className="mt-1 text-xs text-slate-500">{section.item_count} itens nessa seção</p>
              </div>
            )) ?? (
              <p className="text-sm text-slate-400">Crie o mensal para visualizar os blocos operacionais do período.</p>
            )}
          </div>
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
              <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1.2fr_1fr_0.8fr_0.8fr_1fr_auto]">
                <input
                  placeholder="Título do item"
                  value={newItems[section.key].title}
                  onChange={(e) => updateNewItem(section.key, { title: e.target.value })}
                />
                <select
                  value={newItems[section.key].category_id}
                  onChange={(e) => updateNewItem(section.key, { category_id: e.target.value })}
                >
                  <option value="">Sem categoria</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Valor previsto"
                  value={newItems[section.key].expected_amount}
                  onChange={(e) => updateNewItem(section.key, { expected_amount: e.target.value })}
                />
                <input
                  type="date"
                  value={newItems[section.key].due_date}
                  onChange={(e) => updateNewItem(section.key, { due_date: e.target.value })}
                />
                <select
                  value={newItems[section.key].assigned_user_id}
                  onChange={(e) => updateNewItem(section.key, { assigned_user_id: e.target.value })}
                >
                  <option value="">Sem responsável</option>
                  {memberOptions.map((member) => (
                    <option key={member.user_id} value={member.user_id}>
                      {member.label}
                    </option>
                  ))}
                </select>
                <button type="button" className="primary-button" onClick={() => void createItem(section.key)} disabled={!plan || saving}>
                  <Plus size={16} />
                  Adicionar
                </button>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-sm text-slate-300">
                  <input
                    type="checkbox"
                    checked={newItems[section.key].is_fixed}
                    onChange={(e) => updateNewItem(section.key, { is_fixed: e.target.checked })}
                  />
                  Repetir nos próximos meses
                </label>
                <input
                  className="max-w-md"
                  placeholder="Observações rápidas"
                  value={newItems[section.key].notes}
                  onChange={(e) => updateNewItem(section.key, { notes: e.target.value })}
                />
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <AnimatePresence>
                {section.items.map((item) => {
                  const draft = itemDrafts[item.id] ?? createBlankItemDraft();
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-[1.6rem] border border-white/10 bg-white/5 p-4"
                    >
                      <div className="grid grid-cols-1 gap-3 2xl:grid-cols-[1.1fr_0.9fr_0.7fr_0.7fr_0.9fr_auto]">
                        <input value={draft.title} onChange={(e) => updateDraft(item.id, { title: e.target.value })} />
                        <select value={draft.category_id} onChange={(e) => updateDraft(item.id, { category_id: e.target.value })}>
                          <option value="">Sem categoria</option>
                          {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          step="0.01"
                          value={draft.expected_amount}
                          onChange={(e) => updateDraft(item.id, { expected_amount: e.target.value })}
                        />
                        <input type="date" value={draft.due_date} onChange={(e) => updateDraft(item.id, { due_date: e.target.value })} />
                        <select value={draft.assigned_user_id} onChange={(e) => updateDraft(item.id, { assigned_user_id: e.target.value })}>
                          <option value="">Sem responsável</option>
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

                      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-[auto_1fr_auto_auto] lg:items-center">
                        <label className="flex items-center gap-2 text-sm text-slate-300">
                          <input
                            type="checkbox"
                            checked={draft.is_fixed}
                            onChange={(e) => updateDraft(item.id, { is_fixed: e.target.checked })}
                          />
                          Fixo
                        </label>
                        <input value={draft.notes} onChange={(e) => updateDraft(item.id, { notes: e.target.value })} placeholder="Observações" />
                        <span className="rounded-full bg-slate-950/40 px-3 py-2 text-xs text-slate-300">
                          {getCategoryName(item.category)}
                        </span>
                        <button
                          type="button"
                          className="secondary-button border-rose-400/20 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20"
                          onClick={() => void removeItem(item.id)}
                        >
                          <Trash2 size={14} />
                          Remover
                        </button>
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                        <div className="rounded-2xl bg-slate-950/40 px-4 py-3 text-sm">
                          <div className="text-slate-400">Previsto</div>
                          <div className="mt-1 font-medium text-white">{formatCurrency(item.expected_amount)}</div>
                        </div>
                        <div className="rounded-2xl bg-slate-950/40 px-4 py-3 text-sm">
                          <div className="text-slate-400">Status</div>
                          <div className="mt-1 font-medium text-white">
                            {item.status === "paid" ? "Pago" : item.status === "partial" ? "Parcial" : "Pendente"}
                          </div>
                        </div>
                        <div className="rounded-2xl bg-slate-950/40 px-4 py-3 text-sm">
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
      </section>
    </motion.div>
  );
}
