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
  buildSalaryLedger,
  enrichSalaryRow,
  getMonthDateRange,
  getMonthsInRange,
} from "@/lib/utils/salary";

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
  const records = await getRangeAttendance(start, end, filters.projectId);
  const employeeIds = employees.map((e) => e.id);
  const [relations, paymentsByEmployee] = await Promise.all([
    getEmployeesWithRelations(employeeIds),
    getPaymentsForMonth(filters.month, employeeIds),
  ]);

  const manDaysByEmployee = new Map<string, number>();
  for (const record of records) {
    const current = manDaysByEmployee.get(record.employee_id) ?? 0;
    manDaysByEmployee.set(
      record.employee_id,
      current + Number(record.day_units)
    );
  }

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
        employee_phones: [],
        employee_payment_methods: [],
      } as EmployeeWithRelations);
    const manDays = manDaysByEmployee.get(employee.id) ?? 0;
    const payments = paymentsByEmployee.get(employee.id) ?? [];
    const stats = enrichSalaryRow(full, manDays, payments);

    totalManDays += stats.manDays;
    if (stats.grossAmount != null) totalGross += stats.grossAmount;
    totalPaidOut += stats.totalPaidOut;
    if (stats.balanceDue != null) totalBalanceDue += stats.balanceDue;
    if (stats.dailyRate != null) employeesWithRate++;
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
  const records = await getRangeAttendance(start, end, projectId);
  const manDays = records
    .filter((r) => r.employee_id === employeeId)
    .reduce((sum, r) => sum + Number(r.day_units), 0);

  const paymentsMap = await getPaymentsForMonth(month, [employeeId]);
  const payments = paymentsMap.get(employeeId) ?? [];
  const stats = enrichSalaryRow(employee, manDays, payments);
  const ledger = buildSalaryLedger(
    payments,
    manDays,
    stats.dailyRate,
    stats.grossAmount,
    month
  );

  return {
    employee,
    month,
    manDays,
    dailyRate: stats.dailyRate,
    grossAmount: stats.grossAmount,
    totalPaidOut: stats.totalPaidOut,
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
