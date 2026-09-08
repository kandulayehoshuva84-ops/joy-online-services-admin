-- BLO data security baseline for the existing Supabase project.
-- Run in the Supabase SQL Editor only after confirming that public.is_admin_or_staff()
-- is the existing authorization function used by this application.
alter table public.blo_voters enable row level security;
alter table public.blo_field_visits enable row level security;

drop policy if exists "Authorized staff manage BLO voters" on public.blo_voters;
create policy "Authorized staff manage BLO voters" on public.blo_voters
for all to authenticated using (public.is_admin_or_staff())
with check (public.is_admin_or_staff());

drop policy if exists "Authorized staff manage BLO field visits" on public.blo_field_visits;
create policy "Authorized staff manage BLO field visits" on public.blo_field_visits
for all to authenticated using (public.is_admin_or_staff())
with check (public.is_admin_or_staff());

-- Keep photos private in the existing Documents bucket. No public read policy is created.
drop policy if exists "Authorized staff manage BLO private photos" on storage.objects;
create policy "Authorized staff manage BLO private photos" on storage.objects
for all to authenticated
using (bucket_id = 'Documents' and name like ('blo/' || (select auth.uid())::text || '/%') and public.is_admin_or_staff())
with check (bucket_id = 'Documents' and name like ('blo/' || (select auth.uid())::text || '/%') and public.is_admin_or_staff());
