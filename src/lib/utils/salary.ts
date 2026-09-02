import type {
  EmployeeWithRelations,
  SalaryLedgerEntry,
  SalaryPayment,
  SalaryPaymentFormData,
  SalaryRow,
  SalarySummary,
} from "@/types/database";
import {
  SALARY_PAYMENT_APP_OPTIONS,
  SALARY_PAYMENT_MODE_LABELS,
  SALARY_PAYMENT_TYPE_LABELS,
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

export function buildSalaryLedger(
  payments: SalaryPayment[],
  manDays: number,
  dailyRate: number | null,
  grossAmount: number | null,
  month: string
): SalaryLedgerEntry[] {
  const entries: SalaryLedgerEntry[] = payments
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
    });

  if (grossAmount != null && dailyRate != null) {
    const { end } = getMonthDateRange(month);
    entries.push({
      id: "earned",
      date: end,
      label: `Monthly wage (${manDays} man-days × ${formatCurrency(dailyRate)})`,
      paymentType: "earned",
      paymentMode: null,
      paymentApp: null,
      paymentReference: null,
      paidOut: 0,
      earned: grossAmount,
      isCalculated: true,
    });
  }

  return entries;
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
    "Man-days",
    "Daily Rate (INR)",
    "Gross Earned (INR)",
    "Paid Out (INR)",
    "Balance Due (INR)",
    "Payout Method",
  ];

  const rows = summary.rows.map((row) => [
    monthLabel,
    row.employee.employee_code,
    row.employee.full_name,
    row.employee.employee_type,
    String(row.manDays),
    row.dailyRate != null ? String(row.dailyRate) : "",
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
    String(summary.totalManDays),
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
  details: Array<{
    month: string;
    manDays: number;
    dailyRate: number | null;
    grossAmount: number | null;
    totalPaidOut: number;
    balanceDue: number | null;
    ledger: SalaryLedgerEntry[];
  }>,
  employee: EmployeeWithRelations
): string {
  const lines: string[] = [];

  lines.push("EMPLOYEE SALARY REPORT");
  lines.push(csvRow(["Employee Name", employee.full_name]));
  lines.push(csvRow(["Employee Code", employee.employee_code]));
  lines.push(csvRow(["Employee Type", employee.employee_type]));
  lines.push("");

  lines.push("MONTHLY SUMMARY");
  lines.push(
    csvRow([
      "Month",
      "Man-days",
      "Daily Rate (INR)",
      "Gross Earned (INR)",
      "Paid Out (INR)",
      "Balance Due (INR)",
    ])
  );

  for (const detail of details) {
    lines.push(
      csvRow([
        formatMonthLabel(detail.month),
        detail.manDays,
        detail.dailyRate ?? "",
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
  manDays: number,
  payments: SalaryPayment[]
): Omit<SalaryRow, "employee"> {
  const dailyRate =
    employee.daily_rate != null ? Number(employee.daily_rate) : null;
  const grossAmount =
    dailyRate != null ? Math.round(manDays * dailyRate * 100) / 100 : null;
  const totalPaidOut = Math.round(sumPaidOut(payments) * 100) / 100;
  const balanceDue =
    grossAmount != null
      ? Math.round((grossAmount - totalPaidOut) * 100) / 100
      : null;
  const hasPaymentMethod = employee.employee_payment_methods.length > 0;

  return {
    manDays,
    dailyRate,
    grossAmount,
    totalPaidOut,
    balanceDue,
    hasPaymentMethod,
  };
}
