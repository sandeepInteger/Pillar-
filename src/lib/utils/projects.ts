import type { ProjectFormData, ProjectWithTeam } from "@/types/database";

export function getEmptyProjectForm(): ProjectFormData {
  return {
    name: "",
    client_name: "",
    location: "",
    status: "active",
    start_date: "",
    end_date: "",
    description: "",
  };
}

export function projectToFormData(project: ProjectWithTeam): ProjectFormData {
  return {
    name: project.name,
    client_name: project.client_name ?? "",
    location: project.location ?? "",
    status: project.status,
    start_date: project.start_date ?? "",
    end_date: project.end_date ?? "",
    description: project.description ?? "",
  };
}

export function formatProjectDate(date: string | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
