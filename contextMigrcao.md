# Plano Fast-Track Mobile + Orquestracao com Agentes

## 1) Reescrita da resposta anterior (versao objetiva)

### Meta realista
- Com execucao paralela, a parte tecnica pode ser muito acelerada.
- Ainda assim, publicacao em loja depende de fatores externos (contas, certificados, review Apple/Google).
- Objetivo de 72h: deixar pacote tecnico pronto para build/submissao.

### Trilhas paralelas recomendadas (4 agentes)
- **Agente A - Build Mobile**
  - empacotamento iOS/Android
  - IDs, splash, icones, permissoes
  - scripts de build e troubleshooting
- **Agente B - UX Mobile**
  - correcao de navegacao mobile (safe area, sobreposicao, menu)
  - estados de loading/erro para uso real em app
  - refinamento de fluxo de onboarding mobile
- **Agente C - Store & Compliance**
  - Privacy Policy, Terms, suporte
  - textos de App Store/Play Store
  - checklist de metadados e assets
- **Agente D - QA & Release**
  - smoke tests (login, cadastro, mensal, lancamentos, comparacao)
  - checklist de regressao
  - consolidacao de bloqueios e evidencias

### Cronograma 72h (comprimido)
- **H0-H6**: setup de agentes + escopo + backlog por trilha.
- **H6-H24**: execucao paralela intensa.
- **H24-H36**: integracao entre trilhas e resolucao de conflitos.
- **H36-H48**: QA em device e correcoes de bloqueio.
- **H48-H60**: preparo de pacote de submissao.
- **H60-H72**: freeze, build final e material pronto para publicar.

### O que acelera vs o que nao acelera
- **Acelera muito**: implementacao, ajustes UX, preparacao tecnica, checklist.
- **Nao depende so da equipe**: aprovacao/review de loja, prazos de conta/certificado e eventuais exigencias de compliance.

---

## 2) Item 1: Prompts prontos para os 4 agentes (Claude)

### Prompt do Agente A - Build Mobile
```text
Voce e o Agente A - Build Mobile do squad AuraFlow.
Objetivo: deixar o app empacotado para iOS/Android e pronto para submissao tecnica em 72h.

Escopo:
- Configurar empacotamento mobile para o app atual.
- Ajustar identificadores, icones, splash, permissoes e configuracoes de build.
- Resolver erros de build e gerar instrucoes reproduziveis.

Regras:
1) Focar apenas em build/infra mobile.
2) Nao alterar regras de negocio sem alinhamento com o Orquestrador.
3) Reportar bloqueios com causa e dependencia exata.

Formato obrigatorio de resposta:
- Status: done | in_progress | blocked
- Entregaveis:
- Bloqueios:
- Proximo passo unico:
- Tempo restante estimado:

Comece com um plano de execucao em 5 passos.
```

### Prompt do Agente B - UX Mobile
```text
Voce e o Agente B - UX Mobile do squad AuraFlow.
Objetivo: corrigir e otimizar experiencia mobile para uso como app (foco em navegacao e usabilidade real).

Escopo:
- Corrigir sobreposicao de menu/nav no mobile.
- Ajustar safe areas, espacos e legibilidade.
- Melhorar estados de loading, erro e feedback de acao.

Regras:
1) Focar em UX mobile e navegacao.
2) Priorizar mudancas de alto impacto e baixo risco.
3) Nao mexer em billing/compliance sem alinhamento com o Orquestrador.

Formato obrigatorio de resposta:
- Status: done | in_progress | blocked
- Entregaveis:
- Bloqueios:
- Proximo passo unico:
- Tempo restante estimado:

Comece com um plano de execucao em 5 passos.
```

### Prompt do Agente C - Store & Compliance
```text
Voce e o Agente C - Store & Compliance do squad AuraFlow.
Objetivo: preparar tudo que e necessario para submissao em loja com minimo risco de rejeicao.

Escopo:
- Preparar checklist de conformidade para App Store/Play Store.
- Estruturar textos de listing, suporte, termos e privacidade.
- Validar gaps de requisitos para publicacao.

Regras:
1) Focar em compliance/documentacao/listing.
2) Nao implementar codigo de produto fora do escopo.
3) Ser preciso sobre o que e bloqueador de submissao.

Formato obrigatorio de resposta:
- Status: done | in_progress | blocked
- Entregaveis:
- Bloqueios:
- Proximo passo unico:
- Tempo restante estimado:

Comece com um plano de execucao em 5 passos.
```

### Prompt do Agente D - QA & Release
```text
Voce e o Agente D - QA & Release do squad AuraFlow.
Objetivo: validar estabilidade funcional e consolidar readiness para release.

Escopo:
- Executar smoke tests e regressao curta.
- Priorizar bugs por severidade (blocker, alta, media, baixa).
- Consolidar evidencias para go/no-go.

Regras:
1) Focar em qualidade e decisao de release.
2) Nao abrir escopo novo sem autorizacao do Orquestrador.
3) Sempre vincular bug a impacto no usuario.

Formato obrigatorio de resposta:
- Status: done | in_progress | blocked
- Entregaveis:
- Bloqueios:
- Proximo passo unico:
- Tempo restante estimado:

Comece com um plano de execucao em 5 passos.
```

---

## 3) Item 2: Template de relatorio do Orquestrador (painel unico)

Use este template para sincronizacao a cada 90-120 minutos:

