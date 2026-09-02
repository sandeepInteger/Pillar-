-- Fixed monthly salary + paid SL (sanctioned leave) days

alter table public.employees
  add column if not exists salary_type text not null default 'daily'
    check (salary_type in ('daily', 'monthly')),
  add column if not exists monthly_salary numeric(12, 2),
  add column if not exists monthly_sl_days numeric(4, 2) not null default 0;

comment on column public.employees.salary_type is
  'daily = man-days × daily_rate; monthly = fixed salary with SL allowance';

comment on column public.employees.monthly_sl_days is
  'Paid SL days per month (e.g. engineer = 1). SL attendance is not deducted.';

-- Default monthly pay type for office/site staff (labour stays daily)
update public.employees
set salary_type = 'monthly',
    monthly_sl_days = case employee_type
      when 'engineer' then 1
      when 'staff' then 1
      else 0
    end
where employee_type in ('engineer', 'staff', 'foreman')
  and salary_type = 'daily';

-- SL shift: paid leave, 0 man-days, no salary deduction for monthly staff
alter table public.attendance_records
  drop constraint if exists attendance_records_shift_type_check;

alter table public.attendance_records
  add constraint attendance_records_shift_type_check
  check (shift_type in ('absent', 'half', 'full', 'double', 'sl'));

create or replace function public.shift_type_to_units(shift text)
returns numeric as $$
begin
  return case shift
    when 'absent' then 0
    when 'sl' then 0
    when 'half' then 0.5
    when 'full' then 1
    when 'double' then 2
    else 0
  end;
end;
$$ language plpgsql immutable;
