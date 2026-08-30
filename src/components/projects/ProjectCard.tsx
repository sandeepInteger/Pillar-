import Link from "next/link";
import { MapPin, Users } from "lucide-react";
import type { Project } from "@/types/database";
import {
  PROJECT_STATUS_COLORS,
  PROJECT_STATUS_LABELS,
} from "@/types/database";
import { formatProjectDate } from "@/lib/utils/projects";

export function ProjectCard({
  project,
  teamCount,
}: {
  project: Project;
  teamCount?: number;
}) {
  return (
    <div className="pillar-card p-5 transition hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold">{project.name}</h3>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${PROJECT_STATUS_COLORS[project.status]}`}
            >
              {PROJECT_STATUS_LABELS[project.status]}
            </span>
          </div>
          <p className="mt-1 text-sm text-[var(--muted)]">{project.project_code}</p>
          {project.client_name && (
            <p className="mt-2 text-sm">Client: {project.client_name}</p>
          )}
          <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-600">
            {project.location && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {project.location}
              </span>
            )}
            {teamCount !== undefined && (
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                {teamCount} on site
              </span>
            )}
          </div>
          <p className="mt-2 text-xs text-[var(--muted)]">
            Started {formatProjectDate(project.start_date)}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Link
            href={`/projects/${project.id}`}
            className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm font-medium hover:bg-gray-50"
          >
            View
          </Link>
          <Link
            href={`/projects/${project.id}/edit`}
            className="rounded-lg bg-[var(--primary-light)] px-3 py-1.5 text-sm font-medium text-[var(--primary)] hover:bg-violet-100"
          >
            Edit
          </Link>
        </div>
      </div>
    </div>
  );
}
