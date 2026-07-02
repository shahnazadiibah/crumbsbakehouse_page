import { createClient } from "@/lib/supabase/server";
import IngredientsManager from "@/components/admin/IngredientsManager";
import RecipeEditor from "@/components/admin/RecipeEditor";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const supabase = await createClient();

  const [{ data: ingredients }, { data: menuItems }, { data: recipes }] =
    await Promise.all([
      supabase
        .from("ingredients")
        .select("id, name, unit, cost_per_unit, stock, reorder_threshold")
        .order("name"),
      supabase.from("menu_items").select("id, name").order("name"),
      supabase
        .from("recipes")
        .select("menu_item_id, ingredient_id, qty_per_unit"),
    ]);

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h1 className="text-xl font-semibold text-stone-900">Ingredients</h1>
        <IngredientsManager ingredients={ingredients ?? []} />
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
