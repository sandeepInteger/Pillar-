-- Phase 2: Daily attendance with shift types (half, full, double, absent)

create table if not exists public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees on delete cascade,
  attendance_date date not null,
  shift_type text not null check (shift_type in ('absent', 'half', 'full', 'double')),
  day_units numeric(4, 2) not null default 0,
  notes text,
  created_by uuid references auth.users,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (employee_id, attendance_date)
);

create or replace function public.shift_type_to_units(shift text)
returns numeric as $$
begin
  return case shift
    when 'absent' then 0
    when 'half' then 0.5
    when 'full' then 1
    when 'double' then 2
    else 0
  end;
end;
$$ language plpgsql immutable;

create or replace function public.set_attendance_day_units()
returns trigger as $$
begin
  new.day_units := public.shift_type_to_units(new.shift_type);
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists attendance_day_units on public.attendance_records;
create trigger attendance_day_units
  before insert or update on public.attendance_records
  for each row execute function public.set_attendance_day_units();

create index if not exists attendance_records_date_idx
  on public.attendance_records (attendance_date);

create index if not exists attendance_records_employee_date_idx
  on public.attendance_records (employee_id, attendance_date);

alter table public.attendance_records enable row level security;

drop policy if exists "Staff read attendance" on public.attendance_records;
create policy "Staff read attendance" on public.attendance_records
  for select using (public.get_user_role() in ('admin', 'engineer'));

drop policy if exists "Staff insert attendance" on public.attendance_records;
create policy "Staff insert attendance" on public.attendance_records
  for insert with check (public.get_user_role() in ('admin', 'engineer'));

drop policy if exists "Staff update attendance" on public.attendance_records;
create policy "Staff update attendance" on public.attendance_records
  for update using (public.get_user_role() in ('admin', 'engineer'));

drop policy if exists "Admin delete attendance" on public.attendance_records;
create policy "Admin delete attendance" on public.attendance_records
  for delete using (public.get_user_role() = 'admin');
