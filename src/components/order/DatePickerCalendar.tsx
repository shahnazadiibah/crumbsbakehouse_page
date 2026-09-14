"use client";

import { useState } from "react";

interface BatchDateOption {
  date: string;
  label: string;
}

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function toDateString(y: number, m: number, d: number): string {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}

export default function DatePickerCalendar({
  options,
  value,
  onChange,
}: {
  options: BatchDateOption[];
  value: string;
  onChange: (date: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const optionByDate = new Map(options.map((o) => [o.date, o.label]));

  const initial = value
    ? new Date(value + "T00:00:00Z")
    : options[0]
      ? new Date(options[0].date + "T00:00:00Z")
      : new Date();
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

  function selectDate(date: string) {
    onChange(date);
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-lg border border-stone-300 p-3 text-sm text-stone-900"
      >
        <span>{value ? optionByDate.get(value) ?? value : "Select a date"}</span>
        <svg
          viewBox="0 0 20 20"
          fill="none"
          className={`h-4 w-4 shrink-0 text-stone-400 transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path
            d="M5 7.5L10 12.5L15 7.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 mt-1 w-full rounded-lg border border-stone-300 bg-white p-3 shadow-lg">
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
                const available = optionByDate.has(date);
                const selected = date === value;
                return (
                  <button
                    key={date}
                    type="button"
                    disabled={!available}
                    onClick={() => selectDate(date)}
                    className={`aspect-square rounded-lg text-sm transition-colors ${
                      selected
                        ? "bg-brand-olive font-semibold text-white"
                        : available
                          ? "text-stone-900 hover:bg-brand-cream"
                          : "text-stone-300"
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
