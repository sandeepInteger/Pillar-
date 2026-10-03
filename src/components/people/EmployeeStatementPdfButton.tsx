"use client";

import { Download } from "lucide-react";

interface EmployeeStatementPdfButtonProps {
  employeeId: string;
  month: string;
  projectId?: string;
}

/** Downloads the single monthly statement (attendance + payable + salary ledger) */
export function EmployeeStatementPdfButton({
  employeeId,
  month,
  projectId,
}: EmployeeStatementPdfButtonProps) {
  function handleDownload() {
    const params = new URLSearchParams({ month });
    if (projectId) params.set("project", projectId);
    window.location.href = `/api/employee-statement/${employeeId}?${params.toString()}`;
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
    >
      <Download className="h-4 w-4" />
      Download PDF
    </button>
  );
}
