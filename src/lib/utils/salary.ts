import type {
  EmployeeSalaryDetail,
  EmployeeWithRelations,
  SalaryLedgerEntry,
  SalaryPayment,
  SalaryPaymentFormData,
  SalaryRow,
  SalarySummary,
  SalaryType,
  ShiftType,
} from "@/types/database";
import {
  SALARY_PAYMENT_APP_OPTIONS,
  SALARY_PAYMENT_MODE_LABELS,
  SALARY_PAYMENT_TYPE_LABELS,
  STANDARD_MONTH_WORKING_DAYS,
} from "@/types/database";
import { maskAccountNumber } from "@/lib/utils/employees";

/** Month key: YYYY-MM */
export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function parseMonth(month: string): { year: number; month: number } {
  const [y, m] = month.split("-").map(Number);
  return { year: y, month: m };
}

export function getMonthDateRange(month: string): { start: string; end: string } {
  const { year, month: m } = parseMonth(month);
  const lastDay = new Date(year, m, 0).getDate();
  const mm = String(m).padStart(2, "0");
  return {
    start: `${year}-${mm}-01`,
    end: `${year}-${mm}-${String(lastDay).padStart(2, "0")}`,
  };
}

export function addMonths(month: string, delta: number): string {
  const { year, month: m } = parseMonth(month);
  const d = new Date(year, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function getMonthsInRange(fromMonth: string, toMonth: string): string[] {
  if (fromMonth > toMonth) return [];
  const months: string[] = [];
  let current = fromMonth;
  while (current <= toMonth) {
    months.push(current);
    current = addMonths(current, 1);
  }
  return months;
}

export function formatMonthLabel(month: string): string {
  const { year, month: m } = parseMonth(month);
  const d = new Date(year, m - 1, 1);
  return d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

export function formatMonthShort(month: string): string {
  const { year, month: m } = parseMonth(month);
  const d = new Date(year, m - 1, 1);
  return d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getPrimaryPayment(
  employee: EmployeeWithRelations
): string | null {
  const primary = employee.employee_payment_methods.find((p) => p.is_primary);
  const method = primary ?? employee.employee_payment_methods[0];
  if (!method) return null;

  if (method.method_type === "upi") {
    return method.upi_id
      ? `UPI · ${method.upi_id}`
      : method.upi_phone
        ? `UPI · ${method.upi_phone}`
        : null;
  }

  if (method.account_number) {
    const bank = method.bank_name ? `${method.bank_name} · ` : "";
    return `${bank}${maskAccountNumber(method.account_number)}`;
  }

  return null;
}

export function formatPaymentDetails(payment: Pick<
  SalaryPayment,
  "payment_mode" | "payment_app" | "payment_reference"
>): string {
  if (!payment.payment_mode) return "—";

  const mode = SALARY_PAYMENT_MODE_LABELS[payment.payment_mode];
  if (payment.payment_mode === "cash") return mode;

  if (payment.payment_mode === "upi") {
    const app = payment.payment_app ? `${payment.payment_app}` : "";
    const ref = payment.payment_reference ? ` · ${payment.payment_reference}` : "";
    return app ? `${mode} · ${app}${ref}` : `${mode}${ref}`;
  }

  const ref = payment.payment_reference
    ? ` · ${payment.payment_reference}`
    : "";
  return `${mode}${ref}`;
}

export function buildPaymentLabel(payment: SalaryPayment): string {
  const purpose = SALARY_PAYMENT_TYPE_LABELS[payment.payment_type];
  const note = payment.notes?.trim();
  return note ? `${purpose} · ${note}` : purpose;
}

export function getEmptySalaryPaymentForm(): SalaryPaymentFormData {
  return {
    payment_date: new Date().toISOString().slice(0, 10),
    amount: "",
    payment_type: "advance",
    payment_mode: "upi",
    payment_app: SALARY_PAYMENT_APP_OPTIONS[0],
    payment_reference: "",
    notes: "",
  };
}

export function paymentToFormData(
  payment: SalaryPayment
): SalaryPaymentFormData {
  return {
    payment_date: payment.payment_date,
    amount: String(payment.amount),
    payment_type: payment.payment_type,
    payment_mode: payment.payment_mode ?? "cash",
    payment_app: payment.payment_app ?? SALARY_PAYMENT_APP_OPTIONS[0],
    payment_reference: payment.payment_reference ?? "",
    notes: payment.notes ?? "",
  };
}

export { SALARY_PAYMENT_APP_OPTIONS };

export function paymentSignedAmount(
  payment: Pick<SalaryPayment, "amount" | "payment_type">
): number {
  const amount = Number(payment.amount);
  return payment.payment_type === "deduction" ? -amount : amount;
}

export function sumPaidOut(payments: SalaryPayment[]): number {
  return payments.reduce((sum, p) => sum + paymentSignedAmount(p), 0);
}

export interface SalaryAttendanceBreakdown {
  manDays: number;
  absentDays: number;
  slDays: number;
}

export function aggregateAttendanceForSalary(
  records: Array<{ shift_type: ShiftType; day_units: number }>
): SalaryAttendanceBreakdown {
  let manDays = 0;
  let absentDays = 0;
  let slDays = 0;

  for (const record of records) {
    if (record.shift_type === "absent") {
      absentDays++;
    } else if (record.shift_type === "sl") {
      slDays++;
    } else {
      manDays += Number(record.day_units);
    }
  }

  return {
    manDays: Math.round(manDays * 100) / 100,
    absentDays,
    slDays,
  };
}

export function getEmployeeSalaryType(
  employee: Pick<EmployeeWithRelations, "salary_type">
): SalaryType {
  return employee.salary_type === "monthly" ? "monthly" : "daily";
}

export function formatRateDisplay(
  employee: Pick<
    EmployeeWithRelations,
    "salary_type" | "daily_rate" | "monthly_salary" | "monthly_sl_days"
  >
): string | null {
  const salaryType = getEmployeeSalaryType(employee);
  if (salaryType === "monthly") {
    if (employee.monthly_salary == null) return null;
    const sl =
      Number(employee.monthly_sl_days) > 0
        ? ` · ${employee.monthly_sl_days} SL/mo`
        : "";
    return `${formatCurrency(Number(employee.monthly_salary))}/mo${sl}`;
  }
  if (employee.daily_rate == null) return null;
  return `${formatCurrency(Number(employee.daily_rate))}/day`;
}

export function computeGrossSalary(
  employee: Pick<
    EmployeeWithRelations,
    "salary_type" | "daily_rate" | "monthly_salary" | "monthly_sl_days"
  >,
  attendance: SalaryAttendanceBreakdown
): {
  grossAmount: number | null;
  salaryDeduction: number;
  slAllowance: number;
  dailyRate: number | null;
  monthlySalary: number | null;
  salaryType: SalaryType;
} {
  const salaryType = getEmployeeSalaryType(employee);
  const slAllowance = Number(employee.monthly_sl_days ?? 0);

  if (salaryType === "monthly") {
    const monthlySalary =
      employee.monthly_salary != null ? Number(employee.monthly_salary) : null;
    if (monthlySalary == null) {
      return {
        grossAmount: null,
        salaryDeduction: 0,
        slAllowance,
        dailyRate: null,
        monthlySalary: null,
        salaryType,
      };
    }

    const perDay = monthlySalary / STANDARD_MONTH_WORKING_DAYS;
    const excessSl = Math.max(0, attendance.slDays - slAllowance);
    const unpaidAbsent = attendance.absentDays + excessSl;
    const salaryDeduction = Math.round(unpaidAbsent * perDay * 100) / 100;
    const grossAmount = Math.max(
      0,
      Math.round((monthlySalary - salaryDeduction) * 100) / 100
    );

    return {
      grossAmount,
      salaryDeduction,
      slAllowance,
      dailyRate: null,
      monthlySalary,
      salaryType,
    };
  }

  const dailyRate =
    employee.daily_rate != null ? Number(employee.daily_rate) : null;
  const grossAmount =
    dailyRate != null
      ? Math.round(attendance.manDays * dailyRate * 100) / 100
      : null;

  return {
    grossAmount,
    salaryDeduction: 0,
    slAllowance: 0,
    dailyRate,
    monthlySalary: null,
    salaryType,
  };
}

export function monthFromDate(date: string): string {
  return date.slice(0, 7);
}

export function dayBefore(date: string): string {
  const d = new Date(`${date}T12:00:00`);
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function groupAttendanceByMonth(
  records: Array<{
    attendance_date: string;
    shift_type: ShiftType;
    day_units: number;
  }>
): Map<string, Array<{ shift_type: ShiftType; day_units: number }>> {
  const map = new Map<
    string,
    Array<{ shift_type: ShiftType; day_units: number }>
  >();

  for (const record of records) {
    const month = monthFromDate(record.attendance_date);
    const list = map.get(month) ?? [];
    list.push({
      shift_type: record.shift_type,
      day_units: Number(record.day_units),
    });
    map.set(month, list);
  }

  return map;
}

function getEmployeeSalaryStartMonth(
  employee: Pick<EmployeeWithRelations, "start_date">,
  attendanceMonths: Iterable<string>,
  paymentMonths: Iterable<string>
): string {
  const candidates: string[] = [];
  if (employee.start_date) candidates.push(monthFromDate(employee.start_date));
  for (const month of attendanceMonths) candidates.push(month);
  for (const month of paymentMonths) candidates.push(month);
  if (candidates.length === 0) return getCurrentMonth();
  return candidates.sort()[0]!;
}

export function computeOpeningBalance(
  employee: Pick<
    EmployeeWithRelations,
    "salary_type" | "daily_rate" | "monthly_salary" | "monthly_sl_days" | "start_date"
  >,
  month: string,
  priorAttendanceByMonth: Map<
    string,
    Array<{ shift_type: ShiftType; day_units: number }>
  >,
  paymentsBeforeMonth: SalaryPayment[]
): number {
  const priorMonthEnd = addMonths(month, -1);
  const startMonth = getEmployeeSalaryStartMonth(
    employee,
    priorAttendanceByMonth.keys(),
    paymentsBeforeMonth.map((payment) => monthFromDate(payment.payment_date))
  );

  if (startMonth > priorMonthEnd) return 0;

  let totalEarned = 0;
  for (const priorMonth of getMonthsInRange(startMonth, priorMonthEnd)) {
    const records = priorAttendanceByMonth.get(priorMonth) ?? [];
    const attendance = aggregateAttendanceForSalary(records);
    const gross = computeGrossSalary(employee, attendance);
    if (gross.grossAmount != null) totalEarned += gross.grossAmount;
  }

  const totalPaid = sumPaidOut(paymentsBeforeMonth);
  return Math.round((totalEarned - totalPaid) * 100) / 100;
}

function buildEarnedLabel(
  employee: EmployeeWithRelations,
  attendance: SalaryAttendanceBreakdown,
  gross: ReturnType<typeof computeGrossSalary>
): string {
  if (gross.salaryType === "monthly" && gross.monthlySalary != null) {
    const parts = [`Monthly salary ${formatCurrency(gross.monthlySalary)}`];
    if (attendance.slDays > 0) {
      parts.push(`${attendance.slDays} SL day(s) paid`);
    }
    if (gross.salaryDeduction > 0) {
      parts.push(
        `deduction ${formatCurrency(gross.salaryDeduction)} (${attendance.absentDays} unpaid absent)`
      );
    }
    return parts.join(" · ");
  }

  if (gross.dailyRate != null) {
    return `Daily wage (${attendance.manDays} man-days × ${formatCurrency(gross.dailyRate)})`;
  }

  return "Monthly wage";
}

export function buildSalaryLedger(
  payments: SalaryPayment[],
  employee: EmployeeWithRelations,
  attendance: SalaryAttendanceBreakdown,
  gross: ReturnType<typeof computeGrossSalary>,
  month: string,
  openingBalance = 0
): SalaryLedgerEntry[] {
  const entries: SalaryLedgerEntry[] = [];

  if (openingBalance !== 0) {
    const { start } = getMonthDateRange(month);
    entries.push({
      id: "opening",
      date: start,
      label:
        openingBalance > 0
          ? "Unpaid balance from previous month(s)"
          : "Overpayment adjustment from previous month(s)",
      paymentType: "opening",
      paymentMode: null,
      paymentApp: null,
      paymentReference: null,
      paidOut: openingBalance < 0 ? Math.abs(openingBalance) : 0,
      earned: openingBalance > 0 ? openingBalance : 0,
      isCalculated: true,
    });
  }

  entries.push(
    ...payments
      .slice()
      .sort(
        (a, b) =>
          a.payment_date.localeCompare(b.payment_date) ||
          a.created_at.localeCompare(b.created_at)
      )
      .map((payment) => {
        const amount = Number(payment.amount);
        const isDeduction = payment.payment_type === "deduction";
        return {
          id: payment.id,
          date: payment.payment_date,
          label: buildPaymentLabel(payment),
          paymentType: payment.payment_type,
          paymentMode: payment.payment_mode,
          paymentApp: payment.payment_app,
          paymentReference: payment.payment_reference,
          paidOut: isDeduction ? -amount : amount,
          earned: 0,
        };
      })
  );

  if (gross.grossAmount != null) {
    const { end } = getMonthDateRange(month);
    entries.push({
      id: "earned",
      date: end,
      label: buildEarnedLabel(employee, attendance, gross),
      paymentType: "earned",
      paymentMode: null,
      paymentApp: null,
      paymentReference: null,
      paidOut: 0,
      earned: gross.grossAmount,
      isCalculated: true,
    });
  }

  return entries.sort((a, b) => a.date.localeCompare(b.date));
}

export function buildSalaryQueryString(filters: {
  month?: string;
  type?: string;
  project?: string;
}): string {
  const params = new URLSearchParams();
  if (filters.month) params.set("month", filters.month);
  if (filters.type && filters.type !== "all") params.set("type", filters.type);
  if (filters.project) params.set("project", filters.project);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function salarySummaryToCsv(
  summary: SalarySummary,
  month: string,
  monthLabel: string
): string {
  const headers = [
    "Month",
    "Employee Code",
    "Employee Name",
    "Type",
    "Pay Type",
    "Man-days",
    "SL Days",
    "Absent Days",
    "Pay Rate",
    "Deduction (INR)",
    "Opening Balance (INR)",
    "This Month Gross (INR)",
    "Paid Out (INR)",
    "Balance Due (INR)",
    "Payout Method",
  ];

  const rows = summary.rows.map((row) => [
    monthLabel,
    row.employee.employee_code,
    row.employee.full_name,
    row.employee.employee_type,
    row.salaryType,
    String(row.manDays),
    String(row.slDays),
    String(row.absentDays),
    row.rateDisplay ?? "",
    row.salaryDeduction > 0 ? String(row.salaryDeduction) : "",
    row.openingBalance !== 0 ? String(row.openingBalance) : "",
    row.grossAmount != null ? String(row.grossAmount) : "",
    String(row.totalPaidOut),
    row.balanceDue != null ? String(row.balanceDue) : "",
    getPrimaryPayment(row.employee) ?? "",
  ]);

  const footer = [
    monthLabel,
    "TOTAL",
    "",
    "",
    "",
    String(summary.totalManDays),
    "",
    "",
    "",
    "",
    "",
    String(summary.totalGross),
    String(summary.totalPaidOut),
    String(summary.totalBalanceDue),
    "",
  ];

  return [headers, ...rows, footer]
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    )
    .join("\n");
}

function csvCell(value: string | number): string {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function csvRow(cells: (string | number)[]): string {
  return cells.map(csvCell).join(",");
}

export function employeeSalaryDetailsToCsv(
  details: EmployeeSalaryDetail[],
  employee: EmployeeWithRelations
): string {
  const lines: string[] = [];

  lines.push("EMPLOYEE SALARY REPORT");
  lines.push(csvRow(["Employee Name", employee.full_name]));
  lines.push(csvRow(["Employee Code", employee.employee_code]));
  lines.push(csvRow(["Employee Type", employee.employee_type]));
  lines.push(
    csvRow([
      "Pay Type",
      employee.salary_type === "monthly" ? "Monthly fixed" : "Daily wage",
    ])
  );
  lines.push("");

  lines.push("MONTHLY SUMMARY");
  lines.push(
    csvRow([
      "Month",
      "Man-days",
      "SL Days",
      "Absent Days",
      "Pay Rate",
      "Deduction (INR)",
      "Opening Balance (INR)",
      "This Month Gross (INR)",
      "Paid Out (INR)",
      "Balance Due (INR)",
    ])
  );

  for (const detail of details) {
    const rate =
      detail.salaryType === "monthly"
        ? detail.monthlySalary != null
          ? `${detail.monthlySalary}/mo · ${detail.slAllowance} SL/mo`
          : ""
        : detail.dailyRate != null
          ? `${detail.dailyRate}/day`
          : "";

    lines.push(
      csvRow([
        formatMonthLabel(detail.month),
        detail.manDays,
        detail.slDays,
        detail.absentDays,
        rate,
        detail.salaryDeduction > 0 ? detail.salaryDeduction : "",
        detail.openingBalance !== 0 ? detail.openingBalance : "",
        detail.grossAmount ?? "",
        detail.totalPaidOut,
        detail.balanceDue ?? "",
      ])
    );
  }

  lines.push("");
  lines.push("LEDGER ENTRIES");
  lines.push(
    csvRow([
      "Month",
      "Date",
      "Purpose",
      "Mode",
      "App / Reference",
      "Paid Out (INR)",
      "Earned (INR)",
      "Running Balance (INR)",
    ])
  );

  for (const detail of details) {
    const monthLabel = formatMonthLabel(detail.month);
    let runningBalance = 0;

    for (const entry of detail.ledger) {
      runningBalance += entry.earned - entry.paidOut;
      lines.push(
        csvRow([
          monthLabel,
          entry.date,
          entry.label,
          entry.paymentMode
            ? SALARY_PAYMENT_MODE_LABELS[entry.paymentMode]
            : "",
          entry.isCalculated
            ? ""
            : formatPaymentDetails({
                payment_mode: entry.paymentMode,
                payment_app: entry.paymentApp,
                payment_reference: entry.paymentReference,
              }).replace(/—/g, ""),
          entry.paidOut !== 0 ? entry.paidOut : "",
          entry.earned !== 0 ? entry.earned : "",
          runningBalance,
        ])
      );
    }
  }

  return lines.join("\n");
}

export function enrichSalaryRow(
  employee: EmployeeWithRelations,
  records: Array<{ shift_type: ShiftType; day_units: number }>,
  payments: SalaryPayment[],
  openingBalance = 0
): Omit<SalaryRow, "employee"> {
  const attendance = aggregateAttendanceForSalary(records);
  const gross = computeGrossSalary(employee, attendance);
  const totalPaidOut = Math.round(sumPaidOut(payments) * 100) / 100;
  const monthBalance =
    gross.grossAmount != null
      ? Math.round((gross.grossAmount - totalPaidOut) * 100) / 100
      : null;
  const balanceDue =
    gross.grossAmount != null || openingBalance !== 0
      ? Math.round(
          (openingBalance + (gross.grossAmount ?? 0) - totalPaidOut) * 100
        ) / 100
      : null;
  const hasPaymentMethod = employee.employee_payment_methods.length > 0;

  return {
    manDays: attendance.manDays,
    absentDays: attendance.absentDays,
    slDays: attendance.slDays,
    dailyRate: gross.dailyRate,
    monthlySalary: gross.monthlySalary,
    salaryType: gross.salaryType,
    rateDisplay: formatRateDisplay(employee),
    grossAmount: gross.grossAmount,
    salaryDeduction: gross.salaryDeduction,
    slAllowance: gross.slAllowance,
    totalPaidOut,
    openingBalance,
    monthBalance,
    balanceDue,
    hasPaymentMethod,
  };
}
