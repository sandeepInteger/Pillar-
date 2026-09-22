import { PageHeader } from "@/components/layout/PageHeader";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { getEmptyProjectForm } from "@/lib/utils/projects";
import { requireAdmin } from "@/lib/utils/authGuard";

export default async function NewProjectPage() {
  await requireAdmin();

  return (
    <div>
      <PageHeader
        title="Add Project"
        subtitle="Log a new construction site or contract"
      />
      <ProjectForm initialData={getEmptyProjectForm()} />
    </div>
  );
}
