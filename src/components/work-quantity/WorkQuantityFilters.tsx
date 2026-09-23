"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { Project } from "@/types/database";
import { WORK_TYPE_DISPLAY_ORDER, WORK_TYPE_LABELS } from "@/types/database";

export function WorkQuantityFilters({ projects }: { projects: Project[] }) {
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
        {WORK_TYPE_DISPLAY_ORDER.map((type) => (
          <option key={type} value={type}>
            {WORK_TYPE_LABELS[type]}
          </option>
        ))}
      </select>
    </div>
  );
}
