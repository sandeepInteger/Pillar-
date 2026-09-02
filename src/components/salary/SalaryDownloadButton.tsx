"use client";

import { useSearchParams } from "next/navigation";
import { Download } from "lucide-react";
import { getCurrentMonth } from "@/lib/utils/salary";

export function SalaryDownloadButton() {
  const searchParams = useSearchParams();
  const month = searchParams.get("month") ?? getCurrentMonth();
  const type = searchParams.get("type") ?? "all";
  const project = searchParams.get("project") ?? "";

  const params = new URLSearchParams();
  params.set("month", month);
  if (type !== "all") params.set("type", type);
  if (project) params.set("project", project);

  return (
    <a
      href={`/api/salary/export?${params.toString()}`}
      download
      className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 sm:w-auto"
    >
      <Download className="h-4 w-4" />
      Download CSV
    </a>
  );
}
