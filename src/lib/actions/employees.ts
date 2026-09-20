"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEmployee, getEmployees } from "@/lib/queries/employees";
import {
  deleteEmployeeFromSheet,
  syncAllEmployeesToSheet,
  syncEmployeeToSheet,
} from "@/lib/google/sheets";
import type { EmployeeFormData } from "@/types/database";
import { usesDailyWageWithSl } from "@/types/database";
import { roundToTwoDecimals } from "@/lib/utils/employees";

function emptyToNull(value: string): string | null {
  return value.trim() === "" ? null : value.trim();
}

async function savePhones(
  supabase: Awaited<ReturnType<typeof createClient>>,
  employeeId: string,
  phones: EmployeeFormData["phones"]
) {
  await supabase.from("employee_phones").delete().eq("employee_id", employeeId);

  const validPhones = phones.filter((p) => p.phone_number.trim());
  if (validPhones.length === 0) return;

  const hasPrimary = validPhones.some((p) => p.is_primary);
  const rows = validPhones.map((p, i) => ({
    employee_id: employeeId,
    phone_number: p.phone_number.trim(),
    label: p.label || "primary",
    is_primary: hasPrimary ? p.is_primary : i === 0,
  }));

  await supabase.from("employee_phones").insert(rows);
}

async function savePaymentMethods(
  supabase: Awaited<ReturnType<typeof createClient>>,
  employeeId: string,
  methods: EmployeeFormData["payment_methods"]
) {
  await supabase
    .from("employee_payment_methods")
    .delete()
    .eq("employee_id", employeeId);

  const validMethods = methods.filter(
    (m) =>
      (m.method_type === "upi" && (m.upi_id.trim() || m.upi_phone.trim())) ||
      (m.method_type === "bank" && m.account_number.trim())
  );
  if (validMethods.length === 0) return;

  const hasPrimary = validMethods.some((m) => m.is_primary);
  const rows = validMethods.map((m, i) => ({
    employee_id: employeeId,
    method_type: m.method_type,
    is_primary: hasPrimary ? m.is_primary : i === 0,
    account_holder_name: emptyToNull(m.account_holder_name),
    bank_name: emptyToNull(m.bank_name),
    account_number: emptyToNull(m.account_number),
    ifsc_code: emptyToNull(m.ifsc_code),
    upi_id: emptyToNull(m.upi_id),
    upi_phone: emptyToNull(m.upi_phone),
    notes: emptyToNull(m.notes),
  }));

  await supabase.from("employee_payment_methods").insert(rows);
}

function buildEmployeePayload(data: EmployeeFormData) {
  const isFounder = data.employee_type === "founder";
  const isDailyWageSl = usesDailyWageWithSl(data.employee_type);
  const salary_type = isFounder
    ? "monthly"
    : isDailyWageSl
      ? "daily"
      : "hourly";

  return {
    full_name: data.full_name.trim(),
    employee_type: data.employee_type,
    designation: emptyToNull(data.designation),
    status: data.status,
    start_date: emptyToNull(data.start_date),
    end_date: emptyToNull(data.end_date),
    address_line1: emptyToNull(data.address_line1),
    address_line2: emptyToNull(data.address_line2),
    city: emptyToNull(data.city),
    state: emptyToNull(data.state),
    pincode: emptyToNull(data.pincode),
    landmark: emptyToNull(data.landmark),
    emergency_contact_name: emptyToNull(data.emergency_contact_name),
    emergency_contact_phone: emptyToNull(data.emergency_contact_phone),
    aadhaar_last_4: emptyToNull(data.aadhaar_last_4),
    pan_number: emptyToNull(data.pan_number),
    notes: emptyToNull(data.notes),
    salary_type,
    daily_rate:
      isDailyWageSl && data.daily_rate.trim() !== ""
        ? roundToTwoDecimals(Number.parseFloat(data.daily_rate))
        : null,
    hourly_rate:
      !isFounder &&
      !isDailyWageSl &&
      data.hourly_rate.trim() !== ""
        ? roundToTwoDecimals(Number.parseFloat(data.hourly_rate))
        : null,
    monthly_salary:
      isFounder && data.monthly_salary.trim() !== ""
        ? Number.parseFloat(data.monthly_salary)
        : null,
    monthly_sl_days:
      isFounder
        ? 0
        : isDailyWageSl
          ? Number.parseFloat(data.monthly_sl_days) || 0
          : 0,
  };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function createEmployee(data: EmployeeFormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: employee, error } = await supabase
    .from("employees")
    .insert({
      ...buildEmployeePayload(data),
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  await savePhones(supabase, employee.id, data.phones);
  await savePaymentMethods(supabase, employee.id, data.payment_methods);

  const fullEmployee = await getEmployee(employee.id);
  if (fullEmployee) {
    await syncEmployeeToSheet(fullEmployee);
  }

  revalidatePath("/");
  revalidatePath("/people");
  revalidatePath("/salary");
  redirect(`/people/${employee.id}`);
}

export async function updateEmployee(id: string, data: EmployeeFormData) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("employees")
    .update(buildEmployeePayload(data))
    .eq("id", id);

  if (error) return { error: error.message };

  await savePhones(supabase, id, data.phones);
  await savePaymentMethods(supabase, id, data.payment_methods);

  const fullEmployee = await getEmployee(id);
  if (fullEmployee) {
    await syncEmployeeToSheet(fullEmployee);
  }

  revalidatePath("/");
  revalidatePath("/people");
  revalidatePath("/salary");
  revalidatePath(`/people/${id}`);
  redirect(`/people/${id}`);
}

export async function deleteEmployee(id: string) {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", (await supabase.auth.getUser()).data.user?.id ?? "")
    .single();

  if (profile?.role !== "admin") {
    return { error: "Only admin can delete employees" };
  }

  const existing = await getEmployee(id);

  const { error } = await supabase.from("employees").delete().eq("id", id);
  if (error) return { error: error.message };

  if (existing?.employee_code) {
    await deleteEmployeeFromSheet(existing.employee_code);
  }

  revalidatePath("/");
  revalidatePath("/people");
  redirect("/people");
}

export async function uploadEmployeePhoto(formData: FormData) {
  const supabase = await createClient();
  const employeeId = formData.get("employeeId") as string;
  const file = formData.get("photo") as File;

  if (!employeeId || !file?.size) {
    return { error: "Missing employee or photo" };
  }

  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${employeeId}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("employee-photos")
    .upload(path, file, { upsert: true });

  if (uploadError) return { error: uploadError.message };

  const {
    data: { publicUrl },
  } = supabase.storage.from("employee-photos").getPublicUrl(path);

  const { error: updateError } = await supabase
    .from("employees")
    .update({ photo_url: publicUrl })
    .eq("id", employeeId);

  if (updateError) return { error: updateError.message };

  const fullEmployee = await getEmployee(employeeId);
  if (fullEmployee) {
    await syncEmployeeToSheet(fullEmployee);
  }

  revalidatePath(`/people/${employeeId}`);
  revalidatePath("/people");
  return { url: publicUrl };
}

export async function syncAllToGoogleSheet() {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", (await supabase.auth.getUser()).data.user?.id ?? "")
    .single();

  if (profile?.role !== "admin") {
    return { error: "Only admin can sync to Google Sheets" };
  }

  const employees = await getEmployees();
  const result = await syncAllEmployeesToSheet(employees);

  if (!result.ok) {
    return { error: result.error };
  }

  return { success: true, count: result.count };
}
