-- Replace the "engineer" role with a strict two-tier model:
--   admin  = super user, full read/write/delete everywhere
--   viewer = read-only everywhere
-- Run this in the Supabase SQL Editor.

-- 1. Drop the old check constraint first — it only allows ('admin', 'engineer'),
--    so it must be gone before any row can be set to 'viewer'.
alter table public.profiles drop constraint if exists profiles_role_check;

-- 2. Migrate existing engineer profiles to viewer
update public.profiles set role = 'viewer' where role = 'engineer';

-- 3. Add the new constraint now that every row already satisfies it
alter table public.profiles
  add constraint profiles_role_check check (role in ('admin', 'viewer'));
alter table public.profiles alter column role set default 'viewer';

-- 3. New signups default to viewer, not engineer
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    coalesce(new.raw_user_meta_data->>'role', 'viewer')
  );
  return new;
end;
$$ language plpgsql security definer;

-- 4. Admins can read and manage every profile (needed for user management UI);
--    everyone keeps read/update access to their own row.
drop policy if exists "Admins read all profiles" on public.profiles;
create policy "Admins read all profiles" on public.profiles
  for select using (public.get_user_role() = 'admin');

drop policy if exists "Admins update all profiles" on public.profiles;
create policy "Admins update all profiles" on public.profiles
  for update using (public.get_user_role() = 'admin');

-- 5. Employees: viewers read, only admins write/delete
drop policy if exists "Staff read employees" on public.employees;
create policy "Staff read employees" on public.employees
  for select using (public.get_user_role() in ('admin', 'viewer'));

drop policy if exists "Staff insert employees" on public.employees;
create policy "Staff insert employees" on public.employees
  for insert with check (public.get_user_role() = 'admin');

drop policy if exists "Staff update employees" on public.employees;
create policy "Staff update employees" on public.employees
  for update using (public.get_user_role() = 'admin');

-- (delete employees was already admin-only)

-- 6. Employee phones
drop policy if exists "Staff read phones" on public.employee_phones;
create policy "Staff read phones" on public.employee_phones
  for select using (public.get_user_role() in ('admin', 'viewer'));

drop policy if exists "Staff insert phones" on public.employee_phones;
create policy "Staff insert phones" on public.employee_phones
  for insert with check (public.get_user_role() = 'admin');

drop policy if exists "Staff update phones" on public.employee_phones;
create policy "Staff update phones" on public.employee_phones
  for update using (public.get_user_role() = 'admin');

drop policy if exists "Staff delete phones" on public.employee_phones;
create policy "Staff delete phones" on public.employee_phones
  for delete using (public.get_user_role() = 'admin');

-- 7. Employee payment methods
drop policy if exists "Staff read payments" on public.employee_payment_methods;
create policy "Staff read payments" on public.employee_payment_methods
  for select using (public.get_user_role() in ('admin', 'viewer'));

drop policy if exists "Staff insert payments" on public.employee_payment_methods;
create policy "Staff insert payments" on public.employee_payment_methods
  for insert with check (public.get_user_role() = 'admin');

drop policy if exists "Staff update payments" on public.employee_payment_methods;
create policy "Staff update payments" on public.employee_payment_methods
  for update using (public.get_user_role() = 'admin');

drop policy if exists "Staff delete payments" on public.employee_payment_methods;
create policy "Staff delete payments" on public.employee_payment_methods
  for delete using (public.get_user_role() = 'admin');

-- 8. Attendance
drop policy if exists "Staff read attendance" on public.attendance_records;
create policy "Staff read attendance" on public.attendance_records
  for select using (public.get_user_role() in ('admin', 'viewer'));

drop policy if exists "Staff insert attendance" on public.attendance_records;
create policy "Staff insert attendance" on public.attendance_records
  for insert with check (public.get_user_role() = 'admin');

drop policy if exists "Staff update attendance" on public.attendance_records;
create policy "Staff update attendance" on public.attendance_records
  for update using (public.get_user_role() = 'admin');

-- (delete attendance was already admin-only)

-- 9. Projects + assignments
drop policy if exists "Staff read projects" on public.projects;
create policy "Staff read projects" on public.projects
  for select using (public.get_user_role() in ('admin', 'viewer'));

