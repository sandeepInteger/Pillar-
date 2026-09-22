import type { SalaryType } from "@/types/database";

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
