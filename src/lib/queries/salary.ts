import { createClient } from "@/lib/supabase/server";
import {
  getActiveEmployeesForAttendance,
  getRangeAttendance,
} from "@/lib/queries/attendance";
import { getEmployee } from "@/lib/queries/employees";
import type {
  EmployeeSalaryDetail,
  EmployeeWithRelations,
  SalaryPayment,
  SalarySummary,
} from "@/types/database";
import {
  aggregateAttendanceForSalary,
  buildSalaryLedger,
  computeGrossSalary,
  computeOpeningBalance,
  dayBefore,
  enrichSalaryRow,
  getMonthDateRange,
  getMonthsInRange,
  groupAttendanceByMonth,
} from "@/lib/utils/salary";
import type { ShiftType } from "@/types/database";

async function getEmployeesWithRelations(
  employeeIds: string[]
): Promise<Map<string, EmployeeWithRelations>> {
  const map = new Map<string, EmployeeWithRelations>();
  if (employeeIds.length === 0) return map;

  await Promise.all(
    employeeIds.map(async (id) => {
      const employee = await getEmployee(id);
      if (employee) map.set(id, employee);
    })
  );

  return map;
}

async function getPaymentsForMonth(
  month: string,
  employeeIds?: string[]
): Promise<Map<string, SalaryPayment[]>> {
  const supabase = await createClient();
  const { start, end } = getMonthDateRange(month);

  let query = supabase
    .from("salary_payments")
    .select("*")
    .gte("payment_date", start)
    .lte("payment_date", end)
    .order("payment_date", { ascending: true });

  if (employeeIds && employeeIds.length > 0) {
    query = query.in("employee_id", employeeIds);
  }

  const { data, error } = await query;
  if (error) {
    console.error("getPaymentsForMonth:", error.message);
    return new Map();
  }

  const map = new Map<string, SalaryPayment[]>();
  for (const payment of data ?? []) {
    const list = map.get(payment.employee_id) ?? [];
    list.push(payment as SalaryPayment);
    map.set(payment.employee_id, list);
  }

  return map;
}

async function getPaymentsBeforeMonth(
  month: string,
  employeeIds?: string[]
): Promise<Map<string, SalaryPayment[]>> {
  const supabase = await createClient();
  const { start } = getMonthDateRange(month);

  let query = supabase
    .from("salary_payments")
    .select("*")
    .lt("payment_date", start)
    .order("payment_date", { ascending: true });

  if (employeeIds && employeeIds.length > 0) {
    query = query.in("employee_id", employeeIds);
  }

  const { data, error } = await query;
  if (error) {
    console.error("getPaymentsBeforeMonth:", error.message);
    return new Map();
  }

  const map = new Map<string, SalaryPayment[]>();
  for (const payment of data ?? []) {
    const list = map.get(payment.employee_id) ?? [];
    list.push(payment as SalaryPayment);
    map.set(payment.employee_id, list);
  }

  return map;
}

function groupPriorAttendanceByEmployee(
  records: Array<{
    employee_id: string;
    attendance_date: string;
    shift_type: ShiftType;
    day_units: number;
  }>
): Map<
  string,
  Map<string, Array<{ shift_type: ShiftType; day_units: number }>>
> {
  const byEmployee = new Map<
    string,
    Map<string, Array<{ shift_type: ShiftType; day_units: number }>>
  >();

  for (const record of records) {
    const employeeMap =
      byEmployee.get(record.employee_id) ??
      new Map<string, Array<{ shift_type: ShiftType; day_units: number }>>();
    const monthMap = groupAttendanceByMonth([record]);
    for (const [month, monthRecords] of monthMap) {
      const list = employeeMap.get(month) ?? [];
      list.push(...monthRecords);
      employeeMap.set(month, list);
    }
    byEmployee.set(record.employee_id, employeeMap);
  }

  return byEmployee;
}

