import { createClient } from "@/lib/supabase/server";
import PrintButton from "@/components/admin/PrintButton";

export const dynamic = "force-dynamic";

const LABELS_PER_PAGE = 10;

function formatBatchLabel(date: string) {
  return new Date(date + "T00:00:00Z").toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
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
      "id, delivery_name, delivery_phone, delivery_address, items, pickup_time, greeting_card"
    )
    .eq("batch_date", batch)
    .order("created_at");

  const pages = chunk(orders ?? [], LABELS_PER_PAGE);

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-6 print:mx-0 print:max-w-none print:p-0">
      <style>{`
        @page { size: A4; margin: 8mm; }
      `}</style>

      <div className="flex items-center justify-between print:hidden">
        <h1 className="text-xl font-semibold text-stone-900">
          Delivery labels — {formatBatchLabel(batch)}
        </h1>
        <PrintButton />
      </div>

      {pages.length === 0 ? (
        <p className="text-sm text-stone-500">No orders for this batch.</p>
      ) : (
        pages.map((pageOrders, pageIndex) => (
          <div
            key={pageIndex}
            className="grid grid-cols-2 gap-2 print:break-after-page print:gap-1 print:last:break-after-auto"
          >
            {pageOrders.map((order) => {
              const toppers = order.items
                .map((item) => item.topper)
                .filter((t): t is string => Boolean(t));
              const hasGreetingCard = Boolean(order.greeting_card?.trim());
              const hasTopper = toppers.length > 0;

              return (
                <div
                  key={order.id}
                  className="break-inside-avoid rounded-lg border border-stone-300 p-3 text-xs leading-tight print:rounded-none print:border print:border-black"
                  style={{ minHeight: "56mm" }}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-500">
                    Recipient
                  </p>
                  <p className="text-sm font-bold text-stone-900">
                    {order.delivery_name}
                  </p>
                  <p className="text-stone-700">{order.delivery_phone}</p>
                  <p className="mt-1 whitespace-pre-wrap text-stone-700">
                    {order.delivery_address}
                  </p>
                  {order.pickup_time && (
                    <p className="mt-1 text-stone-700">
                      Pick-up: {order.pickup_time}
                    </p>
                  )}

                  {(hasGreetingCard || hasTopper) && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {hasGreetingCard && (
                        <span className="rounded border border-black px-1 py-0.5 font-bold uppercase">
                          Greeting Card
                        </span>
                      )}
                      {hasTopper && (
                        <span className="rounded border border-black px-1 py-0.5 font-bold uppercase">
                          Cake Topper
                        </span>
                      )}
                    </div>
                  )}
                  {hasGreetingCard && (
                    <p className="mt-1 whitespace-pre-wrap text-stone-800">
                      &quot;{order.greeting_card}&quot;
                    </p>
                  )}

                  <div className="mt-1.5 border-t border-stone-200 pt-1.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-500">
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
              );
            })}
          </div>
        ))
      )}
    </div>
  );
}