drop policy if exists "Staff insert projects" on public.projects;
create policy "Staff insert projects" on public.projects
  for insert with check (public.get_user_role() = 'admin');

drop policy if exists "Staff update projects" on public.projects;
create policy "Staff update projects" on public.projects
  for update using (public.get_user_role() = 'admin');

-- (delete projects was already admin-only)

drop policy if exists "Staff read assignments" on public.project_assignments;
create policy "Staff read assignments" on public.project_assignments
  for select using (public.get_user_role() in ('admin', 'viewer'));

drop policy if exists "Staff insert assignments" on public.project_assignments;
create policy "Staff insert assignments" on public.project_assignments
  for insert with check (public.get_user_role() = 'admin');

drop policy if exists "Staff update assignments" on public.project_assignments;
create policy "Staff update assignments" on public.project_assignments
  for update using (public.get_user_role() = 'admin');

drop policy if exists "Staff delete assignments" on public.project_assignments;
create policy "Staff delete assignments" on public.project_assignments
  for delete using (public.get_user_role() = 'admin');

-- 10. Salary payments
drop policy if exists "Staff read salary payments" on public.salary_payments;
create policy "Staff read salary payments" on public.salary_payments
  for select using (public.get_user_role() in ('admin', 'viewer'));

drop policy if exists "Staff insert salary payments" on public.salary_payments;
create policy "Staff insert salary payments" on public.salary_payments
  for insert with check (public.get_user_role() = 'admin');

drop policy if exists "Staff update salary payments" on public.salary_payments;
create policy "Staff update salary payments" on public.salary_payments
  for update using (public.get_user_role() = 'admin');

drop policy if exists "Staff delete salary payments" on public.salary_payments;
create policy "Staff delete salary payments" on public.salary_payments
  for delete using (public.get_user_role() = 'admin');

-- 11. RA bills
drop policy if exists "Staff read ra_bills" on public.ra_bills;
create policy "Staff read ra_bills" on public.ra_bills
  for select using (public.get_user_role() in ('admin', 'viewer'));

drop policy if exists "Staff insert ra_bills" on public.ra_bills;
create policy "Staff insert ra_bills" on public.ra_bills
  for insert with check (public.get_user_role() = 'admin');

drop policy if exists "Staff update ra_bills" on public.ra_bills;
create policy "Staff update ra_bills" on public.ra_bills
  for update using (public.get_user_role() = 'admin');

-- (delete ra_bills was already admin-only)

-- 12. Project bank inflows
drop policy if exists "Staff read project_bank_inflows" on public.project_bank_inflows;
create policy "Staff read project_bank_inflows" on public.project_bank_inflows
  for select using (public.get_user_role() in ('admin', 'viewer'));

drop policy if exists "Staff insert project_bank_inflows" on public.project_bank_inflows;
create policy "Staff insert project_bank_inflows" on public.project_bank_inflows
  for insert with check (public.get_user_role() = 'admin');

drop policy if exists "Staff update project_bank_inflows" on public.project_bank_inflows;
create policy "Staff update project_bank_inflows" on public.project_bank_inflows
  for update using (public.get_user_role() = 'admin');

drop policy if exists "Staff delete project_bank_inflows" on public.project_bank_inflows;
create policy "Staff delete project_bank_inflows" on public.project_bank_inflows
  for delete using (public.get_user_role() = 'admin');

-- 13. Storage: employee photos — upload/update/delete admin-only, read stays public
drop policy if exists "Staff upload employee photos" on storage.objects;
create policy "Admin upload employee photos" on storage.objects
  for insert with check (
    bucket_id = 'employee-photos'
    and public.get_user_role() = 'admin'
  );

drop policy if exists "Staff update employee photos" on storage.objects;
create policy "Admin update employee photos" on storage.objects
  for update using (
    bucket_id = 'employee-photos'
    and public.get_user_role() = 'admin'
  );

drop policy if exists "Staff delete employee photos" on storage.objects;
create policy "Admin delete employee photos" on storage.objects
  for delete using (
    bucket_id = 'employee-photos'
    and public.get_user_role() = 'admin'
  );
