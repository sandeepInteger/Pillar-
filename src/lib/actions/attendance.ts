"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { AttendanceCellInput } from "@/types/database";

export async function saveWeekAttendance(
  weekStart: string,
  cells: AttendanceCellInput[]
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not logged in" };
  }

  if (cells.length === 0) {
    return { error: "No attendance data to save" };
  }

  const rows = cells.map((cell) => ({
    employee_id: cell.employee_id,
    attendance_date: cell.attendance_date,
    shift_type: cell.shift_type,
    hours_worked:
      cell.shift_type === "hours" ? (cell.hours_worked ?? 0) : null,
    project_id: cell.project_id ?? null,
    created_by: user.id,
  }));

  const { error } = await supabase.from("attendance_records").upsert(rows, {
    onConflict: "employee_id,attendance_date",
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/attendance");
  revalidatePath("/salary");
  revalidatePath("/");
  return { success: true, count: rows.length };
}

export async function markAllForDay(
  date: string,
  shiftType: AttendanceCellInput["shift_type"],
  employeeIds: string[]
) {
  const cells = employeeIds.map((employee_id) => ({
    employee_id,
    attendance_date: date,
    shift_type: shiftType,
  }));

  return saveWeekAttendance(date, cells);
}
