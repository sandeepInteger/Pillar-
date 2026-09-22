import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmployeeForm } from "@/components/people/EmployeeForm";
import { getEmployee } from "@/lib/queries/employees";
import { employeeToFormData } from "@/lib/utils/employees";
import { requireAdmin } from "@/lib/utils/authGuard";

interface EditEmployeePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditEmployeePage({
  params,
}: EditEmployeePageProps) {
  await requireAdmin();
  const { id } = await params;
  const employee = await getEmployee(id);
  if (!employee) notFound();

  return (
    <div>
      <PageHeader
        title={`Edit ${employee.full_name}`}
        subtitle={employee.employee_code}
      />
      <EmployeeForm
        initialData={employeeToFormData(employee)}
        employeeId={id}
      />
    </div>
  );
}
