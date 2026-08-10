import { createClient } from "@/lib/supabase/server";
import RecipeEditor from "@/components/admin/RecipeEditor";
import { saveRecipe } from "@/app/actions/admin-inventory";
import { savePackagingRecipe } from "@/app/actions/admin-packaging";

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
    supabase.from("menu_items").select("id, name").order("name"),
    supabase
      .from("recipes")
      .select("menu_item_id, ingredient_id, qty_per_unit"),
    supabase
      .from("packaging_recipes")
      .select("menu_item_id, packaging_item_id, qty_per_unit"),
  ]);

  return (
    <div className="space-y-8">
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
