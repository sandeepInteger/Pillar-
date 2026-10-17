-- Founder: daily wage from shift attendance (like foreman/engineer) but no SL.
-- Replaces the fixed monthly salary from 012_founder_fixed_salary.sql.
-- daily_rate is left as-is (usually null) — set it on each founder's profile.
update public.employees
set salary_type = 'daily',
    monthly_salary = null,
    monthly_sl_days = 0
where employee_type = 'founder';
