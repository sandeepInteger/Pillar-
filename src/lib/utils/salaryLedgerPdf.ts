import type { EmployeeSalaryDetail } from "@/types/database";
import { EMPLOYEE_TYPE_LABELS, SALARY_PAYMENT_MODE_LABELS } from "@/types/database";
import { getMonthDateRange } from "@/lib/utils/salary";
import { formatDayDate } from "@/lib/utils/attendancePdf";
import { formatInr } from "@/components/pdf/PdfShared";
import { DEFAULT_COMPANY_NAME } from "@/types/pdf";
import type { SalaryLedgerPDFData, SalaryLedgerRow } from "@/types/pdf";

// The standard PDF Helvetica font has no ₹ glyph — it renders as a broken
// character, so PDFs use "Rs." (formatInr) instead of the app's usual
// formatCurrency, which is fine for on-screen UI but not for PDF text.
function money(amount: number): string {
  return amount > 0 ? formatInr(amount) : "-";
}

export interface BuildSalaryLedgerPdfParams {
  detail: EmployeeSalaryDetail;
  projectName: string | null;
  companyName?: string;
}

/** Builds the Salary Ledger PDF's flat data object, reusing the same ledger
 * entries and totals already computed by src/lib/queries/salary.ts. */
export function buildSalaryLedgerPdfData(
  params: BuildSalaryLedgerPdfParams
): SalaryLedgerPDFData {
  const { detail, projectName } = params;
  const { start, end } = getMonthDateRange(detail.month);

  const rows: SalaryLedgerRow[] = detail.ledger.map((entry) => ({
    date: formatDayDate(entry.date),
    mode: entry.paymentMode ? SALARY_PAYMENT_MODE_LABELS[entry.paymentMode] : "-",
    amount: money(entry.paidOut),
    earned: money(entry.earned),
  }));

  return {
    companyName: params.companyName ?? DEFAULT_COMPANY_NAME,
    employeeName: detail.employee.full_name,
    designation:
      detail.employee.designation ||
      EMPLOYEE_TYPE_LABELS[detail.employee.employee_type],
    project: projectName ?? "—",
    reportingFrom: formatDayDate(start),
    reportingTo: formatDayDate(end),
    rows,
    monthClosingBalance: formatInr(detail.balanceDue ?? 0),
  };
}
