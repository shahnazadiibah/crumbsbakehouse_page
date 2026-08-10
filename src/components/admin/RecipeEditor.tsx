"use client";

import { useMemo, useState, useTransition } from "react";

interface MenuItem {
  id: string;
  name: string;
}

interface RecipeItem {
  id: string;
  name: string;
  unit: string;
}

interface RecipeLine {
  menu_item_id: string;
  item_id: string;
  qty_per_unit: number;
}

export default function RecipeEditor({
  menuItems,
  items,
  recipeLines,
  onSave,
}: {
  menuItems: MenuItem[];
  items: RecipeItem[];
  recipeLines: RecipeLine[];
  onSave: (
    menuItemId: string,
    lines: { itemId: string; qtyPerUnit: number }[]
  ) => Promise<unknown>;
}) {
  const [menuItemId, setMenuItemId] = useState(menuItems[0]?.id ?? "");
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const initialQuantities = useMemo(() => {
    const map: Record<string, number> = {};
    for (const r of recipeLines) {
      if (r.menu_item_id === menuItemId) map[r.item_id] = r.qty_per_unit;
    }
    return map;
  }, [recipeLines, menuItemId]);

  const [quantities, setQuantities] = useState(initialQuantities);

  function selectMenuItem(id: string) {
    setMenuItemId(id);
    const map: Record<string, number> = {};
    for (const r of recipeLines) {
      if (r.menu_item_id === id) map[r.item_id] = r.qty_per_unit;
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
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-3 py-2"
          >
            <span className="text-sm text-stone-700">{item.name}</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                step="any"
                value={quantities[item.id] ?? 0}
                onChange={(e) =>
                  setQuantities((prev) => ({
                    ...prev,
                    [item.id]: Number(e.target.value),
                  }))
                }
                className="w-24 rounded-lg border border-stone-300 p-1.5 text-sm"
              />
              <span className="w-10 text-xs text-stone-500">{item.unit}</span>
            </div>
          </div>
        ))}
      </div>

      <button
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const lines = Object.entries(quantities).map(
              ([itemId, qtyPerUnit]) => ({ itemId, qtyPerUnit })
            );
            await onSave(menuItemId, lines);
            setSaved(true);
          })
        }
        className="rounded-lg bg-brand-olive px-4 py-2 text-sm font-semibold text-white hover:bg-brand-olive-dark disabled:opacity-50"
      >
        {isPending ? "Saving…" : "Save recipe"}
      </button>
      {saved && !isPending && (
        <span className="ml-3 text-sm text-green-700">Saved.</span>
      )}
    </div>
  );
}
