alter table public.ra_bills
  add column if not exists contractor_name text;
