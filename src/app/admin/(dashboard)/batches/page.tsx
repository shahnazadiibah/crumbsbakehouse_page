import { createClient } from "@/lib/supabase/server";
import CloseBatchCard from "@/components/admin/CloseBatchCard";
import { formatIDR } from "@/lib/format";

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

export default async function BatchesPage() {
  const supabase = await createClient();

  const [
    { data: orders },
    { data: closedBatches },
    { data: recipes },
    { data: ingredients },
  ] = await Promise.all([
    supabase.from("orders").select("batch_date, paid, grand_total, items"),
    supabase
      .from("batch_history")
      .select("*")
      .order("batch_date", { ascending: false }),
    supabase
      .from("recipes")
      .select("menu_item_id, ingredient_id, qty_per_unit"),
    supabase.from("ingredients").select("id, cost_per_unit"),
  ]);

  const closedDates = new Set((closedBatches ?? []).map((b) => b.batch_date));
  const openDates = Array.from(
    new Set((orders ?? []).map((o) => o.batch_date))
  )
    .filter((d) => !closedDates.has(d))
    .sort();

  const costByIngredientId = new Map(
    (ingredients ?? []).map((i) => [i.id, i.cost_per_unit])
  );
  const recipesByMenuItem = new Map<
    string,
    { ingredient_id: string; qty_per_unit: number }[]
  >();
  for (const r of recipes ?? []) {
    const list = recipesByMenuItem.get(r.menu_item_id) ?? [];
    list.push({ ingredient_id: r.ingredient_id, qty_per_unit: r.qty_per_unit });
    recipesByMenuItem.set(r.menu_item_id, list);
  }

  function previewFor(batchDate: string) {
    const batchOrders = (orders ?? []).filter(
      (o) => o.batch_date === batchDate
    );
    const revenue = batchOrders
      .filter((o) => o.paid)
      .reduce((sum, o) => sum + o.grand_total, 0);

    let ingredientCost = 0;
    for (const order of batchOrders) {
      for (const item of order.items) {
        const lines = recipesByMenuItem.get(item.menu_item_id) ?? [];
        for (const line of lines) {
          const cost = costByIngredientId.get(line.ingredient_id) ?? 0;
          ingredientCost += line.qty_per_unit * item.qty * cost;
        }
      }
    }
    return { revenue, ingredientCost };
  }

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h1 className="text-xl font-semibold text-stone-900">Open batches</h1>
        {openDates.length === 0 ? (
          <p className="rounded-xl border border-stone-200 bg-white p-6 text-sm text-stone-500">
            No open batches to close right now.
          </p>
        ) : (
          <div className="space-y-4">
            {openDates.map((date) => {
              const { revenue, ingredientCost } = previewFor(date);
              return (
                <CloseBatchCard
                  key={date}
                  batchDate={date}
                  label={formatBatchLabel(date)}
                  revenuePreview={revenue}
                  ingredientCostPreview={ingredientCost}
                />
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-stone-900">
          Batch history
        </h2>
        {(closedBatches ?? []).length === 0 ? (
          <p className="rounded-xl border border-stone-200 bg-white p-6 text-sm text-stone-500">
            No batches closed yet.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-stone-200 bg-stone-50 text-left text-xs uppercase tracking-wide text-stone-500">
                <tr>
                  <th className="px-4 py-3">Batch</th>
                  <th className="px-4 py-3">Revenue</th>
                  <th className="px-4 py-3">Ingredient cost</th>
                  <th className="px-4 py-3">Other costs</th>
                  <th className="px-4 py-3">Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {(closedBatches ?? []).map((b) => (
                  <tr key={b.id}>
                    <td className="px-4 py-3 font-medium text-stone-900">
                      {formatBatchLabel(b.batch_date)}
                    </td>
                    <td className="px-4 py-3">{formatIDR(b.revenue)}</td>
                    <td className="px-4 py-3">
                      {formatIDR(b.ingredient_cost)}
                    </td>
                    <td className="px-4 py-3">
                      {formatIDR(b.other_costs)}
                      {b.other_costs_note && (
                        <span className="ml-1 text-stone-400">
                          ({b.other_costs_note})
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-semibold text-stone-900">
                      {formatIDR(b.profit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
