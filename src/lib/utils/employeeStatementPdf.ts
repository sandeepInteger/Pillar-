import type {
  AttendanceRecord,
  EmployeeSalaryDetail,
  SalaryLedgerEntry,
} from "@/types/database";
import {
  EMPLOYEE_TYPE_LABELS,
  SALARY_PAYMENT_MODE_LABELS,
  SALARY_PAYMENT_TYPE_LABELS,
  STANDARD_MONTH_WORKING_DAYS,
  tracksAttendance,
} from "@/types/database";
import { aggregateAttendanceForSalary, parseMonth } from "@/lib/utils/salary";
import { formatInr } from "@/components/pdf/PdfShared";
import { DEFAULT_COMPANY_NAME } from "@/types/pdf";
import type {
  EmployeeStatementPDFData,
  StatementAmountRow,
  StatementDay,
  StatementLedgerRow,
} from "@/types/pdf";

export function formatDayDate(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function shortDate(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function formatQty(value: number): string {
  return String(round2(value));
}

function dayCount(count: number): string {
  return `${formatQty(count)} ${count === 1 ? "day" : "days"}`;
}

/** P present · A absent · H half day · L leave (SL) */
function statusCode(record: AttendanceRecord): string {
  switch (record.shift_type) {
    case "absent":
      return "A";
    case "half":
      return "H";
    case "sl":
      return "L";
    case "hours":
      return Number(record.hours_worked ?? 0) > 0 ? "P" : "A";
    default:
      return "P";
  }
}

// Helvetica in the PDF has no ₹ glyph, so amounts use "Rs." via formatInr.
function money(amount: number): string {
  return amount !== 0 ? formatInr(amount) : "-";
}

function ledgerDescription(entry: SalaryLedgerEntry): string {
  if (entry.paymentType === "opening") {
    return entry.earned > 0
      ? "Previous balance (still to pay)"
      : "Previous advance (paid extra earlier)";
  }
  if (entry.paymentType === "earned") return "Salary earned this month";
  return SALARY_PAYMENT_TYPE_LABELS[entry.paymentType];
}

function ledgerMode(entry: SalaryLedgerEntry): string {
  if (!entry.paymentMode) return "-";
  const mode = SALARY_PAYMENT_MODE_LABELS[entry.paymentMode];
  return entry.paymentApp ? `${mode} · ${entry.paymentApp}` : mode;
}

export interface BuildEmployeeStatementParams {
  detail: EmployeeSalaryDetail;
  records: AttendanceRecord[];
  projectName: string | null;
  companyName?: string;
}

/** One-page monthly statement, reusing the payroll math from getEmployeeSalaryDetail
 * so the PDF always matches the on-screen ledger. */
export function buildEmployeeStatementPdfData(
  params: BuildEmployeeStatementParams
): EmployeeStatementPDFData {
  const { detail, records, projectName } = params;
  const { employee, month } = detail;
  const { year, month: m } = parseMonth(month);
  const lastDay = new Date(year, m, 0).getDate();
  const mm = String(m).padStart(2, "0");
  const isoFor = (day: number) => `${year}-${mm}-${String(day).padStart(2, "0")}`;

  // --- Attendance grid + summary -------------------------------------------
  const recordsByDate = new Map(records.map((r) => [r.attendance_date, r]));
  const days: StatementDay[] = [];
  const summary = {
    totalDays: lastDay,
    present: 0,
    absent: 0,
    halfDay: 0,
    leave: 0,
    notMarked: 0,
    overtimeHours: 0,
  };

  for (let day = 1; day <= lastDay; day++) {
    const iso = isoFor(day);
    const record = recordsByDate.get(iso);
    let status = "-";
    let ot = "";
    if (record) {
      status = statusCode(record);
      const otHours = Number(record.overtime_hours ?? 0);
      if (otHours > 0) {
        ot = `${formatQty(otHours)} h`;
        summary.overtimeHours += otHours;
      }
    }
    if (status === "P") summary.present++;
    else if (status === "A") summary.absent++;
    else if (status === "H") summary.halfDay++;
    else if (status === "L") summary.leave++;
    else summary.notMarked++;
    days.push({ day, date: shortDate(iso), status, ot });
  }
  summary.overtimeHours = round2(summary.overtimeHours);

  // 5 columns of 6 days; the last runs to month end (25 - 28/29/30/31)
  const columns = [0, 6, 12, 18, 24].map((start, i, starts) => {
    const isLast = i === starts.length - 1;
    const slice = isLast ? days.slice(start) : days.slice(start, start + 6);
    return {
      label: `${start + 1} - ${isLast ? lastDay : start + 6}`,
      days: slice,
    };
  });

  // --- Total payable (rows add up to the ledger's gross) --------------------
  const attendance = aggregateAttendanceForSalary(
    records.map((r) => ({
      shift_type: r.shift_type,
      day_units: Number(r.day_units),
      hours_worked: r.hours_worked,
      overtime_hours: r.overtime_hours,
    }))
  );
  const netSalary = detail.grossAmount ?? 0;
  const rows: StatementAmountRow[] = [];
  let rateLabel = "Not set";
  const otNote =
    summary.overtimeHours > 0 ? `${summary.overtimeHours} hrs` : "-";

  if (!tracksAttendance(employee.employee_type) && detail.monthlySalary != null) {
    rateLabel = `${formatInr(detail.monthlySalary)} / month (fixed)`;
    rows.push({ label: "Fixed monthly salary", detail: "No attendance", amount: detail.monthlySalary });
  } else if (detail.salaryType === "hourly" && employee.hourly_rate != null) {
    const rate = Number(employee.hourly_rate);
    rateLabel = `${formatInr(rate)} / hour`;
    rows.push({
      label: "Attendance (regular hours)",
      detail: `${formatQty(attendance.regularHours)} hrs × ${formatInr(rate)}`,
      amount: round2(attendance.regularHours * rate),
    });
    rows.push({
      label: "Overtime",
      detail: `${formatQty(attendance.overtimeHours)} hrs × ${formatInr(rate)}`,
      amount: round2(attendance.overtimeHours * rate),
    });
  } else if (detail.salaryType === "monthly" && detail.monthlySalary != null) {
    const perDay = detail.monthlySalary / STANDARD_MONTH_WORKING_DAYS;
    rateLabel = `${formatInr(detail.monthlySalary)} / month (${formatInr(round2(perDay))} / day)`;
    rows.push({ label: "Monthly salary", detail: "Full month", amount: detail.monthlySalary });
    if (detail.salaryDeduction > 0) {
      rows.push({
        label: "Less: unpaid absent / extra leave",
        detail: `${dayCount(detail.salaryDeduction / perDay)} × ${formatInr(round2(perDay))}`,
        amount: -detail.salaryDeduction,
      });
    }
    if (detail.slEncashment > 0) {
      rows.push({
        label: "Unused leave (SL) paid",
        detail: dayCount(detail.unusedSlDays),
        amount: detail.slEncashment,
      });
    }
    rows.push({ label: "Overtime", detail: `${otNote} (not paid separately)`, amount: 0 });
  } else if (detail.dailyRate != null) {
    const rate = detail.dailyRate;
    rateLabel = `${formatInr(rate)} / day`;
    const halfUnits = summary.halfDay * 0.5;
    const fullUnits = Math.max(0, attendance.manDays - halfUnits);
    const paidSl = Math.min(attendance.slDays, detail.slAllowance);
    rows.push({
      label: "Attendance (full days)",
      detail: `${dayCount(fullUnits)} × ${formatInr(rate)}`,
      amount: round2(fullUnits * rate),
    });
    rows.push({
      label: "Half days",
      detail: `${summary.halfDay} × 0.5 day × ${formatInr(rate)}`,
      amount: round2(halfUnits * rate),
    });
    if (paidSl > 0) {
      rows.push({
        label: "Paid leave (SL taken)",
        detail: `${dayCount(paidSl)} × ${formatInr(rate)}`,
        amount: round2(paidSl * rate),
      });
    }
    if (detail.slEncashment > 0) {
      rows.push({
        label: "Unused leave (SL) paid",
        detail: `${dayCount(detail.unusedSlDays)} × ${formatInr(rate)}`,
        amount: detail.slEncashment,
      });
    }
    rows.push({ label: "Overtime", detail: `${otNote} (not paid separately)`, amount: 0 });
  }

  // --- Salary ledger ---------------------------------------------------------
  const ledgerRows: StatementLedgerRow[] = detail.ledger.map((entry) => ({
    date: shortDate(entry.date),
    description: ledgerDescription(entry),
    mode: ledgerMode(entry),
    given: money(entry.paidOut),
    earned: money(entry.earned),
  }));

  const closingBalance =
    detail.balanceDue ??
    round2(detail.openingBalance + netSalary - detail.totalPaidOut);

  return {
    companyName: params.companyName ?? DEFAULT_COMPANY_NAME,
    employeeName: employee.full_name,
    employeeCode: employee.employee_code,
    designation: employee.designation || EMPLOYEE_TYPE_LABELS[employee.employee_type],
    project: projectName ?? "—",
    reportingFrom: formatDayDate(isoFor(1)),
    reportingTo: formatDayDate(isoFor(lastDay)),
    tracksAttendance: tracksAttendance(employee.employee_type),
    summary,
    columns,
    payable: { rateLabel, rows, netSalary },
    ledger: {
      rows: ledgerRows,
      openingBalance: detail.openingBalance,
      netSalary,
      givenThisMonth: detail.totalPaidOut,
      closingBalance,
    },
  };
}
