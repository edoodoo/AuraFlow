# Contexto Operacional - AuraFlow

## 1) Objetivo atual
- Manter continuidade do projeto sem perder decisões entre conversas.
- Fechar a validação funcional do app após as últimas mudanças em `Mensal`, `Lançamentos`, `Dashboard` e `Comparação`.
- Usar este arquivo como fonte principal de retomada.

## 2) O que já foi feito
- Estrutura principal consolidada:
  - telas `Dashboard`, `Mensal`, `Categorias`, `Lançamentos`, `Comparação`
  - vínculo de cônjuge por e-mail com validação de usuário existente
  - categorias separadas em `Custo fixo` e `Variável`
  - lançamentos `avulso` e `vinculado ao mensal`
  - exportação de itens fixos para o próximo mês
- Correções já implementadas:
  - validação inline no `Mensal` para `título`, `categoria`, `valor`, `data` e `responsável`
  - itens `PAGO` continuam visíveis em `Lançamentos`, mas ficam desabilitados
  - backend bloqueia pagamento vinculado acima do saldo restante
  - `Comparação` não marca mais excesso falso causado por `avulso`
  - `Gastos avulsos` agora aparecem separados no `Mensal` e no `Dashboard`
  - `Renda total do casal no mês` implementada no topo do `Mensal`
  - `Dashboard` ganhou `Entradas do mês` e `Saldo livre`
- Infra/validação recente:
  - SQL novo já aplicado no Supabase, incluindo `monthly_household_incomes`
  - revalidação da etapa de renda mensal passou
  - fluxo corrigido de `avulso` e pagamento excedente já está testável no ambiente atual
- Commits relevantes já enviados:
  - `455a479` `fix: block extra payments on settled monthly items`
  - `10fd850` `fix: separate avulso spending from planned monthly execution`
  - `ceed9f4` `feat: add monthly household income tracking`

## 3) Decisões tomadas
- `Mensal` é a tela operacional principal; `Dashboard` é leitura rápida.
- Categorias padrão não podem ser removidas; personalizadas mostram lixeira.
- Vínculo de cônjuge continua simples: valida existência do e-mail, sem fluxo de aceite/rejeite nesta fase.
- Gastos `avulso`:
  - continuam visíveis
  - não contaminam o `previsto vs realizado` do mensal
  - aparecem em bloco próprio no `Mensal`
  - aparecem em card próprio no `Dashboard`
- Pagamentos vinculados:
  - não podem exceder o saldo restante do item mensal
  - itens quitados aparecem como `PAGO` e desabilitados no dropdown
  - excedente deve ser lançado como `Gasto avulso`
- Renda mensal:
  - é do casal inteiro
  - é por `mês/ano`
  - inclui salários + extras
  - pode ser atualizada durante o mês
  - alimenta `Planejado`, `Realizado`, `Avulsos`, `Saldo disponível`, `Entradas do mês` e `Saldo livre`

## 4) Pendências
- [ ] Executar o restante do checklist funcional end-to-end
- [ ] Consolidar o que já passou no checklist manual:
  - `9.3 Mensal`
  - `9.4 Dashboard`
  - `9.5 Lançamentos`
  - `9.7 Comparação`
  - leitura de `Renda mensal do casal`
- [ ] Refinar responsividade e UX fina com base nos testes reais
- [ ] Definir backlog da próxima fase (`aceite/rejeição` de vínculo do cônjuge)

## 5) Próximo passo único
- Continuar do ponto atual do checklist funcional e registrar no contexto apenas os itens restantes que ainda não foram validados manualmente.

## 6) Riscos/observações
- Após deploy ou mudança de schema, podem existir oscilações transitórias; se algo falhar, retestar após alguns minutos.
- O checklist funcional ainda não foi encerrado; o estado atual é `implementado, SQL aplicado e validação parcial aprovada`.
- Se abrir um novo chat:
  - ler este `context.md` antes de agir
  - resumir entendimento em 5 bullets
  - continuar a partir do `Próximo passo único`