import type { ProjectBankInflow, ProjectBankInflowWeekSummary } from "@/types/database";
import { roundToTwoDecimals } from "@/lib/utils/employees";

export function getWeekStartMonday(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00`);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

function formatWeekRangeLabel(weekStart: string, weekEnd: string): string {
  const start = new Date(`${weekStart}T12:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
  const end = new Date(`${weekEnd}T12:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return `${start} – ${end}`;
}

export function summarizeInflowsByWeek(
  inflows: Pick<ProjectBankInflow, "received_date" | "amount">[]
): ProjectBankInflowWeekSummary[] {
  const map = new Map<string, { totalAmount: number; entryCount: number }>();

  for (const row of inflows) {
    const weekStart = getWeekStartMonday(row.received_date);
    const bucket = map.get(weekStart) ?? { totalAmount: 0, entryCount: 0 };
    bucket.totalAmount = roundToTwoDecimals(
      bucket.totalAmount + Number(row.amount)
    );
    bucket.entryCount += 1;
    map.set(weekStart, bucket);
  }

  return Array.from(map.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([weekStart, stats]) => {
      const end = new Date(`${weekStart}T12:00:00`);
      end.setDate(end.getDate() + 6);
      const weekEnd = end.toISOString().slice(0, 10);
      return {
        weekStart,
        weekEnd,
        weekLabel: formatWeekRangeLabel(weekStart, weekEnd),
        totalAmount: stats.totalAmount,
        entryCount: stats.entryCount,
      };
    });
}

export function sumInflowAmounts(
  inflows: Pick<ProjectBankInflow, "amount">[]
): number {
  return roundToTwoDecimals(
    inflows.reduce((s, r) => s + Number(r.amount), 0)
  );
}
