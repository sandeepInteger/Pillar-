import { createClient } from "@/lib/supabase/server";
import type { Employee, EmployeeWithRelations, Profile } from "@/types/database";
import { sortEmployeesByHierarchy } from "@/lib/utils/employees";

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return data;
}

export async function getEmployees(filters?: {
  type?: string;
  status?: string;
  search?: string;
}): Promise<EmployeeWithRelations[]> {
  const supabase = await createClient();

  let query = supabase
    .from("employees")
    .select(
      `
      *,
      employee_phones (*),
      employee_payment_methods (*)
    `
    )
    .order("created_at", { ascending: false });

  if (filters?.type && filters.type !== "all") {
    query = query.eq("employee_type", filters.type);
  }
  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }
  if (filters?.search) {
    query = query.or(
      `full_name.ilike.%${filters.search}%,employee_code.ilike.%${filters.search}%`
    );
  }

  const { data, error } = await query;
  if (error) {
    console.error("getEmployees error:", error.message);
    return [];
  }

  return sortEmployeesByHierarchy((data ?? []) as EmployeeWithRelations[]);
}

export async function getEmployee(
  id: string
): Promise<EmployeeWithRelations | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("employees")
    .select(
      `
      *,
      employee_phones (*),
      employee_payment_methods (*)
    `
    )
    .eq("id", id)
    .single();

  if (error) return null;
  return data as EmployeeWithRelations;
}

/** Active employees for payroll — includes founders (no attendance required). */
export async function getActiveEmployeesForSalary(filters?: {
  type?: string;
  projectId?: string;
}): Promise<Employee[]> {
  const supabase = await createClient();

  async function fetchActiveFounders(): Promise<Employee[]> {
    if (filters?.type && filters.type !== "all" && filters.type !== "founder") {
      return [];
    }
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .eq("status", "active")
      .eq("employee_type", "founder")
      .order("full_name", { ascending: true });
    if (error) {
      console.error("fetchActiveFounders:", error.message);
      return [];
    }
    return data ?? [];
  }

  if (filters?.projectId) {
    const { getProjectAssignedEmployees } = await import("@/lib/queries/projects");
    let employees = await getProjectAssignedEmployees(filters.projectId);
    if (filters?.type && filters.type !== "all") {
      employees = employees.filter((e) => e.employee_type === filters.type);
    }
    const founders = await fetchActiveFounders();
    const byId = new Map<string, Employee>();
    for (const employee of [...employees, ...founders]) {
      byId.set(employee.id, employee);
    }
    return sortEmployeesByHierarchy(Array.from(byId.values()));
  }

  let query = supabase
    .from("employees")
    .select("*")
    .eq("status", "active")
    .order("full_name", { ascending: true });

  if (filters?.type && filters.type !== "all") {
    query = query.eq("employee_type", filters.type);
  }

  const { data, error } = await query;
  if (error) {
    console.error("getActiveEmployeesForSalary:", error.message);
    return [];
  }

  return sortEmployeesByHierarchy(data ?? []);
}

export async function getDashboardStats() {
  const supabase = await createClient();

  const { data: employees } = await supabase
    .from("employees")
    .select("id, employee_type, status");

  const all = employees ?? [];
  const active = all.filter((e) => e.status === "active");

  const countByType = (type: string) =>
    active.filter((e) => e.employee_type === type).length;

  const { data: missingPayment } = await supabase
    .from("employees")
    .select(
      `
      id,
      employee_payment_methods (id)
    `
    )
    .eq("status", "active");

  const noPayment = (missingPayment ?? []).filter(
    (e) =>
      !e.employee_payment_methods || e.employee_payment_methods.length === 0
  ).length;

  return {
    total: active.length,
    labour: countByType("labour"),
    carpenter: countByType("carpenter"),
    mason: countByType("mason"),
    foreman: countByType("foreman"),
    engineer: countByType("engineer"),
    staff: countByType("staff"),
    founder: countByType("founder"),
    missingPayment: noPayment,
  };
}
