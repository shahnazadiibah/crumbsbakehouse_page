-- Adds a per-item discount percentage to menu_items. The discounted
-- price (price * (1 - discount_percent/100)) is what customers see and
-- pay, both on /pricelist and when ordering on /order.
-- Run this once in the Supabase SQL Editor.

alter table menu_items
  add column if not exists discount_percent numeric(5,2) not null default 0
  check (discount_percent >= 0 and discount_percent <= 100);
