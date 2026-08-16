import { createClient } from "@/lib/supabase/server";
import RecipeEditor from "@/components/admin/RecipeEditor";
import { saveRecipe } from "@/app/actions/admin-inventory";
import { savePackagingRecipe } from "@/app/actions/admin-packaging";
import { formatIDR } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function RecipesPage() {
  const supabase = await createClient();

  const [
    { data: ingredients },
    { data: packagingItems },
    { data: menuItems },
    { data: recipes },
    { data: packagingRecipes },
  ] = await Promise.all([
    supabase
      .from("ingredients")
      .select("id, name, unit, cost_per_unit, stock")
      .order("name"),
    supabase
      .from("packaging_items")
      .select("id, name, unit, cost_per_unit, stock")
      .order("name"),
    supabase.from("menu_items").select("id, name, price").order("name"),
    supabase
      .from("recipes")
      .select("menu_item_id, ingredient_id, qty_per_unit"),
    supabase
      .from("packaging_recipes")
      .select("menu_item_id, packaging_item_id, qty_per_unit"),
  ]);

  const ingredientCostById = new Map(
    (ingredients ?? []).map((i) => [i.id, i.cost_per_unit])
  );
  const packagingCostById = new Map(
    (packagingItems ?? []).map((p) => [p.id, p.cost_per_unit])
  );

  const ingredientCostByMenuItem = new Map<string, number>();
  for (const r of recipes ?? []) {
    const cost = ingredientCostById.get(r.ingredient_id) ?? 0;
    ingredientCostByMenuItem.set(
      r.menu_item_id,
      (ingredientCostByMenuItem.get(r.menu_item_id) ?? 0) +
        cost * r.qty_per_unit
    );
  }

  const packagingCostByMenuItem = new Map<string, number>();
  for (const r of packagingRecipes ?? []) {
    const cost = packagingCostById.get(r.packaging_item_id) ?? 0;
    packagingCostByMenuItem.set(
      r.menu_item_id,
      (packagingCostByMenuItem.get(r.menu_item_id) ?? 0) +
        cost * r.qty_per_unit
    );
  }

  const cogsByMenuItem = (menuItems ?? []).map((m) => {
    const ingredientCost = ingredientCostByMenuItem.get(m.id) ?? 0;
    const packagingCost = packagingCostByMenuItem.get(m.id) ?? 0;
    const cogs = ingredientCost + packagingCost;
    const margin = m.price - cogs;
    const marginPct = m.price > 0 ? (margin / m.price) * 100 : 0;
    return {
      id: m.id,
      name: m.name,
      price: m.price,
      ingredientCost,
      packagingCost,
      cogs,
      margin,
      marginPct,
    };
  });

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h1 className="text-xl font-semibold text-stone-900">
          Cost of goods sold
        </h1>
        <p className="text-sm text-stone-500">
          Computed from the ingredient and packaging recipes below (cost/unit
          x qty/unit, summed).
        </p>
        <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-stone-200 bg-stone-50 text-left text-xs uppercase tracking-wide text-stone-500">
              <tr>
                <th className="px-4 py-3">Menu item</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Ingredient cost</th>
                <th className="px-4 py-3">Packaging cost</th>
                <th className="px-4 py-3">COGS</th>
                <th className="px-4 py-3">Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {cogsByMenuItem.map((m) => (
                <tr key={m.id}>
                  <td className="px-4 py-3 font-medium text-stone-900">
                    {m.name}
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {formatIDR(m.price)}
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {formatIDR(m.ingredientCost)}
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {formatIDR(m.packagingCost)}
                  </td>
                  <td className="px-4 py-3 font-medium text-stone-900">
                    {formatIDR(m.cogs)}
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {formatIDR(m.margin)}{" "}
                    <span className="text-xs text-stone-400">
                      ({m.marginPct.toFixed(0)}%)
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h1 className="text-xl font-semibold text-stone-900">Recipes</h1>
        <p className="text-sm text-stone-500">
          Define how much of each ingredient one unit of a menu item uses.
          This drives ingredient deduction when a batch is closed.
        </p>
        <RecipeEditor
          menuItems={menuItems ?? []}
          items={ingredients ?? []}
          recipeLines={(recipes ?? []).map((r) => ({
            menu_item_id: r.menu_item_id,
            item_id: r.ingredient_id,
            qty_per_unit: r.qty_per_unit,
          }))}
          onSave={async (menuItemId, lines) => {
            "use server";
            return saveRecipe(
              menuItemId,
              lines.map((l) => ({
                ingredientId: l.itemId,
                qtyPerUnit: l.qtyPerUnit,
              }))
            );
          }}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-stone-900">
          Packaging recipes
        </h2>
        <p className="text-sm text-stone-500">
          Define how much of each packaging item one unit of a menu item
          uses.
        </p>
        <RecipeEditor
          menuItems={menuItems ?? []}
          items={packagingItems ?? []}
          recipeLines={(packagingRecipes ?? []).map((r) => ({
            menu_item_id: r.menu_item_id,
            item_id: r.packaging_item_id,
            qty_per_unit: r.qty_per_unit,
          }))}
          onSave={async (menuItemId, lines) => {
            "use server";
            return savePackagingRecipe(
              menuItemId,
              lines.map((l) => ({
                packagingItemId: l.itemId,
                qtyPerUnit: l.qtyPerUnit,
              }))
            );
          }}
        />
      </section>
    </div>
  );
}
