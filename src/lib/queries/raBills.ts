import { createClient } from "@/lib/supabase/server";
import type { RaBillSummary, RaBillWithProject } from "@/types/database";

export async function getRaBills(filters?: {
  projectId?: string;
  payment?: "all" | "pending" | "received";
}): Promise<RaBillWithProject[]> {
  const supabase = await createClient();

  let query = supabase
    .from("ra_bills")
    .select(
      `
      *,
      projects (id, name, project_code, client_name)
    `
    )
    .order("confirmed_date", { ascending: false });

  if (filters?.projectId) {
    query = query.eq("project_id", filters.projectId);
  }

  const { data, error } = await query;
  if (error) {
    console.error("getRaBills:", error.message);
    return [];
  }

  let bills = (data ?? []) as RaBillWithProject[];

  if (filters?.payment === "pending") {
    bills = bills.filter((b) => !b.bank_received_date);
  } else if (filters?.payment === "received") {
    bills = bills.filter((b) => !!b.bank_received_date);
  }

  return bills;
}

export async function getRaBill(id: string): Promise<RaBillWithProject | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("ra_bills")
    .select(
      `
      *,
      projects (id, name, project_code, client_name)
    `
    )
    .eq("id", id)
    .single();

  if (error) return null;
  return data as RaBillWithProject;
}

export function summarizeRaBills(bills: RaBillWithProject[]): RaBillSummary {
  let pendingCount = 0;
  let totalGross = 0;
  let totalRetention = 0;
  let totalTds = 0;
  let totalNet = 0;
  let pendingNet = 0;
  let receivedNet = 0;

  for (const bill of bills) {
    totalGross += Number(bill.gross_amount);
    totalRetention += Number(bill.retention_amount);
    totalTds += Number(bill.tds_amount);
    totalNet += Number(bill.net_amount);

    if (bill.bank_received_date) {
      receivedNet += Number(bill.bank_received_amount ?? bill.net_amount);
    } else {
      pendingCount++;
      pendingNet += Number(bill.net_amount);
    }
  }

  return {
    billCount: bills.length,
    pendingCount,
    totalGross: round(totalGross),
    totalRetention: round(totalRetention),
    totalTds: round(totalTds),
    totalNet: round(totalNet),
    pendingNet: round(pendingNet),
    receivedNet: round(receivedNet),
  };
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
