"use client";

import { useState, useTransition } from "react";
import {
  addIngredient,
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

const emptyForm: IngredientInput = {
  name: "",
  unit: "",
  costPerUnit: 0,
  stock: 0,
};

function formatQty(qty: number): number {
  return Number(qty.toFixed(2));
}

function IngredientForm({
  initial,
  onSubmit,
  submitLabel,
}: {
  initial: IngredientInput;
  onSubmit: (input: IngredientInput) => void;
  submitLabel: string;
}) {
  const [form, setForm] = useState(initial);

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
      <input
        placeholder="Name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        className="col-span-2 rounded-lg border border-stone-300 p-2 text-sm text-stone-900 placeholder:text-stone-500 sm:col-span-2"
      />
      <input
        placeholder="Unit (g, pcs, ml…)"
        value={form.unit}
        onChange={(e) => setForm({ ...form, unit: e.target.value })}
        className="rounded-lg border border-stone-300 p-2 text-sm text-stone-900 placeholder:text-stone-500"
      />
      <input
        type="number"
        placeholder="Cost/unit"
        value={form.costPerUnit}
        onChange={(e) =>
          setForm({ ...form, costPerUnit: Number(e.target.value) })
        }
        className="rounded-lg border border-stone-300 p-2 text-sm text-stone-900 placeholder:text-stone-500"
      />
      <div className="flex gap-1">
        <input
          type="number"
          placeholder="Stock"
          value={form.stock}
          onChange={(e) =>
            setForm({ ...form, stock: Number(e.target.value) })
          }
          className="w-full rounded-lg border border-stone-300 p-2 text-sm text-stone-900 placeholder:text-stone-500"
        />
        <button
          type="button"
          onClick={() => onSubmit(form)}
          className="shrink-0 rounded-lg bg-brand-olive px-3 py-2 text-xs font-semibold text-white hover:bg-brand-olive-dark"
        >
          {submitLabel}
        </button>
      </div>
    </div>
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
                <tr key={ing.id}>
                  <td colSpan={7} className="px-4 py-3">
                    <IngredientForm
                      initial={{
                        name: ing.name,
                        unit: ing.unit,
                        costPerUnit: ing.cost_per_unit,
                        stock: ing.stock,
                      }}
                      submitLabel="Save"
                      onSubmit={(input) =>
                        startTransition(async () => {
                          await updateIngredient(ing.id, input);
                          setEditingId(null);
                        })
                      }
                    />
                  </td>
                </tr>
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

      <div className="rounded-xl border border-dashed border-stone-300 bg-white p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
          Add ingredient
        </p>
        <IngredientForm
          key={ingredients.length}
          initial={emptyForm}
          submitLabel="Add"
          onSubmit={(input) =>
            startTransition(() => {
              addIngredient(input);
            })
          }
        />
      </div>
    </div>
  );
}
