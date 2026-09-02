-- Salary payouts: advances mid-month, final salary, bonuses, deductions

create table if not exists public.salary_payments (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees on delete cascade,
  payment_date date not null,
  amount numeric(12, 2) not null check (amount > 0),
  payment_type text not null check (
    payment_type in ('advance', 'salary', 'bonus', 'deduction')
  ),
  notes text,
  created_by uuid references auth.users,
  created_at timestamptz default now()
);

create index if not exists salary_payments_employee_date_idx
  on public.salary_payments (employee_id, payment_date);

create index if not exists salary_payments_date_idx
  on public.salary_payments (payment_date);

alter table public.salary_payments enable row level security;

drop policy if exists "Staff read salary payments" on public.salary_payments;
create policy "Staff read salary payments" on public.salary_payments
  for select using (public.get_user_role() in ('admin', 'engineer'));

drop policy if exists "Staff insert salary payments" on public.salary_payments;
create policy "Staff insert salary payments" on public.salary_payments
  for insert with check (public.get_user_role() in ('admin', 'engineer'));

drop policy if exists "Staff update salary payments" on public.salary_payments;
create policy "Staff update salary payments" on public.salary_payments
  for update using (public.get_user_role() in ('admin', 'engineer'));

drop policy if exists "Admin delete salary payments" on public.salary_payments;
create policy "Staff delete salary payments" on public.salary_payments
  for delete using (public.get_user_role() in ('admin', 'engineer'));
