"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface BatchDateMultiFilterProps {
  dates: string[];
  selected: string[];
  basePath: string;
}

function formatDate(date: string) {
  return new Date(date + "T00:00:00Z").toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default function BatchDateMultiFilter({
  dates,
  selected,
  basePath,
}: BatchDateMultiFilterProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  function toggle(date: string) {
    const next = selected.includes(date)
      ? selected.filter((d) => d !== date)
      : [...selected, date];
    // Always keep at least one date selected.
    if (next.length === 0) return;
    router.push(`${basePath}?batches=${next.join(",")}`);
  }

  const label =
    selected.length === 1
      ? formatDate(selected[0])
      : `${selected.length} batches combined`;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-lg border border-stone-300 bg-white p-2 text-sm text-stone-900"
      >
        {label} ▾
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-20 mt-1 max-h-64 w-64 overflow-y-auto rounded-lg border border-stone-200 bg-white p-2 shadow-lg">
            <p className="px-1 pb-1 text-xs text-stone-500">
              Select dates to combine
            </p>
            {dates.map((date) => (
              <label
                key={date}
                className="flex items-center gap-2 rounded px-1 py-1.5 text-sm text-stone-700 hover:bg-stone-50"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(date)}
                  onChange={() => toggle(date)}
                  className="h-4 w-4 accent-brand-olive"
                />
                {formatDate(date)}
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
