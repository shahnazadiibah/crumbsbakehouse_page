-- Crumbs Bakehouse — Supabase schema
-- Run this in the Supabase SQL editor (Project > SQL Editor > New query)

-- ============================================================
-- Extensions
-- ============================================================
create extension if not exists "pgcrypto";

-- ============================================================
-- Tables
-- ============================================================

create table if not exists menu_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric(12,2) not null check (price >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists delivery_zones (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  fee numeric(12,2) not null check (fee >= 0),
  created_at timestamptz not null default now()
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  contact text not null,
  batch_date date not null,
  items jsonb not null, -- [{ menu_item_id, name, price, qty, topper? }]
  zone_id uuid references delivery_zones(id),
  delivery_fee numeric(12,2) not null default 0,
  items_total numeric(12,2) not null,
  grand_total numeric(12,2) not null,
  paid boolean not null default false,
  status text not null default 'Pending' check (status in ('Pending', 'Ready', 'Done')),
  notes text,
  greeting_card text,
  delivery_name text,
  delivery_phone text,
  delivery_address text,
  pickup_time text,
  created_at timestamptz not null default now()
);

create table if not exists ingredients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  unit text not null,
  cost_per_unit numeric(12,2) not null default 0,
  stock numeric(12,2) not null default 0,
  reorder_threshold numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists recipes (
  id uuid primary key default gen_random_uuid(),
  menu_item_id uuid not null references menu_items(id) on delete cascade,
  ingredient_id uuid not null references ingredients(id) on delete cascade,
  qty_per_unit numeric(12,4) not null check (qty_per_unit >= 0),
  unique (menu_item_id, ingredient_id)
);

create table if not exists batch_history (
  id uuid primary key default gen_random_uuid(),
  batch_date date not null,
  revenue numeric(12,2) not null default 0,
  ingredient_cost numeric(12,2) not null default 0,
  other_costs numeric(12,2) not null default 0,
  other_costs_note text,
  profit numeric(12,2) not null default 0,
  archived_at timestamptz not null default now()
);

-- Helpful indexes
create index if not exists idx_orders_batch_date on orders(batch_date);
create index if not exists idx_orders_status on orders(status);
create index if not exists idx_recipes_menu_item on recipes(menu_item_id);

-- ============================================================
-- Row Level Security
-- ============================================================
-- Public customers only need to: read active menu items, read delivery
-- zones, and insert new orders. Everything else (including reading
-- existing orders, ingredients, recipes, batch_history, and any update
-- /delete) is restricted to authenticated admin users.

alter table menu_items enable row level security;
alter table delivery_zones enable row level security;
alter table orders enable row level security;
alter table ingredients enable row level security;
alter table recipes enable row level security;
alter table batch_history enable row level security;

-- menu_items: public can read active items only; admins (authenticated) can do anything
create policy "public read active menu items"
  on menu_items for select
  using (active = true);

create policy "admin full access menu items"
  on menu_items for all
  to authenticated
  using (true)
  with check (true);

-- delivery_zones: public can read all zones; admins manage
create policy "public read delivery zones"
  on delivery_zones for select
  using (true);

create policy "admin full access delivery zones"
  on delivery_zones for all
  to authenticated
  using (true)
  with check (true);

-- orders: public (anon) can only INSERT; cannot read/update/delete.
-- Admins (authenticated) have full access.
create policy "public can insert orders"
  on orders for insert
  to anon
  with check (true);

create policy "admin full access orders"
  on orders for all
  to authenticated
  using (true)
  with check (true);

-- ingredients, recipes, batch_history: admin only, no public access at all
create policy "admin full access ingredients"
  on ingredients for all
  to authenticated
  using (true)
  with check (true);

create policy "admin full access recipes"
  on recipes for all
  to authenticated
  using (true)
  with check (true);

create policy "admin full access batch_history"
  on batch_history for all
  to authenticated
  using (true)
  with check (true);

-- ============================================================
-- Storage: bucket for the static QRIS payment image
-- ============================================================
insert into storage.buckets (id, name, public)
values ('payment-assets', 'payment-assets', true)
on conflict (id) do nothing;

create policy "public read payment assets"
  on storage.objects for select
  using (bucket_id = 'payment-assets');

create policy "admin manage payment assets"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'payment-assets')
  with check (bucket_id = 'payment-assets');

-- ============================================================
-- Seed data (edit to match the real menu)
-- ============================================================
-- Inserted in display order (the order page sorts menu items by created_at).
insert into menu_items (name, price, active) values
  ('Banana Bread (Loaf)', 175000, true),
  ('Banana Bread (Slice)', 22000, true),
  ('Carrot Cake (Whole)', 385000, true),
  ('Carrot Cake (Cup)', 42000, true)
on conflict do nothing;

-- Inserted in display order (the order page sorts zones by created_at).
-- The "Grab Instant Car" zone name is matched by the app (substring "whole
-- cake") to auto-enforce it for whole-cake orders — keep that phrase if you
-- rename it. See isWholeCakeItem/isMandatoryWholeCakeZone in src/lib/menuRules.ts.
insert into delivery_zones (name, fee) values
  ('Grab Sameday Bike (Preferred)', 32000),
  ('Grab Instant Car (Mandatory for whole cake delivery, confirm fee with admin)', 0),
  ('Grab Instant Bike (Confirm fee with admin)', 0),
  ('Self Order Delivery Services', 0),
  ('Self Pick Up', 0)
on conflict do nothing;
