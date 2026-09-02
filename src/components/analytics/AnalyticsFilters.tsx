"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { addMonths, getCurrentMonth } from "@/lib/utils/salary";

export function AnalyticsFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentMonth = getCurrentMonth();

  const fromMonth = searchParams.get("from") ?? addMonths(currentMonth, -5);
  const toMonth = searchParams.get("to") ?? currentMonth;

  function updateParams(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value);
    }
    // KPI snapshot always follows the range end month
    params.delete("month");
    router.push(`/analytics?${params.toString()}`);
  }

  const inputClass =
    "w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2.5 text-sm outline-none sm:w-auto min-h-[44px]";

  const labelClass = "text-xs font-medium text-[var(--muted)]";

  return (
    <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-end sm:gap-4">
      <label className="flex flex-col gap-1">
        <span className={labelClass}>From</span>
        <input
          type="month"
          value={fromMonth}
          max={toMonth}
          onChange={(e) => updateParams({ from: e.target.value })}
          className={inputClass}
          aria-label="From month"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className={labelClass}>To</span>
        <input
          type="month"
          value={toMonth}
          min={fromMonth}
          onChange={(e) => updateParams({ to: e.target.value })}
          className={inputClass}
          aria-label="To month"
        />
      </label>
    </div>
  );
}
