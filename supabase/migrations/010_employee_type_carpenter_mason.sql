-- Allow carpenter and mason employee types
alter table public.employees
  drop constraint if exists employees_employee_type_check;

alter table public.employees
  add constraint employees_employee_type_check
  check (
    employee_type in (
      'founder',
      'staff',
      'engineer',
      'foreman',
      'labour',
      'carpenter',
      'mason'
    )
  );
