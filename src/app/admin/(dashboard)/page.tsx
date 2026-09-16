import { createClient } from "@/lib/supabase/server";
import BatchDateFilter from "@/components/admin/BatchDateFilter";
import OrdersTable from "@/components/admin/OrdersTable";
import OpenDatesManager from "@/components/admin/OpenDatesManager";
import AddOrderForm from "@/components/admin/AddOrderForm";
import AdminNotepad from "@/components/admin/AdminNotepad";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { from, to } = await searchParams;
  const supabase = await createClient();

  // Fetched once and filtered/sorted in JS below, rather than a first
  // query for just the batch dates followed by a second query for the
  // selected date's rows — with order volume this small, one round trip
  // for everything is cheaper than two sequential ones.
  const [
    { data: allOrders },
    { data: openBatchDates },
    { data: menuItems },
    { data: adminNotes },
  ] = await Promise.all([
    supabase
      .from("orders")
      .select(
        "id, customer_name, contact, batch_date, items, delivery_fee, items_total, grand_total, paid, status, notes, greeting_card, delivery_name, delivery_phone, delivery_address, pickup_time, created_at"
      )
      .order("created_at"),
    supabase.from("open_batch_dates").select("date").order("date"),
    supabase.from("menu_items").select("id, name, price").order("name"),
    supabase.from("admin_notes").select("content").eq("id", "main").maybeSingle(),
  ]);

  const dates = Array.from(
    new Set((allOrders ?? []).map((r) => r.batch_date))
  ).sort();

  const today = new Date().toISOString().slice(0, 10);
  const defaultDate = dates.find((d) => d >= today) ?? dates[dates.length - 1];
  const minDate = dates[0] ?? defaultDate ?? today;
  const maxDate = dates[dates.length - 1] ?? defaultDate ?? today;

  // Clamp requested range into the bounds of dates that actually have
  // orders, so a stale/out-of-range URL param can't produce an empty
  // date picker or a range with nothing to filter against.
  function clamp(value: string | undefined, fallback: string) {
    const v = value || fallback;
    return v < minDate ? minDate : v > maxDate ? maxDate : v;
  }
  const clampedFrom = clamp(from, defaultDate ?? today);
  const clampedTo = clamp(to, defaultDate ?? today);
  const rangeFrom = clampedFrom <= clampedTo ? clampedFrom : clampedTo;
  const rangeTo = clampedFrom <= clampedTo ? clampedTo : clampedFrom;

  const orders = (allOrders ?? [])
    .filter((o) => o.batch_date >= rangeFrom && o.batch_date <= rangeTo)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
          Pre-order dates
        </h2>
        <OpenDatesManager
          dates={(openBatchDates ?? []).map((d) => d.date)}
        />
      </section>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-xl font-semibold text-stone-900">Orders</h1>
          <div className="flex items-center gap-2">
            {dates.length > 0 && (
              <BatchDateFilter
                minDate={minDate}
                maxDate={maxDate}
                from={rangeFrom}
                to={rangeTo}
                basePath="/admin"
              />
            )}
          </div>
        </div>
        <AddOrderForm
          batchDates={(openBatchDates ?? []).map((d) => d.date)}
          menuItems={menuItems ?? []}
        />
      </div>

      {dates.length === 0 ? (
        <p className="rounded-xl border border-stone-200 bg-white p-6 text-sm text-stone-500">
          No orders have been placed yet.
        </p>
      ) : (
        <OrdersTable
          orders={orders}
          rangeFrom={rangeFrom}
          rangeTo={rangeTo}
          menuItems={menuItems ?? []}
        />
      )}

      <AdminNotepad initialContent={adminNotes?.content ?? ""} />
    </div>
  );
}
