# Contexto Operacional - AuraFlow

## 1) Objetivo atual
- Manter continuidade do projeto sem perder decisões entre conversas.
- Encerrar a validação funcional pendente e preparar o AuraFlow para liberação externa controlada.
- Usar este arquivo como fonte principal de retomada e execução.

## 2) O que já foi feito
- Base principal consolidada:
  - telas `Dashboard`, `Mensal`, `Categorias`, `Lançamentos`, `Comparação`
  - categorias separadas em `Custo fixo` e `Variável`
  - lançamentos `avulso` e `vinculado ao mensal`
  - exportação de custos fixos para o próximo mês
  - renda mensal do casal por `mês/ano`
- Regras e correções implementadas:
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
- Infra e estado técnico atual:
  - SQL novo já aplicado no Supabase, incluindo `monthly_household_incomes`
  - fluxo de `avulso`, pagamento excedente e renda mensal está funcional
  - áreas autenticadas são protegidas no layout e APIs principais exigem usuário autenticado
  - vínculo de cônjuge hoje ainda é automático por `partner_email`, sem aceite explícito
  - cadastro atual cria conta via `signUp`, sem etapa clara de confirmação de e-mail no frontend
  - navegação mobile/PWA usa barra inferior fixa com muitas opções
  - existe validação com `zod`, mas ainda não há registro de rate limiting, captcha e headers de segurança
- Commits relevantes:
  - `455a479` `fix: block extra payments on settled monthly items`
  - `10fd850` `fix: separate avulso spending from planned monthly execution`
  - `ceed9f4` `feat: add monthly household income tracking`
  - `d21c636` `feat: add inline transaction actions and monthly feedback`
  - `f43b997` `checkpoint: atualizar contexto da sessao`

## 3) Decisões tomadas
- `Mensal` é a tela operacional principal; `Dashboard` é leitura rápida.
- Categorias padrão não podem ser removidas; personalizadas mostram lixeira.
- Gastos `avulso` continuam visíveis, não contaminam o `previsto vs realizado` e aparecem em blocos próprios.
- Pagamentos vinculados não podem exceder o saldo restante; excedente deve virar `Gasto avulso`.
- Renda mensal é do casal inteiro, pode ser atualizada durante o mês e alimenta os indicadores principais.
- Plano de liberação aprovado:
  - primeiro rollout será `beta fechado`
  - foco inicial em `Canadá + Brasil`
  - cobrança não entra agora, mas o produto deve ficar pronto para cobrar assim que a validação terminar
  - domínio próprio é desejado, mas a decisão final pode ficar para perto do fim da validação; no beta, a URL da Vercel ainda é aceitável
- Vínculo do cônjuge no futuro:
  - sair do modelo automático atual
  - roadmap desejado: solução híbrida
  - prioridade prática do beta: `e-mail + status pendente`
- PWA/mobile:
  - `Opção A`: manter bottom nav reduzido + `Mais`
  - `Opção B`: bottom nav minimalista + `hamburguer/drawer`
  - `Opção C`: header com hamburguer e sem bottom nav
  - recomendação aprovada para o beta: `Opção B`
- Cobrança:
  - começar simples
  - uma moeda principal no início
  - um único provedor recorrente
  - multi-moeda e métodos locais depois, se o beta provar demanda
  - preço `5 a 10` por mês deve ser tratado como preço beta / early adopter, não preço final

## 4) Pendências
- [ ] Encerrar o checklist funcional manual pendente e consolidar o que já passou.
- [ ] Refinar responsividade e UX fina com base nos testes reais.
- [ ] Fase 1 - readiness para beta fechado:
  - revisar autenticação e sessão
  - revisar autorização por household
  - revisar isolamento entre usuários/casal
  - revisar storage de recibos
  - revisar variáveis sensíveis e uso de service role
  - revisar abuso de login/cadastro/reset, brute force, automação, upload malicioso, enumeração e vazamento entre households
  - fechar checklist operacional: backup/rollback, logging, monitoramento crítico, suporte beta e processo para desativar acesso/limpar dados em incidente
  - definir `beta gate`: convite/lista manual ou feature flag, limite inicial de usuários e comunicação de beta fechado
