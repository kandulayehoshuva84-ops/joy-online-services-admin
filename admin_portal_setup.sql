alter table public.applications alter column customer_id drop not null;

drop policy if exists "Admin staff insert applications" on public.applications;
create policy "Admin staff insert applications"
on public.applications for insert to authenticated
with check (public.is_admin_or_staff());
