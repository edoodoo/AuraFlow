# Opcao B — Card Compacto com Hierarquia

Especificacao final para implementacao no Cursor.
Referencia visual: `opcao-b-card-hierarquico.html` (abrir no navegador).

---

## Estrutura do Card

Cada item de secao expandida e um unico componente `<MonthlyItemCard>` com 4 zonas:

```
┌─ border-left 3px (cor = status) ──────────────────────────────────────┐
│                                                                        │
│  [ZONA 1 — HEADER]                                                     │
│  Nome (left, truncate)     StatusBadge (center)     Valor (right)      │
│                                                                        │
│  [ZONA 2 — META]                                                       │
│  Categoria · Responsavel · Venc. DD/MM · Fixo                          │
│                                                                        │
│  [ZONA 3 — ACTIONS] ← hover-reveal ou expanded                        │
│  [Editar] [Remover]                     "Notas preview..." (right)     │
│                                                                        │
│  [ZONA 4 — EDIT] ← visivel so quando expanded                         │
│  [titulo] [categoria] [valor] [data] [responsavel] [Salvar]           │
│  [x] Fixo   [observacoes__________________________]                    │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Regras Visuais

### Card Container

| Propriedade       | Valor Tailwind                                          |
|-------------------|---------------------------------------------------------|
| Background        | `bg-white/5`                                            |
| Background hover  | `bg-white/[0.08]`                                       |
| Background expanded | `bg-white/[0.06]`                                     |
| Border            | `border border-white/[0.12]`                            |
| Border left       | `border-l-[3px]` + cor condicional por status           |
| Border radius     | `rounded-[1.25rem]`                                     |
| Padding           | `px-[1.1rem] py-[0.85rem]`                             |
| Gap entre cards   | `gap-[0.55rem]` no container pai                        |
| Transition        | `transition-[background,border-color] duration-[160ms]` |

### Border Left por Status

| Status   | Classe Tailwind                |
|----------|--------------------------------|
| Pago     | `border-l-emerald-400`         |
| Parcial  | `border-l-amber-500`           |
| Pendente | `border-l-slate-700`           |

### Expanded State

| Propriedade       | Valor                                           |
|-------------------|-------------------------------------------------|
| Border color      | `border-cyan-400/25`                            |
| Background        | `bg-white/[0.06]`                               |
| Actions           | sempre visiveis (nao depende de hover)           |
| Edit zone         | renderizada condicionalmente                    |

---

## Hierarchy Rules

### Zona 1 — Header (sempre visivel)

Layout: `flex items-center gap-3`

| Elemento    | Estilo                                                            | Prioridade |
|-------------|-------------------------------------------------------------------|------------|
| Nome        | `text-[0.95rem] font-semibold text-white truncate flex-1 min-w-0` | Primaria   |
| Status      | Badge pill com dot + label (ver Status Treatment abaixo)           | Secundaria |
| Valor       | `text-lg font-bold tabular-nums text-cyan-300 text-right min-w-[8rem] shrink-0` | Primaria |

O **valor e o nome** sao os dois pontos de ancora visual. O olho percorre horizontal: nome → valor.
O status e reconhecido perifericamente pelo badge + borda left.

### Zona 2 — Meta (sempre visivel)

Layout: `flex items-center flex-wrap` com separadores `·`

| Elemento      | Estilo                                        |
|---------------|-----------------------------------------------|
| Container     | `mt-[0.3rem] text-xs text-slate-500 leading-[1.45]` |
| Separador     | `mx-[0.4rem] opacity-40`                     |
| Tag "Fixo"    | `text-slate-400 font-medium` com icone 12px   |
| Sem vencimento| Texto "Sem vencimento" no lugar de "Venc. DD/MM" |

Ordem fixa: `Categoria · Responsavel · Vencimento [· Fixo]`

### Zona 3 — Actions (hover-reveal)

Layout: `flex items-center gap-2`

| Propriedade     | Valor colapsado          | Valor visivel                |
|-----------------|--------------------------|------------------------------|
| opacity         | `0`                      | `1`                          |
| max-height      | `0`                      | `44px`                       |
| margin-top      | `0`                      | `0.6rem`                     |
| padding-top     | `0`                      | `0.55rem`                    |
| border-top      | `transparent`            | `border-white/[0.06]`       |
| overflow        | `hidden`                 | `hidden`                     |
| transition      | `all 200ms ease`         |                              |

Trigger: `hover` no card ou `data-expanded="true"`

Conteudo:
- Botao "Editar" (secondary, icon Pencil)
- Botao "Remover" (danger, icon Trash2)
- Notas preview (italic, right-aligned, truncate com ellipsis)

### Zona 4 — Edit (condicional)

Visivel apenas quando `expandedItemId === item.id`

| Layout          | Grid 6-col: `1.1fr 1.2fr 0.7fr 0.85fr 1.1fr auto` |
|-----------------|------------------------------------------------------|
| Fields          | Reutiliza `compactMonthlyFieldClass` existente       |
| Row 2           | Grid 3-col: `[checkbox fixo] [observacoes] [vazio]`  |
| Botao Salvar    | `primary-button` gradient, icone Check               |
| Border-top      | `border-t border-white/[0.06] mt-[0.7rem] pt-[0.7rem]` |

---

## Status Treatment

### StatusBadge Component

```
<span class="status-badge" data-status={status}>
  <span class="status-dot" />
  {label}
