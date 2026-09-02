-- Phase 3: Salary — daily rate on employees (payroll = man-days × daily_rate)

alter table public.employees
  add column if not exists daily_rate numeric(10, 2);

comment on column public.employees.daily_rate is
  'Daily wage in INR; gross pay = sum(attendance day_units) × daily_rate';