- [ ] Fase 2 - segurança de dados:
  - auditar rotas que usam contexto de household
  - revisar `monthly-plan`, `transactions`, `categories` e `comparison`
  - definir política de recibos: bucket privado ou URL segura, remoção de órfãos, tipo/tamanho, retenção
  - revisar exposição do `SUPABASE_SERVICE_ROLE_KEY`
  - confirmar RLS no Supabase alinhado com a lógica do backend
- [ ] Fase 3 - segurança do site contra ataques:
  - avaliar captcha/Turnstile em cadastro, login repetido, reset e convite/aceite de cônjuge
  - adicionar rate limiting em APIs críticas
  - definir headers mínimos: `CSP`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`
  - planejar teste básico de segurança: IDOR, brute force, enumeração, upload indevido, regressão de auth/sessão
- [ ] Fase 4 - confirmação de cadastro por e-mail:
  - estado claro de `confirme seu e-mail`
  - informar envio, evitar sensação de acesso concluído e permitir reenvio
  - ajustar login para conta não confirmada
- [ ] Fase 5 - confirmação de vínculo do cônjuge:
  - criar fluxo de `convite pendente`
  - estados: sem convite, enviado, aceito, recusado, expirado/cancelado
  - opções: e-mail, mensagem no app ou híbrido
  - beta deve começar com `e-mail + status pendente`
- [ ] Fase 6 - bug do layout PWA/mobile:
  - corrigir sobreposição atual da barra inferior fixa
  - aplicar navegação recomendada `Opção B`
- [ ] Fase 7 - preparação para cobrança:
  - definir planos, trial ou não, status de assinatura, bloqueio gracioso e telas de pricing/gestão
  - preparar cobrança simples para ativação rápida após o beta
  - medir uso semanal, retorno no mês seguinte, valor percebido e sensibilidade a preço em Canadá e Brasil
- [ ] Itens adicionais obrigatórios para liberar:
  - política de privacidade e termos
  - política de exclusão de conta e dados
  - tela/configuração de conta do usuário
  - observabilidade mínima: erros de frontend, erros de API, auditoria de ações sensíveis
  - suporte: canal de contato, FAQ mínima e fluxo para problemas de vínculo/recuperação
  - separar operação de `beta` e `produção`: envs, chaves, bucket/storage e domínio final

## 5) Próximo passo único
- Executar a revisão de segurança e readiness para `beta fechado`, cobrindo dados dos usuários, superfícies de ataque, onboarding, vínculo do cônjuge e navegação mobile/PWA.

## 6) Riscos/observações
- Estado atual: `produto funcional com validação parcial aprovada`, mas ainda não pronto para liberação pública.
- O maior risco de produto hoje é liberar externamente antes de corrigir: confirmação de e-mail, aceite explícito de cônjuge, segurança operacional e navegação PWA/mobile.
- A ordem recomendada do plano é:
  1. fechar checklist funcional pendente e corrigir responsividade/PWA
  2. revisar segurança de dados e segurança contra ataques
  3. implementar confirmação de e-mail
  4. implementar convite/aceite de cônjuge com estado pendente
  5. preparar domínio, páginas institucionais mínimas e observabilidade
  6. rodar beta fechado em Canadá + Brasil com poucos usuários
  7. só então ativar cobrança
- Resultado esperado do plano:
  - sair de produto validado internamente para beta fechado com risco controlado
  - tornar o vínculo do casal confiável
  - tornar onboarding mais seguro
  - deixar o PWA usável no mobile real
  - deixar a plataforma pronta para ligar cobrança rapidamente após validação final
- Se algo falhar após deploy ou mudança de schema, retestar após alguns minutos por causa de possíveis oscilações transitórias.
- Comando de retomada em novo chat:
  - `Antes de qualquer ação, leia context.md e use como fonte principal de continuidade.`
  - depois responder obrigatoriamente:
    `1) me confirme em 5 bullets o que entendeu`
    `2) diga qual é o próximo passo`
    `3) confirme comando de execucao`
- Palavra de comando para executar exatamente o plano acima: `Executar plano Beta`.
- Se a retomada for para seguir a trilha de liberação, confirmar explicitamente o comando `Executar plano Beta` antes de executar qualquer etapa.