export async function getMonthlySalary(filters: {
  month: string;
  type?: string;
  projectId?: string;
}): Promise<SalarySummary> {
  const employees = await getActiveEmployeesForAttendance({
    type: filters.type,
    projectId: filters.projectId,
  });

  const { start, end } = getMonthDateRange(filters.month);
  const employeeIds = employees.map((e) => e.id);
  const priorEnd = dayBefore(start);

  const [records, priorRecords, relations, paymentsByEmployee, priorPaymentsByEmployee] =
    await Promise.all([
      getRangeAttendance(start, end, filters.projectId),
      priorEnd >= "2020-01-01"
        ? getRangeAttendance("2020-01-01", priorEnd, filters.projectId)
        : Promise.resolve([]),
      getEmployeesWithRelations(employeeIds),
      getPaymentsForMonth(filters.month, employeeIds),
      getPaymentsBeforeMonth(filters.month, employeeIds),
    ]);

  const recordsByEmployee = new Map<
    string,
    Array<{ shift_type: ShiftType; day_units: number }>
  >();
  for (const record of records) {
    const list = recordsByEmployee.get(record.employee_id) ?? [];
    list.push({
      shift_type: record.shift_type as ShiftType,
      day_units: Number(record.day_units),
    });
    recordsByEmployee.set(record.employee_id, list);
  }

  const priorAttendanceByEmployee = groupPriorAttendanceByEmployee(
    priorRecords.map((record) => ({
      employee_id: record.employee_id,
      attendance_date: record.attendance_date,
      shift_type: record.shift_type as ShiftType,
      day_units: Number(record.day_units),
    }))
  );

  let totalManDays = 0;
  let totalGross = 0;
  let totalPaidOut = 0;
  let totalBalanceDue = 0;
  let employeesWithRate = 0;
  let employeesMissingRate = 0;
  let employeesMissingPayment = 0;

  const rows = employees.map((employee) => {
    const full =
      relations.get(employee.id) ??
      ({
        ...employee,
        salary_type: employee.salary_type ?? "daily",
        monthly_sl_days: employee.monthly_sl_days ?? 0,
        employee_phones: [],
        employee_payment_methods: [],
      } as EmployeeWithRelations);
    const empRecords = recordsByEmployee.get(employee.id) ?? [];
    const payments = paymentsByEmployee.get(employee.id) ?? [];
    const openingBalance = computeOpeningBalance(
      full,
      filters.month,
      priorAttendanceByEmployee.get(employee.id) ?? new Map(),
      priorPaymentsByEmployee.get(employee.id) ?? []
    );
    const stats = enrichSalaryRow(full, empRecords, payments, openingBalance);

    totalManDays += stats.manDays;
    if (stats.grossAmount != null) totalGross += stats.grossAmount;
    totalPaidOut += stats.totalPaidOut;
    if (stats.balanceDue != null) totalBalanceDue += stats.balanceDue;
    const hasRate =
      stats.salaryType === "monthly"
        ? stats.monthlySalary != null
        : stats.dailyRate != null;
    if (hasRate) employeesWithRate++;
    else employeesMissingRate++;
    if (!stats.hasPaymentMethod) employeesMissingPayment++;

    return {
      employee: full,
      ...stats,
    };
  });

  rows.sort((a, b) => {
    const grossDiff = (b.grossAmount ?? 0) - (a.grossAmount ?? 0);
    if (grossDiff !== 0) return grossDiff;
    return a.employee.full_name.localeCompare(b.employee.full_name);
  });

  return {
    rows,
    totalManDays,
    totalGross: Math.round(totalGross * 100) / 100,
    totalPaidOut: Math.round(totalPaidOut * 100) / 100,
    totalBalanceDue: Math.round(totalBalanceDue * 100) / 100,
    employeesWithRate,
    employeesMissingRate,
    employeesMissingPayment,
  };
}

