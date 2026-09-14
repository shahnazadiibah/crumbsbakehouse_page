"use client";

import { useRouter } from "next/navigation";

interface BatchDateFilterProps {
  minDate: string;
  maxDate: string;
  from: string;
  to: string;
  basePath: string;
}

export default function BatchDateFilter({
  minDate,
  maxDate,
  from,
  to,
  basePath,
}: BatchDateFilterProps) {
  const router = useRouter();

  function update(nextFrom: string, nextTo: string) {
    const rangeFrom = nextFrom <= nextTo ? nextFrom : nextTo;
    const rangeTo = nextFrom <= nextTo ? nextTo : nextFrom;
    router.push(`${basePath}?from=${rangeFrom}&to=${rangeTo}`);
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <input
        type="date"
        value={from}
        min={minDate}
        max={maxDate}
        onChange={(e) => update(e.target.value, to)}
        className="rounded-lg border border-stone-300 p-2 text-sm text-stone-700"
      />
      <span className="text-stone-400">to</span>
      <input
        type="date"
        value={to}
        min={minDate}
        max={maxDate}
        onChange={(e) => update(from, e.target.value)}
        className="rounded-lg border border-stone-300 p-2 text-sm text-stone-700"
      />
    </div>
  );
}
