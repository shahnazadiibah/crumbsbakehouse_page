"use client";

import { useRouter } from "next/navigation";

export default function OpenBatchSelect({
  dates,
  selected,
  labels,
}: {
  dates: string[];
  selected: string;
  labels: Record<string, string>;
}) {
  const router = useRouter();

  return (
    <select
      value={selected}
      onChange={(e) => router.push(`/admin/batches?date=${e.target.value}`)}
      className="rounded-lg border border-stone-300 bg-white p-2 text-sm text-stone-900"
    >
      {dates.map((d) => (
        <option key={d} value={d}>
          {labels[d] ?? d}
        </option>
      ))}
    </select>
  );
}
