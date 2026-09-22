import type {
  AttendanceRecord,
  EmployeeWithRelations,
  ShiftType,
} from "@/types/database";
import {
  EMPLOYEE_TYPE_LABELS,
  STANDARD_MONTH_WORKING_DAYS,
} from "@/types/database";
import {
  aggregateAttendanceForSalary,
  computeGrossSalary,
  formatCurrencyUpToTwoDecimals,
  parseMonth,
} from "@/lib/utils/salary";
import type { AttendanceDay, AttendancePDFData } from "@/types/pdf";

const STATUS_LABELS: Record<ShiftType, string> = {
  absent: "Absent",
  half: "Half Day",
  full: "Present",
  double: "Present",
  sl: "Leave",
  hours: "Present",
};

function statusForRecord(record: AttendanceRecord): string {
  if (record.shift_type === "hours" && Number(record.hours_worked ?? 0) <= 0) {
    return "Absent";
  }
  return STATUS_LABELS[record.shift_type];
}

function formatDayDate(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export interface BuildAttendancePdfParams {
  employee: EmployeeWithRelations;
  records: AttendanceRecord[];
  month: string;
  projectName: string | null;
  companyName?: string;
}

/** Builds the PDF's flat data object from Supabase attendance rows + the app's existing payroll math (src/lib/utils/salary.ts). */
export function buildAttendancePdfData(
  params: BuildAttendancePdfParams
): AttendancePDFData {
  const { employee, records, month, projectName } = params;
  const { year, month: m } = parseMonth(month);
  const lastDay = new Date(year, m, 0).getDate();
  const mm = String(m).padStart(2, "0");

  const recordsByDate = new Map(records.map((r) => [r.attendance_date, r]));

  const days: AttendanceDay[] = [];
  let present = 0;
  let absent = 0;
  let halfDay = 0;
  let overtimeHours = 0;

  for (let day = 1; day <= lastDay; day++) {
    const dateIso = `${year}-${mm}-${String(day).padStart(2, "0")}`;
    const record = recordsByDate.get(dateIso);
    let status = "Not Marked";
    let ot = "-";

    if (record) {
      status = statusForRecord(record);
      if (status === "Present") present++;
      else if (status === "Absent") absent++;
      else if (status === "Half Day") halfDay++;

      const otHours = Number(record.overtime_hours ?? 0);
      if (otHours > 0) {
        ot = `${otHours} hr`;
        overtimeHours += otHours;
      }
    }

    days.push({ date: formatDayDate(dateIso), status, ot });
  }

  overtimeHours = Math.round(overtimeHours * 100) / 100;

  const salaryRecords = records.map((r) => ({
    shift_type: r.shift_type,
    day_units: Number(r.day_units),
    hours_worked: r.hours_worked,
    overtime_hours: r.overtime_hours,
  }));
  const attendance = aggregateAttendanceForSalary(salaryRecords);
  const gross = computeGrossSalary(employee, attendance);

  const halfDayUnits =
    records.filter((r) => r.shift_type === "half").length * 0.5;

  let rateLabel = "—";
  let attendancePay = 0;
  let halfDayPay = 0;
  let overtimePay = 0;

  if (gross.salaryType === "hourly" && employee.hourly_rate != null) {
    const rate = Number(employee.hourly_rate);
    rateLabel = `${formatCurrencyUpToTwoDecimals(rate)} / hour`;
    attendancePay = Math.round(attendance.regularHours * rate * 100) / 100;
    overtimePay = Math.round(attendance.overtimeHours * rate * 100) / 100;
  } else if (gross.salaryType === "monthly" && gross.monthlySalary != null) {
    const perDay = gross.monthlySalary / STANDARD_MONTH_WORKING_DAYS;
    rateLabel = `${formatCurrencyUpToTwoDecimals(perDay)} / day (from monthly salary)`;
    const fullDayEquivalent = Math.max(0, attendance.manDays - halfDayUnits);
    attendancePay = Math.round(fullDayEquivalent * perDay * 100) / 100;
    halfDayPay = Math.round(halfDayUnits * perDay * 100) / 100;
  } else if (gross.dailyRate != null) {
    const rate = gross.dailyRate;
    rateLabel = `${formatCurrencyUpToTwoDecimals(rate)} / day`;
    const fullDayEquivalent = Math.max(0, attendance.manDays - halfDayUnits);
    attendancePay = Math.round(fullDayEquivalent * rate * 100) / 100;
    halfDayPay = Math.round(halfDayUnits * rate * 100) / 100;
  }

  const netSalary = gross.grossAmount ?? 0;
  const midpoint = 15;
  const monthName = new Date(year, m - 1, 1).toLocaleDateString("en-IN", {
    month: "long",
  });

  return {
    companyName: params.companyName ?? "Pillar",
    employeeName: employee.full_name,
    designation:
      employee.designation || EMPLOYEE_TYPE_LABELS[employee.employee_type],
    project: projectName ?? "—",
    reportingFrom: formatDayDate(`${year}-${mm}-01`),
    reportingTo: formatDayDate(
      `${year}-${mm}-${String(lastDay).padStart(2, "0")}`
    ),
    firstHalfLabel: `01 - 15 ${monthName}`,
    secondHalfLabel: `16 - ${lastDay} ${monthName}`,
    summary: {
      totalDays: lastDay,
      present,
      absent,
      halfDay,
      overtimeHours,
    },
    firstHalf: days.slice(0, midpoint),
    secondHalf: days.slice(midpoint),
    payroll: {
      rateType: gross.salaryType,
      rateLabel,
      attendancePay,
      halfDayPay,
      overtimePay,
      netSalary,
    },
  };
}
