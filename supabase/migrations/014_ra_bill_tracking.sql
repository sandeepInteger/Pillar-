-- RA Bill payment tracking (project-wise, no BOQ)

create table if not exists public.ra_bills (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects on delete cascade,
  bill_label text not null,
  confirmed_date date not null,
  gross_amount numeric(14, 2) not null check (gross_amount >= 0),
  retention_amount numeric(14, 2) not null default 0 check (retention_amount >= 0),
  tds_amount numeric(14, 2) not null default 0 check (tds_amount >= 0),
  net_amount numeric(14, 2) not null check (net_amount >= 0),
  bank_received_date date,
  bank_received_amount numeric(14, 2) check (bank_received_amount is null or bank_received_amount >= 0),
  notes text,
  created_by uuid references auth.users,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists ra_bills_project_idx on public.ra_bills (project_id);
create index if not exists ra_bills_confirmed_date_idx on public.ra_bills (confirmed_date desc);

create or replace function public.set_ra_bill_net_amount()
returns trigger as $$
begin
  new.net_amount := round(
    (new.gross_amount - new.retention_amount - new.tds_amount)::numeric,
    2
  );
  if new.net_amount < 0 then
    raise exception 'Retention + TDS cannot exceed gross amount';
  end if;
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists ra_bills_net_amount on public.ra_bills;
create trigger ra_bills_net_amount
  before insert or update on public.ra_bills
  for each row execute function public.set_ra_bill_net_amount();

alter table public.ra_bills enable row level security;

drop policy if exists "Staff read ra_bills" on public.ra_bills;
create policy "Staff read ra_bills" on public.ra_bills
  for select using (public.get_user_role() in ('admin', 'engineer'));

drop policy if exists "Staff insert ra_bills" on public.ra_bills;
create policy "Staff insert ra_bills" on public.ra_bills
  for insert with check (public.get_user_role() in ('admin', 'engineer'));

drop policy if exists "Staff update ra_bills" on public.ra_bills;
create policy "Staff update ra_bills" on public.ra_bills
  for update using (public.get_user_role() in ('admin', 'engineer'));

drop policy if exists "Admin delete ra_bills" on public.ra_bills;
create policy "Admin delete ra_bills" on public.ra_bills
  for delete using (public.get_user_role() = 'admin');
