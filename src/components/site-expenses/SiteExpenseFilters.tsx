"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { ExpenseCategory, Project } from "@/types/database";
import { getCurrentMonth } from "@/lib/utils/salary";

const selectClass =
  "rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none";

export function SiteExpenseFilters({
  projects,
  categories,
}: {
  projects: Project[];
  categories: ExpenseCategory[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function update(key: string, value: string, allValue = "all") {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== allValue) params.set(key, value);
    else params.delete(key);
    router.push(`/site-expenses?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <input
        type="month"
        value={searchParams.get("month") ?? getCurrentMonth()}
        onChange={(e) => update("month", e.target.value, "")}
        className={selectClass}
        aria-label="Select month"
      />
      <select
        value={searchParams.get("project") ?? "all"}
        onChange={(e) => update("project", e.target.value)}
        className={selectClass}
      >
        <option value="all">All sites</option>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      <select
        value={searchParams.get("category") ?? "all"}
        onChange={(e) => update("category", e.target.value)}
        className={selectClass}
      >
        <option value="all">All categories</option>
        {categories.map((c) => (
          <option key={c.code} value={c.code}>
            {c.name}
          </option>
        ))}
      </select>
    </div>
  );
}
