import type {
  WorkQuantityFormData,
  WorkQuantityLog,
  WorkQuantitySummary,
  WorkQuantityTypeTotal,
  WorkQuantityUnit,
} from "@/types/database";
import { WORK_TYPE_DISPLAY_ORDER } from "@/types/database";

export function getEmptyWorkQuantityForm(projectId = ""): WorkQuantityFormData {
  return {
    project_id: projectId,
    work_date: new Date().toISOString().slice(0, 10),
    work_type: "block_work",
    quantity: "",
    unit: "sqft",
    notes: "",
  };
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

export function summarizeWorkQuantity(
  logs: Pick<WorkQuantityLog, "work_type" | "quantity" | "unit">[]
): WorkQuantitySummary {
  const byType = new Map<string, WorkQuantityTypeTotal>();

  for (const type of WORK_TYPE_DISPLAY_ORDER) {
    byType.set(type, { workType: type, totalsByUnit: {}, entryCount: 0 });
  }

  for (const log of logs) {
    const bucket =
      byType.get(log.work_type) ??
      ({ workType: log.work_type, totalsByUnit: {}, entryCount: 0 } as WorkQuantityTypeTotal);
    bucket.entryCount += 1;
    bucket.totalsByUnit[log.unit] =
      Math.round(((bucket.totalsByUnit[log.unit] ?? 0) + Number(log.quantity)) * 100) / 100;
    byType.set(log.work_type, bucket);
  }

  return {
    entryCount: logs.length,
    byType: Array.from(byType.values()),
  };
}
