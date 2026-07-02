"use client";

import { useMemo, useState, useTransition } from "react";
import { saveRecipe } from "@/app/actions/admin-inventory";

interface MenuItem {
  id: string;
  name: string;
}

interface Ingredient {
  id: string;
  name: string;
  unit: string;
}

interface Recipe {
  menu_item_id: string;
  ingredient_id: string;
  qty_per_unit: number;
}

export default function RecipeEditor({
  menuItems,
  ingredients,
  recipes,
}: {
  menuItems: MenuItem[];
  ingredients: Ingredient[];
  recipes: Recipe[];
}) {
  const [menuItemId, setMenuItemId] = useState(menuItems[0]?.id ?? "");
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const initialQuantities = useMemo(() => {
    const map: Record<string, number> = {};
    for (const r of recipes) {
      if (r.menu_item_id === menuItemId) map[r.ingredient_id] = r.qty_per_unit;
    }
    return map;
  }, [recipes, menuItemId]);

  const [quantities, setQuantities] = useState(initialQuantities);

  function selectMenuItem(id: string) {
    setMenuItemId(id);
    const map: Record<string, number> = {};
    for (const r of recipes) {
      if (r.menu_item_id === id) map[r.ingredient_id] = r.qty_per_unit;
    }
    setQuantities(map);
    setSaved(false);
  }

  if (menuItems.length === 0) {
    return (
      <p className="text-sm text-stone-500">
        Add a menu item first to define its recipe.
      </p>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-stone-200 bg-white p-4">
      <select
        value={menuItemId}
        onChange={(e) => selectMenuItem(e.target.value)}
        className="rounded-lg border border-stone-300 p-2 text-sm"
      >
        {menuItems.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </select>

      <div className="divide-y divide-stone-100">
        {ingredients.map((ing) => (
          <div
            key={ing.id}
            className="flex items-center justify-between gap-3 py-2"
          >
            <span className="text-sm text-stone-700">{ing.name}</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                step="any"
                value={quantities[ing.id] ?? 0}
                onChange={(e) =>
                  setQuantities((prev) => ({
                    ...prev,
                    [ing.id]: Number(e.target.value),
                  }))
                }
                className="w-24 rounded-lg border border-stone-300 p-1.5 text-sm"
              />
              <span className="w-10 text-xs text-stone-500">{ing.unit}</span>
            </div>
          </div>
        ))}
      </div>

      <button
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const lines = Object.entries(quantities).map(
              ([ingredientId, qtyPerUnit]) => ({ ingredientId, qtyPerUnit })
            );
            await saveRecipe(menuItemId, lines);
            setSaved(true);
          })
        }
        className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
      >
        {isPending ? "Saving…" : "Save recipe"}
      </button>
      {saved && !isPending && (
        <span className="ml-3 text-sm text-green-700">Saved.</span>
      )}
    </div>
  );
}
