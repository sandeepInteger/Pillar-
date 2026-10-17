import type {
  WorkQuantityFormData,
  WorkQuantityLog,
  WorkQuantitySummary,
  WorkQuantityTypeTotal,
  WorkQuantityUnit,
  WorkTypeConfig,
  WorkTypeFormData,
} from "@/types/database";

export function getEmptyWorkQuantityForm(
  projectId = "",
  workType = ""
): WorkQuantityFormData {
  return {
    project_id: projectId,
    work_date: new Date().toISOString().slice(0, 10),
    work_type: workType,
    quantity: "",
    notes: "",
  };
}

export function getEmptyWorkTypeForm(): WorkTypeFormData {
  return { name: "", unit: "sqm", rate: "" };
}

/** "Scaffolding Work" -> "scaffolding_work" (stable code stored on each log). */
export function workTypeCodeFromName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/** Quantity input: digits and at most 2 decimal places (same rule as wage rates). */
export function sanitizeQuantityInput(raw: string): string {
  if (raw === "") return "";
  let cleaned = raw.replace(/[^\d.]/g, "");
  const dotIndex = cleaned.indexOf(".");
  if (dotIndex !== -1) {
    const intPart = cleaned.slice(0, dotIndex);
    const decPart = cleaned.slice(dotIndex + 1).replace(/\./g, "").slice(0, 2);
    cleaned = decPart.length > 0 ? `${intPart}.${decPart}` : `${intPart}.`;
  }
  return cleaned;
}

export function formatQuantity(quantity: number, unit: WorkQuantityUnit): string {
  const formatted = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(quantity);
  return `${formatted} ${unit.toUpperCase()}`;
}

export function computeWorkAmount(quantity: number, rate: number): number {
  return Math.round(quantity * rate * 100) / 100;
}

export function getWorkTypeName(
  workTypes: Pick<WorkTypeConfig, "code" | "name">[],
  code: string
): string {
  return workTypes.find((t) => t.code === code)?.name ?? code;
}

export function summarizeWorkQuantity(
  logs: Pick<WorkQuantityLog, "work_type" | "quantity" | "unit" | "amount">[],
  workTypes: Pick<WorkTypeConfig, "code" | "name" | "is_active">[]
): WorkQuantitySummary {
  const byType = new Map<string, WorkQuantityTypeTotal>();

  for (const type of workTypes) {
    if (!type.is_active) continue;
    byType.set(type.code, {
      workType: type.code,
      name: type.name,
      totalsByUnit: {},
      totalAmount: 0,
      entryCount: 0,
    });
  }

  let totalAmount = 0;
  for (const log of logs) {
    const bucket =
      byType.get(log.work_type) ??
      ({
        workType: log.work_type,
        name: getWorkTypeName(workTypes, log.work_type),
        totalsByUnit: {},
        totalAmount: 0,
        entryCount: 0,
      } as WorkQuantityTypeTotal);
    bucket.entryCount += 1;
    bucket.totalsByUnit[log.unit] =
      Math.round(((bucket.totalsByUnit[log.unit] ?? 0) + Number(log.quantity)) * 100) / 100;
    const amount = Number(log.amount ?? 0);
    bucket.totalAmount = Math.round((bucket.totalAmount + amount) * 100) / 100;
    totalAmount += amount;
    byType.set(log.work_type, bucket);
  }

  return {
    entryCount: logs.length,
    totalAmount: Math.round(totalAmount * 100) / 100,
    byType: Array.from(byType.values()),
  };
}

export interface WorkQuantityDay<T> {
  date: string;
  logs: T[];
  totalAmount: number;
}

/**
 * Every calendar day of `month` (YYYY-MM), newest first, with that day's logs.
 * Days with no logs come back with an empty list so the table can show "nil".
 * Future days of the current month are left out.
 */
export function groupWorkQuantityByDay<
  T extends Pick<WorkQuantityLog, "work_date" | "amount">,
>(
  logs: T[],
  month: string,
  today = new Date().toISOString().slice(0, 10)
): WorkQuantityDay<T>[] {
  const [year, m] = month.split("-").map(Number);
  const lastDay = new Date(year, m, 0).getDate();
  const byDate = new Map<string, T[]>();
  for (const log of logs) {
    const list = byDate.get(log.work_date) ?? [];
    list.push(log);
    byDate.set(log.work_date, list);
  }

  const days: WorkQuantityDay<T>[] = [];
  for (let d = lastDay; d >= 1; d--) {
    const date = `${month}-${String(d).padStart(2, "0")}`;
    if (date > today) continue;
    const dayLogs = byDate.get(date) ?? [];
    const totalAmount =
      Math.round(dayLogs.reduce((s, l) => s + Number(l.amount ?? 0), 0) * 100) / 100;
    days.push({ date, logs: dayLogs, totalAmount });
  }
  return days;
}
