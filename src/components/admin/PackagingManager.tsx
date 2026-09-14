"use client";

import { useState, useTransition } from "react";
import {
  deletePackagingItem,
  updatePackagingNameAndStock,
} from "@/app/actions/admin-packaging";

interface PackagingItem {
  id: string;
  name: string;
  unit: string;
  cost_per_unit: number;
  stock: number;
}

const inputClass =
  "w-full rounded-lg border border-stone-300 p-1.5 text-sm text-stone-900 placeholder:text-stone-500";

export default function PackagingManager({
  items,
  neededByPackaging,
}: {
  items: PackagingItem[];
  neededByPackaging: Record<string, number>;
}) {
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editStock, setEditStock] = useState(0);

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-stone-200 bg-stone-50 text-left text-xs uppercase tracking-wide text-stone-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Unit</th>
              <th className="px-4 py-3">Needed for batch</th>
              <th className="px-4 py-3">To buy</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {items.map((item) => {
              const needed = neededByPackaging[item.id] ?? 0;
              const toBuy = Math.max(0, needed - item.stock);

              return editingId === item.id ? (
                <tr key={item.id}>
                  <td className="px-4 py-2 align-top">
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className={inputClass}
                    />
                  </td>
                  <td className="px-4 py-2 align-top">
                    <input
                      type="number"
                      value={editStock}
                      onChange={(e) => setEditStock(Number(e.target.value))}
                      className={inputClass}
                    />
                  </td>
                  <td className="px-4 py-2 align-top text-stone-600">
                    {item.unit || "—"}
                  </td>
                  <td className="px-4 py-2 align-top text-stone-400">—</td>
                  <td className="px-4 py-2 align-top text-stone-400">—</td>
                  <td className="px-4 py-2 align-top text-right whitespace-nowrap">
                    <button
                      disabled={isPending}
                      onClick={() =>
                        startTransition(async () => {
                          await updatePackagingNameAndStock(
                            item.id,
                            editName,
                            editStock
                          );
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
                <tr key={item.id} className={toBuy > 0 ? "bg-red-50" : ""}>
                  <td className="px-4 py-3 font-medium text-stone-900">
                    {item.name}
                  </td>
                  <td className="px-4 py-3 text-stone-600">{item.stock}</td>
                  <td className="px-4 py-3 text-stone-600">
                    {item.unit || "—"}
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {Number(needed.toFixed(2))}
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {toBuy > 0 ? (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                        Buy {Number(toBuy.toFixed(2))} {item.unit}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => {
                        setEditingId(item.id);
                        setEditName(item.name);
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
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
