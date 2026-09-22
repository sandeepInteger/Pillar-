import type { SalaryType } from "@/types/database";

/** No dynamic company-settings table exists in this app; this is the single
 * place that names the company shown on generated PDFs. */
export const DEFAULT_COMPANY_NAME = "MDS Solution Company";

export interface AttendanceDay {
  date: string;
  status: string;
  ot: string;
}

export interface AttendancePDFData {
  companyName: string;

  employeeName: string;
  designation: string;
  project: string;

  reportingFrom: string;
  reportingTo: string;

  summary: {
    totalDays: number;
    present: number;
    absent: number;
    halfDay: number;
    overtimeHours: number;
  };

  firstHalfLabel: string;
  secondHalfLabel: string;
  firstHalf: AttendanceDay[];
  secondHalf: AttendanceDay[];

  payroll: {
    rateType: SalaryType;
    rateLabel: string;
    attendancePay: number;
    halfDayPay: number;
    overtimePay: number;
    netSalary: number;
  };
}

export interface SalaryLedgerRow {
  date: string;
  mode: string;
  amount: string;
  earned: string;
}

export interface SalaryLedgerPDFData {
  companyName: string;

  employeeName: string;
  designation: string;
  project: string;

  reportingFrom: string;
  reportingTo: string;

  rows: SalaryLedgerRow[];
  monthClosingBalance: string;
}
