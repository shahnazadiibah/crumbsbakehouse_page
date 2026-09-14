"use client";

import { useMemo, useState, useTransition } from "react";
import {
  addOpenBatchDate,
  removeOpenBatchDate,
} from "@/app/actions/admin-batch-dates";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function toDateString(y: number, m: number, d: number): string {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}

function todayDateString(): string {
  const now = new Date();
  return toDateString(now.getFullYear(), now.getMonth(), now.getDate());
}

export default function OpenDatesManager({ dates }: { dates: string[] }) {
  const openDates = useMemo(() => new Set(dates), [dates]);
  const [isPending, startTransition] = useTransition();
  const [pendingDate, setPendingDate] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const leadingBlanks = firstOfMonth.getDay();
  const todayStr = todayDateString();

  const cells: (string | null)[] = [
    ...Array(leadingBlanks).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) =>
      toDateString(viewYear, viewMonth, i + 1)
    ),
  ];

  function toggle(date: string) {
    setError(null);
    setPendingDate(date);
    startTransition(async () => {
      const result = openDates.has(date)
        ? await removeOpenBatchDate(date)
        : await addOpenBatchDate(date);
      if (!result.ok) setError(result.error ?? "Could not update that date.");
      setPendingDate(null);
    });
  }

  function goToMonth(delta: number) {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  }

  return (
    <div className="w-fit max-w-md space-y-4 rounded-xl border border-stone-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => goToMonth(-1)}
          className="rounded-lg border border-stone-300 px-3 py-1 text-sm text-stone-600 hover:bg-stone-100"
        >
          ‹
        </button>
        <p className="text-base font-semibold text-stone-900">
          {firstOfMonth.toLocaleDateString("en-GB", {
            month: "long",
            year: "numeric",
          })}
        </p>
        <button
          type="button"
          onClick={() => goToMonth(1)}
          className="rounded-lg border border-stone-300 px-3 py-1 text-sm text-stone-600 hover:bg-stone-100"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-sm">
        {WEEKDAY_LABELS.map((w) => (
          <div key={w} className="py-1 font-semibold text-stone-400">
            {w[0]}
          </div>
        ))}
        {cells.map((date, i) =>
          date === null ? (
            <div key={i} />
          ) : (
            <button
              key={date}
              type="button"
              disabled={isPending}
              onClick={() => toggle(date)}
              className={`aspect-square rounded-lg text-sm transition-colors disabled:opacity-50 ${
                openDates.has(date)
                  ? "bg-brand-olive font-semibold text-white hover:bg-brand-olive-dark"
                  : "text-stone-700 hover:bg-stone-100"
              } ${date === todayStr ? "ring-2 ring-brand-olive/50" : ""} ${
                pendingDate === date ? "animate-pulse" : ""
              }`}
            >
              {Number(date.slice(-2))}
            </button>
          )
        )}
      </div>

      <div className="flex items-center gap-2 text-sm text-stone-500">
        <span className="inline-block h-4 w-4 rounded bg-brand-olive" />
        Click a date to open/close it
      </div>
      {error && <p className="text-sm text-red-700">{error}</p>}
    </div>
  );
}
