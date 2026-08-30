"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { Project } from "@/types/database";

const types = [
  { value: "all", label: "Everyone" },
  { value: "labour", label: "Labour" },
  { value: "foreman", label: "Foreman" },
  { value: "engineer", label: "Engineer" },
  { value: "staff", label: "Staff" },
  { value: "founder", label: "Founder" },
];

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

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={searchParams.get("project") ?? ""}
        onChange={(e) => updateParam("project", e.target.value, "")}
        className="rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none"
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
        className="rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none"
      >
        {types.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>
    </div>
  );
}
