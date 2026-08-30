-- Phase 1: People master + Admin/Engineer roles
-- Run this in Supabase SQL Editor

-- Profiles (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text,
  role text not null default 'engineer' check (role in ('admin', 'engineer')),
  created_at timestamptz default now()
);

-- Employees
create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  employee_code text unique,
  full_name text not null,
  photo_url text,
  employee_type text not null check (employee_type in ('founder', 'staff', 'engineer', 'foreman', 'labour')),
  designation text,
  status text not null default 'active' check (status in ('active', 'inactive', 'left')),
  start_date date,
  end_date date,
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  pincode text,
  landmark text,
  emergency_contact_name text,
  emergency_contact_phone text,
  aadhaar_last_4 text,
  pan_number text,
  notes text,
  created_by uuid references auth.users,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.employee_phones (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees on delete cascade,
  phone_number text not null,
  label text default 'primary',
  is_primary boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.employee_payment_methods (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees on delete cascade,
  method_type text not null check (method_type in ('bank', 'upi')),
  is_primary boolean default false,
  account_holder_name text,
  bank_name text,
  account_number text,
  ifsc_code text,
  upi_id text,
  upi_phone text,
  notes text,
  created_at timestamptz default now()
);

-- Auto employee code
create or replace function public.generate_employee_code()
returns trigger as $$
declare
  next_num int;
begin
  if new.employee_code is null then
    select coalesce(max(cast(substring(employee_code from 5) as int)), 0) + 1
    into next_num
    from public.employees
    where employee_code ~ '^EMP-[0-9]+$';
    new.employee_code := 'EMP-' || lpad(next_num::text, 3, '0');
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_employee_code on public.employees;
create trigger set_employee_code
  before insert on public.employees
  for each row execute function public.generate_employee_code();

-- Updated_at trigger
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists employees_updated_at on public.employees;
create trigger employees_updated_at
  before update on public.employees
  for each row execute function public.set_updated_at();

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    coalesce(new.raw_user_meta_data->>'role', 'engineer')
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;
alter table public.employees enable row level security;
alter table public.employee_phones enable row level security;
alter table public.employee_payment_methods enable row level security;

create or replace function public.get_user_role()
returns text as $$
  select role from public.profiles where id = auth.uid();
$$ language sql stable security definer;

-- Profiles: users read own profile
drop policy if exists "Users read own profile" on public.profiles;
create policy "Users read own profile" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Employees: admin and engineer full access except delete (admin only)
drop policy if exists "Staff read employees" on public.employees;
create policy "Staff read employees" on public.employees
  for select using (public.get_user_role() in ('admin', 'engineer'));

drop policy if exists "Staff insert employees" on public.employees;
create policy "Staff insert employees" on public.employees
  for insert with check (public.get_user_role() in ('admin', 'engineer'));

drop policy if exists "Staff update employees" on public.employees;
create policy "Staff update employees" on public.employees
  for update using (public.get_user_role() in ('admin', 'engineer'));

drop policy if exists "Admin delete employees" on public.employees;
create policy "Admin delete employees" on public.employees
  for delete using (public.get_user_role() = 'admin');

-- Phones
drop policy if exists "Staff manage phones" on public.employee_phones;
create policy "Staff manage phones" on public.employee_phones
  for all using (
    public.get_user_role() in ('admin', 'engineer')
    and exists (select 1 from public.employees e where e.id = employee_id)
  );

-- Payment methods
drop policy if exists "Staff manage payments" on public.employee_payment_methods;
create policy "Staff manage payments" on public.employee_payment_methods
  for all using (
    public.get_user_role() in ('admin', 'engineer')
    and exists (select 1 from public.employees e where e.id = employee_id)
  );

-- Storage bucket for photos (run separately if needed)
insert into storage.buckets (id, name, public)
values ('employee-photos', 'employee-photos', true)
on conflict (id) do nothing;

drop policy if exists "Public read employee photos" on storage.objects;
create policy "Public read employee photos" on storage.objects
  for select using (bucket_id = 'employee-photos');

drop policy if exists "Staff upload employee photos" on storage.objects;
create policy "Staff upload employee photos" on storage.objects
  for insert with check (
    bucket_id = 'employee-photos'
    and public.get_user_role() in ('admin', 'engineer')
  );

drop policy if exists "Staff update employee photos" on storage.objects;
create policy "Staff update employee photos" on storage.objects
  for update using (
    bucket_id = 'employee-photos'
    and public.get_user_role() in ('admin', 'engineer')
  );

drop policy if exists "Staff delete employee photos" on storage.objects;
create policy "Staff delete employee photos" on storage.objects
  for delete using (
    bucket_id = 'employee-photos'
    and public.get_user_role() in ('admin', 'engineer')
  );
