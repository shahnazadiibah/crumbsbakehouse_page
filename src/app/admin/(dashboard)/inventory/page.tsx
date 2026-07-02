import { createClient } from "@/lib/supabase/server";
import BatchDateFilter from "@/components/admin/BatchDateFilter";
import IngredientsManager from "@/components/admin/IngredientsManager";
import RecipeEditor from "@/components/admin/RecipeEditor";

export const dynamic = "force-dynamic";

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ batch?: string }>;
}) {
  const { batch } = await searchParams;
  const supabase = await createClient();

  const [
    { data: ingredients },
    { data: menuItems },
    { data: recipes },
    { data: orderBatchDates },
    { data: closedBatches },
  ] = await Promise.all([
    supabase
      .from("ingredients")
      .select("id, name, unit, cost_per_unit, stock")
      .order("name"),
    supabase.from("menu_items").select("id, name").order("name"),
    supabase
      .from("recipes")
      .select("menu_item_id, ingredient_id, qty_per_unit"),
    supabase.from("orders").select("batch_date").order("batch_date"),
    supabase.from("batch_history").select("batch_date"),
  ]);

  const closedDates = new Set((closedBatches ?? []).map((b) => b.batch_date));
  const openDates = Array.from(
    new Set((orderBatchDates ?? []).map((r) => r.batch_date))
  )
    .filter((d) => !closedDates.has(d))
    .sort();

  const today = new Date().toISOString().slice(0, 10);
  const defaultDate =
    openDates.find((d) => d >= today) ?? openDates[openDates.length - 1];
  const selectedBatch =
    batch && openDates.includes(batch) ? batch : defaultDate;

  const { data: batchOrders } = selectedBatch
    ? await supabase
        .from("orders")
        .select("items")
        .eq("batch_date", selectedBatch)
    : { data: [] };

  const recipesByMenuItem = new Map<
    string,
    { ingredient_id: string; qty_per_unit: number }[]
  >();
  for (const r of recipes ?? []) {
    const list = recipesByMenuItem.get(r.menu_item_id) ?? [];
    list.push({ ingredient_id: r.ingredient_id, qty_per_unit: r.qty_per_unit });
    recipesByMenuItem.set(r.menu_item_id, list);
  }

  const neededByIngredient = new Map<string, number>();
  for (const order of batchOrders ?? []) {
    for (const item of order.items) {
      const lines = recipesByMenuItem.get(item.menu_item_id) ?? [];
      for (const line of lines) {
        neededByIngredient.set(
          line.ingredient_id,
          (neededByIngredient.get(line.ingredient_id) ?? 0) +
            line.qty_per_unit * item.qty
        );
      }
    }
  }

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-stone-900">
            Ingredients
          </h1>
          {openDates.length > 0 && (
            <BatchDateFilter
              dates={openDates}
              selected={selectedBatch}
              basePath="/admin/inventory"
            />
          )}
        </div>
        {openDates.length === 0 && (
          <p className="text-sm text-stone-500">
            No open batches yet — &quot;Needed for batch&quot; and &quot;To
            buy&quot; will show once there are orders for an upcoming batch.
          </p>
        )}
        <IngredientsManager
          ingredients={ingredients ?? []}
          neededByIngredient={Object.fromEntries(neededByIngredient)}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-stone-900">Recipes</h2>
        <p className="text-sm text-stone-500">
          Define how much of each ingredient one unit of a menu item uses.
          This drives ingredient deduction when a batch is closed.
        </p>
        <RecipeEditor
          menuItems={menuItems ?? []}
          ingredients={ingredients ?? []}
          recipes={recipes ?? []}
        />
      </section>
    </div>
  );
}
