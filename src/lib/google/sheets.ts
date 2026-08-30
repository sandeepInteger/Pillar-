import { google } from "googleapis";
import type { EmployeeWithRelations } from "@/types/database";
import {
  EMPLOYEE_STATUS_LABELS,
  EMPLOYEE_TYPE_LABELS,
} from "@/types/database";

const SHEET_NAME = "Employees";

const HEADERS = [
  "Employee Code",
  "ID",
  "Full Name",
  "Type",
  "Designation",
  "Status",
  "Start Date",
  "End Date",
  "Address Line 1",
  "Address Line 2",
  "City",
  "State",
  "Pincode",
  "Landmark",
  "Primary Phone",
  "All Phones",
  "Primary Payment",
  "All Payment Details",
  "Emergency Contact",
  "Emergency Phone",
  "Aadhaar Last 4",
  "PAN",
  "Notes",
  "Photo URL",
  "Updated At",
];

export function isGoogleSheetsConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_SHEET_ID &&
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
      process.env.GOOGLE_PRIVATE_KEY
  );
}

function getSheetsClient() {
  if (!isGoogleSheetsConfigured()) {
    throw new Error("Google Sheets is not configured");
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return google.sheets({ version: "v4", auth });
}

function formatPhones(employee: EmployeeWithRelations): {
  primary: string;
  all: string;
} {
  const phones = employee.employee_phones;
  if (phones.length === 0) return { primary: "", all: "" };

  const primary =
    phones.find((p) => p.is_primary)?.phone_number ?? phones[0].phone_number;
  const all = phones
    .map((p) => `${p.phone_number} (${p.label}${p.is_primary ? ", primary" : ""})`)
    .join(" | ");

  return { primary, all };
}

function formatPayment(employee: EmployeeWithRelations): {
  primary: string;
  all: string;
} {
  const methods = employee.employee_payment_methods;
  if (methods.length === 0) return { primary: "", all: "" };

  const formatOne = (m: (typeof methods)[0]) => {
    if (m.method_type === "upi") {
      return `UPI: ${m.upi_id ?? ""}${m.upi_phone ? ` / ${m.upi_phone}` : ""}`;
    }
    return `Bank: ${m.account_holder_name ?? ""} | ${m.bank_name ?? ""} | ${m.account_number ?? ""} | ${m.ifsc_code ?? ""}`;
  };

  const primaryMethod =
    methods.find((m) => m.is_primary) ?? methods[0];

  return {
    primary: formatOne(primaryMethod),
    all: methods.map(formatOne).join(" | "),
  };
}

export function employeeToSheetRow(employee: EmployeeWithRelations): string[] {
  const phones = formatPhones(employee);
  const payment = formatPayment(employee);

  return [
    employee.employee_code,
    employee.id,
    employee.full_name,
    EMPLOYEE_TYPE_LABELS[employee.employee_type],
    employee.designation ?? "",
    EMPLOYEE_STATUS_LABELS[employee.status],
    employee.start_date ?? "",
    employee.end_date ?? "",
    employee.address_line1 ?? "",
    employee.address_line2 ?? "",
    employee.city ?? "",
    employee.state ?? "",
    employee.pincode ?? "",
    employee.landmark ?? "",
    phones.primary,
    phones.all,
    payment.primary,
    payment.all,
    employee.emergency_contact_name ?? "",
    employee.emergency_contact_phone ?? "",
    employee.aadhaar_last_4 ?? "",
    employee.pan_number ?? "",
    employee.notes ?? "",
    employee.photo_url ?? "",
    employee.updated_at,
  ];
}

async function ensureHeaderRow() {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.GOOGLE_SHEET_ID!;

  const existing = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${SHEET_NAME}!A1:Y1`,
  });

  if (!existing.data.values?.length) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${SHEET_NAME}!A1`,
      valueInputOption: "RAW",
      requestBody: { values: [HEADERS] },
    });
  }
}

async function findRowByEmployeeCode(code: string): Promise<number | null> {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.GOOGLE_SHEET_ID!;

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${SHEET_NAME}!A:A`,
  });

  const rows = response.data.values ?? [];
  const index = rows.findIndex((row, i) => i > 0 && row[0] === code);
  return index === -1 ? null : index + 1;
}

export async function syncEmployeeToSheet(
  employee: EmployeeWithRelations
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isGoogleSheetsConfigured()) {
    return { ok: true };
  }

  try {
    const sheets = getSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEET_ID!;
    await ensureHeaderRow();

    const row = employeeToSheetRow(employee);
    const existingRow = await findRowByEmployeeCode(employee.employee_code);

    if (existingRow) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${SHEET_NAME}!A${existingRow}:Y${existingRow}`,
        valueInputOption: "RAW",
        requestBody: { values: [row] },
      });
    } else {
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${SHEET_NAME}!A:Y`,
        valueInputOption: "RAW",
        insertDataOption: "INSERT_ROWS",
        requestBody: { values: [row] },
      });
    }

    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Google Sheets sync failed";
    console.error("Google Sheets sync error:", message);
    return { ok: false, error: message };
  }
}

export async function deleteEmployeeFromSheet(
  employeeCode: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isGoogleSheetsConfigured()) {
    return { ok: true };
  }

  try {
    const rowNumber = await findRowByEmployeeCode(employeeCode);
    if (!rowNumber) return { ok: true };

    const sheets = getSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEET_ID!;

    // Clear row data (keeps sheet structure; avoids re-auth issues with deleteDimension)
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: `${SHEET_NAME}!A${rowNumber}:Y${rowNumber}`,
    });

    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Google Sheets delete failed";
    console.error("Google Sheets delete error:", message);
    return { ok: false, error: message };
  }
}

export async function syncAllEmployeesToSheet(
  employees: EmployeeWithRelations[]
): Promise<{ ok: true; count: number } | { ok: false; error: string }> {
  if (!isGoogleSheetsConfigured()) {
    return { ok: false, error: "Google Sheets is not configured" };
  }

  try {
    const sheets = getSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEET_ID!;

    await ensureHeaderRow();

    const rows = employees.map(employeeToSheetRow);

    // Replace all data below header
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: `${SHEET_NAME}!A2:Y`,
    });

    if (rows.length > 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${SHEET_NAME}!A2`,
        valueInputOption: "RAW",
        requestBody: { values: rows },
      });
    }

    return { ok: true, count: rows.length };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Full sync failed";
    return { ok: false, error: message };
  }
}
