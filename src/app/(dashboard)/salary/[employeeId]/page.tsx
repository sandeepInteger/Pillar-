import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmployeeSalaryLedger } from "@/components/salary/EmployeeSalaryLedger";
import { EmployeeSalaryDownload } from "@/components/salary/EmployeeSalaryDownload";
import { getEmployeeSalaryDetail } from "@/lib/queries/salary";
import { getCurrentMonth, formatMonthLabel } from "@/lib/utils/salary";
import { EMPLOYEE_TYPE_LABELS } from "@/types/database";

interface EmployeeSalaryPageProps {
  params: Promise<{ employeeId: string }>;
  searchParams: Promise<{
    month?: string;
    type?: string;
    project?: string;
  }>;
}

export default async function EmployeeSalaryPage({
  params,
  searchParams,
}: EmployeeSalaryPageProps) {
  const { employeeId } = await params;
  const query = await searchParams;
  const month = query.month ?? getCurrentMonth();
  const projectId = query.project;

  const detail = await getEmployeeSalaryDetail(employeeId, month, projectId);
  if (!detail) notFound();

  const backParams = new URLSearchParams();
  backParams.set("month", month);
  if (query.type && query.type !== "all") backParams.set("type", query.type);
  if (projectId) backParams.set("project", projectId);

  return (
    <div>
      <Link
        href={`/salary?${backParams.toString()}`}
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-[var(--primary)] hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to salary list
      </Link>

      <PageHeader
        title={detail.employee.full_name}
        subtitle={`${detail.employee.employee_code} · ${EMPLOYEE_TYPE_LABELS[detail.employee.employee_type]} · ${formatMonthLabel(month)}`}
      >
        <Suspense fallback={null}>
          <EmployeeSalaryDownload
            employeeId={employeeId}
            employeeName={detail.employee.full_name}
          />
        </Suspense>
      </PageHeader>

      <EmployeeSalaryLedger
        detail={detail}
        employeeType={query.type}
        projectId={projectId}
      />
    </div>
  );
}
