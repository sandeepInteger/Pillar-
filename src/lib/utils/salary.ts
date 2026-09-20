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
  EMPLOYEE_TYPE_LABELS,
  isFounderFixedSalary,
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

export function formatCurrencyUpToTwoDecimals(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
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

export interface AttendanceSalaryRecord {
  shift_type: ShiftType;
  day_units: number;
  hours_worked?: number | null;
  overtime_hours?: number | null;
}

export interface SalaryAttendanceBreakdown {
  manDays: number;
  absentDays: number;
  slDays: number;
  regularHours: number;
  overtimeHours: number;
}

export function aggregateAttendanceForSalary(
  records: AttendanceSalaryRecord[]
): SalaryAttendanceBreakdown {
  let manDays = 0;
  let absentDays = 0;
  let slDays = 0;
  let regularHours = 0;
  let overtimeHours = 0;

  for (const record of records) {
    if (record.shift_type === "absent") {
      absentDays++;
    } else if (record.shift_type === "sl") {
      slDays++;
    } else if (record.shift_type === "hours") {
      const hours = Number(record.hours_worked ?? 0);
      if (hours <= 0) {
        absentDays++;
        continue;
      }
      manDays += Number(record.day_units);
      regularHours += Math.min(hours, 8);
      overtimeHours +=
        record.overtime_hours != null
          ? Number(record.overtime_hours)
          : Math.max(0, hours - 8);
    } else {
      manDays += Number(record.day_units);
    }
  }

  return {
    manDays: Math.round(manDays * 100) / 100,
    absentDays,
    slDays,
    regularHours: Math.round(regularHours * 100) / 100,
    overtimeHours: Math.round(overtimeHours * 100) / 100,
  };
}

export function getEmployeeSalaryType(
  employee: Pick<EmployeeWithRelations, "salary_type">
): SalaryType {
  if (employee.salary_type === "monthly") return "monthly";
  if (employee.salary_type === "hourly") return "hourly";
  return "daily";
}

export function formatRateDisplay(
  employee: Pick<
    EmployeeWithRelations,
    | "employee_type"
    | "salary_type"
    | "daily_rate"
    | "hourly_rate"
    | "monthly_salary"
    | "monthly_sl_days"
  >
): string | null {
  const salaryType = getEmployeeSalaryType(employee);
  if (salaryType === "monthly") {
    if (employee.monthly_salary == null) return null;
    if (isFounderFixedSalary(employee.employee_type)) {
      return `${formatCurrency(Number(employee.monthly_salary))}/mo fixed`;
    }
    const sl =
      Number(employee.monthly_sl_days) > 0
        ? ` · ${employee.monthly_sl_days} SL/mo`
        : "";
    return `${formatCurrency(Number(employee.monthly_salary))}/mo${sl}`;
  }
  if (salaryType === "hourly") {
    if (employee.hourly_rate == null) return null;
    return `${formatCurrencyUpToTwoDecimals(Number(employee.hourly_rate))}/hr`;
  }
  if (employee.daily_rate == null) return null;
  const sl =
    Number(employee.monthly_sl_days) > 0
      ? ` · ${employee.monthly_sl_days} SL/mo`
      : "";
  return `${formatCurrencyUpToTwoDecimals(Number(employee.daily_rate))}/day${sl}`;
}

export function computeGrossSalary(
  employee: Pick<
    EmployeeWithRelations,
    | "employee_type"
    | "salary_type"
    | "daily_rate"
    | "hourly_rate"
    | "monthly_salary"
    | "monthly_sl_days"
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

  if (salaryType === "hourly") {
    const hourlyRate =
      employee.hourly_rate != null ? Number(employee.hourly_rate) : null;
    if (hourlyRate == null) {
      return {
        grossAmount: null,
        salaryDeduction: 0,
        slAllowance: 0,
        dailyRate: null,
        monthlySalary: null,
        salaryType,
      };
    }
    const grossAmount = Math.round(
      (attendance.regularHours + attendance.overtimeHours) * hourlyRate * 100
    ) / 100;
    return {
      grossAmount,
      salaryDeduction: 0,
      slAllowance: 0,
      dailyRate: null,
      monthlySalary: null,
      salaryType,
    };
  }

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

    if (isFounderFixedSalary(employee.employee_type)) {
      return {
        grossAmount: monthlySalary,
        salaryDeduction: 0,
        slAllowance: 0,
        dailyRate: null,
        monthlySalary,
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
  if (dailyRate == null) {
    return {
      grossAmount: null,
      salaryDeduction: 0,
      slAllowance,
      dailyRate: null,
      monthlySalary: null,
      salaryType,
    };
  }

  const paidSlDays = Math.min(attendance.slDays, slAllowance);
  const excessSl = Math.max(0, attendance.slDays - slAllowance);
  const grossAmount = Math.round(
    (attendance.manDays + paidSlDays) * dailyRate * 100
  ) / 100;
  const salaryDeduction =
    excessSl > 0
      ? Math.round(excessSl * dailyRate * 100) / 100
      : 0;

  return {
    grossAmount,
    salaryDeduction,
    slAllowance,
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
    hours_worked?: number | null;
    overtime_hours?: number | null;
  }>
): Map<string, AttendanceSalaryRecord[]> {
  const map = new Map<string, AttendanceSalaryRecord[]>();

  for (const record of records) {
    const month = monthFromDate(record.attendance_date);
    const list = map.get(month) ?? [];
    list.push({
      shift_type: record.shift_type,
      day_units: Number(record.day_units),
      hours_worked: record.hours_worked,
      overtime_hours: record.overtime_hours,
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
    | "employee_type"
    | "salary_type"
    | "daily_rate"
    | "hourly_rate"
    | "monthly_salary"
    | "monthly_sl_days"
    | "start_date"
  >,
  month: string,
  priorAttendanceByMonth: Map<string, AttendanceSalaryRecord[]>,
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
    if (isFounderFixedSalary(employee.employee_type)) {
      return `Fixed salary ${formatCurrency(gross.monthlySalary)} (no attendance)`;
    }
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
    const paidSl = Math.min(attendance.slDays, gross.slAllowance);
    const parts = [
      `Daily wage (${attendance.manDays} man-days`,
      paidSl > 0 ? `+ ${paidSl} SL` : "",
      `× ${formatCurrency(gross.dailyRate)})`,
    ].filter(Boolean);
    return parts.join(" ");
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

function csvPadRow(first: string, width = 10): string {
  return csvRow([first, ...Array(Math.max(0, width - 1)).fill("")]);
}

function csvKeyValue(label: string, value: string | number): string {
  return csvRow(["", label, value]);
}

function formatCsvInr(amount: number | null | undefined): string {
  if (amount == null || amount === 0) return "";
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatCsvDecimal(value: number): string {
  if (value === 0) return "";
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatLedgerExportDate(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function payStructureLabel(employee: EmployeeWithRelations): string {
  const salaryType = getEmployeeSalaryType(employee);
  if (salaryType === "monthly") return "Monthly fixed salary";
  if (salaryType === "hourly") return "Hourly wage";
  return "Daily wage";
}

function primaryPhone(employee: EmployeeWithRelations): string {
  const primary =
    employee.employee_phones.find((p) => p.is_primary) ??
    employee.employee_phones[0];
  return primary?.phone_number ?? "";
}

export interface EmployeeSalaryCsvMeta {
  periodLabel: string;
  generatedAt?: string;
}

export function employeeSalaryDetailsToCsv(
  details: EmployeeSalaryDetail[],
  employee: EmployeeWithRelations,
  meta?: EmployeeSalaryCsvMeta
): string {
  const lines: string[] = [];
  const W = 10;
  const generatedAt =
    meta?.generatedAt ??
    new Date().toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  const periodLabel =
    meta?.periodLabel ??
    (details.length === 1
      ? formatMonthLabel(details[0].month)
      : details.length > 1
        ? `${formatMonthLabel(details[0].month)} – ${formatMonthLabel(details[details.length - 1].month)}`
        : "");

  const rateDisplay = formatRateDisplay(employee) ?? "—";
  const payoutMethod = getPrimaryPayment(employee) ?? "Not on file";

  let totalGross = 0;
  let totalPaid = 0;
  let totalDue = 0;
  let totalManDays = 0;

  for (const d of details) {
    totalManDays += d.manDays;
    if (d.grossAmount != null) totalGross += d.grossAmount;
    totalPaid += d.totalPaidOut;
    if (d.balanceDue != null) totalDue += d.balanceDue;
  }
  totalGross = Math.round(totalGross * 100) / 100;
  totalPaid = Math.round(totalPaid * 100) / 100;
  totalDue = Math.round(totalDue * 100) / 100;

  lines.push(csvPadRow("PILLAR", W));
  lines.push(csvPadRow("Employee Salary Statement", W));
  lines.push(csvRow(Array(W).fill("")));
  lines.push(csvKeyValue("Report period", periodLabel));
  lines.push(csvKeyValue("Generated on", generatedAt));
  lines.push(csvKeyValue("Currency", "INR (₹)"));
  lines.push(csvRow(Array(W).fill("")));

  lines.push(csvPadRow("EMPLOYEE DETAILS", W));
  lines.push(csvRow(["", "Field", "Value"]));
  lines.push(csvKeyValue("Full name", employee.full_name));
  lines.push(csvKeyValue("Employee code", employee.employee_code));
  lines.push(
    csvKeyValue("Role", EMPLOYEE_TYPE_LABELS[employee.employee_type])
  );
  lines.push(csvKeyValue("Pay structure", payStructureLabel(employee)));
  lines.push(csvKeyValue("Rate", rateDisplay));
  lines.push(
    csvKeyValue(
      "Status",
      employee.status === "active" ? "Active" : "Inactive"
    )
  );
  if (primaryPhone(employee)) {
    lines.push(csvKeyValue("Phone", primaryPhone(employee)));
  }
  lines.push(csvKeyValue("Primary payout", payoutMethod));
  lines.push(csvRow(Array(W).fill("")));

  lines.push(csvPadRow("MONTHLY SUMMARY", W));
  lines.push(
    csvRow([
      "",
      "Month",
      "Man-days",
      "SL days",
      "Absent",
      "Pay rate",
      "Deduction (₹)",
      "Opening bal. (₹)",
      "Gross earned (₹)",
      "Paid out (₹)",
      "Balance due (₹)",
    ])
  );

  for (const detail of details) {
    const rate =
      formatRateDisplay(detail.employee) ??
      (detail.salaryType === "monthly"
        ? detail.monthlySalary != null
          ? `${formatCsvInr(detail.monthlySalary)}/mo`
          : ""
        : detail.dailyRate != null
          ? `${formatCsvInr(detail.dailyRate)}/day`
          : "");

    lines.push(
      csvRow([
        "",
        formatMonthLabel(detail.month),
        formatCsvDecimal(detail.manDays),
        formatCsvDecimal(detail.slDays),
        formatCsvDecimal(detail.absentDays),
        rate,
        formatCsvInr(detail.salaryDeduction),
        formatCsvInr(detail.openingBalance),
        detail.grossAmount != null ? formatCsvInr(detail.grossAmount) : "",
        formatCsvInr(detail.totalPaidOut),
        detail.balanceDue != null ? formatCsvInr(detail.balanceDue) : "",
      ])
    );
  }

  if (details.length > 1) {
    lines.push(
      csvRow([
        "",
        "TOTAL (period)",
        formatCsvDecimal(totalManDays),
        "",
        "",
        "",
        "",
        "",
        formatCsvInr(totalGross),
        formatCsvInr(totalPaid),
        formatCsvInr(totalDue),
      ])
    );
  }

  lines.push(csvRow(Array(W).fill("")));
  lines.push(csvPadRow("PAYMENT & EARNINGS LEDGER", W));
  lines.push(
    csvRow([
      "",
      "Month",
      "Date",
      "Description",
      "Type",
      "Mode",
      "Reference",
      "Paid out (₹)",
      "Earned (₹)",
      "Running balance (₹)",
    ])
  );

  for (const detail of details) {
    const monthLabel = formatMonthLabel(detail.month);
    let runningBalance = 0;

    for (const entry of detail.ledger) {
      runningBalance += entry.earned - entry.paidOut;
      runningBalance = Math.round(runningBalance * 100) / 100;

      const typeLabel =
        entry.paymentType === "earned" || entry.paymentType === "opening"
          ? entry.label
          : SALARY_PAYMENT_TYPE_LABELS[entry.paymentType] ?? entry.label;

      lines.push(
        csvRow([
          "",
          monthLabel,
          formatLedgerExportDate(entry.date),
          entry.label,
          typeLabel,
          entry.paymentMode
            ? SALARY_PAYMENT_MODE_LABELS[entry.paymentMode]
            : "",
          entry.isCalculated
            ? "—"
            : formatPaymentDetails({
                payment_mode: entry.paymentMode,
                payment_app: entry.paymentApp,
                payment_reference: entry.paymentReference,
              }),
          formatCsvInr(entry.paidOut),
          formatCsvInr(entry.earned),
          formatCsvInr(runningBalance),
        ])
      );
    }
  }

  lines.push(csvRow(Array(W).fill("")));
  lines.push(csvPadRow("STATEMENT TOTALS", W));
  lines.push(csvKeyValue("Total gross earned (period)", formatCsvInr(totalGross)));
  lines.push(csvKeyValue("Total paid out (period)", formatCsvInr(totalPaid)));
  lines.push(csvKeyValue("Total balance due (period)", formatCsvInr(totalDue)));
  lines.push(csvRow(Array(W).fill("")));
  lines.push(
    csvPadRow(
      "This is a system-generated salary statement from Pillar. Amounts are in INR.",
      W
    )
  );

  return `\uFEFF${lines.join("\r\n")}`;
}

export function enrichSalaryRow(
  employee: EmployeeWithRelations,
  records: AttendanceSalaryRecord[],
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
    regularHours: attendance.regularHours,
    overtimeHours: attendance.overtimeHours,
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
