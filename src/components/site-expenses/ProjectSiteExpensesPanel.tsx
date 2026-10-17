import Link from "next/link";
import type {
  ExpenseCategory,
  SiteExpenseSummary,
  SiteExpenseWithProject,
} from "@/types/database";
import { SiteExpenseTable } from "@/components/site-expenses/SiteExpenseTable";

interface ProjectSiteExpensesPanelProps {
  projectId: string;
  month: string;
  expenses: SiteExpenseWithProject[];
  summary: SiteExpenseSummary;
  categories: ExpenseCategory[];
  isAdmin: boolean;
}

/** Project page: this month's site expenses, logged against this site only. */
export function ProjectSiteExpensesPanel({
  projectId,
  month,
  expenses,
  summary,
  categories,
  isAdmin,
}: ProjectSiteExpensesPanelProps) {
  return (
    <section className="mt-8 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Site Expenses</h2>
          <p className="text-sm text-[var(--muted)]">
            Labour and business expenses spent on this site.
          </p>
        </div>
        <Link
          href={`/site-expenses?project=${projectId}`}
          className="text-sm font-medium text-[var(--primary)] hover:underline"
        >
          Other months →
        </Link>
      </div>

      <SiteExpenseTable
        expenses={expenses}
        summary={summary}
        categories={categories}
        month={month}
        isAdmin={isAdmin}
        fixedProjectId={projectId}
      />
    </section>
  );
}
