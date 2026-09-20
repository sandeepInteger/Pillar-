-- IGST 18% optional: net in bank = gross - retention - TDS + IGST

alter table public.ra_bills
  add column if not exists gst_applicable boolean not null default false,
  add column if not exists igst_amount numeric(14, 2) not null default 0 check (igst_amount >= 0);

create or replace function public.set_ra_bill_net_amount()
returns trigger as $$
begin
  if new.gst_applicable then
    new.igst_amount := round((new.gross_amount * 0.18)::numeric, 2);
  else
    new.igst_amount := 0;
  end if;

  new.net_amount := round(
    (
      new.gross_amount
      - new.retention_amount
      - new.tds_amount
      + new.igst_amount
    )::numeric,
    2
  );

  if new.retention_amount + new.tds_amount > new.gross_amount then
    raise exception 'Retention + TDS cannot exceed gross amount';
  end if;
  if new.net_amount < 0 then
    raise exception 'Net amount cannot be negative';
  end if;
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;
