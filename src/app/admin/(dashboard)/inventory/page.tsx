import { createClient } from "@/lib/supabase/server";
import BatchDateFilter from "@/components/admin/BatchDateFilter";
import IngredientsManager from "@/components/admin/IngredientsManager";
import PackagingManager from "@/components/admin/PackagingManager";

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
    { data: packagingItems },
    { data: recipes },
    { data: packagingRecipes },
    { data: allOrders },
    { data: closedBatches },
  ] = await Promise.all([
    supabase
      .from("ingredients")
      .select("id, name, unit, cost_per_unit, stock")
      .order("name"),
    supabase
      .from("packaging_items")
      .select("id, name, unit, cost_per_unit, stock")
      .order("name"),
    supabase
      .from("recipes")
      .select("menu_item_id, ingredient_id, qty_per_unit"),
    supabase
      .from("packaging_recipes")
      .select("menu_item_id, packaging_item_id, qty_per_unit"),
    supabase.from("orders").select("batch_date, items").order("batch_date"),
    supabase.from("batch_history").select("batch_date"),
  ]);

  const closedDates = new Set((closedBatches ?? []).map((b) => b.batch_date));
  const openDates = Array.from(
    new Set((allOrders ?? []).map((r) => r.batch_date))
  )
    .filter((d) => !closedDates.has(d))
    .sort();

  const today = new Date().toISOString().slice(0, 10);
  const defaultDate =
    openDates.find((d) => d >= today) ?? openDates[openDates.length - 1];
  const selectedBatch =
    batch && openDates.includes(batch) ? batch : defaultDate;

  const batchOrders = (allOrders ?? []).filter(
    (o) => o.batch_date === selectedBatch
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

  const neededByIngredient = new Map<string, number>();
  for (const order of batchOrders) {
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

  const packagingRecipesByMenuItem = new Map<
    string,
    { packaging_item_id: string; qty_per_unit: number }[]
  >();
  for (const r of packagingRecipes ?? []) {
    const list = packagingRecipesByMenuItem.get(r.menu_item_id) ?? [];
    list.push({
      packaging_item_id: r.packaging_item_id,
      qty_per_unit: r.qty_per_unit,
    });
    packagingRecipesByMenuItem.set(r.menu_item_id, list);
  }

  const neededByPackaging = new Map<string, number>();
  for (const order of batchOrders) {
    for (const item of order.items) {
      const lines = packagingRecipesByMenuItem.get(item.menu_item_id) ?? [];
      for (const line of lines) {
        neededByPackaging.set(
          line.packaging_item_id,
          (neededByPackaging.get(line.packaging_item_id) ?? 0) +
            line.qty_per_unit * item.qty
        );
      }
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <p className="text-sm text-stone-500">
          &quot;Needed for batch&quot; and &quot;To buy&quot; are calculated
          for the batch selected here.
        </p>
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

      <section className="space-y-3">
        <h1 className="text-xl font-semibold text-stone-900">Ingredients</h1>
        <IngredientsManager
          ingredients={ingredients ?? []}
          neededByIngredient={Object.fromEntries(neededByIngredient)}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-stone-900">Packaging</h2>
        <PackagingManager
          items={packagingItems ?? []}
          neededByPackaging={Object.fromEntries(neededByPackaging)}
        />
      </section>
    </div>
  );
}
