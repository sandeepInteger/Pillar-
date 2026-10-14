-- RA bill type: normal (5% retention, 1% TDS) or labour supply (no
-- retention, 2% TDS). Projects can be marked as having no TDS at all.

alter table public.ra_bills
  add column if not exists bill_type text not null default 'normal'
    check (bill_type in ('normal', 'labour_supply'));

alter table public.projects
  add column if not exists tds_applicable boolean not null default true;
