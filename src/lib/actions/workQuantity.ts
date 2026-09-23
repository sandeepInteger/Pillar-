"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { WorkQuantityUnit, WorkType } from "@/types/database";

export async function addWorkQuantityLog(data: {
  project_id: string;
  work_date: string;
  work_type: WorkType;
  quantity: string;
  unit: WorkQuantityUnit;
  notes: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  if (!data.project_id) return { error: "Select a project" };
  if (!data.work_date) return { error: "Date is required" };
  const quantity = Number.parseFloat(data.quantity);
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return { error: "Quantity must be greater than zero" };
  }

  const { error } = await supabase.from("work_quantity_logs").insert({
    project_id: data.project_id,
    work_date: data.work_date,
    work_type: data.work_type,
    quantity,
    unit: data.unit,
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
