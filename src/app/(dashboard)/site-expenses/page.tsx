import { Suspense } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { ExpenseCategoriesManager } from "@/components/site-expenses/ExpenseCategoriesManager";
import { SiteExpenseFilters } from "@/components/site-expenses/SiteExpenseFilters";
import { SiteExpenseTable } from "@/components/site-expenses/SiteExpenseTable";
import { getExpenseCategories, getSiteExpenses } from "@/lib/queries/siteExpenses";
import { getProjects } from "@/lib/queries/projects";
import { getProfile } from "@/lib/queries/employees";
import { summarizeSiteExpenses } from "@/lib/utils/siteExpenses";
import { getCurrentMonth, getMonthDateRange } from "@/lib/utils/salary";

interface SiteExpensesPageProps {
  searchParams: Promise<{
    project?: string;
    category?: string;
    month?: string;
  }>;
}

export default async function SiteExpensesPage({
  searchParams,
}: SiteExpensesPageProps) {
  const params = await searchParams;
  const projectId = params.project && params.project !== "all" ? params.project : undefined;
  const month = /^\d{4}-\d{2}$/.test(params.month ?? "") ? params.month! : getCurrentMonth();
  const { start, end } = getMonthDateRange(month);

  const [expenses, projects, categories, profile] = await Promise.all([
    getSiteExpenses({ projectId, category: params.category, from: start, to: end }),
    getProjects(),
    getExpenseCategories(),
    getProfile(),
  ]);

  const isAdmin = profile?.role === "admin";
  const summary = summarizeSiteExpenses(expenses, categories);

  return (
    <div>
      <PageHeader
        title="Site Expenses"
        subtitle="Labour and business expenses spent on each site"
      >
        <Suspense fallback={null}>
          <SiteExpenseFilters projects={projects} categories={categories} />
        </Suspense>
      </PageHeader>

      <div className="space-y-6">
        {isAdmin && <ExpenseCategoriesManager categories={categories} />}

        <SiteExpenseTable
          expenses={expenses}
          summary={summary}
          projects={projects}
          categories={categories}
          month={month}
          isAdmin={isAdmin}
        />
      </div>
    </div>
  );
}
