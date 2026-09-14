import { createClient } from "@/lib/supabase/server";
import RecipeEditor from "@/components/admin/RecipeEditor";
import CogsTable from "@/components/admin/CogsTable";
import {
  addIngredient,
  saveRecipe,
  updateIngredientBrand,
  updateIngredientCost,
  updateIngredientName,
  updateIngredientUnit,
} from "@/app/actions/admin-inventory";
import {
  addPackagingItem,
  savePackagingRecipe,
  updatePackagingBrand,
  updatePackagingCost,
  updatePackagingName,
  updatePackagingUnit,
} from "@/app/actions/admin-packaging";
import { updateMenuItemPrice } from "@/app/actions/admin-menu-items";

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
      .select("id, name, unit, cost_per_unit, stock, brand_supplier")
      .order("name"),
    supabase
      .from("packaging_items")
      .select("id, name, unit, cost_per_unit, stock, brand_supplier")
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
    return {
      id: m.id,
      name: m.name,
      price: m.price,
      ingredientCost,
      packagingCost,
      cogs,
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
          x qty/unit, summed). Price is editable here.
        </p>
        <CogsTable
          rows={cogsByMenuItem}
          onSavePrice={async (menuItemId, price) => {
            "use server";
            return updateMenuItemPrice(menuItemId, price);
          }}
        />
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
          itemLabel="ingredient"
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
          onSaveCost={async (itemId, costPerUnit) => {
            "use server";
            return updateIngredientCost(itemId, costPerUnit);
          }}
          onSaveName={async (itemId, name) => {
            "use server";
            return updateIngredientName(itemId, name);
          }}
          onSaveUnit={async (itemId, unit) => {
            "use server";
            return updateIngredientUnit(itemId, unit);
          }}
          onSaveBrand={async (itemId, brandSupplier) => {
            "use server";
            return updateIngredientBrand(itemId, brandSupplier);
          }}
          onAddItem={async (name, unit, costPerUnit) => {
            "use server";
            return addIngredient({ name, unit, costPerUnit, stock: 0 });
          }}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-stone-900">Packaging</h2>
        <p className="text-sm text-stone-500">
          Define how much of each packaging item one unit of a menu item
          uses.
        </p>
        <RecipeEditor
          menuItems={menuItems ?? []}
          items={packagingItems ?? []}
          itemLabel="packaging item"
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
          onSaveCost={async (itemId, costPerUnit) => {
            "use server";
            return updatePackagingCost(itemId, costPerUnit);
          }}
          onSaveName={async (itemId, name) => {
            "use server";
            return updatePackagingName(itemId, name);
          }}
          onSaveUnit={async (itemId, unit) => {
            "use server";
            return updatePackagingUnit(itemId, unit);
          }}
          onSaveBrand={async (itemId, brandSupplier) => {
            "use server";
            return updatePackagingBrand(itemId, brandSupplier);
          }}
          onAddItem={async (name, unit, costPerUnit) => {
            "use server";
            return addPackagingItem({ name, unit, costPerUnit, stock: 0 });
          }}
        />
      </section>
    </div>
  );
}
