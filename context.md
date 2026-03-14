# Contexto Operacional - AuraFlow

## 1) Objetivo atual
- Manter continuidade do projeto sem perder decisões quando o chat ficar longo.
- Usar este arquivo como fonte única de retomada entre conversas.
- Validar funcionalmente o app end-to-end após as últimas mudanças de fluxo.

## 2) Estado atual do produto
- App focado em planejamento mensal compartilhado do casal.
- Tela dedicada de categorias implementada.
- Categorias divididas em `Custo fixo` e `Variável`.
- Lançamentos com opção:
  - avulso
  - vinculado ao item do mensal
- Comparação e dashboard adaptados para o cenário do casal.
- Fluxo de vínculo de cônjuge com validação de e-mail existente na base.

## 3) O que já foi implementado
- Tela `Mensal` com:
  - vínculo opcional do cônjuge por e-mail
  - seções:
    - Gastos mensais
    - Investimentos
    - Reserva de Emergência
    - Dívidas
  - exportação de itens fixos para o próximo mês
- Tela `Categorias` exclusiva:
  - agrupamento por `Custo fixo` e `Variável`
  - categorias padrão pré-carregadas
  - criação de categorias personalizadas
  - exclusão para categorias personalizadas
- Dashboard simplificado para leitura rápida do período.
- Comparação com visão de previsto vs realizado e divisão por pagador.
- Ajustes de robustez:
  - erro de parse no vínculo do cônjuge corrigido
  - tratamento de erro com mensagem clara de e-mail inexistente
  - hardening no client server-side do Supabase para evitar crash de cookie em render.

## 4) Decisões importantes
- Dashboard é tela de acompanhamento (não de operação/cadastro).
- Operação principal fica na tela `Mensal`.
- `Categorias` virou tela separada.
- Categorias padrão não devem ser removidas na interface.
- Categorias personalizadas devem mostrar lixeira para exclusão.
- Vínculo de cônjuge, por enquanto:
  - apenas valida se o e-mail existe na base
  - aceite/rejeite do vínculo fica para versão futura.
- Este arquivo (`context.md`) é a fonte oficial de retomada entre chats.

## 5) Pendências abertas
- [ ] Executar checklist funcional completo em produção.
- [ ] Revisar UX final de mensagens de sucesso/erro em fluxo mensal.
- [ ] Refinar pontos de responsividade conforme testes reais.
- [ ] Definir backlog da próxima fase (aceite de vínculo do cônjuge).

## 6) Próximo passo único
- Executar o test plan completo abaixo e registrar cada resultado com `ok` ou `bug`.

## 7) Bugs/riscos conhecidos
- Após deploy, podem ocorrer oscilações transitórias em rotas (retestar após alguns minutos).
- Mudanças de schema exigem SQL atualizado no Supabase antes da validação funcional.
- Vínculo de cônjuge depende de e-mail existente na base.

## 8) Como retomar em novo chat
- Solicitar leitura deste `context.md` antes de qualquer ação.
- Confirmar entendimento em 5 bullets.
- Continuar a partir do “Próximo passo único”.
- Não recomeçar análise do zero se este contexto já estiver atualizado.

## 9) Test plan pendente (execução na próxima conversa)

### 9.1 Login e navegação
- [ ] Entrar com usuário principal.
- [ ] Confirmar menu com:
  - Dashboard
  - Mensal
  - Categorias
  - Lançamentos
  - Comparação

### 9.2 Categorias
- [ ] Abrir `Categorias`.
- [ ] Confirmar grupos:
  - Custo fixo
  - Variável
- [ ] Confirmar categorias padrão carregadas.
- [ ] Criar 2 categorias novas (1 fixa, 1 variável).
- [ ] Validar ícone de lixeira nas categorias personalizadas.
- [ ] Excluir 1 categoria de teste.
- [ ] Confirmar que categoria padrão não tem exclusão.

### 9.3 Mensal
- [ ] Abrir `Mensal`.
- [ ] Escolher mês/ano.
- [ ] Testar vínculo com e-mail inexistente:
  - Deve mostrar mensagem clara de e-mail não cadastrado.
- [ ] Testar vínculo com e-mail existente:
  - Deve salvar com sucesso.
- [ ] Confirmar membros esperados na área de vínculo.
- [ ] Criar itens em:
  - Gastos mensais
  - Investimentos
  - Reserva de Emergência
  - Dívidas
- [ ] Marcar ao menos 1 item como fixo.
- [ ] Testar `Exportar fixos para o próximo mês`.

