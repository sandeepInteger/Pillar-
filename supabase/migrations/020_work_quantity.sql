-- Daily work quantity tracking (per project) — replaces the placeholder
-- "Invoices" nav item. Starts with block work & shuttering work; more work
-- types can be added later the same way 010_employee_type_carpenter_mason.sql
-- added employee types (drop + recreate the check constraint).

create table if not exists public.work_quantity_logs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects on delete cascade,
  work_date date not null,
  work_type text not null check (work_type in ('block_work', 'shuttering_work')),
  quantity numeric(10, 2) not null check (quantity > 0),
  unit text not null check (unit in ('nos', 'sqft', 'cum', 'rft')),
  notes text,
  created_by uuid references auth.users,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists work_quantity_logs_project_date_idx
  on public.work_quantity_logs (project_id, work_date desc);

create index if not exists work_quantity_logs_date_idx
  on public.work_quantity_logs (work_date desc);

drop trigger if exists work_quantity_logs_updated_at on public.work_quantity_logs;
create trigger work_quantity_logs_updated_at
  before update on public.work_quantity_logs
  for each row execute function public.set_updated_at();

alter table public.work_quantity_logs enable row level security;

-- Everyone (admin + viewer) can read; only admins can write/delete.
drop policy if exists "Staff read work_quantity_logs" on public.work_quantity_logs;
create policy "Staff read work_quantity_logs" on public.work_quantity_logs
  for select using (public.get_user_role() in ('admin', 'viewer'));

drop policy if exists "Staff insert work_quantity_logs" on public.work_quantity_logs;
create policy "Staff insert work_quantity_logs" on public.work_quantity_logs
  for insert with check (public.get_user_role() = 'admin');

drop policy if exists "Staff update work_quantity_logs" on public.work_quantity_logs;
create policy "Staff update work_quantity_logs" on public.work_quantity_logs
  for update using (public.get_user_role() = 'admin');

drop policy if exists "Staff delete work_quantity_logs" on public.work_quantity_logs;
create policy "Staff delete work_quantity_logs" on public.work_quantity_logs
  for delete using (public.get_user_role() = 'admin');
