import { Suspense } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { AnalyticsFilters } from "@/components/analytics/AnalyticsFilters";
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";
import {
  getAnalyticsData,
  getDefaultAnalyticsRange,
} from "@/lib/queries/analytics";

interface AnalyticsPageProps {
  searchParams: Promise<{
    from?: string;
    to?: string;
    month?: string;
  }>;
}

export default async function AnalyticsPage({
  searchParams,
}: AnalyticsPageProps) {
  const params = await searchParams;
  const defaults = getDefaultAnalyticsRange();
  const fromMonth = params.from ?? defaults.fromMonth;
  const toMonth =
    params.to && params.to >= fromMonth ? params.to : defaults.toMonth;
  const selectedMonth =
    params.month &&
    params.month >= fromMonth &&
    params.month <= toMonth
      ? params.month
      : toMonth;

  const data = await getAnalyticsData(fromMonth, toMonth, selectedMonth);

  return (
    <div>
      <PageHeader
        title="Analytics"
        subtitle="Work on site & salary trends — compare month by month"
      >
        <Suspense fallback={null}>
          <AnalyticsFilters />
        </Suspense>
      </PageHeader>

      <AnalyticsDashboard data={data} />
    </div>
  );
}
