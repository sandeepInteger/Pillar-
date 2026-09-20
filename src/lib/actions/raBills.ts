"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { RaBillFormData } from "@/types/database";
import { parseRaBillAmounts } from "@/lib/utils/raBills";

function emptyToNull(value: string): string | null {
  return value.trim() === "" ? null : value.trim();
}

function buildPayload(data: RaBillFormData, userId: string) {
  const amounts = parseRaBillAmounts(data);

  if (amounts.gross_amount <= 0) {
    return { error: "Bill amount must be greater than zero" as const };
  }
  if (amounts.retention_amount + amounts.tds_amount > amounts.gross_amount) {
    return {
      error: "Retention + TDS cannot be more than bill amount" as const,
    };
  }

  const bank_received_date = emptyToNull(data.bank_received_date);

  return {
    payload: {
      project_id: data.project_id,
      bill_label: data.bill_label.trim(),
      contractor_name: emptyToNull(data.contractor_name),
      confirmed_date: data.confirmed_date,
      work_period_start: data.work_period_start,
      work_period_end: data.work_period_end,
      gross_amount: amounts.gross_amount,
      gst_applicable: amounts.gst_applicable,
      igst_amount: amounts.igst_amount,
      retention_amount: amounts.retention_amount,
      tds_amount: amounts.tds_amount,
      net_amount: amounts.net_amount,
      bank_received_date,
      bank_received_amount: bank_received_date
        ? (amounts.bank_received_amount ?? amounts.net_amount)
        : null,
      notes: emptyToNull(data.notes),
      created_by: userId,
    },
  };
}

export async function createRaBill(data: RaBillFormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  if (!data.project_id) return { error: "Select a project" };
  if (!data.bill_label.trim()) return { error: "RA Bill name / number is required" };
  if (!data.confirmed_date) return { error: "Confirmed date is required" };
  if (!data.work_period_start || !data.work_period_end) {
    return { error: "Work period (from and to) is required" };
  }
  if (data.work_period_start > data.work_period_end) {
    return { error: "Work period start must be on or before end date" };
  }

  const built = buildPayload(data, user.id);
  if ("error" in built) return { error: built.error };

  const { data: row, error } = await supabase
    .from("ra_bills")
    .insert(built.payload)
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/ra-bills");
  revalidatePath(`/projects/${data.project_id}`);
  redirect(`/ra-bills/${row.id}/edit`);
}

export async function updateRaBill(id: string, data: RaBillFormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  if (!data.work_period_start || !data.work_period_end) {
    return { error: "Work period (from and to) is required" };
  }
  if (data.work_period_start > data.work_period_end) {
    return { error: "Work period start must be on or before end date" };
  }

  const built = buildPayload(data, user.id);
  if ("error" in built) return { error: built.error };

  const { error } = await supabase
    .from("ra_bills")
    .update({
      project_id: built.payload.project_id,
      bill_label: built.payload.bill_label,
      contractor_name: built.payload.contractor_name,
      confirmed_date: built.payload.confirmed_date,
      work_period_start: built.payload.work_period_start,
      work_period_end: built.payload.work_period_end,
      gross_amount: built.payload.gross_amount,
      gst_applicable: built.payload.gst_applicable,
      igst_amount: built.payload.igst_amount,
      retention_amount: built.payload.retention_amount,
      tds_amount: built.payload.tds_amount,
      net_amount: built.payload.net_amount,
      bank_received_date: built.payload.bank_received_date,
      bank_received_amount: built.payload.bank_received_amount,
      notes: built.payload.notes,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/ra-bills");
  revalidatePath(`/ra-bills/${id}/edit`);
  revalidatePath(`/projects/${data.project_id}`);
  return { success: true };
}

export async function deleteRaBill(id: string, projectId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("ra_bills").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/ra-bills");
  revalidatePath(`/projects/${projectId}`);
  redirect("/ra-bills");
}
