import { createClient } from "@/lib/supabase/server";
import PrintButton from "@/components/admin/PrintButton";

export const dynamic = "force-dynamic";

function formatBatchLabel(date: string) {
  return new Date(date + "T00:00:00Z").toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default async function PrintLabelsPage({
  searchParams,
}: {
  searchParams: Promise<{ batch?: string }>;
}) {
  const { batch } = await searchParams;
  const supabase = await createClient();

  if (!batch) {
    return (
      <div className="p-8 text-sm text-stone-500">
        Missing ?batch= date. Open this page from the Orders tab.
      </div>
    );
  }

  const { data: orders } = await supabase
    .from("orders")
    .select(
      "id, delivery_name, delivery_phone, delivery_address, items, pickup_time"
    )
    .eq("batch_date", batch)
    .order("created_at");

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-6">
      <div className="flex items-center justify-between print:hidden">
        <h1 className="text-xl font-semibold text-stone-900">
          Delivery labels — {formatBatchLabel(batch)}
        </h1>
        <PrintButton />
      </div>

      {(orders ?? []).length === 0 ? (
        <p className="text-sm text-stone-500">No orders for this batch.</p>
      ) : (
        <div className="space-y-4 print:space-y-0">
          {(orders ?? []).map((order) => (
            <div
              key={order.id}
              className="break-inside-avoid rounded-xl border border-stone-300 p-5 text-sm print:break-after-page print:rounded-none print:border-2"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                Recipient
              </p>
              <p className="text-lg font-bold text-stone-900">
                {order.delivery_name}
              </p>
              <p className="text-stone-700">No. HP: {order.delivery_phone}</p>
              <p className="mt-1 whitespace-pre-wrap text-stone-700">
                {order.delivery_address}
              </p>
              {order.pickup_time && (
                <p className="mt-1 text-stone-700">
                  Pick-up: {order.pickup_time}
                </p>
              )}

              <div className="mt-3 border-t border-stone-200 pt-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                  Order
                </p>
                {order.items.map((item, i) => (
                  <p key={i} className="text-stone-800">
                    {item.qty}x {item.name}
                    {item.topper && ` — Topper: "${item.topper}"`}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
