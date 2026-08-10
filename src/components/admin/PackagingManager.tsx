"use client";

import { useState, useTransition } from "react";
import {
  addPackagingItem,
  deletePackagingItem,
  updatePackagingStock,
  type PackagingInput,
} from "@/app/actions/admin-packaging";

interface PackagingItem {
  id: string;
  name: string;
  unit: string;
  cost_per_unit: number;
  stock: number;
}

const emptyForm: PackagingInput = {
  name: "",
  unit: "",
  costPerUnit: 0,
  stock: 0,
};

const inputClass =
  "w-full rounded-lg border border-stone-300 p-1.5 text-sm text-stone-900 placeholder:text-stone-500";

export default function PackagingManager({
  items,
}: {
  items: PackagingItem[];
}) {
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStock, setEditStock] = useState(0);
  const [form, setForm] = useState<PackagingInput>(emptyForm);

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
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {items.map((item) =>
              editingId === item.id ? (
                <tr key={item.id}>
                  <td className="px-4 py-2 align-top text-stone-600">
                    {item.name}
                  </td>
                  <td className="px-4 py-2 align-top text-stone-600">
                    {item.unit || "—"}
                  </td>
                  <td className="px-4 py-2 align-top text-stone-600">
                    {item.cost_per_unit}
                  </td>
                  <td className="px-4 py-2 align-top">
                    <input
                      type="number"
                      value={editStock}
                      onChange={(e) => setEditStock(Number(e.target.value))}
                      className={inputClass}
                    />
                  </td>
                  <td className="px-4 py-2 align-top text-right whitespace-nowrap">
                    <button
                      disabled={isPending}
                      onClick={() =>
                        startTransition(async () => {
                          await updatePackagingStock(item.id, editStock);
                          setEditingId(null);
                        })
                      }
                      className="mr-3 font-medium text-brand-olive hover:underline"
                    >
                      Save
                    </button>
                    <button
                      disabled={isPending}
                      onClick={() => setEditingId(null)}
                      className="font-medium text-stone-500 hover:underline"
                    >
                      Cancel
                    </button>
                  </td>
                </tr>
              ) : (
                <tr key={item.id}>
                  <td className="px-4 py-3 font-medium text-stone-900">
                    {item.name}
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {item.unit || "—"}
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {item.cost_per_unit}
                  </td>
                  <td className="px-4 py-3 text-stone-600">{item.stock}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => {
                        setEditingId(item.id);
                        setEditStock(item.stock);
                      }}
                      className="mr-3 font-medium text-stone-700 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      disabled={isPending}
                      onClick={() =>
                        startTransition(() => {
                          deletePackagingItem(item.id);
                        })
                      }
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-dashed border-stone-300 bg-white p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
          Add packaging item
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          <input
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="col-span-2 rounded-lg border border-stone-300 p-2 text-sm text-stone-900 placeholder:text-stone-500 sm:col-span-2"
          />
          <input
            placeholder="Unit (pcs…)"
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
              onClick={() =>
                startTransition(async () => {
                  await addPackagingItem(form);
                  setForm(emptyForm);
                })
              }
              className="shrink-0 rounded-lg bg-brand-olive px-3 py-2 text-xs font-semibold text-white hover:bg-brand-olive-dark"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
