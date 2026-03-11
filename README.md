# AuraFlow

Web app de controle de despesas familiar, construído com Next.js (App Router), TypeScript, Tailwind e Supabase.

## Stack

- Frontend: Next.js 16 + React + Tailwind
- Backend/API: Route Handlers do Next.js (`app/api/*`)
- Banco/Auth/Storage: Supabase PostgreSQL + Supabase Auth + Supabase Storage
- UX: Lucide React + Framer Motion

## Funcionalidades MVP

- Registro, login, logout e recuperação de senha
- Proteção de rotas para páginas autenticadas
- Dashboard mensal com:
  - categorias globais + do usuário
  - criação de categoria na própria tela
  - orçamento previsto por categoria
  - exportação de itens fixos para o próximo mês
- Lançamento de gasto com upload de recibo para Supabase Storage
- Histórico de lançamentos recentes
- Comparação previsto x realizado com alertas visuais e progresso por categoria
- Tema claro/escuro

## 1) Setup local

1. Instale dependências:
   ```bash
   pnpm install
   ```
2. Crie `.env.local` na raiz:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   SUPABASE_RECEIPTS_BUCKET=receipts
   ```
3. Rode o SQL em `supabase/schema.sql` no Supabase SQL Editor.
4. No Supabase Storage, confirme o bucket `receipts`.
5. Suba o app:
   ```bash
   pnpm dev
   ```

## 2) Rotas de API implementadas

- Auth:
  - `POST /api/auth/login`
  - `POST /api/auth/register`
  - `POST /api/auth/logout`
- Categorias:
  - `GET /api/categories`
  - `POST /api/categories`
  - `PUT /api/categories/[id]`
  - `DELETE /api/categories/[id]`
- Orçamentos mensais:
  - `GET /api/monthly-budgets?month=&year=`
  - `POST /api/monthly-budgets`
  - `PUT /api/monthly-budgets/[id]`
  - `DELETE /api/monthly-budgets/[id]`
  - `POST /api/monthly-budgets/export`
- Transações:
  - `GET /api/transactions`
  - `POST /api/transactions` (multipart/form-data com upload de recibo)
  - `PUT /api/transactions/[id]`
  - `DELETE /api/transactions/[id]`
- Relatório:
  - `GET /api/reports/comparison?month=&year=`

## 3) Deploy no Vercel

1. Crie um repositório no GitHub e faça push.
2. Conecte o repo ao Vercel.
3. Configure as variáveis de ambiente do `.env.local` no projeto Vercel.
4. Faça deploy.

## 4) Estrutura principal

- `app/(auth)/*` - telas de autenticação
- `app/(app)/*` - áreas protegidas (dashboard, lançamentos, comparação)
- `app/api/*` - endpoints backend
- `lib/*` - clientes Supabase e validações
- `supabase/schema.sql` - esquema, RLS e policies de storage
