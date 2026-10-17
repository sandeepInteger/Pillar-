-- Site expenses: money spent on a particular site (labour expense, machine,
-- petrol / diesel, food, material, ...). Categories are admin-configurable,
-- the same way work types are (023_work_types_rates.sql).

create table if not exists public.expense_categories (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

drop trigger if exists expense_categories_updated_at on public.expense_categories;
create trigger expense_categories_updated_at
  before update on public.expense_categories
  for each row execute function public.set_updated_at();

alter table public.expense_categories enable row level security;

drop policy if exists "Staff read expense_categories" on public.expense_categories;
create policy "Staff read expense_categories" on public.expense_categories
  for select using (public.get_user_role() in ('admin', 'viewer'));

drop policy if exists "Staff insert expense_categories" on public.expense_categories;
create policy "Staff insert expense_categories" on public.expense_categories
  for insert with check (public.get_user_role() = 'admin');

drop policy if exists "Staff update expense_categories" on public.expense_categories;
create policy "Staff update expense_categories" on public.expense_categories
  for update using (public.get_user_role() = 'admin');

insert into public.expense_categories (code, name)
values
  ('labour_expense', 'Labour Expense'),
  ('machine', 'Machine'),
  ('petrol_diesel', 'Petrol / Diesel'),
  ('food', 'Food'),
  ('material', 'Material'),
  ('transport', 'Transport'),
  ('other', 'Other')
on conflict (code) do nothing;

create table if not exists public.site_expenses (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects on delete cascade,
  expense_date date not null,
  category text not null references public.expense_categories (code) on update cascade,
  amount numeric(14, 2) not null check (amount > 0),
  paid_to text,
  payment_mode text not null default 'cash' check (payment_mode in ('cash', 'upi', 'bank')),
  notes text,
  created_by uuid references auth.users,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists site_expenses_project_date_idx
  on public.site_expenses (project_id, expense_date desc);

create index if not exists site_expenses_date_idx
  on public.site_expenses (expense_date desc);

drop trigger if exists site_expenses_updated_at on public.site_expenses;
create trigger site_expenses_updated_at
  before update on public.site_expenses
  for each row execute function public.set_updated_at();

alter table public.site_expenses enable row level security;

drop policy if exists "Staff read site_expenses" on public.site_expenses;
create policy "Staff read site_expenses" on public.site_expenses
  for select using (public.get_user_role() in ('admin', 'viewer'));

drop policy if exists "Staff insert site_expenses" on public.site_expenses;
create policy "Staff insert site_expenses" on public.site_expenses
  for insert with check (public.get_user_role() = 'admin');

drop policy if exists "Staff update site_expenses" on public.site_expenses;
create policy "Staff update site_expenses" on public.site_expenses
  for update using (public.get_user_role() = 'admin');

drop policy if exists "Staff delete site_expenses" on public.site_expenses;
create policy "Staff delete site_expenses" on public.site_expenses
  for delete using (public.get_user_role() = 'admin');
