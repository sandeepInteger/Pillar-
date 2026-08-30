import { Suspense } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmployeeCard } from "@/components/people/EmployeeCard";
import { PeopleFilters } from "@/components/people/PeopleFilters";
import { SyncToSheetsButton } from "@/components/people/SyncToSheetsButton";
import { getEmployees, getProfile } from "@/lib/queries/employees";
import { isGoogleSheetsConfigured } from "@/lib/google/sheets";

interface PeoplePageProps {
  searchParams: Promise<{
    type?: string;
    status?: string;
    search?: string;
  }>;
}

export default async function PeoplePage({ searchParams }: PeoplePageProps) {
  const params = await searchParams;
  const [employees, profile] = await Promise.all([
    getEmployees({
      type: params.type,
      status: params.status,
      search: params.search,
    }),
    getProfile(),
  ]);

  const showSheetSync =
    profile?.role === "admin" && isGoogleSheetsConfigured();

  return (
    <div>
      <PageHeader
        title="People"
        subtitle={`${employees.length} employee${employees.length !== 1 ? "s" : ""}`}
        showAddEmployee
      >
        <Suspense fallback={null}>
          <PeopleFilters />
        </Suspense>
        {showSheetSync && <SyncToSheetsButton />}
      </PageHeader>

      {employees.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] bg-white p-12 text-center">
          <p className="text-lg font-medium text-gray-600">No employees yet</p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Add your first labour, foreman, engineer or staff member.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {employees.map((employee) => (
            <EmployeeCard key={employee.id} employee={employee} />
          ))}
        </div>
      )}
    </div>
  );
}
