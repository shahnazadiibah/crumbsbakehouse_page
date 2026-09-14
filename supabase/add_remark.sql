-- Adds a free-text remark field to ingredients and packaging items,
-- editable from the COGS tab. Run this in the Supabase SQL editor.

alter table ingredients add column if not exists remark text;
alter table packaging_items add column if not exists remark text;
