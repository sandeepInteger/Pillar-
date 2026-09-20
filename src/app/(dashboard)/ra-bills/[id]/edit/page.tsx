import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { RaBillForm } from "@/components/ra-bills/RaBillForm";
import { getRaBill } from "@/lib/queries/raBills";
import { getProjects } from "@/lib/queries/projects";
import { raBillToFormData } from "@/lib/utils/raBills";

interface EditRaBillPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditRaBillPage({ params }: EditRaBillPageProps) {
  const { id } = await params;
  const [bill, projects] = await Promise.all([
    getRaBill(id),
    getProjects(),
  ]);

  if (!bill) notFound();

  return (
    <div>
      <PageHeader
        title={bill.bill_label}
        subtitle={[
          bill.contractor_name,
          `${bill.projects.name} · ${bill.projects.project_code}`,
        ]
          .filter(Boolean)
          .join(" · ")}
      />
      <RaBillForm
        billId={id}
        initialData={raBillToFormData(bill)}
        projects={projects}
      />
    </div>
  );
}
