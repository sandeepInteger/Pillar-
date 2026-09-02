import { NextRequest, NextResponse } from "next/server";
import { getMonthlySalary } from "@/lib/queries/salary";
import {
  formatMonthLabel,
  getCurrentMonth,
  salarySummaryToCsv,
} from "@/lib/utils/salary";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const month = searchParams.get("month") ?? getCurrentMonth();
  const type = searchParams.get("type") ?? "all";
  const projectId = searchParams.get("project") ?? undefined;

  const summary = await getMonthlySalary({
    month,
    type,
    projectId,
  });

  const monthLabel = formatMonthLabel(month);
  const csv = salarySummaryToCsv(summary, month, monthLabel);
  const filename = `pillar-salary-${month}${type !== "all" ? `-${type}` : ""}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
