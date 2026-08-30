import { PageHeader } from "@/components/layout/PageHeader";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { getEmptyProjectForm } from "@/lib/utils/projects";

export default function NewProjectPage() {
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
