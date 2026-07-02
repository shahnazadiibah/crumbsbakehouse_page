# Crumbs Bakehouse — Pre-order Web App

Weekly Saturday pre-order system for a home bakery. Customers browse the
menu, pick a batch date, submit an order, and pay manually via QRIS. Admins
manage orders, inventory, and batch profit from a password-protected
dashboard.

## Stack

- Next.js (App Router, TypeScript, Tailwind)
- Supabase (Postgres + Auth + Storage) — free tier
- Netlify — deployment

## Setup

1. **Create a Supabase project** at [supabase.com](https://supabase.com) (free tier).
2. **Run the schema** — open the SQL Editor in your Supabase project and run,
   in order:
   1. [`supabase/schema.sql`](supabase/schema.sql) — all tables, RLS policies,
      the `payment-assets` storage bucket, and a small seed menu.
   2. [`supabase/close_batch.sql`](supabase/close_batch.sql) — the
      `close_batch()` function used by the admin "close batch" action.
   3. [`supabase/add_greeting_card.sql`](supabase/add_greeting_card.sql) —
      adds the `greeting_card` column to `orders`.
3. **Upload your QRIS image** — in Supabase Storage, upload your static QRIS
   code image to the `payment-assets` bucket as `qris.png`. Must be a static
   merchant QRIS (no fixed amount, no expiry) — a one-time/dynamic QR will
   stop working after its first use.
4. **Create an admin user** — in Supabase Auth (Authentication > Users > Add
   user), add a user (email + password) for yourself; this is who can log in
   to `/admin`.
5. **Copy env vars** — `cp .env.local.example .env.local` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Project Settings > API
   - `SUPABASE_SERVICE_ROLE_KEY` — Project Settings > API (keep secret, server-only)
   - `NEXT_PUBLIC_WHATSAPP_NUMBER` — the bakery's WhatsApp number in international format, digits only (e.g. `6281234567890`)
6. **Run locally**:
   ```bash
   npm install
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) for the customer order
   page, and [http://localhost:3000/admin](http://localhost:3000/admin) for
   the admin dashboard.

## Project structure

- `src/app/page.tsx` — public customer order page
- `src/app/actions/orders.ts` — server action that validates and inserts orders
- `src/lib/batchDates.ts` — upcoming-Saturday / Friday-16:00-cutoff logic
- `src/lib/menuRules.ts` — whole-cake / mandatory-delivery-zone matching,
  shared by the client form and the server action so they can't drift apart
- `src/lib/supabase/` — browser, server, and admin (service-role) Supabase clients
- `supabase/schema.sql` — full database schema, RLS policies, storage bucket, seed data
- `supabase/close_batch.sql` — Postgres function that atomically computes
  revenue/ingredient cost, deducts ingredient stock, and records profit
- `src/app/admin/login/` — admin sign-in (Supabase Auth)
- `src/app/admin/(dashboard)/` — orders, bake list, inventory, and batches pages
- `src/app/actions/admin-*.ts` — server actions for admin mutations (each
  re-checks the session via `requireAdmin()` in addition to the `/admin/*`
  route guard in `src/proxy.ts`)

### Notes on menu items / delivery zones

The order page sorts both `menu_items` and `delivery_zones` by `created_at`
(insertion order), not name or fee, so you control display order by the
order you insert rows. If you edit a row's name later, its `created_at`
stays put — but if several rows share the exact same timestamp (e.g.
inserted in one batch `INSERT`), ties can reorder unpredictably on update.
Give rows distinct `created_at` values if display order matters.

The whole-cake delivery rule (`src/lib/menuRules.ts`) matches menu item
names containing both "cake" and "whole", and delivery zone names
containing "whole cake" — rename either while keeping those substrings, or
update the matcher.

### Admin dashboard

- **Orders** (`/admin`) — filter by batch date, mark paid/unpaid, move
  through Pending → Ready → Done.
- **Bake list** (`/admin/bake-list`) — total quantity of each menu item
  ordered for a batch, for the kitchen.
- **Inventory** (`/admin/inventory`) — manage ingredients (stock, cost,
  reorder threshold) and recipes (how much of each ingredient one unit of a
  menu item consumes).
- **Batches** (`/admin/batches`) — preview revenue/ingredient cost for open
  batches, enter other costs, and close a batch. Closing deducts ingredient
  stock (via recipes) for everything baked and permanently records revenue,
  cost, and profit to batch history — it can't be run twice for the same
  date, so only close a batch once its orders are final.

## Deployment (Netlify)

This app deploys to Netlify via `@netlify/plugin-nextjs` (auto-detected). Set
the same environment variables from `.env.local` in the Netlify site's
**Site configuration > Environment variables**.
