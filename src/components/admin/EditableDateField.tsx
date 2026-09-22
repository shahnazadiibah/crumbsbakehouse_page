"use client";

import { useState } from "react";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function toDateString(y: number, m: number, d: number): string {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}

function formatShort(date: string): string {
  return new Date(date + "T00:00:00Z").toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

// Native <input type="date"> can't show a custom display format (it's
// locale/OS-controlled), so this mimics its calendar-popup UX while
// rendering the value as "Wed, 23 Sep 2026" — unlike DatePickerCalendar,
// every day is selectable, not just a fixed list of open batch dates.
export default function EditableDateField({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (date: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const initial = value ? new Date(value + "T00:00:00Z") : new Date();
  const [viewYear, setViewYear] = useState(initial.getUTCFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getUTCMonth());

  const firstOfMonth = new Date(Date.UTC(viewYear, viewMonth, 1));
  const daysInMonth = new Date(Date.UTC(viewYear, viewMonth + 1, 0)).getUTCDate();
  const leadingBlanks = firstOfMonth.getUTCDay();

  const cells: (string | null)[] = [
    ...Array(leadingBlanks).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) =>
      toDateString(viewYear, viewMonth, i + 1)
    ),
  ];

  function goToMonth(delta: number) {
    const next = new Date(Date.UTC(viewYear, viewMonth + delta, 1));
    setViewYear(next.getUTCFullYear());
    setViewMonth(next.getUTCMonth());
  }

  function select(date: string) {
    onChange(date);
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className="whitespace-nowrap rounded-lg border border-stone-300 p-1.5 text-left text-sm text-stone-900 disabled:opacity-50"
      >
        {value ? formatShort(value) : "Select date"}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 mt-1 w-56 rounded-lg border border-stone-300 bg-white p-3 shadow-lg">
            <div className="mb-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => goToMonth(-1)}
                className="rounded-lg border border-stone-300 px-2 py-1 text-sm text-stone-600 hover:bg-stone-100"
              >
                ‹
              </button>
              <p className="text-sm font-semibold text-stone-900">
                {firstOfMonth.toLocaleDateString("en-GB", {
                  month: "long",
                  year: "numeric",
                  timeZone: "UTC",
                })}
              </p>
              <button
                type="button"
                onClick={() => goToMonth(1)}
                className="rounded-lg border border-stone-300 px-2 py-1 text-sm text-stone-600 hover:bg-stone-100"
              >
                ›
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {WEEKDAY_LABELS.map((w) => (
                <div key={w} className="py-1 font-semibold text-stone-400">
                  {w[0]}
                </div>
              ))}
              {cells.map((date, i) => {
                if (date === null) return <div key={i} />;
                const selected = date === value;
                return (
                  <button
                    key={date}
                    type="button"
                    onClick={() => select(date)}
                    className={`aspect-square rounded-lg text-xs transition-colors ${
                      selected
                        ? "bg-brand-olive font-semibold text-white"
                        : "text-stone-900 hover:bg-brand-cream"
                    }`}
                  >
                    {Number(date.slice(-2))}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
