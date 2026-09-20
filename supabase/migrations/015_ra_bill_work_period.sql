-- Work period + optional backfill for existing rows

alter table public.ra_bills
  add column if not exists work_period_start date,
  add column if not exists work_period_end date;

update public.ra_bills
set
  work_period_start = coalesce(work_period_start, confirmed_date),
  work_period_end = coalesce(work_period_end, confirmed_date)
where work_period_start is null or work_period_end is null;
