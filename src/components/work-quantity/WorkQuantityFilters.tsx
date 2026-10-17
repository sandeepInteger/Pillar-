"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { Project, WorkTypeConfig } from "@/types/database";
import { getCurrentMonth } from "@/lib/utils/salary";

export function WorkQuantityFilters({
  projects,
  workTypes,
}: {
  projects: Project[];
  workTypes: WorkTypeConfig[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function update(key: string, value: string, allValue = "all") {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== allValue) params.set(key, value);
    else params.delete(key);
    router.push(`/work-quantity?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <input
        type="month"
        value={searchParams.get("month") ?? getCurrentMonth()}
        onChange={(e) => update("month", e.target.value, "")}
        className="rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none"
        aria-label="Select month"
      />
      <select
        value={searchParams.get("project") ?? "all"}
        onChange={(e) => update("project", e.target.value)}
        className="rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none"
      >
        <option value="all">All projects</option>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      <select
        value={searchParams.get("type") ?? "all"}
        onChange={(e) => update("type", e.target.value)}
        className="rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none"
      >
        <option value="all">All work types</option>
        {workTypes.map((type) => (
          <option key={type.code} value={type.code}>
            {type.name}
          </option>
        ))}
      </select>
    </div>
  );
}
