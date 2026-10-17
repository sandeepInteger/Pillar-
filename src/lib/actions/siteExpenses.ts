"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { SiteExpenseFormData } from "@/types/database";
import { SALARY_PAYMENT_MODE_LABELS } from "@/types/database";
import { expenseCategoryCodeFromName } from "@/lib/utils/siteExpenses";
import { parseIndianAmount } from "@/lib/utils/raBills";

function emptyToNull(value: string): string | null {
  return value.trim() === "" ? null : value.trim();
}

export async function addExpenseCategory(name: string) {
  const supabase = await createClient();
  const trimmed = name.trim();
  if (!trimmed) return { error: "Category name is required" };
  const code = expenseCategoryCodeFromName(trimmed);
  if (!code) return { error: "Category name must contain letters or digits" };

  const { error } = await supabase
    .from("expense_categories")
    .insert({ code, name: trimmed });
  if (error) {
    if (error.code === "23505") return { error: "This category already exists" };
    return { error: error.message };
  }

  revalidatePath("/site-expenses");
  return { success: true };
}

export async function renameExpenseCategory(id: string, name: string) {
  const supabase = await createClient();
  const trimmed = name.trim();
  if (!trimmed) return { error: "Category name is required" };

  const { error } = await supabase
    .from("expense_categories")
    .update({ name: trimmed })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/site-expenses");
  return { success: true };
}

export async function setExpenseCategoryActive(id: string, isActive: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("expense_categories")
    .update({ is_active: isActive })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/site-expenses");
  return { success: true };
}

export async function addSiteExpense(data: SiteExpenseFormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  if (!data.project_id) return { error: "Select a site" };
  if (!data.expense_date) return { error: "Date is required" };
  if (!data.category) return { error: "Select a category" };
  if (!(data.payment_mode in SALARY_PAYMENT_MODE_LABELS)) {
    return { error: "Select a payment mode" };
  }
  const amount = Math.round(parseIndianAmount(data.amount) * 100) / 100;
  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: "Amount must be greater than zero" };
  }

  const { error } = await supabase.from("site_expenses").insert({
    project_id: data.project_id,
    expense_date: data.expense_date,
    category: data.category,
    amount,
    paid_to: emptyToNull(data.paid_to),
    payment_mode: data.payment_mode,
    notes: emptyToNull(data.notes),
    created_by: user.id,
  });

  if (error) return { error: error.message };

  revalidatePath("/site-expenses");
  revalidatePath(`/projects/${data.project_id}`);
  return { success: true };
}

export async function deleteSiteExpense(expenseId: string, projectId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("site_expenses")
    .delete()
    .eq("id", expenseId);

  if (error) return { error: error.message };

  revalidatePath("/site-expenses");
  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}
