"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { EMPLOYEE_TYPE_FILTER_OPTIONS, type Project } from "@/types/database";

export function AttendanceFilters({ projects }: { projects: Project[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateParam(key: string, value: string, allValue = "all") {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === allValue) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`/attendance?${params.toString()}`);
  }

  const selectClass =
    "w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2.5 text-sm outline-none sm:w-auto min-h-[44px]";

  return (
    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
      <select
        value={searchParams.get("project") ?? ""}
        onChange={(e) => updateParam("project", e.target.value, "")}
        className={selectClass}
      >
        <option value="">All projects</option>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      <select
        value={searchParams.get("type") ?? "all"}
        onChange={(e) => updateParam("type", e.target.value)}
        className={selectClass}
      >
        {EMPLOYEE_TYPE_FILTER_OPTIONS.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>
    </div>
  );
}
