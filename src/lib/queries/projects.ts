import { createClient } from "@/lib/supabase/server";
import type {
  Employee,
  Project,
  ProjectWithTeam,
} from "@/types/database";
import { compareEmployeesByHierarchy } from "@/lib/utils/employees";

export async function getProjects(filters?: {
  status?: string;
  search?: string;
}): Promise<Project[]> {
  const supabase = await createClient();

  let query = supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }
  if (filters?.search) {
    query = query.or(
      `name.ilike.%${filters.search}%,project_code.ilike.%${filters.search}%,client_name.ilike.%${filters.search}%`
    );
  }

  const { data, error } = await query;
  if (error) {
    console.error("getProjects:", error.message);
    return [];
  }
  return data ?? [];
}

export async function getActiveProjects(): Promise<Project[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("*")
    .eq("status", "active")
    .order("name");
  return data ?? [];
}

export async function getProject(id: string): Promise<ProjectWithTeam | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("projects")
    .select(
      `
      *,
      project_assignments (
        *,
        employees (*)
      )
    `
    )
    .eq("id", id)
    .single();

  if (error) return null;

  const project = data as ProjectWithTeam;
  project.project_assignments = (project.project_assignments ?? [])
    .filter((a) => a.is_active)
    .sort((a, b) =>
      compareEmployeesByHierarchy(a.employees, b.employees)
    );
  return project;
}

export async function getProjectAssignedEmployees(
  projectId: string
): Promise<Employee[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("project_assignments")
    .select("employees (*)")
    .eq("project_id", projectId)
    .eq("is_active", true);

  const employees =
    data
      ?.map((row) => row.employees as unknown as Employee)
      .filter(Boolean) ?? [];

  return [...employees].sort(compareEmployeesByHierarchy);
}

export async function getEmployeeActiveProject(
  employeeId: string
): Promise<Project | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("project_assignments")
    .select("projects (*)")
    .eq("employee_id", employeeId)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  return (data?.projects as unknown as Project) ?? null;
}

export async function getProjectStats() {
  const supabase = await createClient();
  const { data } = await supabase.from("projects").select("id, status");
  const all = data ?? [];
  return {
    total: all.length,
    active: all.filter((p) => p.status === "active").length,
    onHold: all.filter((p) => p.status === "on_hold").length,
    completed: all.filter((p) => p.status === "completed").length,
  };
}
