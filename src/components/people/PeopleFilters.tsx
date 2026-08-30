"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

const types = [
  { value: "all", label: "Everyone" },
  { value: "labour", label: "Labour" },
  { value: "foreman", label: "Foreman" },
  { value: "engineer", label: "Engineer" },
  { value: "staff", label: "Staff" },
  { value: "founder", label: "Founder" },
];

export function PeopleFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const update = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== "all") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`/people?${params.toString()}`);
    },
    [router, searchParams]
  );

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        value={searchParams.get("type") ?? "all"}
        onChange={(e) => update("type", e.target.value)}
        className="rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none"
      >
        {types.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>
      <select
        value={searchParams.get("status") ?? "all"}
        onChange={(e) => update("status", e.target.value)}
        className="rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none"
      >
        <option value="all">All Status</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
        <option value="left">Left</option>
      </select>
      <input
        type="search"
        placeholder="Search name or code..."
        defaultValue={searchParams.get("search") ?? ""}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            update("search", (e.target as HTMLInputElement).value);
          }
        }}
        className="rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none"
      />
    </div>
  );
}
