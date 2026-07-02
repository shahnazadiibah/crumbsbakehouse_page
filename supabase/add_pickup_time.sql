-- Adds a pickup-time-estimate field to orders, required for self-arranged
-- delivery options (Self Pick Up, Self Order Delivery Services).
-- Run this once in the Supabase SQL Editor.

alter table orders add column if not exists pickup_time text;
