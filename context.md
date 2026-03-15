# Contexto Operacional - AuraFlow

## 1) Objetivo atual
- Manter continuidade do projeto sem perder decisões entre conversas.
- Encerrar a validação funcional pendente e preparar o AuraFlow para liberação externa controlada.
- Usar este arquivo como fonte principal de retomada.

## 2) O que já foi feito
- Base principal consolidada:
  - telas `Dashboard`, `Mensal`, `Categorias`, `Lançamentos`, `Comparação`
  - categorias separadas em `Custo fixo` e `Variável`
  - lançamentos `avulso` e `vinculado ao mensal`
  - exportação de custos fixos para o próximo mês
  - renda mensal do casal por `mês/ano`
- Regras e correções já implementadas:
  - validação inline no `Mensal` para `título`, `categoria`, `valor`, `data` e `responsável`
  - itens `PAGO` continuam visíveis em `Lançamentos`, mas ficam desabilitados
  - backend bloqueia pagamento vinculado acima do saldo restante
  - `Comparação` não marca excesso falso causado por `avulso`
  - `Gastos avulsos` aparecem separados no `Mensal` e no `Dashboard`
  - `Dashboard` mostra `Entradas do mês` e `Saldo livre`
- Melhorias UX recentes concluídas e validadas:
  - `Lançamentos` agora permite `editar` e `excluir`
  - edição de lançamento ficou `inline/local`
  - `Mensal` agora mostra feedback visual ao salvar item
  - exportação para o próximo mês usa mensagem HTML inline, sem `alert()`
- Infra:
  - SQL novo já aplicado no Supabase, incluindo `monthly_household_incomes`
  - fluxo corrigido de `avulso`, pagamento excedente e renda mensal já está funcional
- Commits relevantes:
  - `455a479` `fix: block extra payments on settled monthly items`
  - `10fd850` `fix: separate avulso spending from planned monthly execution`
  - `ceed9f4` `feat: add monthly household income tracking`
  - `d21c636` `feat: add inline transaction actions and monthly feedback`

## 3) Decisões tomadas
- `Mensal` é a tela operacional principal; `Dashboard` é leitura rápida.
- Categorias padrão não podem ser removidas; personalizadas mostram lixeira.
- Gastos `avulso` continuam visíveis, não contaminam o `previsto vs realizado` e aparecem em blocos próprios.
- Pagamentos vinculados não podem exceder o saldo restante; excedente deve virar `Gasto avulso`.
- Renda mensal é do casal inteiro, pode ser atualizada durante o mês e alimenta os indicadores principais.
- Para liberação externa:
  - primeiro rollout será `beta fechado`
  - foco inicial em `Canadá + Brasil`
  - cobrança não entra agora, mas o produto deve ficar preparado para ativar cobrança logo após a validação
  - domínio próprio é desejado, mas pode ser decidido perto do fim da validação
- Para o PWA/mobile, a direção preferida é reduzir dependência da barra inferior fixa e avaliar navegação com `hamburguer/drawer`.

## 4) Pendências
- [ ] Encerrar o checklist funcional manual pendente e consolidar o que já passou
- [ ] Refinar responsividade e UX fina com base nos testes reais
- [ ] Planejar e executar a trilha de liberação externa:
  - segurança de dados dos usuários
  - segurança do site contra ataques
  - confirmação de cadastro por e-mail
  - aceite/rejeição de vínculo do cônjuge
  - correção do layout do PWA/mobile
  - preparação de cobrança
- [ ] Definir desenho final da navegação mobile para evitar sobreposição no PWA
- [ ] Preparar documentos e operação mínima para beta fechado:
  - política de privacidade / termos
  - suporte básico
  - observabilidade / logs / rollback

## 5) Próximo passo único
- Executar a revisão de segurança e readiness para `beta fechado`, cobrindo dados dos usuários, superfícies de ataque, onboarding e navegação mobile/PWA.

## 6) Riscos/observações
- Estado atual: `produto funcional com validação parcial aprovada`, mas ainda não pronto para liberação pública.
- O vínculo de cônjuge atual ainda é simples; a próxima fase deve trocar isso por fluxo com confirmação explícita.
- O cadastro atual ainda precisa evoluir para confirmação por e-mail antes do rollout externo.
- A barra inferior fixa no PWA/mobile pode comprometer usabilidade real; isso deve ser tratado antes do beta.
- Se algo falhar após deploy ou mudança de schema, retestar após alguns minutos por causa de possíveis oscilações transitórias.
- Palavra de comando para seguir exatamente o plano de liberação já definido: `Executar plano Beta`.
- Se abrir um novo chat:
  - esperar o seguinte comando de retomada:
    `Antes de qualquer ação, leia context.md e use como fonte principal de continuidade.`
  - depois responder obrigatoriamente:
    `1) me confirme em 5 bullets o que entendeu`
    `2) diga qual é o próximo passo`
    `3) confirme comando de execucao`
  - se a retomada for para seguir a trilha de liberação, confirmar explicitamente o comando `Executar plano Beta` antes de executar qualquer etapa
  - somente depois seguir exatamente o plano de liberação já aprovado