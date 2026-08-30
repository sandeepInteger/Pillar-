import { Suspense } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { AttendanceGrid } from "@/components/attendance/AttendanceGrid";
import { AttendanceFilters } from "@/components/attendance/AttendanceFilters";
import {
  getActiveEmployeesForAttendance,
  getWeekAttendance,
} from "@/lib/queries/attendance";
import { getActiveProjects } from "@/lib/queries/projects";
import { getCurrentWeekStart } from "@/lib/utils/attendance";

interface AttendancePageProps {
  searchParams: Promise<{
    week?: string;
    type?: string;
    project?: string;
  }>;
}

export default async function AttendancePage({
  searchParams,
}: AttendancePageProps) {
  const params = await searchParams;
  const weekStart = params.week ?? getCurrentWeekStart();
  const employeeType = params.type ?? "all";
  const projectId = params.project;

  const [employees, records, projects] = await Promise.all([
    getActiveEmployeesForAttendance({
      type: employeeType,
      projectId,
    }),
    getWeekAttendance(weekStart, projectId),
    getActiveProjects(),
  ]);

  const selectedProject = projects.find((p) => p.id === projectId);

  return (
    <div>
      <PageHeader
        title="Attendance"
        subtitle={
          selectedProject
            ? `${selectedProject.name} · team on this site`
            : "All projects · mark half, full, or double shift"
        }
      >
        <Suspense fallback={null}>
          <AttendanceFilters projects={projects} />
        </Suspense>
      </PageHeader>

      {!projectId && (
        <p className="mb-4 rounded-xl border border-[var(--primary-light)] bg-[var(--primary-light)]/50 px-4 py-3 text-sm text-[var(--primary)]">
          Tip: Select a <strong>project</strong> to show only that site&apos;s team.
          Engineers appear on every project they&apos;re assigned to.
        </p>
      )}

      <AttendanceGrid
        key={`${weekStart}-${employeeType}-${projectId ?? "all"}`}
        employees={employees}
        weekStart={weekStart}
        records={records}
        employeeType={employeeType}
        projectId={projectId}
      />
    </div>
  );
}
