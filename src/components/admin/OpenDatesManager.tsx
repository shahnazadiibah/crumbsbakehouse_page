"use client";

import { useState, useTransition } from "react";
import {
  addOpenBatchDate,
  removeOpenBatchDate,
} from "@/app/actions/admin-batch-dates";

function formatLabel(date: string) {
  return new Date(date + "T00:00:00Z").toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default function OpenDatesManager({ dates }: { dates: string[] }) {
  const [newDate, setNewDate] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const sorted = [...dates].sort();

  return (
    <div className="space-y-3 rounded-xl border border-stone-200 bg-white p-4">
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={newDate}
          onChange={(e) => setNewDate(e.target.value)}
          className="rounded-lg border border-stone-300 p-2 text-sm text-stone-900"
        />
        <button
          type="button"
          disabled={isPending || !newDate}
          onClick={() =>
            startTransition(async () => {
              setError(null);
              const result = await addOpenBatchDate(newDate);
              if (!result.ok) {
                setError(result.error ?? "Could not add date.");
                return;
              }
              setNewDate("");
            })
          }
          className="rounded-lg bg-brand-olive px-3 py-2 text-xs font-semibold text-white hover:bg-brand-olive-dark disabled:opacity-50"
        >
          Open for pre-order
        </button>
      </div>
      {error && <p className="text-sm text-red-700">{error}</p>}

      {sorted.length === 0 ? (
        <p className="text-sm text-stone-500">
          No dates are open for pre-order yet.
        </p>
      ) : (
        <ul className="divide-y divide-stone-100">
          {sorted.map((date) => (
            <li
              key={date}
              className="flex items-center justify-between py-2 text-sm"
            >
              <span className="text-stone-700">{formatLabel(date)}</span>
              <button
                type="button"
                disabled={isPending}
                onClick={() =>
                  startTransition(() => {
                    removeOpenBatchDate(date);
                  })
                }
                className="text-red-600 hover:underline"
              >
                Close
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
