export const PLAN_SECTIONS = ["general", "investments", "emergency_reserve", "debts"] as const;
export type PlanSection = (typeof PLAN_SECTIONS)[number];

export const SECTION_LABELS: Record<PlanSection, string> = {
  general: "Gastos mensais",
  investments: "Investimentos",
  emergency_reserve: "Reserva de Emergência",
  debts: "Dívidas",
};

export type ComparisonSectionKey = PlanSection | "avulso";

export const COMPARISON_SECTION_ORDER: ComparisonSectionKey[] = [
  "general",
  "investments",
  "emergency_reserve",
  "debts",
  "avulso",
];

export const COMPARISON_SECTION_LABELS: Record<ComparisonSectionKey, string> = {
  ...SECTION_LABELS,
  avulso: "Gastos avulsos",
};

export const COMPARISON_SECTION_HELPERS: Record<ComparisonSectionKey, string> = {
  general: "Compare o previsto e o realizado das despesas recorrentes do mês.",
  investments: "Acompanhe os aportes planejados e o que já foi efetivamente lançado.",
  emergency_reserve: "Veja o quanto da reserva foi planejado e o quanto saiu do papel.",
  debts: "Monitore parcelas, renegociações e pagamentos ligados a passivos do período.",
  avulso: "Valores fora do mensal aparecem separados para não distorcer a leitura do planejamento.",
};
