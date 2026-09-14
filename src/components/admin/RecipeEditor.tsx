"use client";

import { useMemo, useState, useTransition } from "react";
import { formatDecimal } from "@/lib/format";

interface MenuItem {
  id: string;
  name: string;
}

interface RecipeItem {
  id: string;
  name: string;
  unit: string;
  cost_per_unit: number;
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
  onSaveCost,
}: {
  menuItems: MenuItem[];
  items: RecipeItem[];
  recipeLines: RecipeLine[];
  onSave: (
    menuItemId: string,
    lines: { itemId: string; qtyPerUnit: number }[]
  ) => Promise<unknown>;
  onSaveCost: (itemId: string, costPerUnit: number) => Promise<unknown>;
}) {
  const [menuItemId, setMenuItemId] = useState(menuItems[0]?.id ?? "");
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [costs, setCosts] = useState<Record<string, number>>(() =>
    Object.fromEntries(items.map((i) => [i.id, i.cost_per_unit]))
  );
  const [costPending, setCostPending] = useState<string | null>(null);

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

  async function saveCost(itemId: string) {
    setCostPending(itemId);
    await onSaveCost(itemId, costs[itemId] ?? 0);
    setCostPending(null);
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

      <div className="flex items-center justify-between gap-3 px-0.5 text-xs font-semibold uppercase tracking-wide text-stone-500">
        <span>Item</span>
        <div className="flex items-center gap-2">
          <span className="w-24">Qty/unit</span>
          <span className="w-10"></span>
          <span className="w-4"></span>
          <span className="w-28 text-right">Cost/unit</span>
        </div>
      </div>

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
              <span className="w-4 text-center text-xs text-stone-400">@</span>
              <div className="w-28">
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={costs[item.id] ?? 0}
                  onChange={(e) =>
                    setCosts((prev) => ({
                      ...prev,
                      [item.id]: Number(e.target.value),
                    }))
                  }
                  onBlur={() => saveCost(item.id)}
                  disabled={costPending === item.id}
                  title="Cost per unit"
                  className="w-full rounded-lg border border-stone-300 p-1.5 text-sm text-stone-600"
                />
                <div className="mt-0.5 flex justify-between text-[11px] text-stone-400">
                  <span>Rp/{item.unit || "unit"}</span>
                  <span>{formatDecimal(costs[item.id] ?? 0)}</span>
                </div>
              </div>
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
