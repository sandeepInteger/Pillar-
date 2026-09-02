import { createClient } from "@/lib/supabase/server";
import type {
  AnalyticsData,
  EmployeeType,
  MonthSalaryTotals,
  MonthSalaryTypeStats,
  MonthWorkStats,
} from "@/types/database";
import { ANALYTICS_SALARY_TYPES } from "@/types/database";
import {
  formatMonthLabel,
  formatMonthShort,
  getCurrentMonth,
  addMonths,
  getMonthDateRange,
  getMonthsInRange,
  paymentSignedAmount,
} from "@/lib/utils/salary";

interface EmployeeRow {
  id: string;
  employee_type: EmployeeType;
  daily_rate: number | null;
}

interface AttendanceRow {
  employee_id: string;
  attendance_date: string;
  day_units: number;
}

interface PaymentRow {
  employee_id: string;
  payment_date: string;
  amount: number;
  payment_type: string;
}

function monthFromDate(date: string): string {
  return date.slice(0, 7);
}

function emptyWorkMonth(month: string): MonthWorkStats {
  return {
    month,
    monthLabel: formatMonthLabel(month),
    monthShort: formatMonthShort(month),
    labourWorkers: 0,
    foremanWorkers: 0,
    totalSiteWorkers: 0,
    labourManDays: 0,
    foremanManDays: 0,
    totalSiteManDays: 0,
    allManDays: 0,
    allWorkers: 0,
  };
}

function emptySalaryTypeMonth(
  month: string,
  employeeType: EmployeeType
): MonthSalaryTypeStats {
  return {
    month,
    monthLabel: formatMonthLabel(month),
    monthShort: formatMonthShort(month),
    employeeType,
    workers: 0,
    manDays: 0,
    grossEarned: 0,
    paidOut: 0,
    balanceDue: 0,
  };
}

