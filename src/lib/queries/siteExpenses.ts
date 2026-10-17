import { createClient } from "@/lib/supabase/server";
import type { ExpenseCategory, SiteExpenseWithProject } from "@/types/database";

/** All categories (active first, then by name). Inactive ones still label old expenses. */
export async function getExpenseCategories(): Promise<ExpenseCategory[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("expense_categories")
    .select("*")
    .order("is_active", { ascending: false })
    .order("name", { ascending: true });

  if (error) {
    console.error("getExpenseCategories:", error.message);
    return [];
  }

  return (data ?? []) as ExpenseCategory[];
}

export async function getSiteExpenses(filters?: {
  projectId?: string;
  category?: string;
  from?: string;
  to?: string;
}): Promise<SiteExpenseWithProject[]> {
  const supabase = await createClient();

  let query = supabase
    .from("site_expenses")
    .select(
      `
      *,
      projects (id, name, project_code)
    `
    )
    .order("expense_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (filters?.projectId) {
    query = query.eq("project_id", filters.projectId);
  }
  if (filters?.category && filters.category !== "all") {
    query = query.eq("category", filters.category);
  }
  if (filters?.from) {
    query = query.gte("expense_date", filters.from);
  }
  if (filters?.to) {
    query = query.lte("expense_date", filters.to);
  }

  const { data, error } = await query;
  if (error) {
    console.error("getSiteExpenses:", error.message);
    return [];
  }

  return (data ?? []) as SiteExpenseWithProject[];
}
