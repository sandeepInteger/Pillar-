import { createClient } from "@/lib/supabase/server";
import type {
  AnalyticsData,
  EmployeeType,
  MonthRaBillCashReceipt,
  MonthRaBillStats,
  MonthSalaryTotals,
  MonthSalaryTypeStats,
  MonthWorkStats,
} from "@/types/database";
import { ANALYTICS_SALARY_TYPES, SITE_LABOUR_TYPES } from "@/types/database";
import {
  addMonths,
  aggregateAttendanceForSalary,
  computeGrossSalary,
  formatMonthLabel,
  formatMonthShort,
  getCurrentMonth,
  getMonthDateRange,
  getMonthsInRange,
  paymentSignedAmount,
} from "@/lib/utils/salary";
import type { EmployeeWithRelations, ShiftType } from "@/types/database";

interface EmployeeRow {
  id: string;
  employee_type: EmployeeType;
  salary_type: EmployeeWithRelations["salary_type"] | null;
  daily_rate: number | null;
  hourly_rate: number | null;
  monthly_salary: number | null;
  monthly_sl_days: number | null;
}

interface AttendanceRow {
  employee_id: string;
  attendance_date: string;
  shift_type: string;
  day_units: number;
  hours_worked: number | null;
  overtime_hours: number | null;
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

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

function emptyRaBillMonth(month: string): MonthRaBillStats {
  return {
    month,
    monthLabel: formatMonthLabel(month),
    monthShort: formatMonthShort(month),
    billCount: 0,
    grossAmount: 0,
    igstAmount: 0,
    totalBillAmount: 0,
    retentionAmount: 0,
    tdsAmount: 0,
    netAmount: 0,
    receivedFromBills: 0,
    pendingNet: 0,
  };
}

function emptyRaBillCashMonth(month: string): MonthRaBillCashReceipt {
  return {
    month,
    monthLabel: formatMonthLabel(month),
    monthShort: formatMonthShort(month),
    amount: 0,
    billCount: 0,
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

  const [employeesRes, attendanceRes, paymentsRes, raBillsRes, raBillBankRes] =
    await Promise.all([
    supabase
      .from("employees")
      .select(
        "id, employee_type, salary_type, daily_rate, hourly_rate, monthly_salary, monthly_sl_days"
      ),
    supabase
      .from("attendance_records")
      .select(
        "employee_id, attendance_date, shift_type, day_units, hours_worked, overtime_hours"
      )
      .gte("attendance_date", start)
      .lte("attendance_date", end),
    supabase
      .from("salary_payments")
      .select("employee_id, payment_date, amount, payment_type")
      .gte("payment_date", start)
      .lte("payment_date", end),
    supabase
      .from("ra_bills")
      .select(
        "confirmed_date, gross_amount, igst_amount, retention_amount, tds_amount, net_amount, bank_received_date, bank_received_amount"
      )
      .gte("confirmed_date", start)
      .lte("confirmed_date", end),
    supabase
      .from("ra_bills")
      .select("bank_received_date, bank_received_amount")
      .not("bank_received_date", "is", null)
      .gte("bank_received_date", start)
      .lte("bank_received_date", end),
  ]);

  const employees = (employeesRes.data ?? []) as EmployeeRow[];
  const attendance = (attendanceRes.data ?? []) as AttendanceRow[];
  const payments = (paymentsRes.data ?? []) as PaymentRow[];

  interface RaBillAnalyticsRow {
    confirmed_date: string;
    gross_amount: number;
    igst_amount: number;
    retention_amount: number;
    tds_amount: number;
    net_amount: number;
    bank_received_date: string | null;
    bank_received_amount: number | null;
  }

  const raBills = (raBillsRes.data ?? []) as RaBillAnalyticsRow[];
  const raBillBankRows = (raBillBankRes.data ?? []) as Pick<
    RaBillAnalyticsRow,
    "bank_received_date" | "bank_received_amount"
  >[];

  const employeeMap = new Map(employees.map((e) => [e.id, e]));

  const raBillsByMonthMap = new Map<string, MonthRaBillStats>(
    months.map((m) => [m, emptyRaBillMonth(m)])
  );
  const raBillCashByMonthMap = new Map<string, MonthRaBillCashReceipt>(
    months.map((m) => [m, emptyRaBillCashMonth(m)])
  );

  for (const bill of raBills) {
    const month = monthFromDate(bill.confirmed_date);
    const stats = raBillsByMonthMap.get(month);
    if (!stats) continue;

    const gross = Number(bill.gross_amount);
    const igst = Number(bill.igst_amount ?? 0);
    const retention = Number(bill.retention_amount);
    const tds = Number(bill.tds_amount);
    const net = Number(bill.net_amount);

    stats.billCount += 1;
    stats.grossAmount = roundMoney(stats.grossAmount + gross);
    stats.igstAmount = roundMoney(stats.igstAmount + igst);
    stats.totalBillAmount = roundMoney(stats.totalBillAmount + gross + igst);
    stats.retentionAmount = roundMoney(stats.retentionAmount + retention);
    stats.tdsAmount = roundMoney(stats.tdsAmount + tds);
    stats.netAmount = roundMoney(stats.netAmount + net);

    if (bill.bank_received_date) {
      const received =
        bill.bank_received_amount != null
          ? Number(bill.bank_received_amount)
          : net;
      stats.receivedFromBills = roundMoney(stats.receivedFromBills + received);
    } else {
      stats.pendingNet = roundMoney(stats.pendingNet + net);
    }
  }

  for (const row of raBillBankRows) {
    if (!row.bank_received_date) continue;
    const month = monthFromDate(row.bank_received_date);
    const stats = raBillCashByMonthMap.get(month);
    if (!stats) continue;
    const amount =
      row.bank_received_amount != null
        ? Number(row.bank_received_amount)
        : 0;
    stats.billCount += 1;
    stats.amount = roundMoney(stats.amount + amount);
  }

  const raBillsByMonth = months.map((m) => raBillsByMonthMap.get(m)!);
  const raBillCashByMonth = months.map((m) => raBillCashByMonthMap.get(m)!);

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

    if (SITE_LABOUR_TYPES.includes(employee.employee_type)) {
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
  const attendanceByEmployeeMonth = new Map<
    string,
    Array<{
      shift_type: ShiftType;
      day_units: number;
      hours_worked?: number | null;
      overtime_hours?: number | null;
    }>
  >();

  for (const record of attendance) {
    const month = monthFromDate(record.attendance_date);
    const empKey = `${record.employee_id}:${month}`;
    const list = attendanceByEmployeeMonth.get(empKey) ?? [];
    list.push({
      shift_type: record.shift_type as ShiftType,
      day_units: Number(record.day_units),
      hours_worked: record.hours_worked,
      overtime_hours: record.overtime_hours,
    });
    attendanceByEmployeeMonth.set(empKey, list);
  }

  for (const month of months) {
    for (const employee of employees) {
      const empKey = `${employee.id}:${month}`;
      const empRecords = attendanceByEmployeeMonth.get(empKey) ?? [];
      const breakdown = aggregateAttendanceForSalary(empRecords);
      const typeKey = `${month}:${employee.employee_type}`;
      const stats = salaryByTypeMap.get(typeKey);
      if (!stats) continue;

      stats.manDays = Math.round((stats.manDays + breakdown.manDays) * 100) / 100;

      const gross = computeGrossSalary(
        {
          employee_type: employee.employee_type,
          salary_type: employee.salary_type ?? "daily",
          daily_rate: employee.daily_rate,
          hourly_rate: employee.hourly_rate ?? null,
          monthly_salary: employee.monthly_salary,
          monthly_sl_days: Number(employee.monthly_sl_days ?? 0),
        },
        breakdown
      );
      if (gross.grossAmount != null) {
        stats.grossEarned =
          Math.round((stats.grossEarned + gross.grossAmount) * 100) / 100;
      }

      if (breakdown.manDays > 0 || breakdown.slDays > 0) {
        if (!workersByMonthType.has(typeKey))
          workersByMonthType.set(typeKey, new Set());
        workersByMonthType.get(typeKey)!.add(employee.id);
      }
    }
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
    raBillsByMonth,
    raBillCashByMonth,
    selectedMonthWork: workByMonthMap.get(focusMonth) ?? null,
    selectedMonthSalaryTotals:
      salaryTotalsByMonth.find((t) => t.month === focusMonth) ?? null,
    selectedMonthRaBills: raBillsByMonthMap.get(focusMonth) ?? null,
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
