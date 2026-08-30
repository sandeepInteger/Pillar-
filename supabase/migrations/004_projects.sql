-- Phase 2b: Projects + employee assignments + project on attendance

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  project_code text unique,
  name text not null,
  client_name text,
  location text,
  status text not null default 'active' check (status in ('active', 'on_hold', 'completed')),
  start_date date,
  end_date date,
  description text,
  created_by uuid references auth.users,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.project_assignments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects on delete cascade,
  employee_id uuid not null references public.employees on delete cascade,
  is_active boolean not null default true,
  started_at date not null default current_date,
  ended_at date,
  notes text,
  created_at timestamptz default now()
);

-- One active assignment per employee per project
create unique index if not exists project_assignments_active_pair
  on public.project_assignments (project_id, employee_id)
  where is_active = true;

create index if not exists project_assignments_employee_idx
  on public.project_assignments (employee_id)
  where is_active = true;

create index if not exists project_assignments_project_idx
  on public.project_assignments (project_id)
  where is_active = true;

-- Auto project code
create or replace function public.generate_project_code()
returns trigger as $$
declare
  next_num int;
begin
  if new.project_code is null then
    select coalesce(max(cast(substring(project_code from 5) as int)), 0) + 1
    into next_num
    from public.projects
    where project_code ~ '^PRJ-[0-9]+$';
    new.project_code := 'PRJ-' || lpad(next_num::text, 3, '0');
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_project_code on public.projects;
create trigger set_project_code
  before insert on public.projects
  for each row execute function public.generate_project_code();

drop trigger if exists projects_updated_at on public.projects;
create trigger projects_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

-- Link attendance to a project (labour site per day; engineers shared across projects)
alter table public.attendance_records
  add column if not exists project_id uuid references public.projects on delete set null;

create index if not exists attendance_records_project_idx
  on public.attendance_records (project_id);

-- RLS projects
alter table public.projects enable row level security;
alter table public.project_assignments enable row level security;

drop policy if exists "Staff read projects" on public.projects;
create policy "Staff read projects" on public.projects
  for select using (public.get_user_role() in ('admin', 'engineer'));

drop policy if exists "Staff insert projects" on public.projects;
create policy "Staff insert projects" on public.projects
  for insert with check (public.get_user_role() in ('admin', 'engineer'));

drop policy if exists "Staff update projects" on public.projects;
create policy "Staff update projects" on public.projects
  for update using (public.get_user_role() in ('admin', 'engineer'));

drop policy if exists "Admin delete projects" on public.projects;
create policy "Admin delete projects" on public.projects
  for delete using (public.get_user_role() = 'admin');

drop policy if exists "Staff read assignments" on public.project_assignments;
create policy "Staff read assignments" on public.project_assignments
  for select using (public.get_user_role() in ('admin', 'engineer'));

drop policy if exists "Staff insert assignments" on public.project_assignments;
create policy "Staff insert assignments" on public.project_assignments
  for insert with check (public.get_user_role() in ('admin', 'engineer'));

drop policy if exists "Staff update assignments" on public.project_assignments;
create policy "Staff update assignments" on public.project_assignments
  for update using (public.get_user_role() in ('admin', 'engineer'));

drop policy if exists "Staff delete assignments" on public.project_assignments;
create policy "Staff delete assignments" on public.project_assignments
  for delete using (public.get_user_role() in ('admin', 'engineer'));
