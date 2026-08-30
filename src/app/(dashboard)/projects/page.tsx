import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { getProjects } from "@/lib/queries/projects";
import { createClient } from "@/lib/supabase/server";

export default async function ProjectsPage() {
  const projects = await getProjects();
  const supabase = await createClient();

  const { data: assignmentCounts } = await supabase
    .from("project_assignments")
    .select("project_id")
    .eq("is_active", true);

  const countByProject = (assignmentCounts ?? []).reduce<Record<string, number>>(
    (acc, row) => {
      acc[row.project_id] = (acc[row.project_id] ?? 0) + 1;
      return acc;
    },
    {}
  );

  return (
    <div>
      <PageHeader
        title="Projects"
        subtitle={`${projects.length} project${projects.length !== 1 ? "s" : ""}`}
      >
        <Link
          href="/projects/new"
          className="pillar-btn-primary w-full justify-center sm:w-auto"
        >
          Add Project
        </Link>
      </PageHeader>

      {projects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] bg-white p-12 text-center">
          <p className="text-lg font-medium text-gray-600">No projects yet</p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Create a site, then assign labour, foreman, and engineers.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              teamCount={countByProject[project.id] ?? 0}
            />
          ))}
        </div>
      )}
    </div>
  );
}
