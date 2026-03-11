-- AuraFlow - Supabase schema + RLS
-- Execute in Supabase SQL editor.

create extension if not exists pgcrypto;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  user_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.monthly_budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete restrict,
  month int not null check (month between 1 and 12),
  year int not null,
  expected_amount numeric(10, 2) not null default 0.00,
  is_fixed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, category_id, month, year)
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete restrict,
  amount numeric(10, 2) not null check (amount > 0),
  description text,
  transaction_date date not null default current_date,
  receipt_url text,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_monthly_budgets_updated_at on public.monthly_budgets;
create trigger trg_monthly_budgets_updated_at
before update on public.monthly_budgets
for each row execute procedure public.set_updated_at();

alter table public.categories enable row level security;
alter table public.monthly_budgets enable row level security;
alter table public.transactions enable row level security;

-- categories: users can see globals (user_id null) + own categories
drop policy if exists categories_select on public.categories;
create policy categories_select on public.categories
for select
to authenticated
using (user_id is null or user_id = auth.uid());

drop policy if exists categories_insert on public.categories;
create policy categories_insert on public.categories
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists categories_update on public.categories;
create policy categories_update on public.categories
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists categories_delete on public.categories;
create policy categories_delete on public.categories
for delete
to authenticated
using (user_id = auth.uid());

-- monthly_budgets: only owner can CRUD
drop policy if exists monthly_budgets_all on public.monthly_budgets;
create policy monthly_budgets_all on public.monthly_budgets
for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- transactions: only owner can CRUD
drop policy if exists transactions_all on public.transactions;
create policy transactions_all on public.transactions
for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Storage bucket for receipts (run once in Supabase Studio Storage too)
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', true)
on conflict (id) do nothing;

-- Read public receipts
drop policy if exists receipts_select on storage.objects;
create policy receipts_select on storage.objects
for select
to authenticated
using (bucket_id = 'receipts');

-- User can upload/update/delete only inside their own folder: <uid>/file
drop policy if exists receipts_insert on storage.objects;
create policy receipts_insert on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'receipts'
  and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists receipts_update on storage.objects;
create policy receipts_update on storage.objects
for update
to authenticated
using (
  bucket_id = 'receipts'
  and split_part(name, '/', 1) = auth.uid()::text
)
with check (
  bucket_id = 'receipts'
  and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists receipts_delete on storage.objects;
create policy receipts_delete on storage.objects
for delete
to authenticated
using (
  bucket_id = 'receipts'
  and split_part(name, '/', 1) = auth.uid()::text
);

