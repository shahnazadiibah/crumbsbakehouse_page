-- Adds the extra content fields the pricelist page needs (description,
-- size/format label, allergens, photo) beyond just name + price.
-- Run this once in the Supabase SQL Editor.

alter table menu_items add column if not exists description text;
alter table menu_items add column if not exists size_label text;
alter table menu_items add column if not exists allergens text;
alter table menu_items add column if not exists image_url text;
