"use client";

import { useState, useTransition } from "react";
import {
  deleteIngredient,
  updateIngredient,
  type IngredientInput,
} from "@/app/actions/admin-inventory";

interface Ingredient {
  id: string;
  name: string;
  unit: string;
  cost_per_unit: number;
  stock: number;
}

function formatQty(qty: number): number {
  return Number(qty.toFixed(2));
}

const inputClass =
  "w-full rounded-lg border border-stone-300 p-1.5 text-sm text-stone-900 placeholder:text-stone-500";

function IngredientEditRow({
  ingredient,
  onSave,
  onCancel,
  isPending,
}: {
  ingredient: Ingredient;
  onSave: (input: IngredientInput) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [form, setForm] = useState<IngredientInput>({
    name: ingredient.name,
    unit: ingredient.unit,
    costPerUnit: ingredient.cost_per_unit,
    stock: ingredient.stock,
  });

  return (
    <tr>
      <td className="px-4 py-2 align-top">
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className={inputClass}
        />
      </td>
      <td className="px-4 py-2 align-top text-stone-600">{form.unit}</td>
      <td className="px-4 py-2 align-top text-stone-600">
        {form.costPerUnit}
      </td>
      <td className="px-4 py-2 align-top">
        <input
          type="number"
          value={form.stock}
          onChange={(e) =>
            setForm({ ...form, stock: Number(e.target.value) })
          }
          className={inputClass}
        />
      </td>
      <td className="px-4 py-2 align-top text-stone-400">—</td>
      <td className="px-4 py-2 align-top text-stone-400">—</td>
      <td className="px-4 py-2 align-top text-right whitespace-nowrap">
        <button
          disabled={isPending}
          onClick={() => onSave(form)}
          className="mr-3 font-medium text-brand-olive hover:underline"
        >
          Save
        </button>
        <button
          disabled={isPending}
          onClick={onCancel}
          className="font-medium text-stone-500 hover:underline"
        >
          Cancel
        </button>
      </td>
    </tr>
  );
}

export default function IngredientsManager({
  ingredients,
  neededByIngredient,
}: {
  ingredients: Ingredient[];
  neededByIngredient: Record<string, number>;
}) {
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-stone-200 bg-stone-50 text-left text-xs uppercase tracking-wide text-stone-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Unit</th>
              <th className="px-4 py-3">Cost/unit</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Needed for batch</th>
              <th className="px-4 py-3">To buy</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {ingredients.map((ing) => {
              const needed = neededByIngredient[ing.id] ?? 0;
              const toBuy = Math.max(0, needed - ing.stock);

              return editingId === ing.id ? (
                <IngredientEditRow
                  key={ing.id}
                  ingredient={ing}
                  isPending={isPending}
                  onCancel={() => setEditingId(null)}
                  onSave={(input) =>
                    startTransition(async () => {
                      await updateIngredient(ing.id, input);
                      setEditingId(null);
                    })
                  }
                />
              ) : (
                <tr key={ing.id} className={toBuy > 0 ? "bg-red-50" : ""}>
                  <td className="px-4 py-3 font-medium text-stone-900">
                    {ing.name}
                  </td>
                  <td className="px-4 py-3 text-stone-600">{ing.unit}</td>
                  <td className="px-4 py-3 text-stone-600">
                    {ing.cost_per_unit}
                  </td>
                  <td className="px-4 py-3 text-stone-600">{ing.stock}</td>
                  <td className="px-4 py-3 text-stone-600">
                    {formatQty(needed)}
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {toBuy > 0 ? (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                        Buy {formatQty(toBuy)} {ing.unit}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setEditingId(ing.id)}
                      className="mr-3 font-medium text-stone-700 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      disabled={isPending}
                      onClick={() =>
                        startTransition(() => {
                          deleteIngredient(ing.id);
                        })
                      }
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
