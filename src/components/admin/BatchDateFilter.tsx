"use client";

import { useRouter } from "next/navigation";

interface BatchDateFilterProps {
  dates: string[];
  selected: string;
  basePath: string;
}

export default function BatchDateFilter({
  dates,
  selected,
  basePath,
}: BatchDateFilterProps) {
  const router = useRouter();

  return (
    <select
      value={selected}
      onChange={(e) => router.push(`${basePath}?batch=${e.target.value}`)}
      className="rounded-lg border border-stone-300 p-2 text-sm"
    >
      {dates.map((date) => (
        <option key={date} value={date}>
          {new Date(date + "T00:00:00Z").toLocaleDateString("en-GB", {
            weekday: "short",
            day: "numeric",
            month: "short",
            year: "numeric",
            timeZone: "UTC",
          })}
        </option>
      ))}
    </select>
  );
}
