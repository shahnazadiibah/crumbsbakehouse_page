import { createClient } from "@/lib/supabase/server";
import BatchDateFilter from "@/components/admin/BatchDateFilter";
import IngredientNeeds from "@/components/admin/IngredientNeeds";
import { getProductFamily } from "@/lib/menuRules";

export const dynamic = "force-dynamic";

export default async function BakeListPage({
  searchParams,
}: {
  searchParams: Promise<{ batch?: string }>;
}) {
  const { batch } = await searchParams;
  const supabase = await createClient();

  const [{ data: allOrders }, { data: recipes }, { data: ingredients }] =
    await Promise.all([
      supabase.from("orders").select("batch_date, items").order("batch_date"),
      supabase
        .from("recipes")
        .select("menu_item_id, ingredient_id, qty_per_unit"),
      supabase.from("ingredients").select("id, name, unit"),
    ]);

  const dates = Array.from(
    new Set((allOrders ?? []).map((r) => r.batch_date))
  ).sort();

  const today = new Date().toISOString().slice(0, 10);
  const defaultDate = dates.find((d) => d >= today) ?? dates[dates.length - 1];
  const selected = batch && dates.includes(batch) ? batch : defaultDate;

  const orders = (allOrders ?? []).filter((o) => o.batch_date === selected);

  const totals = new Map<string, number>();
  for (const order of orders) {
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

  const totalsByFamily = new Map<string, Map<string, number>>();
  for (const order of orders) {
    for (const item of order.items) {
      const lines = recipesByMenuItem.get(item.menu_item_id) ?? [];
      if (lines.length === 0) continue;

      const family = getProductFamily(item.name);
      const familyTotals = totalsByFamily.get(family) ?? new Map();
      for (const line of lines) {
        familyTotals.set(
          line.ingredient_id,
          (familyTotals.get(line.ingredient_id) ?? 0) +
            line.qty_per_unit * item.qty
        );
      }
      totalsByFamily.set(family, familyTotals);
    }
  }

  // The "individual recipe amount" for a family is the recipe of whichever
  // of its menu items uses the most ingredients in total (the full-size
  // variant, e.g. the whole loaf/cake) — the other variants (slice, cup)
  // are fractions of that same recipe, not separate recipes.
  const familyToMenuItems = new Map<string, string[]>();
  const menuItemNameById = new Map<string, string>();
  for (const order of orders) {
    for (const item of order.items) {
      menuItemNameById.set(item.menu_item_id, item.name);
    }
  }
  for (const [menuItemId, name] of menuItemNameById) {
    const family = getProductFamily(name);
    const list = familyToMenuItems.get(family) ?? [];
    list.push(menuItemId);
    familyToMenuItems.set(family, list);
  }

  const baseRecipeByFamily = new Map<string, Map<string, number>>();
  for (const [family, menuItemIds] of familyToMenuItems) {
    let bestMenuItemId: string | null = null;
    let bestTotal = -1;
    for (const menuItemId of menuItemIds) {
      const lines = recipesByMenuItem.get(menuItemId) ?? [];
      const total = lines.reduce((sum, l) => sum + l.qty_per_unit, 0);
      if (total > bestTotal) {
        bestTotal = total;
        bestMenuItemId = menuItemId;
      }
    }
    const lines = bestMenuItemId ? recipesByMenuItem.get(bestMenuItemId) ?? [] : [];
    baseRecipeByFamily.set(
      family,
      new Map(lines.map((l) => [l.ingredient_id, l.qty_per_unit]))
    );
  }

  const ingredientNeedsByFamily = Array.from(totalsByFamily.entries())
    .map(([family, ingredientTotals]) => {
      const baseRecipe = baseRecipeByFamily.get(family) ?? new Map();
      return {
        family,
        ingredients: Array.from(ingredientTotals.entries())
          .map(([ingredientId, qty]) => {
            const ing = ingredientById.get(ingredientId);
            return {
              name: ing?.name ?? "Unknown ingredient",
              unit: ing?.unit ?? "",
              orderQty: qty,
              baseQty: baseRecipe.get(ingredientId) ?? 0,
            };
          })
          .sort((a, b) => a.name.localeCompare(b.name)),
      };
    })
    .sort((a, b) => a.family.localeCompare(b.family));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-stone-900">Baking Guide</h1>
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

          <div className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
              Ingredients needed
            </h2>
            {ingredientNeedsByFamily.length === 0 ? (
              <p className="rounded-xl border border-stone-200 bg-white p-6 text-sm text-stone-500">
                No recipes are set up for the items in this batch, so
                ingredient needs can&apos;t be calculated. Add recipes on the
                Inventory page.
              </p>
            ) : (
              <IngredientNeeds families={ingredientNeedsByFamily} />
            )}
          </div>
        </>
      )}
    </div>
  );
}
