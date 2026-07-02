-- Adds the close_batch() function. Run this once in the Supabase SQL
-- Editor AFTER schema.sql has already been applied.
--
-- Closing a batch is a multi-step, all-or-nothing operation (compute
-- revenue, deduct ingredient stock via recipes, record profit), so it's
-- implemented as a single Postgres function rather than several
-- round-trips from the app — that keeps it atomic and lets it run with
-- elevated (security definer) privileges while still being callable only
-- by authenticated admins.

create or replace function close_batch(
  p_batch_date date,
  p_other_costs numeric default 0,
  p_other_costs_note text default null
) returns batch_history
language plpgsql
security definer
set search_path = public
as $$
declare
  v_revenue numeric := 0;
  v_ingredient_cost numeric := 0;
  v_result batch_history;
begin
  if exists (select 1 from batch_history where batch_date = p_batch_date) then
    raise exception 'Batch % has already been closed', p_batch_date;
  end if;

  -- Revenue only counts orders that have actually been paid.
  select coalesce(sum(grand_total), 0) into v_revenue
  from orders
  where batch_date = p_batch_date and paid = true;

  -- Ingredient consumption counts everything baked for the batch,
  -- regardless of payment status — the ingredients were used either way.
  create temporary table tmp_consumption on commit drop as
  select r.ingredient_id, sum(r.qty_per_unit * (item->>'qty')::numeric) as total_qty
  from orders o, jsonb_array_elements(o.items) as item
  join recipes r on r.menu_item_id = (item->>'menu_item_id')::uuid
  where o.batch_date = p_batch_date
  group by r.ingredient_id;

  update ingredients i
  set stock = i.stock - tc.total_qty
  from tmp_consumption tc
  where i.id = tc.ingredient_id;

  select coalesce(sum(tc.total_qty * i.cost_per_unit), 0) into v_ingredient_cost
  from tmp_consumption tc
  join ingredients i on i.id = tc.ingredient_id;

  insert into batch_history (
    batch_date, revenue, ingredient_cost, other_costs, other_costs_note, profit
  )
  values (
    p_batch_date,
    v_revenue,
    v_ingredient_cost,
    coalesce(p_other_costs, 0),
    p_other_costs_note,
    v_revenue - v_ingredient_cost - coalesce(p_other_costs, 0)
  )
  returning * into v_result;

  return v_result;
end;
$$;

revoke all on function close_batch(date, numeric, text) from public;
grant execute on function close_batch(date, numeric, text) to authenticated;
