import type { RaBill, RaBillFormData, RaBillPaymentStatus } from "@/types/database";
import { roundToTwoDecimals } from "@/lib/utils/employees";

export const RA_BILL_RETENTION_RATE = 0.05;
export const RA_BILL_TDS_RATE = 0.01;
export const RA_BILL_IGST_RATE = 0.18;

export function computeIgstAmount(
  gross: number,
  gstApplicable: boolean
): number {
  if (!gstApplicable || gross <= 0) return 0;
  return roundToTwoDecimals(gross * RA_BILL_IGST_RATE);
}

export function computeTotalBillWithIgst(
  gross: number,
  gstApplicable: boolean
): number {
  return roundToTwoDecimals(gross + computeIgstAmount(gross, gstApplicable));
}

export function computeRaBillNet(
  gross: number,
  retention: number,
  tds: number,
  igst = 0
): number {
  return Math.max(0, roundToTwoDecimals(gross - retention - tds + igst));
}

export function computeDefaultRetention(gross: number): number {
  return roundToTwoDecimals(gross * RA_BILL_RETENTION_RATE);
}

export function computeDefaultTds(gross: number): number {
  return roundToTwoDecimals(gross * RA_BILL_TDS_RATE);
}

export function stripIndianGrouping(value: string): string {
  return value.replace(/,/g, "").trim();
}

export function parseIndianAmount(value: string): number {
  const stripped = stripIndianGrouping(value);
  if (stripped === "" || stripped === ".") return 0;
  const n = Number.parseFloat(stripped);
  return Number.isFinite(n) ? n : 0;
}

/** Format number with Indian digit grouping (en-IN). */
export function formatIndianAmount(
  amount: number,
  maxFractionDigits = 2
): string {
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxFractionDigits,
  }).format(amount);
}

export function formatIndianRupee(amount: number): string {
  return `₹${formatIndianAmount(amount, 2)}`;
}

/** Input sanitizer: digits + optional decimal (max 2 places), then Indian grouping. */
export function sanitizeIndianAmountInput(raw: string): string {
  if (raw === "") return "";
  let cleaned = raw.replace(/,/g, "").replace(/[^\d.]/g, "");
  const dotIndex = cleaned.indexOf(".");
  let intPart = cleaned;
  let decPart = "";
  if (dotIndex !== -1) {
    intPart = cleaned.slice(0, dotIndex);
    decPart = cleaned.slice(dotIndex + 1).replace(/\./g, "").slice(0, 2);
  }
  if (intPart === "" && decPart === "" && cleaned.includes(".")) {
    return ".";
  }
  if (intPart === "" && decPart !== "") {
    return `0.${decPart}`;
  }
  if (intPart === "") return decPart ? `0.${decPart}` : "";

  const endsWithDot = cleaned.endsWith(".") && decPart === "";
  const num = decPart !== "" ? Number.parseFloat(`${intPart}.${decPart}`) : Number.parseInt(intPart, 10);
  if (!Number.isFinite(num)) return raw.replace(/,/g, "");

  if (endsWithDot) {
    return `${formatIndianAmount(num, 0)}.`;
  }
  const fractionDigits = decPart.length;
  return formatIndianAmount(num, Math.max(fractionDigits, fractionDigits > 0 ? 2 : 0));
}

export function getRaBillPaymentStatus(
  bill: Pick<RaBill, "bank_received_date">
): RaBillPaymentStatus {
  return bill.bank_received_date ? "received" : "pending";
}

export function getEmptyRaBillForm(projectId = ""): RaBillFormData {
  return {
    project_id: projectId,
    bill_label: "",
    contractor_name: "",
    confirmed_date: new Date().toISOString().slice(0, 10),
    work_period_start: "",
    work_period_end: "",
    gross_amount: "",
    gst_applicable: false,
    retention_amount: formatIndianAmount(0),
    tds_amount: formatIndianAmount(0),
    bank_received_date: "",
    bank_received_amount: "",
    notes: "",
  };
}

export function raBillToFormData(
  bill: RaBill,
  projectId?: string
): RaBillFormData {
  return {
    project_id: projectId ?? bill.project_id,
    bill_label: bill.bill_label,
    contractor_name: bill.contractor_name ?? "",
    confirmed_date: bill.confirmed_date,
    work_period_start: bill.work_period_start ?? "",
    work_period_end: bill.work_period_end ?? "",
    gross_amount: formatIndianAmount(Number(bill.gross_amount)),
    gst_applicable: bill.gst_applicable ?? false,
    retention_amount: formatIndianAmount(Number(bill.retention_amount)),
    tds_amount: formatIndianAmount(Number(bill.tds_amount)),
    bank_received_date: bill.bank_received_date ?? "",
    bank_received_amount:
      bill.bank_received_amount != null
        ? formatIndianAmount(Number(bill.bank_received_amount))
        : "",
    notes: bill.notes ?? "",
  };
}

export function parseRaBillAmounts(data: RaBillFormData): {
  gross_amount: number;
  gst_applicable: boolean;
  igst_amount: number;
  total_bill_amount: number;
  retention_amount: number;
  tds_amount: number;
  net_amount: number;
  bank_received_amount: number | null;
} {
  const gross_amount = roundToTwoDecimals(parseIndianAmount(data.gross_amount));
  const gst_applicable = data.gst_applicable;
  const igst_amount = computeIgstAmount(gross_amount, gst_applicable);
  const total_bill_amount = computeTotalBillWithIgst(
    gross_amount,
    gst_applicable
  );
  const retention_amount = roundToTwoDecimals(
    parseIndianAmount(data.retention_amount)
  );
  const tds_amount = roundToTwoDecimals(parseIndianAmount(data.tds_amount));
  const net_amount = computeRaBillNet(
    gross_amount,
    retention_amount,
    tds_amount,
    igst_amount
  );
  const bank_received_amount =
    data.bank_received_amount.trim() !== ""
      ? roundToTwoDecimals(parseIndianAmount(data.bank_received_amount))
      : null;

  return {
    gross_amount,
    gst_applicable,
    igst_amount,
    total_bill_amount,
    retention_amount,
    tds_amount,
    net_amount,
    bank_received_amount,
  };
}

export function formatRaBillDate(date: string | null): string {
  if (!date) return "—";
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatRaBillWorkPeriod(
  start: string | null,
  end: string | null
): string {
  if (!start && !end) return "—";
  if (start && end && start !== end) {
    return `${formatRaBillDate(start)} – ${formatRaBillDate(end)}`;
  }
  return formatRaBillDate(start ?? end);
}

export function applyDefaultDeductionsToForm(
  form: RaBillFormData
): Pick<RaBillFormData, "retention_amount" | "tds_amount"> {
  const gross = parseIndianAmount(form.gross_amount);
  return {
    retention_amount: formatIndianAmount(computeDefaultRetention(gross)),
    tds_amount: formatIndianAmount(computeDefaultTds(gross)),
  };
}
