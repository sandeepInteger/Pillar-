-- Founder: fixed monthly salary only (no SL allowance)
update public.employees
set monthly_sl_days = 0,
    salary_type = 'monthly'
where employee_type = 'founder';
