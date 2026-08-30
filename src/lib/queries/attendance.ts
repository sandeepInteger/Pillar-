import { createClient } from "@/lib/supabase/server";
import type { AttendanceRecord, Employee, ShiftType } from "@/types/database";
import { getWeekDates } from "@/lib/utils/attendance";

export async function getActiveEmployeesForAttendance(filters?: {
  type?: string;
  projectId?: string;
}): Promise<Employee[]> {
  if (filters?.projectId) {
    const { getProjectAssignedEmployees } = await import("@/lib/queries/projects");
    let employees = await getProjectAssignedEmployees(filters.projectId);
    if (filters?.type && filters.type !== "all") {
      employees = employees.filter((e) => e.employee_type === filters.type);
    }
    return employees;
  }

  const supabase = await createClient();

  let query = supabase
    .from("employees")
    .select("*")
    .eq("status", "active")
    .order("full_name", { ascending: true });

  if (filters?.type && filters.type !== "all") {
    query = query.eq("employee_type", filters.type);
  }

  const { data, error } = await query;
  if (error) {
    console.error("getActiveEmployeesForAttendance:", error.message);
    return [];
  }

  return data ?? [];
}

export async function getWeekAttendance(
  weekStart: string,
  projectId?: string
): Promise<AttendanceRecord[]> {
  const supabase = await createClient();
  const dates = getWeekDates(weekStart);

  let query = supabase
    .from("attendance_records")
    .select("*")
    .gte("attendance_date", dates[0])
    .lte("attendance_date", dates[6]);

  if (projectId) {
    query = query.or(`project_id.eq.${projectId},project_id.is.null`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("getWeekAttendance:", error.message);
    return [];
  }

  return data ?? [];
}

export async function getAttendanceSummary(weekStart: string) {
  const records = await getWeekAttendance(weekStart);

  const byShift: Record<ShiftType, number> = {
    absent: 0,
    half: 0,
    full: 0,
    double: 0,
  };

  let totalDayUnits = 0;

  for (const r of records) {
    byShift[r.shift_type as ShiftType]++;
    totalDayUnits += Number(r.day_units);
  }

  return {
    totalRecords: records.length,
    totalDayUnits,
    byShift,
  };
}

export async function getTodayAttendanceSummary() {
  const supabase = await createClient();
  const today = new Date();
  const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const { data } = await supabase
    .from("attendance_records")
    .select("shift_type, day_units")
    .eq("attendance_date", iso);

  const records = data ?? [];
  const present = records.filter((r) => r.shift_type !== "absent").length;
  const absent = records.filter((r) => r.shift_type === "absent").length;
  const manDays = records.reduce((s, r) => s + Number(r.day_units), 0);

  return { present, absent, manDays, marked: records.length };
}
