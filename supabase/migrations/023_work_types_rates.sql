-- Configurable work types with a fixed rate and measuring unit.
-- Admins define e.g. "Scaffolding Work" @ ₹X per sqm; each work quantity
-- log then picks up that unit and snapshots the rate, so amount = qty × rate.
-- Changing a rate later does not rewrite amounts already logged.

create table if not exists public.work_types (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  unit text not null default 'sqft'
    check (unit in ('nos', 'sqft', 'sqm', 'cum', 'rft', 'rmt', 'kg')),
  rate numeric(12, 2) not null default 0 check (rate >= 0),
  is_active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

drop trigger if exists work_types_updated_at on public.work_types;
create trigger work_types_updated_at
  before update on public.work_types
  for each row execute function public.set_updated_at();

alter table public.work_types enable row level security;

drop policy if exists "Staff read work_types" on public.work_types;
create policy "Staff read work_types" on public.work_types
  for select using (public.get_user_role() in ('admin', 'viewer'));

drop policy if exists "Staff insert work_types" on public.work_types;
create policy "Staff insert work_types" on public.work_types
  for insert with check (public.get_user_role() = 'admin');

drop policy if exists "Staff update work_types" on public.work_types;
create policy "Staff update work_types" on public.work_types
  for update using (public.get_user_role() = 'admin');

-- Seed the two work types that were hard-coded in 020 (rate 0 — set it in the app).
insert into public.work_types (code, name, unit)
values
  ('block_work', 'Block Work', 'sqft'),
  ('shuttering_work', 'Shuttering Work', 'sqft')
on conflict (code) do nothing;

-- Logs: work_type now references work_types.code instead of a fixed list.
alter table public.work_quantity_logs
  drop constraint if exists work_quantity_logs_work_type_check;

alter table public.work_quantity_logs
  drop constraint if exists work_quantity_logs_work_type_fkey;
alter table public.work_quantity_logs
  add constraint work_quantity_logs_work_type_fkey
    foreign key (work_type) references public.work_types (code)
    on update cascade;

alter table public.work_quantity_logs
  drop constraint if exists work_quantity_logs_unit_check;
alter table public.work_quantity_logs
  add constraint work_quantity_logs_unit_check
    check (unit in ('nos', 'sqft', 'sqm', 'cum', 'rft', 'rmt', 'kg'));

-- Rate snapshot + amount (null for entries logged before rates existed).
alter table public.work_quantity_logs
  add column if not exists rate numeric(12, 2) check (rate >= 0),
  add column if not exists amount numeric(14, 2) check (amount >= 0);
