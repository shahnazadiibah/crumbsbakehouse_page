"use client";

import { useState, useTransition } from "react";
import { formatIDR } from "@/lib/format";

interface CogsRow {
  id: string;
  name: string;
  price: number;
  ingredientCost: number;
  packagingCost: number;
  cogs: number;
}

export default function CogsTable({
  rows,
  onSavePrice,
}: {
  rows: CogsRow[];
  onSavePrice: (menuItemId: string, price: number) => Promise<unknown>;
}) {
  const [prices, setPrices] = useState<Record<string, number>>(() =>
    Object.fromEntries(rows.map((r) => [r.id, r.price]))
  );
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [prevRows, setPrevRows] = useState(rows);
  if (rows !== prevRows) {
    setPrevRows(rows);
    setPrices(Object.fromEntries(rows.map((r) => [r.id, r.price])));
  }

  function savePrice(id: string) {
    setPendingId(id);
    startTransition(async () => {
      await onSavePrice(id, prices[id] ?? 0);
      setPendingId(null);
    });
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
      <table className="w-full text-sm">
        <thead className="border-b border-stone-200 bg-stone-50 text-left text-xs uppercase tracking-wide text-stone-500">
          <tr>
            <th className="px-4 py-3">Menu item</th>
            <th className="px-4 py-3">Price</th>
            <th className="px-4 py-3">Ingredient cost</th>
            <th className="px-4 py-3">Packaging cost</th>
            <th className="px-4 py-3">COGS</th>
            <th className="px-4 py-3">Margin</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {rows.map((m) => {
            const price = prices[m.id] ?? 0;
            const margin = price - m.cogs;
            const marginPct = price > 0 ? (margin / price) * 100 : 0;
            return (
              <tr key={m.id}>
                <td className="px-4 py-3 font-medium text-stone-900">
                  {m.name}
                </td>
                <td className="px-4 py-3">
                  <div className="relative w-32">
                    <span className="pointer-events-none absolute inset-y-0 left-2 flex items-center text-sm text-stone-400">
                      Rp
                    </span>
                    <input
                      type="number"
                      min={0}
                      step="any"
                      value={price}
                      onChange={(e) =>
                        setPrices((prev) => ({
                          ...prev,
                          [m.id]: Number(e.target.value),
                        }))
                      }
                      onBlur={() => savePrice(m.id)}
                      disabled={isPending && pendingId === m.id}
                      className="w-full rounded-lg border border-stone-300 py-1.5 pl-8 pr-1.5 text-sm text-stone-900"
                    />
                  </div>
                </td>
                <td className="px-4 py-3 text-stone-600">
                  {formatIDR(m.ingredientCost)}
                </td>
                <td className="px-4 py-3 text-stone-600">
                  {formatIDR(m.packagingCost)}
                </td>
                <td className="px-4 py-3 font-medium text-stone-900">
                  {formatIDR(m.cogs)}
                </td>
                <td className="px-4 py-3 text-stone-600">
                  {formatIDR(margin)}{" "}
                  <span className="text-xs text-stone-400">
                    ({marginPct.toFixed(0)}%)
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
