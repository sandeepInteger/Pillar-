"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ProjectFormData } from "@/types/database";
import { MULTI_PROJECT_TYPES } from "@/types/database";

function emptyToNull(value: string): string | null {
  return value.trim() === "" ? null : value.trim();
}

function buildProjectPayload(data: ProjectFormData) {
  return {
    name: data.name.trim(),
    client_name: emptyToNull(data.client_name),
    location: emptyToNull(data.location),
    status: data.status,
    start_date: emptyToNull(data.start_date),
    end_date: emptyToNull(data.end_date),
    description: emptyToNull(data.description),
  };
}

export async function createProject(data: ProjectFormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: project, error } = await supabase
    .from("projects")
    .insert({ ...buildProjectPayload(data), created_by: user.id })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/projects");
  redirect(`/projects/${project.id}`);
}

export async function updateProject(id: string, data: ProjectFormData) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("projects")
    .update(buildProjectPayload(data))
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
  redirect(`/projects/${id}`);
}

export async function assignEmployeeToProject(
  projectId: string,
  employeeId: string
) {
  const supabase = await createClient();

  const { data: employee } = await supabase
    .from("employees")
    .select("id, employee_type, full_name")
    .eq("id", employeeId)
    .single();

  if (!employee) return { error: "Employee not found" };

  const { data: alreadyHere } = await supabase
    .from("project_assignments")
    .select("id")
    .eq("project_id", projectId)
    .eq("employee_id", employeeId)
    .eq("is_active", true)
    .maybeSingle();

  if (alreadyHere) return { success: true };

  const canMultiProject = MULTI_PROJECT_TYPES.includes(employee.employee_type);

  if (!canMultiProject) {
    const { data: existing } = await supabase
      .from("project_assignments")
      .select("id, project_id, projects(name)")
      .eq("employee_id", employeeId)
      .eq("is_active", true);

    const onOtherProject = existing?.find((a) => a.project_id !== projectId);
    if (onOtherProject) {
      const projectName =
        (onOtherProject.projects as { name?: string } | null)?.name ??
        "another project";
      return {
        error: `${employee.full_name} is already on ${projectName}. Use Transfer to move labour/foreman.`,
      };
    }
  }

  const { error } = await supabase.from("project_assignments").insert({
    project_id: projectId,
    employee_id: employeeId,
    is_active: true,
    started_at: new Date().toISOString().slice(0, 10),
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "Employee is already assigned to this project" };
    }
    return { error: error.message };
  }

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/attendance");
  return { success: true };
}

export async function removeEmployeeFromProject(
  projectId: string,
  employeeId: string
) {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const { error } = await supabase
    .from("project_assignments")
    .update({ is_active: false, ended_at: today })
    .eq("project_id", projectId)
    .eq("employee_id", employeeId)
    .eq("is_active", true);

  if (error) return { error: error.message };

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/attendance");
  return { success: true };
}

/** Move labour/foreman from one project to another */
export async function transferEmployeeToProject(
  employeeId: string,
  fromProjectId: string,
  toProjectId: string
) {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  await supabase
    .from("project_assignments")
    .update({ is_active: false, ended_at: today })
    .eq("project_id", fromProjectId)
    .eq("employee_id", employeeId)
    .eq("is_active", true);

  const { error } = await supabase.from("project_assignments").insert({
    project_id: toProjectId,
    employee_id: employeeId,
    is_active: true,
    started_at: today,
    notes: `Transferred from project`,
  });

  if (error) return { error: error.message };

  revalidatePath(`/projects/${fromProjectId}`);
  revalidatePath(`/projects/${toProjectId}`);
  revalidatePath("/attendance");
  return { success: true };
}
