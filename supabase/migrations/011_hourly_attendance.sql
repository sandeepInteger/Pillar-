-- Hourly attendance (8h = 1 present day, excess = overtime) + hourly pay type

alter table public.employees
  drop constraint if exists employees_salary_type_check;

alter table public.employees
  add constraint employees_salary_type_check
  check (salary_type in ('daily', 'monthly', 'hourly'));

alter table public.employees
  add column if not exists hourly_rate numeric(10, 2);

comment on column public.employees.hourly_rate is
  'INR per hour; gross = regular hours (up to 8/day) + overtime hours × rate';

update public.employees
set salary_type = 'hourly',
    hourly_rate = round(daily_rate / 8.0, 2)
where employee_type not in ('founder', 'foreman')
  and salary_type = 'daily'
  and daily_rate is not null
  and hourly_rate is null;

alter table public.attendance_records
  add column if not exists hours_worked numeric(5, 2),
  add column if not exists overtime_hours numeric(5, 2) not null default 0;

alter table public.attendance_records
  drop constraint if exists attendance_records_shift_type_check;

alter table public.attendance_records
  add constraint attendance_records_shift_type_check
  check (shift_type in ('absent', 'half', 'full', 'double', 'sl', 'hours'));

create or replace function public.shift_type_to_units(shift text)
returns numeric as $$
begin
  return case shift
    when 'absent' then 0
    when 'sl' then 0
    when 'half' then 0.5
    when 'full' then 1
    when 'double' then 2
    when 'hours' then 0
    else 0
  end;
end;
$$ language plpgsql immutable;

create or replace function public.hours_to_day_units(hours numeric)
returns numeric as $$
begin
  if coalesce(hours, 0) <= 0 then
    return 0;
  elsif hours >= 8 then
    return 1;
  else
    return round(hours / 8.0, 2);
  end if;
end;
$$ language plpgsql immutable;

create or replace function public.set_attendance_day_units()
returns trigger as $$
begin
  if new.shift_type = 'hours' then
    new.overtime_hours := greatest(0, round(coalesce(new.hours_worked, 0) - 8, 2));
    new.day_units := public.hours_to_day_units(coalesce(new.hours_worked, 0));
  else
    new.hours_worked := null;
    new.overtime_hours := 0;
    new.day_units := public.shift_type_to_units(new.shift_type);
  end if;
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;
