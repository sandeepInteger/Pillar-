import { Suspense } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { WorkQuantityFilters } from "@/components/work-quantity/WorkQuantityFilters";
import { WorkQuantityTable } from "@/components/work-quantity/WorkQuantityTable";
import { getWorkQuantityLogs } from "@/lib/queries/workQuantity";
import { getProjects } from "@/lib/queries/projects";
import { getProfile } from "@/lib/queries/employees";
import { summarizeWorkQuantity } from "@/lib/utils/workQuantity";

interface WorkQuantityPageProps {
  searchParams: Promise<{
    project?: string;
    type?: string;
  }>;
}

export default async function WorkQuantityPage({
  searchParams,
}: WorkQuantityPageProps) {
  const params = await searchParams;
  const projectId = params.project && params.project !== "all" ? params.project : undefined;
  const workType = params.type;

  const [logs, projects, profile] = await Promise.all([
    getWorkQuantityLogs({ projectId, workType }),
    getProjects(),
    getProfile(),
  ]);

  const summary = summarizeWorkQuantity(logs);

  return (
    <div>
      <PageHeader
        title="Work Quantity"
        subtitle="Daily work performed, logged per project"
      >
        <Suspense fallback={null}>
          <WorkQuantityFilters projects={projects} />
        </Suspense>
      </PageHeader>

      <WorkQuantityTable
        logs={logs}
        summary={summary}
        projects={projects}
        isAdmin={profile?.role === "admin"}
      />
    </div>
  );
}
