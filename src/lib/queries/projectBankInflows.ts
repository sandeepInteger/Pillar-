import { createClient } from "@/lib/supabase/server";
import type { ProjectBankInflow } from "@/types/database";
import { sumInflowAmounts } from "@/lib/utils/projectBankInflows";

export async function getProjectBankInflows(
  projectId: string
): Promise<ProjectBankInflow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_bank_inflows")
    .select("*")
    .eq("project_id", projectId)
    .order("received_date", { ascending: false });

  if (error) {
    console.error("getProjectBankInflows:", error.message);
    return [];
  }
  return (data ?? []) as ProjectBankInflow[];
}

/** Total bank inflow per project (all time). */
export async function getProjectBankInflowTotalsByProject(): Promise<
  Record<string, number>
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_bank_inflows")
    .select("project_id, amount");

  if (error) {
    console.error("getProjectBankInflowTotalsByProject:", error.message);
    return {};
  }

  const totals: Record<string, number> = {};
  for (const row of data ?? []) {
    const id = row.project_id as string;
    totals[id] = (totals[id] ?? 0) + Number(row.amount);
  }

  for (const id of Object.keys(totals)) {
    totals[id] = Math.round(totals[id] * 100) / 100;
  }
  return totals;
}

export function summarizeProjectInflows(inflows: ProjectBankInflow[]) {
  const total = sumInflowAmounts(inflows);
  const now = new Date();
  const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const thisMonth = sumInflowAmounts(
    inflows.filter((r) => r.received_date.startsWith(monthPrefix))
  );
  return { total, thisMonth, entryCount: inflows.length };
}