export async function getAnalyticsData(
  fromMonth: string,
  toMonth: string,
  selectedMonth?: string
): Promise<AnalyticsData> {
  const months = getMonthsInRange(fromMonth, toMonth);
  const { start } = getMonthDateRange(fromMonth);
  const { end } = getMonthDateRange(toMonth);

  const supabase = await createClient();

  const [employeesRes, attendanceRes, paymentsRes] = await Promise.all([
    supabase
      .from("employees")
      .select("id, employee_type, daily_rate"),
    supabase
      .from("attendance_records")
      .select("employee_id, attendance_date, day_units")
      .gte("attendance_date", start)
      .lte("attendance_date", end),
    supabase
      .from("salary_payments")
      .select("employee_id, payment_date, amount, payment_type")
      .gte("payment_date", start)
      .lte("payment_date", end),
  ]);

  const employees = (employeesRes.data ?? []) as EmployeeRow[];
  const attendance = (attendanceRes.data ?? []) as AttendanceRow[];
  const payments = (paymentsRes.data ?? []) as PaymentRow[];

  const employeeMap = new Map(employees.map((e) => [e.id, e]));

  const workByMonthMap = new Map<string, MonthWorkStats>(
    months.map((m) => [m, emptyWorkMonth(m)])
  );

  const labourWorkersByMonth = new Map<string, Set<string>>();
  const foremanWorkersByMonth = new Map<string, Set<string>>();
  const allWorkersByMonth = new Map<string, Set<string>>();

  for (const record of attendance) {
    const month = monthFromDate(record.attendance_date);
    if (!workByMonthMap.has(month)) continue;

    const employee = employeeMap.get(record.employee_id);
    if (!employee) continue;

    const units = Number(record.day_units);
    if (units <= 0) continue;

    const stats = workByMonthMap.get(month)!;
    stats.allManDays = Math.round((stats.allManDays + units) * 100) / 100;

    if (!allWorkersByMonth.has(month)) allWorkersByMonth.set(month, new Set());
    allWorkersByMonth.get(month)!.add(record.employee_id);

    if (employee.employee_type === "labour") {
      stats.labourManDays = Math.round((stats.labourManDays + units) * 100) / 100;
      if (!labourWorkersByMonth.has(month))
        labourWorkersByMonth.set(month, new Set());
      labourWorkersByMonth.get(month)!.add(record.employee_id);
    } else if (employee.employee_type === "foreman") {
      stats.foremanManDays =
        Math.round((stats.foremanManDays + units) * 100) / 100;
      if (!foremanWorkersByMonth.has(month))
        foremanWorkersByMonth.set(month, new Set());
      foremanWorkersByMonth.get(month)!.add(record.employee_id);
    }
  }

  for (const month of months) {
    const stats = workByMonthMap.get(month)!;
    stats.labourWorkers = labourWorkersByMonth.get(month)?.size ?? 0;
    stats.foremanWorkers = foremanWorkersByMonth.get(month)?.size ?? 0;
    stats.totalSiteWorkers = new Set([
      ...(labourWorkersByMonth.get(month) ?? []),
      ...(foremanWorkersByMonth.get(month) ?? []),
    ]).size;
    stats.totalSiteManDays =
      Math.round((stats.labourManDays + stats.foremanManDays) * 100) / 100;
    stats.allWorkers = allWorkersByMonth.get(month)?.size ?? 0;
  }

  const salaryByTypeMap = new Map<string, MonthSalaryTypeStats>();
  for (const month of months) {
    for (const type of ANALYTICS_SALARY_TYPES) {
      salaryByTypeMap.set(`${month}:${type}`, emptySalaryTypeMonth(month, type));
    }
  }

  const workersByMonthType = new Map<string, Set<string>>();

  for (const record of attendance) {
    const month = monthFromDate(record.attendance_date);
    const employee = employeeMap.get(record.employee_id);
    if (!employee || !salaryByTypeMap.has(`${month}:${employee.employee_type}`))
      continue;

    const units = Number(record.day_units);
    if (units <= 0) continue;

    const key = `${month}:${employee.employee_type}`;
    const stats = salaryByTypeMap.get(key)!;
    stats.manDays = Math.round((stats.manDays + units) * 100) / 100;

    const rate =
      employee.daily_rate != null ? Number(employee.daily_rate) : null;
    if (rate != null) {
      stats.grossEarned =
        Math.round((stats.grossEarned + units * rate) * 100) / 100;
    }

    if (!workersByMonthType.has(key)) workersByMonthType.set(key, new Set());
    workersByMonthType.get(key)!.add(record.employee_id);
  }

  for (const payment of payments) {
    const month = monthFromDate(payment.payment_date);
    const employee = employeeMap.get(payment.employee_id);
    if (!employee) continue;

    const key = `${month}:${employee.employee_type}`;
    const stats = salaryByTypeMap.get(key);
    if (!stats) continue;

    stats.paidOut =
      Math.round(
        (stats.paidOut +
          paymentSignedAmount({
            amount: payment.amount,
            payment_type: payment.payment_type as
              | "advance"
              | "salary"
              | "weekly_kharcha"
              | "bonus"
              | "deduction",
          })) *
          100
      ) / 100;
  }

  for (const stats of salaryByTypeMap.values()) {
    stats.workers = workersByMonthType.get(
      `${stats.month}:${stats.employeeType}`
    )?.size ?? 0;
    stats.balanceDue =
      Math.round((stats.grossEarned - stats.paidOut) * 100) / 100;
  }

  const salaryByType = Array.from(salaryByTypeMap.values()).sort((a, b) =>
    a.month === b.month
      ? ANALYTICS_SALARY_TYPES.indexOf(a.employeeType) -
        ANALYTICS_SALARY_TYPES.indexOf(b.employeeType)
      : a.month.localeCompare(b.month)
  );

  const salaryTotalsByMonth: MonthSalaryTotals[] = months.map((month) => {
    const monthRows = salaryByType.filter((r) => r.month === month);
    return {
      month,
      monthLabel: formatMonthLabel(month),
      monthShort: formatMonthShort(month),
      grossEarned: Math.round(
        monthRows.reduce((s, r) => s + r.grossEarned, 0) * 100
      ) / 100,
      paidOut: Math.round(monthRows.reduce((s, r) => s + r.paidOut, 0) * 100) / 100,
      balanceDue: Math.round(
        monthRows.reduce((s, r) => s + r.balanceDue, 0) * 100
      ) / 100,
    };
  });

  const focusMonth =
    selectedMonth && months.includes(selectedMonth)
      ? selectedMonth
      : months[months.length - 1];

  return {
    fromMonth,
    toMonth,
    workByMonth: months.map((m) => workByMonthMap.get(m)!),
    salaryByType,
    salaryTotalsByMonth,
    selectedMonthWork: workByMonthMap.get(focusMonth) ?? null,
    selectedMonthSalaryTotals:
      salaryTotalsByMonth.find((t) => t.month === focusMonth) ?? null,
  };
}

export function getDefaultAnalyticsRange(): {
  fromMonth: string;
  toMonth: string;
} {
  const toMonth = getCurrentMonth();
  const fromMonth = addMonths(toMonth, -5);
  return { fromMonth, toMonth };
}