### 9.4 Dashboard
- [ ] Abrir `Dashboard`.
- [ ] Confirmar presença:
  - Orçado no mês
  - Orçamentos fixos
  - Ritmo do mês
  - Top categorias do mês
- [ ] Confirmar ausência:
  - Categorias ativas
  - Expanda seu mapa financeiro
  - Categorias e metas

### 9.5 Lançamentos
- [ ] Criar 1 lançamento avulso.
- [ ] Criar 1 lançamento vinculado ao mensal.
- [ ] No vinculado:
  - selecionar item do mensal
  - validar categoria/descrição
  - anexar recibo (câmera/galeria)

### 9.6 Reflexo no Mensal
- [ ] Confirmar atualização de item vinculado:
  - status
  - quem pagou
  - data
- [ ] Se houver pagamentos parciais, validar transição:
  - pending -> partial -> paid

### 9.7 Comparação
- [ ] Validar:
  - previsto vs realizado
  - quem lançou/pagou
  - categorias acima do previsto
  - pendências
  - divisão por cônjuge

### 9.8 Segundo cônjuge
- [ ] Entrar com usuário vinculado.
- [ ] Confirmar mesma visão de Mensal e Dashboard.
- [ ] Realizar 1 lançamento vinculado.
- [ ] Verificar reflexo na Comparação.

### 9.9 PWA / Mobile
- [ ] Validar no iPhone:
  - adicionar à tela inicial
  - abrir app instalado
  - fluxo de câmera/galeria no recibo
  - navegação inferior e área segura (safe area)

## 10) Registro de execução do test plan (preencher na próxima conversa)

### 10.1 Inspeção de código (2026-03-14) — realizada por agente
- Dev server: rodando em `localhost:3000`, respondendo HTTP 200. ✅
- Navegação (app-shell): 5 links confirmados (Dashboard, Mensal, Categorias, Lançamentos, Comparação) + botão Sair. ✅
- Tela `Categorias`: agrupamento fixed/variable, lixeira só em `user_id != null`, categorias padrão sem lixeira. ✅
- Tela `Mensal`: vínculo de cônjuge com validação de e-mail na base, 4 seções, exportar fixos, summary cards. ✅
- Tela `Dashboard`: métricas Orçado/Fixos/Ritmo, Top categorias, Pendências, Divisão real. Sem `Categorias ativas` ou `Expanda seu mapa`. ✅
- Tela `Lançamentos`: avulso / vinculado ao mensal, upload de recibo com `capture="environment"`. ✅
- Tela `Comparação`: previsto vs realizado, payer_breakdown, itens pendentes por categoria. ✅
- `refreshMonthlyPlanItemStatus`: atualiza status pending→partial→paid automaticamente após lançamento. ✅

### 10.2 Bugs/pontos de atenção encontrados na inspeção
- **Minor — Lançamentos:** `/api/monthly-plan` é carregado sem `month/year`, então os itens do mensal disponíveis no dropdown são sempre do mês atual. Se o usuário quiser lançar em mês retroativo, não verá os itens. Não é bloqueador, mas pode causar confusão.
- **Minor — Comparação:** função `load()` não tem `try/catch` — se a API falhar, a tela fica em branco sem mensagem de erro. Não é bloqueador.

### 10.3 Testes manuais (pendentes — a preencher pelo usuário)
- 9.1 Login e navegação: [ ]
- 9.2 Categorias: [ ]
- 9.3 Mensal: [ ]
- 9.4 Dashboard: [ ]
- 9.5 Lançamentos: [ ]
- 9.6 Reflexo no Mensal: [ ]
- 9.7 Comparação: [ ]
- 9.8 Segundo cônjuge: [ ]
- 9.9 PWA / Mobile (iPhone): [ ]

### 10.4 Retorno manual registrado em 2026-03-14
- `9.3 Mensal` revelou bug real de UX/validação ao criar itens.
- Sintoma encontrado: era possível cadastrar conta apenas com título, sem valor, categoria, data ou responsável.
- Sintoma encontrado: a mensagem de erro ficava apenas no topo da página, obrigando o usuário a procurar o problema nas seções mais abaixo (`Investimentos`, `Dívidas`, etc.).
- Correção aplicada:
  - validação inline no front para `título`, `categoria`, `valor`, `data` e `responsável`
  - destaque visual com borda vermelha nos campos inválidos
  - mensagem local dentro da própria seção/item com erro
  - foco e scroll automático para o primeiro campo inválido
  - validação reforçada também no backend (`lib/validators.ts`)
