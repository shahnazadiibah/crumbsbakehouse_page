-- Simplifies order status to just Pending/Done (drops "Ready"). Existing
-- "Ready" orders are moved to "Done" since they were already prepared.
-- Run this once in the Supabase SQL Editor.

update orders set status = 'Done' where status = 'Ready';

alter table orders drop constraint if exists orders_status_check;
alter table orders add constraint orders_status_check
  check (status in ('Pending', 'Done'));
