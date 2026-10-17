"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { WorkType, WorkTypeFormData } from "@/types/database";
import { WORK_QUANTITY_UNIT_LABELS } from "@/types/database";
import { computeWorkAmount, workTypeCodeFromName } from "@/lib/utils/workQuantity";
import { parseIndianAmount } from "@/lib/utils/raBills";

function parseWorkTypeForm(data: WorkTypeFormData) {
  const name = data.name.trim();
  if (!name) return { error: "Work type name is required" as const };
  if (!(data.unit in WORK_QUANTITY_UNIT_LABELS)) {
    return { error: "Select a measuring unit" as const };
  }
  const rate = parseIndianAmount(data.rate);
  if (!Number.isFinite(rate) || rate < 0) {
    return { error: "Rate cannot be negative" as const };
  }
  return { name, unit: data.unit, rate: Math.round(rate * 100) / 100 };
}

export async function addWorkType(data: WorkTypeFormData) {
  const supabase = await createClient();
  const parsed = parseWorkTypeForm(data);
  if ("error" in parsed) return parsed;

  const code = workTypeCodeFromName(parsed.name);
  if (!code) return { error: "Work type name must contain letters or digits" };

  const { error } = await supabase.from("work_types").insert({ code, ...parsed });
  if (error) {
    if (error.code === "23505") return { error: "This work type already exists" };
    return { error: error.message };
  }

  revalidatePath("/work-quantity");
  return { success: true };
}

/** Rate changes apply to new logs only — existing logs keep their snapshot. */
export async function updateWorkType(id: string, data: WorkTypeFormData) {
  const supabase = await createClient();
  const parsed = parseWorkTypeForm(data);
  if ("error" in parsed) return parsed;

  const { error } = await supabase.from("work_types").update(parsed).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/work-quantity");
  return { success: true };
}

export async function setWorkTypeActive(id: string, isActive: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("work_types")
    .update({ is_active: isActive })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/work-quantity");
  return { success: true };
}

export async function addWorkQuantityLog(data: {
  project_id: string;
  work_date: string;
  work_type: WorkType;
  quantity: string;
  notes: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  if (!data.project_id) return { error: "Select a project" };
  if (!data.work_date) return { error: "Date is required" };
  if (!data.work_type) return { error: "Select a work type" };
  const quantity = Number.parseFloat(data.quantity);
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return { error: "Quantity must be greater than zero" };
  }

  // Unit and rate always come from the work type master, never the client.
  const { data: workType, error: typeError } = await supabase
    .from("work_types")
    .select("code, unit, rate, is_active")
    .eq("code", data.work_type)
    .maybeSingle();
  if (typeError) return { error: typeError.message };
  if (!workType || !workType.is_active) return { error: "Select a valid work type" };

  const rate = Number(workType.rate);

  const { error } = await supabase.from("work_quantity_logs").insert({
    project_id: data.project_id,
    work_date: data.work_date,
    work_type: workType.code,
    quantity,
    unit: workType.unit,
    rate,
    amount: computeWorkAmount(quantity, rate),
    notes: data.notes.trim() || null,
    created_by: user.id,
  });

  if (error) return { error: error.message };

  revalidatePath("/work-quantity");
  revalidatePath(`/projects/${data.project_id}`);
  return { success: true };
}

export async function deleteWorkQuantityLog(logId: string, projectId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("work_quantity_logs")
    .delete()
    .eq("id", logId);

  if (error) return { error: error.message };

  revalidatePath("/work-quantity");
  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}
