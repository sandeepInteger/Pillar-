"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Download, X } from "lucide-react";
import {
  addMonths,
  formatMonthLabel,
  getCurrentMonth,
} from "@/lib/utils/salary";

interface EmployeeSalaryDownloadProps {
  employeeId: string;
  employeeName: string;
}

type DownloadMode = "current" | "single" | "range";

export function EmployeeSalaryDownload({
  employeeId,
  employeeName,
}: EmployeeSalaryDownloadProps) {
  const searchParams = useSearchParams();
  const currentMonth = searchParams.get("month") ?? getCurrentMonth();
  const project = searchParams.get("project") ?? "";

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<DownloadMode>("current");
  const [singleMonth, setSingleMonth] = useState(currentMonth);
  const [fromMonth, setFromMonth] = useState(addMonths(currentMonth, -2));
  const [toMonth, setToMonth] = useState(currentMonth);
  const [error, setError] = useState<string | null>(null);

  function buildDownloadUrl(): string | null {
    const params = new URLSearchParams();
    if (project) params.set("project", project);

    if (mode === "current") {
      params.set("mode", "single");
      params.set("month", currentMonth);
    } else if (mode === "single") {
      if (!singleMonth) {
        setError("Select a month");
        return null;
      }
      params.set("mode", "single");
      params.set("month", singleMonth);
    } else {
      if (!fromMonth || !toMonth) {
        setError("Select both start and end months");
        return null;
      }
      if (fromMonth > toMonth) {
        setError("Start month must be before or equal to end month");
        return null;
      }
      params.set("mode", "range");
      params.set("from", fromMonth);
      params.set("to", toMonth);
    }

    setError(null);
    return `/api/salary/export/${employeeId}?${params.toString()}`;
  }

  function handleDownload() {
    const url = buildDownloadUrl();
    if (!url) return;
    window.location.href = url;
    setOpen(false);
  }

  const inputClass =
    "w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none min-h-[44px]";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 sm:w-auto"
      >
        <Download className="h-4 w-4" />
        Download
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">Download salary report</h3>
                <p className="mt-1 text-sm text-[var(--muted)]">{employeeName}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--border)] p-3 hover:bg-gray-50">
                <input
                  type="radio"
                  name="download-mode"
                  checked={mode === "current"}
                  onChange={() => setMode("current")}
                  className="mt-1"
                />
                <span>
                  <span className="block text-sm font-medium">
                    This month ({formatMonthLabel(currentMonth)})
                  </span>
                  <span className="text-xs text-[var(--muted)]">
                    Download the month you are viewing now
                  </span>
                </span>
              </label>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--border)] p-3 hover:bg-gray-50">
                <input
                  type="radio"
                  name="download-mode"
                  checked={mode === "single"}
                  onChange={() => setMode("single")}
                  className="mt-1"
                />
                <span className="flex-1">
                  <span className="block text-sm font-medium">
                    Particular month
                  </span>
                  <span className="text-xs text-[var(--muted)]">
                    Pick any one month
                  </span>
                  {mode === "single" && (
                    <input
                      type="month"
                      value={singleMonth}
                      onChange={(e) => setSingleMonth(e.target.value)}
                      className={`${inputClass} mt-2`}
                    />
                  )}
                </span>
              </label>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--border)] p-3 hover:bg-gray-50">
                <input
                  type="radio"
                  name="download-mode"
                  checked={mode === "range"}
                  onChange={() => setMode("range")}
                  className="mt-1"
                />
                <span className="flex-1">
                  <span className="block text-sm font-medium">
                    Multiple months
                  </span>
                  <span className="text-xs text-[var(--muted)]">
                    From one month to another
                  </span>
                  {mode === "range" && (
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <div>
                        <span className="mb-1 block text-xs text-[var(--muted)]">
                          From
                        </span>
                        <input
                          type="month"
                          value={fromMonth}
                          onChange={(e) => setFromMonth(e.target.value)}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <span className="mb-1 block text-xs text-[var(--muted)]">
                          To
                        </span>
                        <input
                          type="month"
                          value={toMonth}
                          onChange={(e) => setToMonth(e.target.value)}
                          className={inputClass}
                        />
                      </div>
                    </div>
                  )}
                </span>
              </label>
            </div>

            {error && (
              <p className="mt-3 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={handleDownload}
                className="pillar-btn-primary flex-1 justify-center"
              >
                Download CSV
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
