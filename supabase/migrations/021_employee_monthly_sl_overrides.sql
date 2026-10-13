-- Per-month SL override for an employee. When a row exists for a month it
-- replaces employees.monthly_sl_days for that month only: 0 = no SL that
-- month, any other value = custom SL allowance. No row = profile default.

create table if not exists public.employee_monthly_sl_overrides (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees on delete cascade,
  month text not null check (month ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  sl_days numeric(4, 1) not null check (sl_days >= 0),
  created_by uuid references auth.users,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (employee_id, month)
);

create index if not exists employee_monthly_sl_overrides_employee_idx
  on public.employee_monthly_sl_overrides (employee_id, month);

drop trigger if exists employee_monthly_sl_overrides_updated_at on public.employee_monthly_sl_overrides;
create trigger employee_monthly_sl_overrides_updated_at
  before update on public.employee_monthly_sl_overrides
  for each row execute function public.set_updated_at();

alter table public.employee_monthly_sl_overrides enable row level security;

-- Everyone (admin + viewer) can read; only admins can write/delete.
drop policy if exists "Staff read employee_monthly_sl_overrides" on public.employee_monthly_sl_overrides;
create policy "Staff read employee_monthly_sl_overrides" on public.employee_monthly_sl_overrides
  for select using (public.get_user_role() in ('admin', 'viewer'));

drop policy if exists "Staff insert employee_monthly_sl_overrides" on public.employee_monthly_sl_overrides;
create policy "Staff insert employee_monthly_sl_overrides" on public.employee_monthly_sl_overrides
  for insert with check (public.get_user_role() = 'admin');

drop policy if exists "Staff update employee_monthly_sl_overrides" on public.employee_monthly_sl_overrides;
create policy "Staff update employee_monthly_sl_overrides" on public.employee_monthly_sl_overrides
  for update using (public.get_user_role() = 'admin');

drop policy if exists "Staff delete employee_monthly_sl_overrides" on public.employee_monthly_sl_overrides;
create policy "Staff delete employee_monthly_sl_overrides" on public.employee_monthly_sl_overrides
  for delete using (public.get_user_role() = 'admin');
