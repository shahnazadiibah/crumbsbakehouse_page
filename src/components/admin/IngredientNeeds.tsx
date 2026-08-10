"use client";

import { useState } from "react";

interface FamilyNeeds {
  family: string;
  ingredients: { name: string; unit: string; qty: number }[];
}

export default function IngredientNeeds({
  families,
}: {
  families: FamilyNeeds[];
}) {
  const [portions, setPortions] = useState<Record<string, number>>({});

  return (
    <div className="space-y-4">
      {families.map(({ family, ingredients }) => {
        const portion = portions[family] ?? 1;

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
                  value={portion}
                  onChange={(e) =>
                    setPortions((prev) => ({
                      ...prev,
                      [family]: Number(e.target.value),
                    }))
                  }
                  className="w-16 rounded-lg border border-stone-300 p-1 text-sm text-stone-900"
                />
              </label>
            </div>
            <div className="divide-y divide-stone-100 rounded-xl border border-stone-200 bg-white">
              {ingredients.map((ing) => (
                <div
                  key={ing.name}
                  className="flex items-center justify-between px-4 py-3 text-sm"
                >
                  <span className="text-stone-900">{ing.name}</span>
                  <span className="font-semibold text-stone-900">
                    {Number((ing.qty * portion).toFixed(2))} {ing.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
