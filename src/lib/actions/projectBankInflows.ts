"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { parseIndianAmount } from "@/lib/utils/raBills";
import { roundToTwoDecimals } from "@/lib/utils/employees";

export async function addProjectBankInflow(
  projectId: string,
  data: { received_date: string; amount: string; reference_note: string }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  if (!data.received_date) return { error: "Date is required" };
  const amount = roundToTwoDecimals(parseIndianAmount(data.amount));
  if (amount <= 0) return { error: "Amount must be greater than zero" };

  const { error } = await supabase.from("project_bank_inflows").insert({
    project_id: projectId,
    received_date: data.received_date,
    amount,
    reference_note: data.reference_note.trim() || null,
    created_by: user.id,
  });

  if (error) return { error: error.message };

  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

export async function deleteProjectBankInflow(
  inflowId: string,
  projectId: string
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("project_bank_inflows")
    .delete()
    .eq("id", inflowId);

  if (error) return { error: error.message };

  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}
