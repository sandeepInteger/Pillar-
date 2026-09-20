-- Project-wise bank inflow log (date + amount + reference)

create table if not exists public.project_bank_inflows (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects on delete cascade,
  received_date date not null,
  amount numeric(14, 2) not null check (amount > 0),
  reference_note text,
  created_by uuid references auth.users,
  created_at timestamptz default now()
);

create index if not exists project_bank_inflows_project_idx
  on public.project_bank_inflows (project_id, received_date desc);

create index if not exists project_bank_inflows_date_idx
  on public.project_bank_inflows (received_date desc);

alter table public.project_bank_inflows enable row level security;

drop policy if exists "Staff read project_bank_inflows" on public.project_bank_inflows;
create policy "Staff read project_bank_inflows" on public.project_bank_inflows
  for select using (public.get_user_role() in ('admin', 'engineer'));

drop policy if exists "Staff insert project_bank_inflows" on public.project_bank_inflows;
create policy "Staff insert project_bank_inflows" on public.project_bank_inflows
  for insert with check (public.get_user_role() in ('admin', 'engineer'));

drop policy if exists "Staff update project_bank_inflows" on public.project_bank_inflows;
create policy "Staff update project_bank_inflows" on public.project_bank_inflows
  for update using (public.get_user_role() in ('admin', 'engineer'));

drop policy if exists "Staff delete project_bank_inflows" on public.project_bank_inflows;
create policy "Staff delete project_bank_inflows" on public.project_bank_inflows
  for delete using (public.get_user_role() in ('admin', 'engineer'));
