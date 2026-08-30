"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Save } from "lucide-react";
import type { AttendanceRecord, Employee, ShiftType } from "@/types/database";
import {
  SHIFT_TYPE_COLORS,
  SHIFT_TYPE_LABELS,
  SHIFT_TYPE_SHORT,
} from "@/types/database";
import { saveWeekAttendance } from "@/lib/actions/attendance";
import {
  addWeeks,
  attendanceCellKey,
  formatDayHeader,
  formatWeekRange,
  getWeekDates,
  sumDayUnits,
} from "@/lib/utils/attendance";
import { EMPLOYEE_TYPE_LABELS, EMPLOYEE_TYPE_COLORS } from "@/types/database";

const SHIFT_OPTIONS: ShiftType[] = ["absent", "half", "full", "double"];

interface AttendanceGridProps {
  employees: Employee[];
  weekStart: string;
  records: AttendanceRecord[];
  employeeType: string;
  projectId?: string;
}

function buildInitialShifts(
  employees: Employee[],
  dates: string[],
  records: AttendanceRecord[],
  projectId?: string
): Record<string, ShiftType> {
  const map: Record<string, ShiftType> = {};

  for (const emp of employees) {
    for (const date of dates) {
      const key = attendanceCellKey(emp.id, date);
      const record = records.find(
        (r) => r.employee_id === emp.id && r.attendance_date === date
      );

      if (!record) {
        map[key] = "absent";
        continue;
      }

      if (projectId) {
        if (record.project_id === projectId || record.project_id === null) {
          map[key] = record.shift_type;
        } else {
          map[key] = "absent";
        }
      } else {
        map[key] = record.shift_type;
      }
    }
  }

  return map;
}

