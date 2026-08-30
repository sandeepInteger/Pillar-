-- Fix: RLS blocking employee insert when profile row is missing
-- Run in Supabase SQL Editor if you get:
-- "new row violates row-level security policy for table employees"

-- 1. Backfill profiles for any auth users missing one
insert into public.profiles (id, full_name, role)
select
  u.id,
  coalesce(u.raw_user_meta_data->>'full_name', u.email),
  coalesce(u.raw_user_meta_data->>'role', 'engineer')
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

-- 2. Harden get_user_role (security definer reads profiles safely)
create or replace function public.get_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- 3. Explicit INSERT policies for phones & payments (FOR ALL was ambiguous)
drop policy if exists "Staff manage phones" on public.employee_phones;
create policy "Staff read phones" on public.employee_phones
  for select using (public.get_user_role() in ('admin', 'engineer'));
create policy "Staff insert phones" on public.employee_phones
  for insert with check (public.get_user_role() in ('admin', 'engineer'));
create policy "Staff update phones" on public.employee_phones
  for update using (public.get_user_role() in ('admin', 'engineer'));
create policy "Staff delete phones" on public.employee_phones
  for delete using (public.get_user_role() in ('admin', 'engineer'));

drop policy if exists "Staff manage payments" on public.employee_payment_methods;
create policy "Staff read payments" on public.employee_payment_methods
  for select using (public.get_user_role() in ('admin', 'engineer'));
create policy "Staff insert payments" on public.employee_payment_methods
  for insert with check (public.get_user_role() in ('admin', 'engineer'));
create policy "Staff update payments" on public.employee_payment_methods
  for update using (public.get_user_role() in ('admin', 'engineer'));
create policy "Staff delete payments" on public.employee_payment_methods
  for delete using (public.get_user_role() in ('admin', 'engineer'));
