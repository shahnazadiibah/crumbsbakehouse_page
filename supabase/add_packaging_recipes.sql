-- Adds packaging_recipes: how much of each packaging item one unit of a
-- menu item uses (mirrors recipes, but for packaging_items instead of
-- ingredients). Run this in the Supabase SQL editor after
-- add_packaging_items.sql has already been applied.

create table if not exists packaging_recipes (
  id uuid primary key default gen_random_uuid(),
  menu_item_id uuid not null references menu_items(id) on delete cascade,
  packaging_item_id uuid not null references packaging_items(id) on delete cascade,
  qty_per_unit numeric(12,4) not null check (qty_per_unit >= 0),
  unique (menu_item_id, packaging_item_id)
);

create index if not exists idx_packaging_recipes_menu_item on packaging_recipes(menu_item_id);

alter table packaging_recipes enable row level security;

create policy "admin full access packaging_recipes"
  on packaging_recipes for all
  to authenticated
  using (true)
  with check (true);

insert into packaging_recipes (menu_item_id, packaging_item_id, qty_per_unit)
select mi.id, pi.id, v.qty
from (values
  ('Box Cake 20x20', 'Carrot Cake (Whole)', 1),
  ('Cake board 20x20', 'Carrot Cake (Whole)', 1),
  ('Box Banana 25x12', 'Banana Bread (Loaf)', 1),
  ('Box Banana 25x12', 'Carrot Cake (Whole)', 1),
  ('Cup 8oz', 'Carrot Cake (Cup)', 1),
  ('Spork', 'Carrot Cake (Cup)', 1),
  ('Spunbond Bag 22x22', 'Banana Bread (Loaf)', 1),
  ('Spunbond Bag 22x22', 'Carrot Cake (Whole)', 1),
  ('Candle', 'Carrot Cake (Whole)', 1),
  ('Knife Cake', 'Carrot Cake (Whole)', 1),
  ('Knife Banana', 'Banana Bread (Loaf)', 1),
  ('Sticker round small beige', 'Carrot Cake (Cup)', 1),
  ('Sticker round small green', 'Banana Bread (Slice)', 1),
  ('Sticker round small yellow', 'Carrot Cake (Cup)', 1),
  ('Sticker square cake board', 'Carrot Cake (Whole)', 1),
  ('Sticker how to enjoy carrot cup', 'Carrot Cake (Cup)', 1),
  ('Sticker how to enjoy banana slice', 'Banana Bread (Slice)', 1),
  ('Doff plastic bag banana slice', 'Banana Bread (Slice)', 1),
  ('Greeting Card', 'Banana Bread (Loaf)', 1),
  ('Greeting Card', 'Carrot Cake (Cup)', 1),
  ('Greeting Card', 'Carrot Cake (Whole)', 1),
  ('Paper bag 2cup', 'Carrot Cake (Cup)', 1),
  ('Plastic bag grab delivery 28', 'Banana Bread (Loaf)', 1),
  ('Plastic bag grab delivery 28', 'Carrot Cake (Cup)', 1)
) as v(packaging_name, menu_name, qty)
join packaging_items pi on pi.name = v.packaging_name
join menu_items mi on mi.name = v.menu_name
on conflict do nothing;
