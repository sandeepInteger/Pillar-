import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { getProject } from "@/lib/queries/projects";
import { projectToFormData } from "@/lib/utils/projects";

interface EditProjectPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProjectPage({ params }: EditProjectPageProps) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  return (
    <div>
      <PageHeader title={`Edit ${project.name}`} subtitle={project.project_code} />
      <ProjectForm initialData={projectToFormData(project)} projectId={id} />
    </div>
  );
}
