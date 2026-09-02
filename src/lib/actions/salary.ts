"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type {
  SalaryPaymentFormData,
  SalaryPaymentMode,
} from "@/types/database";

function emptyToNull(value: string): string | null {
  return value.trim() === "" ? null : value.trim();
}

function validateSalaryPaymentForm(data: SalaryPaymentFormData) {
  const amount = Number.parseFloat(data.amount);
  if (!data.payment_date || Number.isNaN(amount) || amount <= 0) {
    return { error: "Valid date and amount are required" };
  }

  if (!data.payment_mode) {
    return { error: "Mode of payment is required" };
  }

  if (data.payment_mode === "upi" && !data.payment_app.trim()) {
    return { error: "Select the UPI app used" };
  }

  if (
    (data.payment_mode === "upi" || data.payment_mode === "bank") &&
    !data.payment_reference.trim()
  ) {
    return {
      error:
        data.payment_mode === "upi"
          ? "UPI ID is required for UPI payments"
          : "Account number is required for bank payments",
    };
  }

  return { amount };
}

function buildPaymentPayload(data: SalaryPaymentFormData, amount: number) {
  return {
    payment_date: data.payment_date,
    amount,
    payment_type: data.payment_type,
    payment_mode: data.payment_mode as SalaryPaymentMode,
    payment_app:
      data.payment_mode === "upi" ? emptyToNull(data.payment_app) : null,
    payment_reference:
      data.payment_mode === "cash"
        ? null
        : emptyToNull(data.payment_reference),
    notes: emptyToNull(data.notes),
  };
}

export async function addSalaryPayment(
  employeeId: string,
  data: SalaryPaymentFormData & { month: string }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const validated = validateSalaryPaymentForm(data);
  if ("error" in validated) return validated;

  const { error } = await supabase.from("salary_payments").insert({
    employee_id: employeeId,
    ...buildPaymentPayload(data, validated.amount),
    created_by: user.id,
  });

  if (error) return { error: error.message };

  revalidatePath("/salary");
  revalidatePath(`/salary/${employeeId}`);
  return { success: true };
}

export async function updateSalaryPayment(
  paymentId: string,
  employeeId: string,
  data: SalaryPaymentFormData
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const validated = validateSalaryPaymentForm(data);
  if ("error" in validated) return validated;

  const { error } = await supabase
    .from("salary_payments")
    .update(buildPaymentPayload(data, validated.amount))
    .eq("id", paymentId)
    .eq("employee_id", employeeId);

  if (error) return { error: error.message };

  revalidatePath("/salary");
  revalidatePath(`/salary/${employeeId}`);
  return { success: true };
}

export async function deleteSalaryPayment(
  paymentId: string,
  employeeId: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { error } = await supabase
    .from("salary_payments")
    .delete()
    .eq("id", paymentId)
    .eq("employee_id", employeeId);

  if (error) return { error: error.message };

  revalidatePath("/salary");
  revalidatePath(`/salary/${employeeId}`);
  return { success: true };
}
