import Link from "next/link";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { RaBillFilters } from "@/components/ra-bills/RaBillFilters";
import { RaBillTable } from "@/components/ra-bills/RaBillTable";
import { getRaBills, summarizeRaBills } from "@/lib/queries/raBills";
import { getProjects } from "@/lib/queries/projects";

interface RaBillsPageProps {
  searchParams: Promise<{
    project?: string;
    payment?: string;
  }>;
}

export default async function RaBillsPage({ searchParams }: RaBillsPageProps) {
  const params = await searchParams;
  const projectId = params.project;
  const payment = (params.payment ?? "all") as "all" | "pending" | "received";

  const [bills, projects] = await Promise.all([
    getRaBills({
      projectId: projectId && projectId !== "all" ? projectId : undefined,
      payment,
    }),
    getProjects(),
  ]);

  const summary = summarizeRaBills(bills);

  return (
    <div>
      <PageHeader
        title="RA Bills"
        subtitle="Project-wise billing — retention, TDS, and bank receipt"
      >
        <Suspense fallback={null}>
          <RaBillFilters projects={projects} />
        </Suspense>
        <Link href="/ra-bills/new" className="pillar-btn-primary">
          Add RA Bill
        </Link>
      </PageHeader>

      <RaBillTable bills={bills} summary={summary} />
    </div>
  );
}
