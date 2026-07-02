-- Adds an optional greeting-card message field to orders.
-- Run this once in the Supabase SQL Editor.

alter table orders add column if not exists greeting_card text;
