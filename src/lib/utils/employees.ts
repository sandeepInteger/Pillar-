import type { EmployeeFormData, EmployeeWithRelations } from "@/types/database";

export function getEmptyFormData(): EmployeeFormData {
  return {
    full_name: "",
    employee_type: "labour",
    designation: "",
    status: "active",
    start_date: "",
    end_date: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    pincode: "",
    landmark: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    aadhaar_last_4: "",
    pan_number: "",
    notes: "",
    daily_rate: "",
    phones: [{ phone_number: "", label: "primary", is_primary: true }],
    payment_methods: [],
  };
}

export function employeeToFormData(
  employee: EmployeeWithRelations
): EmployeeFormData {
  return {
    full_name: employee.full_name,
    employee_type: employee.employee_type,
    designation: employee.designation ?? "",
    status: employee.status,
    start_date: employee.start_date ?? "",
    end_date: employee.end_date ?? "",
    address_line1: employee.address_line1 ?? "",
    address_line2: employee.address_line2 ?? "",
    city: employee.city ?? "",
    state: employee.state ?? "",
    pincode: employee.pincode ?? "",
    landmark: employee.landmark ?? "",
    emergency_contact_name: employee.emergency_contact_name ?? "",
    emergency_contact_phone: employee.emergency_contact_phone ?? "",
    aadhaar_last_4: employee.aadhaar_last_4 ?? "",
    pan_number: employee.pan_number ?? "",
    notes: employee.notes ?? "",
    daily_rate:
      employee.daily_rate != null ? String(employee.daily_rate) : "",
    phones:
      employee.employee_phones.length > 0
        ? employee.employee_phones.map((p) => ({
            phone_number: p.phone_number,
            label: p.label,
            is_primary: p.is_primary,
          }))
        : [{ phone_number: "", label: "primary", is_primary: true }],
    payment_methods: employee.employee_payment_methods.map((m) => ({
      method_type: m.method_type,
      is_primary: m.is_primary,
      account_holder_name: m.account_holder_name ?? "",
      bank_name: m.bank_name ?? "",
      account_number: m.account_number ?? "",
      ifsc_code: m.ifsc_code ?? "",
      upi_id: m.upi_id ?? "",
      upi_phone: m.upi_phone ?? "",
      notes: m.notes ?? "",
    })),
  };
}

export function maskAccountNumber(num: string | null): string {
  if (!num) return "—";
  if (num.length <= 4) return num;
  return "****" + num.slice(-4);
}

export function formatDate(date: string | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function getPrimaryPhone(employee: EmployeeWithRelations): string | null {
  const primary = employee.employee_phones.find((p) => p.is_primary);
  return primary?.phone_number ?? employee.employee_phones[0]?.phone_number ?? null;
}

export function getPrimaryPayment(employee: EmployeeWithRelations): string | null {
  const primary = employee.employee_payment_methods.find((p) => p.is_primary);
  const method = primary ?? employee.employee_payment_methods[0];
  if (!method) return null;
  if (method.method_type === "upi") {
    return method.upi_id ?? method.upi_phone ?? null;
  }
  return method.account_number
    ? maskAccountNumber(method.account_number)
    : null;
}
