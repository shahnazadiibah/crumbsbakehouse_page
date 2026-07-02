import { createClient } from "@/lib/supabase/server";
import BatchDateFilter from "@/components/admin/BatchDateFilter";

export const dynamic = "force-dynamic";

export default async function BakeListPage({
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
    ? await supabase.from("orders").select("items").eq("batch_date", selected)
    : { data: [] };

  const totals = new Map<string, number>();
  for (const order of orders ?? []) {
    for (const item of order.items) {
      totals.set(item.name, (totals.get(item.name) ?? 0) + item.qty);
    }
  }
  const bakeList = Array.from(totals.entries()).sort((a, b) =>
    a[0].localeCompare(b[0])
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-stone-900">Bake list</h1>
        {dates.length > 0 && (
          <BatchDateFilter
            dates={dates}
            selected={selected}
            basePath="/admin/bake-list"
          />
        )}
      </div>

      {dates.length === 0 ? (
        <p className="rounded-xl border border-stone-200 bg-white p-6 text-sm text-stone-500">
          No orders have been placed yet.
        </p>
      ) : bakeList.length === 0 ? (
        <p className="rounded-xl border border-stone-200 bg-white p-6 text-sm text-stone-500">
          No items ordered for this batch.
        </p>
      ) : (
        <div className="divide-y divide-stone-100 rounded-xl border border-stone-200 bg-white">
          {bakeList.map(([name, qty]) => (
            <div
              key={name}
              className="flex items-center justify-between px-4 py-3 text-sm"
            >
              <span className="text-stone-900">{name}</span>
              <span className="font-semibold text-stone-900">{qty}x</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
