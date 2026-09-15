-- Adds a single-row table for the admin's free-text notepad on the
-- Orders tab. Run this once in the Supabase SQL Editor.

create table if not exists admin_notes (
  id text primary key default 'main',
  content text not null default '',
  updated_at timestamptz not null default now()
);

alter table admin_notes enable row level security;

create policy "admin full access admin_notes"
  on admin_notes for all
  to authenticated
  using (true)
  with check (true);
