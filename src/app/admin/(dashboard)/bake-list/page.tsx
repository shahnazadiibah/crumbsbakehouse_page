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

  const [{ data: orders }, { data: recipes }, { data: ingredients }] =
    selected
      ? await Promise.all([
          supabase
            .from("orders")
            .select("items")
            .eq("batch_date", selected),
          supabase
            .from("recipes")
            .select("menu_item_id, ingredient_id, qty_per_unit"),
          supabase.from("ingredients").select("id, name, unit"),
        ])
      : [{ data: [] }, { data: [] }, { data: [] }];

  const totals = new Map<string, number>();
  for (const order of orders ?? []) {
    for (const item of order.items) {
      totals.set(item.name, (totals.get(item.name) ?? 0) + item.qty);
    }
  }
  const bakeList = Array.from(totals.entries()).sort((a, b) =>
    a[0].localeCompare(b[0])
  );

  const ingredientById = new Map(
    (ingredients ?? []).map((i) => [i.id, { name: i.name, unit: i.unit }])
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

  const ingredientTotals = new Map<string, number>();
  for (const order of orders ?? []) {
    for (const item of order.items) {
      const lines = recipesByMenuItem.get(item.menu_item_id) ?? [];
      for (const line of lines) {
        ingredientTotals.set(
          line.ingredient_id,
          (ingredientTotals.get(line.ingredient_id) ?? 0) +
            line.qty_per_unit * item.qty
        );
      }
    }
  }
  const ingredientNeeds = Array.from(ingredientTotals.entries())
    .map(([ingredientId, qty]) => {
      const ing = ingredientById.get(ingredientId);
      return {
        name: ing?.name ?? "Unknown ingredient",
        unit: ing?.unit ?? "",
        qty,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

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
        <>
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

          <div className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
              Ingredients needed
            </h2>
            {ingredientNeeds.length === 0 ? (
              <p className="rounded-xl border border-stone-200 bg-white p-6 text-sm text-stone-500">
                No recipes are set up for the items in this batch, so
                ingredient needs can&apos;t be calculated. Add recipes on the
                Inventory page.
              </p>
            ) : (
              <div className="divide-y divide-stone-100 rounded-xl border border-stone-200 bg-white">
                {ingredientNeeds.map((ing) => (
                  <div
                    key={ing.name}
                    className="flex items-center justify-between px-4 py-3 text-sm"
                  >
                    <span className="text-stone-900">{ing.name}</span>
                    <span className="font-semibold text-stone-900">
                      {Number(ing.qty.toFixed(2))} {ing.unit}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
