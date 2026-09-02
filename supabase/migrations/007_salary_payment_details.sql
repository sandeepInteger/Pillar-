-- Salary payment details: mode, app, reference + weekly kharcha purpose

alter table public.salary_payments
  add column if not exists payment_mode text check (
    payment_mode in ('upi', 'bank', 'cash')
  ),
  add column if not exists payment_app text,
  add column if not exists payment_reference text;

alter table public.salary_payments
  drop constraint if exists salary_payments_payment_type_check;

alter table public.salary_payments
  add constraint salary_payments_payment_type_check check (
    payment_type in (
      'advance',
      'salary',
      'weekly_kharcha',
      'bonus',
      'deduction'
    )
  );

comment on column public.salary_payments.payment_mode is
  'upi, bank (account transfer), or cash';

comment on column public.salary_payments.payment_app is
  'UPI app used e.g. PhonePe, Google Pay';

comment on column public.salary_payments.payment_reference is
  'UPI ID or bank account number used for this payment';
