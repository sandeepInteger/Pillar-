import type {
  HourlyAttendanceCell,
  HourlyAttendanceStatus,
  ShiftType,
} from "@/types/database";
import {
  SHIFT_DAY_UNITS,
  STANDARD_SHIFT_HOURS,
  usesShiftAttendance,
  type EmployeeType,
} from "@/types/database";

/** Monday as week start (ISO-style for India sites) */
export function getWeekStartFromDate(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

export function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseDateISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function getWeekDates(weekStartISO: string): string[] {
  const start = parseDateISO(weekStartISO);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return formatDateISO(d);
  });
}

export function addWeeks(weekStartISO: string, weeks: number): string {
  const d = parseDateISO(weekStartISO);
  d.setDate(d.getDate() + weeks * 7);
  return formatDateISO(d);
}

export function formatWeekRange(weekStartISO: string): string {
  const dates = getWeekDates(weekStartISO);
  const start = parseDateISO(dates[0]);
  const end = parseDateISO(dates[6]);
  const opts: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
  };
  return `${start.toLocaleDateString("en-IN", opts)} – ${end.toLocaleDateString("en-IN", opts)}`;
}

export function formatDayHeader(iso: string): { day: string; date: string } {
  const d = parseDateISO(iso);
  return {
    day: d.toLocaleDateString("en-IN", { weekday: "short" }),
    date: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
  };
}

export function attendanceCellKey(employeeId: string, date: string): string {
  return `${employeeId}:${date}`;
}

export function sumDayUnits(
  shifts: Record<string, ShiftType>,
  employeeId: string,
  dates: string[]
): number {
  return dates.reduce((sum, date) => {
    const key = attendanceCellKey(employeeId, date);
    const shift = shifts[key] ?? "absent";
    return sum + SHIFT_DAY_UNITS[shift];
  }, 0);
}

export function countByShift(
  shifts: Record<string, ShiftType>,
  dates: string[],
  shift: ShiftType
): number {
  let count = 0;
  for (const key of Object.keys(shifts)) {
    const [, date] = key.split(":");
    if (dates.includes(date) && shifts[key] === shift) count++;
  }
  return count;
}

export function getCurrentWeekStart(): string {
  return formatDateISO(getWeekStartFromDate(new Date()));
}

export function hoursToDayUnits(hours: number): number {
  if (hours <= 0) return 0;
  if (hours >= STANDARD_SHIFT_HOURS) return 1;
  return Math.round((hours / STANDARD_SHIFT_HOURS) * 100) / 100;
}

export function hoursToOvertime(hours: number): number {
  return Math.max(
    0,
    Math.round((hours - STANDARD_SHIFT_HOURS) * 100) / 100
  );
}

export function hourlyCellToDayUnits(cell: HourlyAttendanceCell): number {
  if (cell.status === "absent" || cell.status === "sl") return 0;
  return hoursToDayUnits(cell.hours);
}

export function hourlyCellToOvertime(cell: HourlyAttendanceCell): number {
  if (cell.status !== "work" || cell.hours <= 0) return 0;
  return hoursToOvertime(cell.hours);
}

export function sumHourlyDayUnits(
  cells: Record<string, HourlyAttendanceCell>,
  employeeId: string,
  dates: string[]
): number {
  return dates.reduce((sum, date) => {
    const key = attendanceCellKey(employeeId, date);
    const cell = cells[key] ?? { status: "absent" as const, hours: 0 };
    return sum + hourlyCellToDayUnits(cell);
  }, 0);
}

export function sumHourlyOvertime(
  cells: Record<string, HourlyAttendanceCell>,
  employeeId: string,
  dates: string[]
): number {
  return dates.reduce((sum, date) => {
    const key = attendanceCellKey(employeeId, date);
    const cell = cells[key] ?? { status: "absent" as const, hours: 0 };
    return sum + hourlyCellToOvertime(cell);
  }, 0);
}

export function formatHourlyAttendanceSummary(cell: HourlyAttendanceCell): string {
  if (cell.status === "sl") return "SL";
  if (cell.status === "absent" || cell.hours <= 0) return "A";
  const ot = hoursToOvertime(cell.hours);
  if (cell.hours >= STANDARD_SHIFT_HOURS) {
    return ot > 0 ? `P + ${ot}h OT` : "P";
  }
  return `${cell.hours}h`;
}

export function recordToHourlyCell(
  shift_type: ShiftType,
  hours_worked: number | null | undefined
): HourlyAttendanceCell {
  if (shift_type === "sl") return { status: "sl", hours: 0 };
  if (shift_type === "hours" && (hours_worked ?? 0) > 0) {
    return { status: "work", hours: Number(hours_worked) };
  }
  return { status: "absent", hours: 0 };
}

export function hourlyCellToInput(
  cell: HourlyAttendanceCell
): Pick<
  import("@/types/database").AttendanceCellInput,
  "shift_type" | "hours_worked"
> {
  if (cell.status === "sl") {
    return { shift_type: "sl", hours_worked: null };
  }
  if (cell.status === "work" && cell.hours > 0) {
    return { shift_type: "hours", hours_worked: cell.hours };
  }
  return { shift_type: "absent", hours_worked: null };
}

export { usesShiftAttendance, type EmployeeType, type HourlyAttendanceStatus };
