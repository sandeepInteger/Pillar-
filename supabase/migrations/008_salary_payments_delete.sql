-- Allow engineers to delete salary payments (same as insert/update)

drop policy if exists "Admin delete salary payments" on public.salary_payments;
drop policy if exists "Staff delete salary payments" on public.salary_payments;

create policy "Staff delete salary payments" on public.salary_payments
  for delete using (public.get_user_role() in ('admin', 'engineer'));
