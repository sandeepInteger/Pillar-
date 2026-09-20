"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { Project } from "@/types/database";

export function RaBillFilters({ projects }: { projects: Project[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function update(key: string, value: string, allValue = "all") {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== allValue) params.set(key, value);
    else params.delete(key);
    router.push(`/ra-bills?${params.toString()}`);
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
        value={searchParams.get("payment") ?? "all"}
        onChange={(e) => update("payment", e.target.value)}
        className="rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none"
      >
        <option value="all">All payments</option>
        <option value="pending">Pending in bank</option>
        <option value="received">Received in bank</option>
      </select>
    </div>
  );
}