```text
# ORQUESTRADOR - STATUS RELEASE MOBILE
Data/Hora:
Janela (H0-H72):

## Estado geral
- Status global: green | yellow | red
- Percentual concluido:
- Risco principal:
- Decisao atual: continuar | mitigar | freeze parcial

## Trilha A - Build Mobile
- Status:
- Entregaveis concluidos:
- Bloqueios:
- Proximo passo:
- ETA:

## Trilha B - UX Mobile
- Status:
- Entregaveis concluidos:
- Bloqueios:
- Proximo passo:
- ETA:

## Trilha C - Store & Compliance
- Status:
- Entregaveis concluidos:
- Bloqueios:
- Proximo passo:
- ETA:

## Trilha D - QA & Release
- Status:
- Entregaveis concluidos:
- Bloqueios:
- Proximo passo:
- ETA:

## Dependencias cruzadas
- [A <- B]:
- [D <- A]:
- [D <- B]:
- [C <- A/B]:

## Top 5 bloqueios (ordem de criticidade)
1)
2)
3)
4)
5)

## Plano das proximas 2 horas
- Acao 1:
- Acao 2:
- Acao 3:

## Criterio de Go/No-Go
- Build estavel: sim/nao
- Fluxos criticos validados: sim/nao
- Compliance minimo pronto: sim/nao
- Bloqueador aberto: sim/nao
- Recomendacao final: GO | NO-GO
```

---

## 4) Observacao final de uso
- O objetivo dos agentes e comprimir ao maximo a execucao tecnica.
- O prazo de aprovacao final em loja continua sujeito a processos externos.
- O Orquestrador deve manter escopo fechado, evitar retrabalho e focar no caminho critico.

---

## 5) Kickoff prático e resumo inicial entre agentes

### Ordem de disparo recomendada (primeira rodada)
1. Orquestrador
2. Agente A (Build Mobile)
3. Agente B (UX Mobile)
4. Agente C (Store & Compliance)
5. Agente D (QA & Release)

### Mensagem pronta para kickoff no Orquestrador
```text
Kickoff oficial do ciclo de 2 horas.

Contexto:
- Ja existem 4 agentes ativos (A Build, B UX, C Compliance, D QA).
- Objetivo: acelerar release mobile com risco controlado.

Tarefa:
1) Consolide o status inicial de A/B/C/D.
2) Liste os bloqueios cruzados por criticidade.
3) Defina o proximo passo unico de cada agente para as proximas 2 horas.
4) De um plano integrado com caminho critico.
5) Informe criterios de Go/No-Go desta rodada.

Formato de resposta obrigatorio:
- Estado global:
- Resumo A:
- Resumo B:
- Resumo C:
- Resumo D:
- Bloqueios cruzados (Top 5):
- Proximo passo A:
- Proximo passo B:
- Proximo passo C:
- Proximo passo D:
- Caminho critico:
- Go/No-Go da rodada:
```

### O que significa "resumo inicial" de cada agente
Extrair apenas 5 itens de cada resposta:
- Status
- Entregaveis
- Bloqueios
- Proximo passo unico
- Tempo restante estimado

Modelo rapido de consolidacao para colar no Orquestrador:
- A: status=..., entregou=..., bloqueio=..., proximo=..., ETA=...
- B: status=..., entregou=..., bloqueio=..., proximo=..., ETA=...
- C: status=..., entregou=..., bloqueio=..., proximo=..., ETA=...
- D: status=..., entregou=..., bloqueio=..., proximo=..., ETA=...

---

## 6) Autonomia total vs checkpoints (por que usar este formato)

- Existem ambientes/plataformas que permitem automacao quase total apos input inicial.
- Neste contexto de trabalho, o modo mais seguro e eficiente e autonomia alta com checkpoints curtos.
- Motivos:
  - reduz risco de erro em cadeia;
  - evita custo descontrolado;
  - preserva alinhamento de prioridade com o dono do produto;
  - melhora rastreabilidade de decisao para release.
- Regra pratica:
  - agentes executam em paralelo;
  - sincronizacao a cada 90-120 minutos via Orquestrador;
  - Orquestrador atualiza caminho critico e redistribui tarefas.

---

## 7) Rotina pronta de sincronizacao (ciclo de 2 horas)

### Bloco para repetir no inicio de cada ciclo
```text
Inicio de ciclo (2 horas) - Orquestrador

Objetivo do ciclo:
- [definir objetivo unico e mensuravel]

Entrada consolidada dos agentes:
- A: status=..., entregou=..., bloqueio=..., proximo=..., ETA=...
- B: status=..., entregou=..., bloqueio=..., proximo=..., ETA=...
- C: status=..., entregou=..., bloqueio=..., proximo=..., ETA=...
- D: status=..., entregou=..., bloqueio=..., proximo=..., ETA=...

Tarefa do Orquestrador:
1) Priorizar bloqueios por impacto.
2) Definir caminho critico do ciclo.
3) Dar proximo passo unico por agente.
4) Definir criterio objetivo de encerramento do ciclo.

Formato de saida:
- Estado global:
- Top 3 prioridades:
- Caminho critico:
- Proximo passo A:
- Proximo passo B:
- Proximo passo C:
- Proximo passo D:
- Criterio de encerramento do ciclo:
```

### Bloco para fechamento do ciclo (antes do proximo)
```text
Fechamento de ciclo (2 horas) - Orquestrador

Resultado:
- O que foi concluido:
- O que ficou pendente:
- Bloqueio novo:
- Risco principal:

Decisao:
- Continuar plano atual | Ajustar escopo | Freeze parcial

Proximo ciclo:
- Objetivo unico:
- Dependencias cruzadas:
- Ordem de execucao recomendada:
```

### Regra de ouro para evitar caos
- Um ciclo = um objetivo principal.
- Cada agente recebe apenas um proximo passo unico por rodada.
- Se surgir bloqueio critico, o Orquestrador replaneja antes de abrir novo trabalho.
