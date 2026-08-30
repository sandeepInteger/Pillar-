import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { ProjectTeamPanel } from "@/components/projects/ProjectTeamPanel";
import { getProject, getProjects } from "@/lib/queries/projects";
import { getEmployees } from "@/lib/queries/employees";
import {
  PROJECT_STATUS_COLORS,
  PROJECT_STATUS_LABELS,
} from "@/types/database";
import { formatProjectDate } from "@/lib/utils/projects";
import { MapPin, Calendar, Pencil } from "lucide-react";

interface ProjectDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectDetailPage({
  params,
}: ProjectDetailPageProps) {
  const { id } = await params;
  const [project, allEmployees, allProjects] = await Promise.all([
    getProject(id),
    getEmployees({ status: "active" }),
    getProjects({ status: "active" }),
  ]);

  if (!project) notFound();

  const assignedIds = new Set(
    project.project_assignments.map((a) => a.employee_id)
  );
  const availableEmployees = allEmployees.filter(
    (e) => !assignedIds.has(e.id)
  );

  return (
    <div>
      <PageHeader title={project.name} subtitle={project.project_code}>
        <Link
          href={`/attendance?project=${id}`}
          className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium hover:bg-gray-50"
        >
          Mark attendance
        </Link>
        <Link
          href={`/projects/${id}/edit`}
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary-light)] px-4 py-2 text-sm font-medium text-[var(--primary)]"
        >
          <Pencil className="h-4 w-4" />
          Edit
        </Link>
      </PageHeader>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-[var(--border)] bg-white p-4">
          <p className="text-xs text-[var(--muted)]">Status</p>
          <span
            className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-sm font-medium ${PROJECT_STATUS_COLORS[project.status]}`}
          >
            {PROJECT_STATUS_LABELS[project.status]}
          </span>
        </div>
        {project.client_name && (
          <div className="rounded-xl border border-[var(--border)] bg-white p-4">
            <p className="text-xs text-[var(--muted)]">Client</p>
            <p className="mt-1 font-medium">{project.client_name}</p>
          </div>
        )}
        {project.location && (
          <div className="rounded-xl border border-[var(--border)] bg-white p-4">
            <p className="text-xs text-[var(--muted)]">Location</p>
            <p className="mt-1 inline-flex items-center gap-1 font-medium">
              <MapPin className="h-3.5 w-3.5" />
              {project.location}
            </p>
          </div>
        )}
        <div className="rounded-xl border border-[var(--border)] bg-white p-4">
          <p className="text-xs text-[var(--muted)]">Timeline</p>
          <p className="mt-1 inline-flex items-center gap-1 text-sm font-medium">
            <Calendar className="h-3.5 w-3.5" />
            {formatProjectDate(project.start_date)} –{" "}
            {formatProjectDate(project.end_date)}
          </p>
        </div>
      </div>

      {project.description && (
        <p className="mb-8 text-sm text-[var(--muted)]">{project.description}</p>
      )}

      <ProjectTeamPanel
        projectId={id}
        assignments={project.project_assignments}
        availableEmployees={availableEmployees}
        otherProjects={allProjects.filter((p) => p.id !== id)}
      />
    </div>
  );
}
