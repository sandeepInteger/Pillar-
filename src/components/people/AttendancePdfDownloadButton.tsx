"use client";

import { Download } from "lucide-react";

interface AttendancePdfDownloadButtonProps {
  employeeId: string;
  month: string;
}

export function AttendancePdfDownloadButton({
  employeeId,
  month,
}: AttendancePdfDownloadButtonProps) {
  function handleDownload() {
    window.location.href = `/api/attendance/export/${employeeId}?month=${month}`;
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
