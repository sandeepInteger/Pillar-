import { PageHeader } from "@/components/layout/PageHeader";
import { EmployeeForm } from "@/components/people/EmployeeForm";
import { getEmptyFormData } from "@/lib/utils/employees";

export default function NewEmployeePage() {
  return (
    <div>
      <PageHeader
        title="Add Employee"
        subtitle="Create a new labour, foreman, engineer or staff record"
      />
      <EmployeeForm initialData={getEmptyFormData()} />
    </div>
  );
}
