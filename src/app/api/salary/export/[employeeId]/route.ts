import { NextRequest, NextResponse } from "next/server";
import { getEmployeeSalaryExport } from "@/lib/queries/salary";
import {
  employeeSalaryDetailsToCsv,
  formatMonthLabel,
  getCurrentMonth,
} from "@/lib/utils/salary";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ employeeId: string }> }
) {
  const { employeeId } = await params;
  const { searchParams } = request.nextUrl;

  const mode = searchParams.get("mode") ?? "single";
  const month = searchParams.get("month") ?? getCurrentMonth();
  const fromMonth = searchParams.get("from") ?? month;
  const toMonth = searchParams.get("to") ?? month;
  const projectId = searchParams.get("project") ?? undefined;

  const rangeFrom = mode === "single" ? month : fromMonth;
  const rangeTo = mode === "single" ? month : toMonth;

  if (rangeFrom > rangeTo) {
    return NextResponse.json(
      { error: "Start month must be before or equal to end month" },
      { status: 400 }
    );
  }

  const details = await getEmployeeSalaryExport(
    employeeId,
    rangeFrom,
    rangeTo,
    projectId
  );

  if (!details || details.length === 0) {
    return NextResponse.json({ error: "Employee not found" }, { status: 404 });
  }

  const employee = details[0].employee;
  const csv = employeeSalaryDetailsToCsv(details, employee);

  const slug = employee.full_name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const filename =
    mode === "single"
      ? `pillar-salary-${slug}-${month}.csv`
      : `pillar-salary-${slug}-${rangeFrom}-to-${rangeTo}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
