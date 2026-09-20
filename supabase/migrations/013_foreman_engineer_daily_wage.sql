-- Foreman & engineer: daily wage + SL; site staff: hourly (no SL)

update public.employees
set salary_type = 'daily',
    monthly_sl_days = coalesce(nullif(monthly_sl_days, 0), 1),
    hourly_rate = null
where employee_type in ('foreman', 'engineer')
  and salary_type in ('monthly', 'hourly');

update public.employees
set salary_type = 'hourly',
    monthly_sl_days = 0,
    monthly_salary = null
where employee_type in ('labour', 'carpenter', 'mason', 'staff')
  and salary_type <> 'hourly';
