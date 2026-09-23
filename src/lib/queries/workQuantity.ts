import { createClient } from "@/lib/supabase/server";
import type { WorkQuantityLog, WorkQuantityLogWithProject } from "@/types/database";

export async function getWorkQuantityLogs(filters?: {
  projectId?: string;
  workType?: string;
  from?: string;
  to?: string;
}): Promise<WorkQuantityLogWithProject[]> {
  const supabase = await createClient();

  let query = supabase
    .from("work_quantity_logs")
    .select(
      `
      *,
      projects (id, name, project_code)
    `
    )
    .order("work_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (filters?.projectId) {
    query = query.eq("project_id", filters.projectId);
  }
  if (filters?.workType && filters.workType !== "all") {
    query = query.eq("work_type", filters.workType);
  }
  if (filters?.from) {
    query = query.gte("work_date", filters.from);
  }
  if (filters?.to) {
    query = query.lte("work_date", filters.to);
  }

  const { data, error } = await query;
  if (error) {
    console.error("getWorkQuantityLogs:", error.message);
    return [];
  }

  return (data ?? []) as WorkQuantityLogWithProject[];
}

export async function getProjectWorkQuantityLogs(
  projectId: string
): Promise<WorkQuantityLog[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("work_quantity_logs")
    .select("*")
    .eq("project_id", projectId)
    .order("work_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getProjectWorkQuantityLogs:", error.message);
    return [];
  }

  return (data ?? []) as WorkQuantityLog[];
}
