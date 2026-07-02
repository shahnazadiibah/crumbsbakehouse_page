import { createClient } from "@/lib/supabase/server";
import BatchDateFilter from "@/components/admin/BatchDateFilter";
import OrdersTable from "@/components/admin/OrdersTable";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ batch?: string }>;
}) {
  const { batch } = await searchParams;
  const supabase = await createClient();

  const { data: batchRows } = await supabase
    .from("orders")
    .select("batch_date")
    .order("batch_date");

  const dates = Array.from(
    new Set((batchRows ?? []).map((r) => r.batch_date))
  ).sort();

  const today = new Date().toISOString().slice(0, 10);
  const defaultDate = dates.find((d) => d >= today) ?? dates[dates.length - 1];
  const selected = batch && dates.includes(batch) ? batch : defaultDate;

  const { data: orders } = selected
    ? await supabase
        .from("orders")
        .select(
          "id, customer_name, contact, items, delivery_fee, items_total, grand_total, paid, status, notes, greeting_card, delivery_name, delivery_phone, delivery_address"
        )
        .eq("batch_date", selected)
        .order("created_at")
    : { data: [] };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-stone-900">Orders</h1>
        {dates.length > 0 && (
          <BatchDateFilter
            dates={dates}
            selected={selected}
            basePath="/admin"
          />
        )}
      </div>

      {dates.length === 0 ? (
        <p className="rounded-xl border border-stone-200 bg-white p-6 text-sm text-stone-500">
          No orders have been placed yet.
        </p>
      ) : (
        <OrdersTable orders={orders ?? []} batchDate={selected} />
      )}
    </div>
  );
}