export function AttendanceGrid({
  employees,
  weekStart,
  records,
  employeeType,
  projectId,
}: AttendanceGridProps) {
  const dates = useMemo(() => getWeekDates(weekStart), [weekStart]);
  const [shifts, setShifts] = useState<Record<string, ShiftType>>(() =>
    buildInitialShifts(employees, dates, records, projectId)
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(
    null
  );

  const prevWeek = addWeeks(weekStart, -1);
  const nextWeek = addWeeks(weekStart, 1);

  const typeQuery = employeeType !== "all" ? `&type=${employeeType}` : "";
  const projectQuery = projectId ? `&project=${projectId}` : "";

  function setShift(employeeId: string, date: string, shift: ShiftType) {
    const key = attendanceCellKey(employeeId, date);
    setShifts((prev) => ({ ...prev, [key]: shift }));
  }

  function setColumnShift(date: string, shift: ShiftType) {
    setShifts((prev) => {
      const next = { ...prev };
      for (const emp of employees) {
        next[attendanceCellKey(emp.id, date)] = shift;
      }
      return next;
    });
  }

  async function handleSave() {
    setLoading(true);
    setMessage(null);

    const cells = Object.entries(shifts).map(([key, shift_type]) => {
      const [employee_id, attendance_date] = key.split(":");
      return {
        employee_id,
        attendance_date,
        shift_type,
        project_id: projectId ?? null,
      };
    });

    const result = await saveWeekAttendance(weekStart, cells);

    if (result.error) {
      setMessage({ type: "err", text: result.error });
    } else {
      setMessage({
        type: "ok",
        text: `Saved ${result.count} attendance records`,
      });
    }
    setLoading(false);
  }

  const weekTotal = employees.reduce(
    (sum, emp) => sum + sumDayUnits(shifts, emp.id, dates),
    0
  );

  if (employees.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--border)] bg-white p-12 text-center">
        <p className="text-lg font-medium text-gray-600">No active employees</p>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Add employees in People first, then mark attendance here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Week navigation + summary */}
      <div className="flex flex-col gap-4 pillar-card p-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex items-center justify-center gap-2 sm:justify-start">
          <Link
            href={`/attendance?week=${prevWeek}${typeQuery}${projectQuery}`}
            className="rounded-lg border border-[var(--border)] p-2.5 hover:bg-gray-50"
            aria-label="Previous week"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0 flex-1 text-center sm:min-w-[200px] sm:flex-none">
            <p className="text-xs font-semibold sm:text-sm">{formatWeekRange(weekStart)}</p>
            <p className="text-[10px] text-[var(--muted)] sm:text-xs">Week starts Monday</p>
          </div>
          <Link
            href={`/attendance?week=${nextWeek}${typeQuery}${projectQuery}`}
            className="rounded-lg border border-[var(--border)] p-2.5 hover:bg-gray-50"
            aria-label="Next week"
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <span className="text-center text-sm sm:text-left">
            <strong>{weekTotal}</strong> man-days this week
          </span>
          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="pillar-btn-primary w-full justify-center disabled:opacity-60 sm:w-auto"
          >
            <Save className="h-4 w-4" />
            {loading ? "Saving..." : "Save Week"}
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`rounded-lg px-4 py-3 text-sm ${
            message.type === "ok"
              ? "border border-violet-200 bg-violet-50 text-violet-800"
              : "border border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-2">
        {SHIFT_OPTIONS.map((shift) => (
          <span
            key={shift}
            className={`rounded-full border px-3 py-1 text-xs font-medium ${SHIFT_TYPE_COLORS[shift]}`}
          >
            {SHIFT_TYPE_SHORT[shift]} = {SHIFT_TYPE_LABELS[shift]}
          </span>
        ))}
      </div>

      {/* Grid — scroll horizontally on mobile */}
      <p className="text-xs text-[var(--muted)] lg:hidden">
        Swipe left on the table to see all days →
      </p>
      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0 pillar-card">
        <table className="w-full min-w-[640px] text-sm sm:min-w-[900px]">
          <thead>
            <tr className="border-b border-[var(--border)] bg-gray-50">
              <th className="sticky left-0 z-10 bg-gray-50 px-2 py-2 text-left text-xs font-semibold sm:px-4 sm:py-3 sm:text-sm">
                Employee
              </th>
              {dates.map((date) => {
                const { day, date: dateLabel } = formatDayHeader(date);
                return (
                  <th key={date} className="px-2 py-3 text-center font-semibold">
                    <div>{day}</div>
                    <div className="text-xs font-normal text-[var(--muted)]">
                      {dateLabel}
                    </div>
                    <select
                      className="mt-1 w-full rounded border border-gray-200 px-1 py-0.5 text-[10px] font-normal"
                      defaultValue=""
                      onChange={(e) => {
                        if (e.target.value) {
                          setColumnShift(date, e.target.value as ShiftType);
                          e.target.value = "";
                        }
                      }}
                    >
                      <option value="">All →</option>
                      {SHIFT_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {SHIFT_TYPE_SHORT[s]}
                        </option>
                      ))}
                    </select>
                  </th>
                );
              })}
              <th className="px-4 py-3 text-center font-semibold">Total</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => {
              const rowTotal = sumDayUnits(shifts, emp.id, dates);
              return (
                <tr
                  key={emp.id}
                  className="border-b border-gray-100 hover:bg-gray-50/50"
                >
                  <td className="sticky left-0 z-10 bg-white px-2 py-2 sm:px-4">
                    <div className="max-w-[120px] text-xs font-medium sm:max-w-none sm:text-sm">{emp.full_name}</div>
                    <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
                      <span>{emp.employee_code}</span>
                      <span
                        className={`rounded px-1.5 py-0.5 ${EMPLOYEE_TYPE_COLORS[emp.employee_type]}`}
                      >
                        {EMPLOYEE_TYPE_LABELS[emp.employee_type]}
                      </span>
                    </div>
                  </td>
                  {dates.map((date) => {
                    const key = attendanceCellKey(emp.id, date);
                    const shift = shifts[key] ?? "absent";
                    return (
                      <td key={date} className="px-2 py-2 text-center">
                        <select
                          value={shift}
                          onChange={(e) =>
                            setShift(emp.id, date, e.target.value as ShiftType)
                          }
                          className={`w-full rounded-lg border px-1 py-1.5 text-center text-xs font-semibold outline-none ${SHIFT_TYPE_COLORS[shift]}`}
                        >
                          {SHIFT_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                              {SHIFT_TYPE_SHORT[s]}
                            </option>
                          ))}
                        </select>
                      </td>
                    );
                  })}
                  <td className="px-4 py-2 text-center font-bold text-[var(--primary)]">
                    {rowTotal}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50 font-semibold">
              <td className="sticky left-0 bg-gray-50 px-4 py-3">Week total</td>
              {dates.map((date) => {
                const dayTotal = employees.reduce(
                  (sum, emp) =>
                    sum +
                    sumDayUnits(
                      shifts,
                      emp.id,
                      [date]
                    ),
                  0
                );
                return (
                  <td key={date} className="px-2 py-3 text-center text-[var(--primary)]">
                    {dayTotal}
                  </td>
                );
              })}
              <td className="px-4 py-3 text-center text-[var(--primary)]">{weekTotal}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <p className="text-xs text-[var(--muted)]">
        Man-day units: Absent = 0 · Half = 0.5 · Full = 1 · Double = 2. Row
        totals feed payroll in the next phase.
      </p>
    </div>
  );
}
