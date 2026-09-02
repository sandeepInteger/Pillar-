import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { SalarySummary } from "@/types/database";
import {
  EMPLOYEE_TYPE_COLORS,
  EMPLOYEE_TYPE_LABELS,
} from "@/types/database";
import {
  addMonths,
  buildSalaryQueryString,
  formatCurrency,
  formatMonthLabel,
  getPrimaryPayment,
} from "@/lib/utils/salary";

interface SalaryTableProps {
  summary: SalarySummary;
  month: string;
  employeeType: string;
  projectId?: string;
}

export function SalaryTable({
  summary,
  month,
  employeeType,
  projectId,
}: SalaryTableProps) {
  const prevMonth = addMonths(month, -1);
  const nextMonth = addMonths(month, 1);

  function buildNavHref(targetMonth: string) {
    const params = new URLSearchParams();
    params.set("month", targetMonth);
    if (employeeType !== "all") params.set("type", employeeType);
    if (projectId) params.set("project", projectId);
    return `/salary?${params.toString()}`;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-white px-4 py-3">
        <Link
          href={buildNavHref(prevMonth)}
          className="inline-flex min-h-[44px] items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Link>
        <p className="text-sm font-semibold text-[var(--foreground)]">
          {formatMonthLabel(month)}
        </p>
        <Link
          href={buildNavHref(nextMonth)}
          className="inline-flex min-h-[44px] items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl border border-[var(--border)] bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
            Gross earned
          </p>
          <p className="mt-1 text-2xl font-bold text-[var(--primary)]">
            {formatCurrency(summary.totalGross)}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
            Paid out
          </p>
          <p className="mt-1 text-2xl font-bold">
            {formatCurrency(summary.totalPaidOut)}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
            Balance due
          </p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">
            {formatCurrency(summary.totalBalanceDue)}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
            Man-days
          </p>
          <p className="mt-1 text-2xl font-bold">{summary.totalManDays}</p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
            Missing rate
          </p>
          <p className="mt-1 text-2xl font-bold text-amber-600">
            {summary.employeesMissingRate}
          </p>
        </div>
      </div>

      {(summary.employeesMissingRate > 0 ||
        summary.employeesMissingPayment > 0) && (
        <p className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Set <strong>daily rate</strong> and <strong>payment details</strong> on
          employee profiles. Click an employee to record advances and view their
          monthly ledger.
        </p>
      )}

      <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-white">
        <table className="min-w-[880px] w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--background)] text-left text-xs uppercase tracking-wide text-[var(--muted)]">
              <th className="px-4 py-3 font-semibold">Employee</th>
              <th className="px-4 py-3 font-semibold">Type</th>
              <th className="px-4 py-3 font-semibold text-right">Man-days</th>
              <th className="px-4 py-3 font-semibold text-right">Daily rate</th>
              <th className="px-4 py-3 font-semibold text-right">Gross</th>
              <th className="px-4 py-3 font-semibold text-right">Paid out</th>
              <th className="px-4 py-3 font-semibold text-right">Balance</th>
              <th className="px-4 py-3 font-semibold">Payout</th>
            </tr>
          </thead>
          <tbody>
            {summary.rows.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-12 text-center text-[var(--muted)]"
                >
                  No active employees for this filter.
                </td>
              </tr>
            ) : (
              summary.rows.map((row) => {
                const payment = getPrimaryPayment(row.employee);
                const detailQuery = buildSalaryQueryString({
                  month,
                  type: employeeType,
                  project: projectId,
                });

                return (
                  <tr
                    key={row.employee.id}
                    className="border-b border-[var(--border)] last:border-0 hover:bg-gray-50/50"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/salary/${row.employee.id}${detailQuery}`}
                        className="font-medium text-[var(--foreground)] hover:text-[var(--primary)]"
                      >
                        {row.employee.full_name}
                      </Link>
                      <p className="text-xs text-[var(--muted)]">
                        {row.employee.employee_code}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${EMPLOYEE_TYPE_COLORS[row.employee.employee_type]}`}
                      >
                        {EMPLOYEE_TYPE_LABELS[row.employee.employee_type]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums">
                      {row.manDays}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {row.dailyRate != null ? (
                        formatCurrency(row.dailyRate)
                      ) : (
                        <Link
                          href={`/people/${row.employee.id}/edit`}
                          className="text-xs font-medium text-amber-600 hover:underline"
                        >
                          Set rate
                        </Link>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">
                      {row.grossAmount != null
                        ? formatCurrency(row.grossAmount)
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {formatCurrency(row.totalPaidOut)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-[var(--primary)]">
                      {row.balanceDue != null
                        ? formatCurrency(row.balanceDue)
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {payment ? (
                        <span className="text-xs text-gray-600">{payment}</span>
                      ) : (
                        <Link
                          href={`/people/${row.employee.id}/edit`}
                          className="text-xs font-medium text-amber-600 hover:underline"
                        >
                          Add payment
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          {summary.rows.length > 0 && (
            <tfoot>
              <tr className="bg-[var(--background)] font-semibold">
                <td className="px-4 py-3" colSpan={2}>
                  Total ({summary.rows.length} employees)
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {summary.totalManDays}
                </td>
                <td className="px-4 py-3" />
                <td className="px-4 py-3 text-right tabular-nums">
                  {formatCurrency(summary.totalGross)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {formatCurrency(summary.totalPaidOut)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-[var(--primary)]">
                  {formatCurrency(summary.totalBalanceDue)}
                </td>
                <td className="px-4 py-3" />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <p className="text-xs text-[var(--muted)]">
        Monthly wage = man-days × daily rate from attendance. Advances and payouts
        are recorded per employee. Click a name to open the salary ledger.
      </p>
    </div>
  );
}