export async function getEmployeeSalaryDetail(
  employeeId: string,
  month: string,
  projectId?: string
): Promise<EmployeeSalaryDetail | null> {
  const employee = await getEmployee(employeeId);
  if (!employee) return null;

  const { start, end } = getMonthDateRange(month);
  const priorEnd = dayBefore(start);

  const [allRecords, priorRecords, paymentsMap, priorPaymentsMap] =
    await Promise.all([
      getRangeAttendance(start, end, projectId),
      priorEnd >= "2020-01-01"
        ? getRangeAttendance("2020-01-01", priorEnd, projectId)
        : Promise.resolve([]),
      getPaymentsForMonth(month, [employeeId]),
      getPaymentsBeforeMonth(month, [employeeId]),
    ]);

  const empRecords = allRecords
    .filter((r) => r.employee_id === employeeId)
    .map((r) => ({
      shift_type: r.shift_type as ShiftType,
      day_units: Number(r.day_units),
    }));

  const priorAttendanceByMonth = groupAttendanceByMonth(
    priorRecords
      .filter((r) => r.employee_id === employeeId)
      .map((r) => ({
        attendance_date: r.attendance_date,
        shift_type: r.shift_type as ShiftType,
        day_units: Number(r.day_units),
      }))
  );

  const payments = paymentsMap.get(employeeId) ?? [];
  const priorPayments = priorPaymentsMap.get(employeeId) ?? [];
  const openingBalance = computeOpeningBalance(
    employee,
    month,
    priorAttendanceByMonth,
    priorPayments
  );

  const attendance = aggregateAttendanceForSalary(empRecords);
  const gross = computeGrossSalary(employee, attendance);
  const stats = enrichSalaryRow(employee, empRecords, payments, openingBalance);
  const ledger = buildSalaryLedger(
    payments,
    employee,
    attendance,
    gross,
    month,
    openingBalance
  );

  return {
    employee,
    month,
    manDays: attendance.manDays,
    absentDays: attendance.absentDays,
    slDays: attendance.slDays,
    dailyRate: gross.dailyRate,
    monthlySalary: gross.monthlySalary,
    salaryType: gross.salaryType,
    slAllowance: gross.slAllowance,
    salaryDeduction: gross.salaryDeduction,
    grossAmount: stats.grossAmount,
    totalPaidOut: stats.totalPaidOut,
    openingBalance: stats.openingBalance,
    monthBalance: stats.monthBalance,
    balanceDue: stats.balanceDue,
    ledger,
    payments,
  };
}

export async function getEmployeeSalaryExport(
  employeeId: string,
  fromMonth: string,
  toMonth: string,
  projectId?: string
): Promise<EmployeeSalaryDetail[] | null> {
  const employee = await getEmployee(employeeId);
  if (!employee) return null;

  const months = getMonthsInRange(fromMonth, toMonth);
  const details = await Promise.all(
    months.map((month) =>
      getEmployeeSalaryDetail(employeeId, month, projectId)
    )
  );

  return details.filter((d): d is EmployeeSalaryDetail => d != null);
}

/** @deprecated use getMonthlySalary */
export async function getWeeklySalary(filters: {
  weekStart: string;
  type?: string;
  projectId?: string;
}): Promise<SalarySummary> {
  const weekDate = new Date(filters.weekStart);
  const month = `${weekDate.getFullYear()}-${String(weekDate.getMonth() + 1).padStart(2, "0")}`;
  return getMonthlySalary({
    month,
    type: filters.type,
    projectId: filters.projectId,
  });
}

export async function getSalaryDashboardStats(month: string) {
  const summary = await getMonthlySalary({ month });
  return {
    totalGross: summary.totalGross,
    totalManDays: summary.totalManDays,
    totalPaidOut: summary.totalPaidOut,
    totalBalanceDue: summary.totalBalanceDue,
    missingRate: summary.employeesMissingRate,
    missingPayment: summary.employeesMissingPayment,
  };
}
