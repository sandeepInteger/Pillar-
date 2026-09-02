import { Suspense } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { SalaryTable } from "@/components/salary/SalaryTable";
import { SalaryFilters } from "@/components/salary/SalaryFilters";
import { SalaryDownloadButton } from "@/components/salary/SalaryDownloadButton";
import { getMonthlySalary } from "@/lib/queries/salary";
import { getActiveProjects } from "@/lib/queries/projects";
import { getCurrentMonth } from "@/lib/utils/salary";

interface SalaryPageProps {
  searchParams: Promise<{
    month?: string;
    type?: string;
    project?: string;
  }>;
}

export default async function SalaryPage({ searchParams }: SalaryPageProps) {
  const params = await searchParams;
  const month = params.month ?? getCurrentMonth();
  const employeeType = params.type ?? "all";
  const projectId = params.project;

  const [summary, projects] = await Promise.all([
    getMonthlySalary({
      month,
      type: employeeType,
      projectId,
    }),
    getActiveProjects(),
  ]);

  const selectedProject = projects.find((p) => p.id === projectId);

  return (
    <div>
      <PageHeader
        title="Salary"
        subtitle={
          selectedProject
            ? `${selectedProject.name} · monthly wages & payouts`
            : "Monthly gross pay, advances, and balance due"
        }
      >
        <Suspense fallback={null}>
          <SalaryFilters projects={projects} />
        </Suspense>
        <Suspense fallback={null}>
          <SalaryDownloadButton />
        </Suspense>
      </PageHeader>

      <SalaryTable
        summary={summary}
        month={month}
        employeeType={employeeType}
        projectId={projectId}
      />
    </div>
  );
}
