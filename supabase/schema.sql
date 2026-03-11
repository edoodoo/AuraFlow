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

create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  partner_email text,
  created_at timestamptz not null default now()
);

create table if not exists public.household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'partner')),
  created_at timestamptz not null default now(),
  unique (household_id, user_id),
  unique (user_id)
);

create table if not exists public.monthly_plans (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  month int not null check (month between 1 and 12),
  year int not null,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (household_id, month, year)
);

create table if not exists public.monthly_plan_items (
  id uuid primary key default gen_random_uuid(),
  monthly_plan_id uuid not null references public.monthly_plans(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  title text not null,
  section text not null check (section in ('general', 'investments', 'emergency_reserve', 'debts')),
  expected_amount numeric(10, 2) not null default 0.00,
  is_fixed boolean not null default false,
  due_date date,
  status text not null default 'pending' check (status in ('pending', 'partial', 'paid')),
  assigned_user_id uuid references auth.users(id) on delete set null,
  paid_by_user_id uuid references auth.users(id) on delete set null,
  paid_at date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.transactions
add column if not exists household_id uuid references public.households(id) on delete set null;

alter table public.transactions
add column if not exists monthly_plan_item_id uuid references public.monthly_plan_items(id) on delete set null;

alter table public.transactions
add column if not exists transaction_kind text not null default 'avulso' check (transaction_kind in ('avulso', 'linked_plan_item'));

drop trigger if exists trg_monthly_plans_updated_at on public.monthly_plans;
create trigger trg_monthly_plans_updated_at
before update on public.monthly_plans
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_monthly_plan_items_updated_at on public.monthly_plan_items;
create trigger trg_monthly_plan_items_updated_at
before update on public.monthly_plan_items
for each row execute procedure public.set_updated_at();

create index if not exists idx_household_members_household on public.household_members(household_id);
create index if not exists idx_monthly_plans_household_period on public.monthly_plans(household_id, year, month);
create index if not exists idx_monthly_plan_items_plan on public.monthly_plan_items(monthly_plan_id);
create index if not exists idx_transactions_household_period on public.transactions(household_id, transaction_date);
create index if not exists idx_transactions_plan_item on public.transactions(monthly_plan_item_id);

create or replace function public.is_household_member(target_household uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.household_members hm
    where hm.household_id = target_household
      and hm.user_id = auth.uid()
  );
$$;

alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.monthly_plans enable row level security;
alter table public.monthly_plan_items enable row level security;

drop policy if exists households_select on public.households;
create policy households_select on public.households
for select
to authenticated
using (
  owner_user_id = auth.uid()
  or public.is_household_member(id)
);

drop policy if exists households_insert on public.households;
create policy households_insert on public.households
for insert
to authenticated
with check (owner_user_id = auth.uid());

drop policy if exists households_update on public.households;
create policy households_update on public.households
for update
to authenticated
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

drop policy if exists household_members_select on public.household_members;
create policy household_members_select on public.household_members
for select
to authenticated
using (public.is_household_member(household_id));

drop policy if exists household_members_insert on public.household_members;
create policy household_members_insert on public.household_members
for insert
to authenticated
with check (
  exists (
    select 1
    from public.households h
    where h.id = household_id
      and h.owner_user_id = auth.uid()
  )
);

drop policy if exists household_members_delete on public.household_members;
create policy household_members_delete on public.household_members
for delete
to authenticated
using (
  exists (
    select 1
    from public.households h
    where h.id = household_id
      and h.owner_user_id = auth.uid()
  )
);

drop policy if exists monthly_plans_all on public.monthly_plans;
create policy monthly_plans_all on public.monthly_plans
for all
to authenticated
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id));

drop policy if exists monthly_plan_items_all on public.monthly_plan_items;
create policy monthly_plan_items_all on public.monthly_plan_items
for all
to authenticated
using (
  exists (
    select 1
    from public.monthly_plans mp
    where mp.id = monthly_plan_id
      and public.is_household_member(mp.household_id)
  )
)
with check (
  exists (
    select 1
    from public.monthly_plans mp
    where mp.id = monthly_plan_id
      and public.is_household_member(mp.household_id)
  )
);

