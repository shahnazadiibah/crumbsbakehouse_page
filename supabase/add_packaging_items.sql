-- Adds a packaging_items table (Inventory tab's new "Packaging" section).
-- Mirrors ingredients' shape/RLS but isn't linked to recipes — packaging
-- usage isn't tracked per order, just as a stock list.
-- Run this in the Supabase SQL editor (Project > SQL Editor > New query)

create table if not exists packaging_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  unit text not null default '',
  cost_per_unit numeric(12,2) not null default 0,
  stock numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

alter table packaging_items enable row level security;

create policy "admin full access packaging_items"
  on packaging_items for all
  to authenticated
  using (true)
  with check (true);

insert into packaging_items (name) values
  ('Box Cake 20x20'),
  ('Cake board 20x20'),
  ('Box Banana 25x12'),
  ('Cup 8oz'),
  ('Spork'),
  ('Spunbond Bag 22x22'),
  ('Candle'),
  ('Knife Cake'),
  ('Knife Banana'),
  ('Sticker round small beige'),
  ('Sticker round small green'),
  ('Sticker round small yellow'),
  ('Sticker square cake board'),
  ('Sticker how to enjoy carrot cup'),
  ('Sticker how to enjoy banana slice'),
  ('Doff plastic bag banana slice'),
  ('Greeting Card'),
  ('Paper bag 2cup'),
  ('Plastic bag grab delivery 28')
on conflict do nothing;
