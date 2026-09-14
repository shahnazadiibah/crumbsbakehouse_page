-- Adds admin-controlled pre-order dates, replacing the old hardcoded
-- "every Saturday" rule. Any calendar date the admin adds here becomes
-- selectable on the public order page (subject to the app's D-2 lead
-- time rule). Run this in the Supabase SQL editor.

create table if not exists open_batch_dates (
  date date primary key,
  created_at timestamptz not null default now()
);

alter table open_batch_dates enable row level security;

create policy "public read open batch dates"
  on open_batch_dates for select
  using (true);

create policy "admin full access open batch dates"
  on open_batch_dates for all
  to authenticated
  using (true)
  with check (true);
