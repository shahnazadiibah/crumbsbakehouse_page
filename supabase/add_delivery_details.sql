-- Adds delivery recipient fields to orders (name/phone/address may differ
-- from the customer placing the order, e.g. gift orders).
-- Run this once in the Supabase SQL Editor.

alter table orders add column if not exists delivery_name text;
alter table orders add column if not exists delivery_phone text;
alter table orders add column if not exists delivery_address text;
