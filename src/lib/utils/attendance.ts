import type { ShiftType } from "@/types/database";
import { SHIFT_DAY_UNITS } from "@/types/database";

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
