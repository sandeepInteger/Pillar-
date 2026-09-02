"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { addMonths, getCurrentMonth } from "@/lib/utils/salary";

export function AnalyticsFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentMonth = getCurrentMonth();

  const fromMonth = searchParams.get("from") ?? addMonths(currentMonth, -5);
  const toMonth = searchParams.get("to") ?? currentMonth;
  const focusMonth = searchParams.get("month") ?? toMonth;

  function updateParams(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value);
    }
    router.push(`/analytics?${params.toString()}`);
  }

  const inputClass =
    "w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2.5 text-sm outline-none sm:w-auto min-h-[44px]";

  return (
    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
      <input
        type="month"
        value={fromMonth}
        max={toMonth}
        onChange={(e) => updateParams({ from: e.target.value })}
        className={inputClass}
        aria-label="From month"
      />
      <input
        type="month"
        value={toMonth}
        min={fromMonth}
        onChange={(e) => updateParams({ to: e.target.value })}
        className={inputClass}
        aria-label="To month"
      />
      <input
        type="month"
        value={focusMonth}
        min={fromMonth}
        max={toMonth}
        onChange={(e) => updateParams({ month: e.target.value })}
        className={inputClass}
        aria-label="Focus month for KPIs"
        title="Focus month for KPI cards"
      />
    </div>
  );
}
