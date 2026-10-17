import { Suspense } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { WorkQuantityFilters } from "@/components/work-quantity/WorkQuantityFilters";
import { WorkQuantityTable } from "@/components/work-quantity/WorkQuantityTable";
import { WorkTypesManager } from "@/components/work-quantity/WorkTypesManager";
import { getWorkQuantityLogs, getWorkTypes } from "@/lib/queries/workQuantity";
import { getProjects } from "@/lib/queries/projects";
import { getProfile } from "@/lib/queries/employees";
import { summarizeWorkQuantity } from "@/lib/utils/workQuantity";
import { getCurrentMonth, getMonthDateRange } from "@/lib/utils/salary";

interface WorkQuantityPageProps {
  searchParams: Promise<{
    project?: string;
    type?: string;
    month?: string;
  }>;
}

export default async function WorkQuantityPage({
  searchParams,
}: WorkQuantityPageProps) {
  const params = await searchParams;
  const projectId = params.project && params.project !== "all" ? params.project : undefined;
  const workType = params.type;
  const month = /^\d{4}-\d{2}$/.test(params.month ?? "") ? params.month! : getCurrentMonth();
  const { start, end } = getMonthDateRange(month);

  const [logs, projects, workTypes, profile] = await Promise.all([
    getWorkQuantityLogs({ projectId, workType, from: start, to: end }),
    getProjects(),
    getWorkTypes(),
    getProfile(),
  ]);

  const isAdmin = profile?.role === "admin";
  const summary = summarizeWorkQuantity(logs, workTypes);

  return (
    <div>
      <PageHeader
        title="Work Quantity"
        subtitle="Daily work performed, logged per project at fixed work-type rates"
      >
        <Suspense fallback={null}>
          <WorkQuantityFilters projects={projects} workTypes={workTypes} />
        </Suspense>
      </PageHeader>

      <div className="space-y-6">
        <WorkTypesManager workTypes={workTypes} isAdmin={isAdmin} />

        <WorkQuantityTable
          logs={logs}
          summary={summary}
          projects={projects}
          workTypes={workTypes}
          month={month}
          isAdmin={isAdmin}
        />
      </div>
    </div>
  );
}
