-- Optional debit on an RA bill (client recovery / penalty / material debit).
-- net in bank = gross - retention - TDS + IGST - debit

alter table public.ra_bills
  add column if not exists debit_applicable boolean not null default false,
  add column if not exists debit_amount numeric(14, 2) not null default 0 check (debit_amount >= 0),
  add column if not exists debit_note text;

create or replace function public.set_ra_bill_net_amount()
returns trigger as $$
begin
  if new.gst_applicable then
    new.igst_amount := round((new.gross_amount * 0.18)::numeric, 2);
  else
    new.igst_amount := 0;
  end if;

  if not new.debit_applicable then
    new.debit_amount := 0;
    new.debit_note := null;
  end if;

  new.net_amount := round(
    (
      new.gross_amount
      - new.retention_amount
      - new.tds_amount
      + new.igst_amount
      - new.debit_amount
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