</span>
```

| Status   | Background                | Text Color    | Dot Color     | Label                    |
|----------|---------------------------|---------------|---------------|--------------------------|
| Pago     | `bg-emerald-400/[0.12]`  | `text-emerald-400` | `bg-emerald-400` | "Pago"              |
| Parcial  | `bg-amber-400/[0.12]`    | `text-amber-400`   | `bg-amber-400`   | "Parcial · R$ {X}" |
| Pendente | `bg-slate-600/20`        | `text-slate-500`   | `bg-slate-500`   | "Pendente"          |

Badge: `inline-flex items-center gap-[0.3rem] px-[0.6rem] py-[0.18rem] rounded-full text-[0.7rem] font-medium shrink-0`

Dot: `w-[7px] h-[7px] rounded-full shrink-0`

---

## Spacing

```
Container (.cards-container):
  padding: 12px 20px
  gap: 8.8px (0.55rem)

Card interno:
  padding: 13.6px 17.6px (0.85rem 1.1rem)

Zona 1 → Zona 2: margin-top 4.8px (0.3rem)
Zona 2 → Zona 3: margin-top 0 → 9.6px (0.6rem) on hover
Zona 3 → border-top: padding-top 8.8px (0.55rem)
Zona 3 → Zona 4: margin-top 11.2px (0.7rem)
```

---

## Comportamento Expand/Collapse

1. Estado default: Zona 1 + Zona 2 visiveis. Zona 3 oculta (opacity 0, max-height 0). Zona 4 nao renderizada.
2. Hover: Zona 3 aparece com transicao de 200ms (opacity + max-height + margin).
3. Click "Editar": `expandedItemId` = item.id. Card recebe `data-expanded="true"`. Zona 4 renderiza. Border muda para `cyan-400/25`. Zona 3 fica permanentemente visivel.
4. Click "Salvar" ou fora: `expandedItemId` = null. Volta ao estado default.
5. Framer Motion: `AnimatePresence` no Zona 4 com `initial={{ opacity: 0, height: 0 }}` e `animate={{ opacity: 1, height: "auto" }}`.

---

## Decisoes Preservar na Implementacao

### 5 Regras Nao-Negociaveis

1. **Valor em cyan a direita e a ancora visual principal.** `text-lg font-bold tabular-nums text-cyan-300 text-right min-w-[8rem]`. Nao pode ser menor, nao pode perder cor, nao pode perder alinhamento tabular.

2. **Border-left 3px codifica status.** Emerald/amber/slate. E o canal de scanning primario — o usuario percebe o estado de todos os itens antes de ler qualquer texto. Nao substituir por badge sozinho.

3. **Meta em linha unica com separadores.** `Categoria · Responsavel · Vencimento · Fixo`. Nao quebrar em 2 linhas. Nao usar badges individuais. Nao duplicar informacao que ja esta no edit form.

4. **Actions sao hover-reveal, nao always-visible.** Reduz noise em 60%. Excecao: quando card esta expanded, actions ficam permanentes. Em touch devices, considerar toggle via click.

5. **Eliminar Row 3 (summary cards).** Os 3 cards "Previsto / Status / Quem pagou" do layout atual sao redundantes. Previsto = valor no header. Status = badge + border-left. Quem pagou = notas inline na action bar. Nao reintroduzir sob nenhuma forma.

---

## Componentes React Sugeridos

```
<MonthlyItemCard>
  props: item, draft, onSave, onRemove, onDraftChange, isExpanded, onToggleExpand

  <CardHeader>        → flex: nome + StatusBadge + valor
  <CardMeta>          → meta string com separadores
  <CardActions>       → hover-reveal: editar + remover + notes preview
  <CardEditZone>      → condicional: grid de inputs + save
</MonthlyItemCard>

<StatusBadge>
  props: status ("paid" | "partial" | "pending"), partialAmount?: number

<MonthlyItemsList>
  Container que renderiza space-y com AnimatePresence
```

---

## Mapping de Campos por Secao

O mesmo `<MonthlyItemCard>` serve para todas as 4 secoes:

| Secao              | Nome    | Valor           | Categoria | Status             |
|--------------------|---------|-----------------|-----------|---------------------|
| Gastos mensais     | title   | expected_amount | category  | paid/partial/pending |
| Investimentos      | title   | expected_amount | category  | aportado/pendente    |
| Reserva            | title   | expected_amount | category  | depositado/pendente  |
| Dividas            | title   | expected_amount | category  | pago/parcial/pendente|

O componente recebe um `statusConfig` por secao que define labels e cores.

---

## Reducao de Altura

| Metrica           | Layout Atual | Opcao B (colapsado) | Opcao B (expanded) |
|--------------------|--------------|---------------------|---------------------|
| Altura por item    | ~180-200px   | ~68px               | ~160px              |
| 8 itens no viewport| 1600px scroll| 544px (sem scroll!) | ~700px (1 expanded) |
| Info density       | Baixa        | Alta                | Media               |

---

## Checklist Pre-Implementacao

- [ ] Criar componente `<MonthlyItemCard>` extraido do page.tsx
- [ ] Criar componente `<StatusBadge>` reutilizavel
- [ ] Adicionar `expandedItemId` state no page
- [ ] Remover Row 3 (summary cards) do item loop
- [ ] Remover badge de categoria duplicado da Row 2
- [ ] Mover checkbox Fixo + notas para dentro da edit zone
- [ ] Adicionar `border-l-[3px]` condicional por status
- [ ] Configurar Framer Motion AnimatePresence na edit zone
- [ ] Garantir `tabular-nums` no valor (font-variant-numeric)
- [ ] Testar hover actions em tela 1024px-1536px (breakpoint critico)
- [ ] Verificar contraste WCAG 4.5:1 em todos os textos sobre dark bg
