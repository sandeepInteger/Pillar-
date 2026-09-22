import Link from "next/link";
import { CalendarDays } from "lucide-react";
import type { AttendanceRecord, ShiftType } from "@/types/database";
import { SHIFT_TYPE_LABELS } from "@/types/database";
import {
  addMonths,
  formatMonthLabel,
  formatCurrency,
  parseMonth,
} from "@/lib/utils/salary";
import { AttendancePdfDownloadButton } from "@/components/people/AttendancePdfDownloadButton";

const STATUS_BADGE_COLORS: Record<ShiftType, string> = {
  absent: "bg-red-50 text-red-600",
  half: "bg-amber-50 text-amber-800",
  full: "bg-emerald-50 text-emerald-700",
  double: "bg-violet-50 text-violet-700",
  sl: "bg-sky-50 text-sky-700",
  hours: "bg-emerald-50 text-emerald-800",
};

interface PersonAttendanceSectionProps {
  employeeId: string;
  month: string;
  records: AttendanceRecord[];
  summary: {
    manDays: number;
    absentDays: number;
    slDays: number;
    overtimeHours: number;
  };
  projectName: string | null;
  rateDisplay: string | null;
  grossAmount: number | null;
}

export function PersonAttendanceSection({
  employeeId,
  month,
  records,
  summary,
  projectName,
  rateDisplay,
  grossAmount,
}: PersonAttendanceSectionProps) {
  const prevMonth = addMonths(month, -1);
  const nextMonth = addMonths(month, 1);
  const halfDayCount = records.filter((r) => r.shift_type === "half").length;

  const { year, month: monthNum } = parseMonth(month);
  const lastDay = new Date(year, monthNum, 0).getDate();
  const mm = String(monthNum).padStart(2, "0");
  const recordsByDate = new Map(records.map((r) => [r.attendance_date, r]));

  const columns: { day: number; record: AttendanceRecord | undefined }[][] = [
    [],
    [],
    [],
  ];
  for (let day = 1; day <= lastDay; day++) {
    const dateIso = `${year}-${mm}-${String(day).padStart(2, "0")}`;
    const columnIndex = day <= 10 ? 0 : day <= 20 ? 1 : 2;
    columns[columnIndex].push({ day, record: recordsByDate.get(dateIso) });
  }
  const columnRanges = [
    "1 - 10",
    "11 - 20",
    `21 - ${lastDay}`,
  ];

  return (
    <section className="rounded-xl border border-[var(--border)] bg-white p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <CalendarDays className="h-5 w-5 text-[var(--primary)]" />
          Attendance
        </h2>
        <AttendancePdfDownloadButton employeeId={employeeId} month={month} />
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-[var(--background)] px-4 py-2.5">
        <Link
          href={`/people/${employeeId}?month=${prevMonth}`}
          className="text-sm font-medium text-gray-600 hover:text-[var(--primary)]"
        >
          ← {formatMonthLabel(prevMonth)}
        </Link>
        <p className="text-sm font-semibold">{formatMonthLabel(month)}</p>
        <Link
          href={`/people/${employeeId}?month=${nextMonth}`}
          className="text-sm font-medium text-gray-600 hover:text-[var(--primary)]"
        >
          {formatMonthLabel(nextMonth)} →
        </Link>
      </div>

      {projectName && (
        <p className="mb-4 text-sm text-[var(--muted)]">
          Project: <span className="font-medium text-gray-700">{projectName}</span>
        </p>
      )}

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-[var(--border)] p-3 text-center">
          <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
            Man-days
          </p>
          <p className="mt-1 text-xl font-bold">{summary.manDays}</p>
        </div>
        <div className="rounded-lg border border-[var(--border)] p-3 text-center">
          <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
            Half days
          </p>
          <p className="mt-1 text-xl font-bold">{halfDayCount}</p>
        </div>
        <div className="rounded-lg border border-[var(--border)] p-3 text-center">
          <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
            Absent / SL
          </p>
          <p className="mt-1 text-xl font-bold">
            {summary.absentDays} / {summary.slDays}
          </p>
        </div>
        <div className="rounded-lg border border-[var(--border)] p-3 text-center">
          <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
            Overtime
          </p>
          <p className="mt-1 text-xl font-bold">
            {summary.overtimeHours > 0 ? `${summary.overtimeHours} hr` : "—"}
          </p>
        </div>
      </div>

      {(rateDisplay || grossAmount != null) && (
        <p className="mb-4 text-sm text-[var(--muted)]">
          {rateDisplay && <>Rate: {rateDisplay}</>}
          {rateDisplay && grossAmount != null && " · "}
          {grossAmount != null && (
            <>Gross this month: <span className="font-medium text-gray-700">{formatCurrency(grossAmount)}</span></>
          )}
        </p>
      )}

      {records.length === 0 ? (
        <div className="rounded-lg border border-[var(--border)] px-4 py-8 text-center text-sm text-[var(--muted)]">
          No attendance marked for {formatMonthLabel(month)}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          {columns.map((column, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-lg border border-[var(--border)]"
            >
              <div className="border-b border-[var(--border)] bg-[var(--background)] px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                {columnRanges[i]}
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] text-left text-[11px] uppercase tracking-wide text-[var(--muted)]">
                    <th className="px-3 py-2 font-semibold">Date</th>
                    <th className="px-3 py-2 font-semibold">Status</th>
                    <th className="px-3 py-2 font-semibold text-right">OT</th>
                  </tr>
                </thead>
                <tbody>
                  {column.map(({ day, record }) => (
                    <tr
                      key={day}
                      className="border-b border-[var(--border)] last:border-0"
                    >
                      <td className="px-3 py-2 tabular-nums">{day}</td>
                      <td className="px-3 py-2">
                        {record ? (
                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_BADGE_COLORS[record.shift_type]}`}
                          >
                            {SHIFT_TYPE_LABELS[record.shift_type]}
                          </span>
                        ) : (
                          <span className="text-[11px] text-[var(--muted)]">
                            Not marked
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {record && Number(record.overtime_hours ?? 0) > 0
                          ? `${record.overtime_hours} hr`
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
