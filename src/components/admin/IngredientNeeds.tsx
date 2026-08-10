"use client";

import { useState } from "react";

interface FamilyNeeds {
  family: string;
  ingredients: { name: string; unit: string; orderQty: number; baseQty: number }[];
}

const BAKING_NOTES: Record<string, string[]> = {
  "Carrot Cake": [
    "3 x 16.5cm diam pan | 360g batter each pan | Bake 170degC for 30mins",
    "18 x 8cm diam pan | 60g batter each pan | Bake 170degC for 30mins | 1 rack max in the oven",
  ],
  "Banana Bread": [
    "1 x 27x12cm pan | 1180g batter each pan | Bake 160degC for 1hour15mins",
  ],
};

export default function IngredientNeeds({
  families,
}: {
  families: FamilyNeeds[];
}) {
  // Undefined/null = show the default (total for this batch's orders).
  // Once set, shows portion x the single-recipe ingredient amount instead.
  const [portions, setPortions] = useState<Record<string, number | null>>({});

  return (
    <div className="space-y-4">
      {families.map(({ family, ingredients }) => {
        const portion = portions[family] ?? null;
        const notes = BAKING_NOTES[family];

        return (
          <div key={family} className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-stone-700">{family}</h3>
              <label className="flex items-center gap-2 text-xs text-stone-500">
                Recipe portion
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  placeholder="Order total"
                  value={portion ?? ""}
                  onChange={(e) =>
                    setPortions((prev) => ({
                      ...prev,
                      [family]:
                        e.target.value === "" ? null : Number(e.target.value),
                    }))
                  }
                  className="w-24 rounded-lg border border-stone-300 p-1 text-sm text-stone-900"
                />
              </label>
            </div>
            {notes && (
              <ul className="space-y-1 rounded-xl border border-dashed border-stone-300 bg-stone-50 px-4 py-3 text-sm text-stone-700">
                {notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            )}
            <div className="divide-y divide-stone-100 rounded-xl border border-stone-200 bg-white">
              {ingredients.map((ing) => {
                const qty =
                  portion === null ? ing.orderQty : ing.baseQty * portion;
                return (
                  <div
                    key={ing.name}
                    className="flex items-center justify-between px-4 py-3 text-sm"
                  >
                    <span className="text-stone-900">{ing.name}</span>
                    <span className="font-semibold text-stone-900">
                      {Number(qty.toFixed(2))} {ing.unit}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
