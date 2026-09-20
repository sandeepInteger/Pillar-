import { PageHeader } from "@/components/layout/PageHeader";
import { RaBillForm } from "@/components/ra-bills/RaBillForm";
import { getProjects } from "@/lib/queries/projects";
import { getEmptyRaBillForm } from "@/lib/utils/raBills";

interface NewRaBillPageProps {
  searchParams: Promise<{ project?: string }>;
}

export default async function NewRaBillPage({
  searchParams,
}: NewRaBillPageProps) {
  const params = await searchParams;
  const projects = await getProjects({ status: "active" });

  return (
    <div>
      <PageHeader
        title="Add RA Bill"
        subtitle="Record confirmed bill and track payment in bank"
      />
      <RaBillForm
        initialData={getEmptyRaBillForm(params.project ?? "")}
        projects={projects}
      />
    </div>
  );
}
