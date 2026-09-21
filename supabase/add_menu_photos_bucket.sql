-- Adds a public Storage bucket for menu item photos (used by the
-- "Photo URL" field on Admin > Menu & Pricelist, and shown on the public
-- /pricelist page). Run this once in the Supabase SQL Editor.

insert into storage.buckets (id, name, public)
values ('menu-photos', 'menu-photos', true)
on conflict (id) do nothing;

create policy "public read menu photos"
  on storage.objects for select
  using (bucket_id = 'menu-photos');

create policy "admin manage menu photos"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'menu-photos')
  with check (bucket_id = 'menu-photos');