- Status desse ponto:
  - [x] bug identificado
  - [x] correção implementada
  - [ ] revalidação manual pendente

### 10.5 Retorno manual registrado em 2026-03-14
- `9.7 Comparação` revelou um bug/regra de negocio inconsistente no fluxo de lancamentos vinculados.
- Sintoma encontrado: o sistema marcava a conta como `paga`, mas ainda permitia novo pagamento vinculado para o mesmo item mensal.
- Efeito observado: a `Comparação` passava a mostrar a categoria como excedida por causa do pagamento extra sobre uma conta ja quitada.
- Decisao adotada:
  - bloquear no backend qualquer novo pagamento vinculado que exceda o saldo restante
  - manter itens `PAGO` visiveis no dropdown de vinculo, porem desabilitados
  - orientar claramente o usuario a usar `Gasto avulso` quando quiser registrar um valor extra
- Correção aplicada:
  - bloqueio no `POST /api/transactions`
  - bloqueio no `PUT /api/transactions/[id]`
  - dropdown da tela `Lançamentos` com opcao `PAGO` desabilitada
  - mensagem visual explicando o que fazer quando a conta ja estiver quitada
- Status desse ponto:
  - [x] bug identificado
  - [x] correção implementada
  - [ ] revalidação manual pendente

### 10.6 Retorno manual registrado em 2026-03-14
- Novo ajuste de produto definido para `avulso`:
  - lancamentos `avulso` devem continuar visiveis
  - mas nao devem contaminar o `previsto vs realizado` do que foi planejado no `Mensal`
- Decisao adotada:
  - `Comparação`: manter avulso na mesma categoria, mas separado visualmente e sem marcar excesso por causa dele
  - `Mensal`: adicionar bloco somente leitura `Gastos avulsos` abaixo de `Dívidas`
  - `Dashboard`: adicionar card superior com o total de `Gastos avulsos`
- Correção aplicada:
  - agregacoes separadas no backend entre `linked_plan_item` e `avulso`
  - `Ritmo do mês` passa a refletir apenas execucao do mensal
  - `Gastos avulsos` passam a aparecer como resumo proprio no `Dashboard`
  - `Mensal` passa a mostrar lista/resumo dos avulsos do periodo
  - `Comparação` passa a mostrar `avulso` separado, sem falso positivo de categoria excedida
- Status desse ponto:
  - [x] bug identificado
  - [x] correção implementada
  - [ ] revalidação manual pendente

### 10.7 Evolução registrada em 2026-03-14
- Nova melhoria de produto definida:
  - adicionar `Renda total do casal no mês` como dado obrigatório por periodo
  - considerar salarios + extras do casal
  - permitir edição ao longo do mes caso entrem novos valores
- UX adotada:
  - bloco editável no topo do `Mensal`
  - cards do `Mensal`: `Planejado`, `Realizado`, `Avulsos`, `Saldo disponível`
  - `Dashboard` com card `Entradas do mês` e card `Saldo livre`
- Regra de cálculo implementada:
  - `Planejado` = soma dos itens do mensal
  - `Realizado` = soma dos pagamentos vinculados ao mensal
  - `Avulsos` = soma dos lancamentos avulsos
  - `Saldo disponível` = renda mensal - realizado - avulsos
  - `Saldo previsto` = renda mensal - planejado
- Status desse ponto:
  - [x] modelagem definida
  - [x] correção implementada
  - [ ] revalidação manual pendente

- Resultado final:
  - [ ] aprovado sem bloqueios
  - [ ] aprovado com ajustes
  - [ ] bloqueado (listar bugs críticos)

## 11) Próximos passos após testes manuais
1. Revalidar `9.3 Mensal` após a correção de validação inline e feedback local.
2. Revalidar `9.7 Comparação` e o fluxo de `Lançamentos` apos o bloqueio de pagamento excedente.
3. Revalidar `Dashboard`, `Mensal` e `Comparação` apos a separacao de `Gastos avulsos`.
4. Revalidar a nova leitura de `Renda mensal do casal` no `Mensal` e no `Dashboard`.
5. Continuar o test plan a partir de `9.4 Dashboard`.
6. Iniciar backlog da fase 2: aceite/rejeição formal do vínculo de cônjuge.
7. Refinar responsividade conforme feedback do teste no iPhone.

## 12) Última atualização
- Data: 2026-03-14
- Status: inspeção de código concluída, bugs reais corrigidos e nova camada de leitura de renda mensal implementada; revalidação manual pendente