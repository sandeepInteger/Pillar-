/** No dynamic company-settings table exists in this app; this is the single
 * place that names the company shown on generated PDFs. */
export const DEFAULT_COMPANY_NAME = "MDS Solution Company";

/** One calendar day in the attendance grid: P / A / H / L or "-" when not marked */
export interface StatementDay {
  day: number;
  date: string;
  status: string;
  ot: string;
}

export interface StatementAmountRow {
  label: string;
  detail: string;
  /** Signed: negative rows are deductions */
  amount: number;
}

export interface StatementLedgerRow {
  date: string;
  description: string;
  mode: string;
  given: string;
  earned: string;
}

/** Single-page monthly statement: attendance + payable + salary ledger */
export interface EmployeeStatementPDFData {
  companyName: string;

  employeeName: string;
  employeeCode: string;
  designation: string;
  project: string;
  reportingFrom: string;
  reportingTo: string;

  tracksAttendance: boolean;
  summary: {
    totalDays: number;
    present: number;
    absent: number;
    halfDay: number;
    leave: number;
    notMarked: number;
    overtimeHours: number;
  };

  /** Days 1-10, 11-20, 21-end of month (28 / 29 / 30 / 31) */
  columns: { label: string; days: StatementDay[] }[];

  payable: {
    rateLabel: string;
    rows: StatementAmountRow[];
    netSalary: number;
  };

  ledger: {
    rows: StatementLedgerRow[];
    openingBalance: number;
    netSalary: number;
    givenThisMonth: number;
    closingBalance: number;
  };
}
