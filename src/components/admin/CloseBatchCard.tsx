"use client";

import { useState, useTransition } from "react";
import { closeBatch } from "@/app/actions/admin-batches";
import { formatIDR } from "@/lib/format";

interface MenuBreakdownLine {
  name: string;
  qty: number;
  revenue: number;
}

interface CloseBatchCardProps {
  batchDate: string;
  label: string;
  revenuePreview: number;
  ingredientCostPreview: number;
  menuBreakdown: MenuBreakdownLine[];
  totalQty: number;
}

export default function CloseBatchCard({
  batchDate,
  label,
  revenuePreview,
  ingredientCostPreview,
  menuBreakdown,
  totalQty,
}: CloseBatchCardProps) {
  const [otherCosts, setOtherCosts] = useState(0);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const profitPreview = revenuePreview - ingredientCostPreview - otherCosts;

  function handleClose() {
    setError(null);
    startTransition(async () => {
      const result = await closeBatch(batchDate, otherCosts, note);
      if (!result.ok) {
        setError(result.error ?? "Could not close batch.");
      }
    });
  }

  return (
    <div className="space-y-3 rounded-xl border border-stone-200 bg-white p-4">
      <h3 className="font-semibold text-stone-900">{label}</h3>

      <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <div>
          <p className="text-stone-500">Revenue (paid)</p>
          <p className="font-medium text-stone-900">
            {formatIDR(revenuePreview)}
          </p>
        </div>
        <div>
          <p className="text-stone-500">Ingredient cost</p>
          <p className="font-medium text-stone-900">
            {formatIDR(ingredientCostPreview)}
          </p>
        </div>
        <div>
          <label className="text-stone-500">Other costs</label>
          <input
            type="number"
            value={otherCosts}
            onChange={(e) => setOtherCosts(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-stone-300 p-1.5 text-sm"
          />
        </div>
        <div>
          <p className="text-stone-500">Est. profit</p>
          <p className="font-semibold text-stone-900">
            {formatIDR(profitPreview)}
          </p>
        </div>
      </div>

      {menuBreakdown.length > 0 && (
        <div className="rounded-lg border border-stone-200">
          <div className="divide-y divide-stone-100">
            {menuBreakdown.map((line) => (
              <div
                key={line.name}
                className="flex items-center justify-between px-3 py-2 text-sm"
              >
                <span className="text-stone-700">
                  {line.qty}x {line.name}
                </span>
                <span className="font-medium text-stone-900">
                  {formatIDR(line.revenue)}
                </span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between border-t border-stone-200 px-3 py-2 text-sm">
            <span className="font-medium text-stone-700">
              Total quantity ordered
            </span>
            <span className="font-semibold text-stone-900">{totalQty}</span>
          </div>
        </div>
      )}

      <input
        placeholder="Other costs note (optional)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="w-full rounded-lg border border-stone-300 p-2 text-sm text-stone-900 placeholder:text-stone-500"
      />

      {error && (
        <p className="rounded-lg bg-red-50 p-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        disabled={isPending}
        onClick={handleClose}
        className="rounded-lg bg-brand-olive px-4 py-2 text-sm font-semibold text-white hover:bg-brand-olive-dark disabled:opacity-50"
      >
        {isPending ? "Closing…" : "Close batch"}
      </button>
    </div>
  );
}
