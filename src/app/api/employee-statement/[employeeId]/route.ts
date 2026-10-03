import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { getEmployeeMonthAttendance } from "@/lib/queries/attendance";
import { getEmployeeSalaryDetail } from "@/lib/queries/salary";
import { getEmployeeActiveProject } from "@/lib/queries/projects";
import { getCurrentMonth } from "@/lib/utils/salary";
import { buildEmployeeStatementPdfData } from "@/lib/utils/employeeStatementPdf";
import { EmployeeStatementPDF } from "@/components/pdf/EmployeeStatementPDF";

/** One-page monthly statement: attendance, total payable and salary ledger */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ employeeId: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { employeeId } = await params;
  const { searchParams } = request.nextUrl;
  const month = searchParams.get("month") ?? getCurrentMonth();
  const projectId = searchParams.get("project") ?? undefined;

  const [detail, records, project] = await Promise.all([
    getEmployeeSalaryDetail(employeeId, month, projectId),
    getEmployeeMonthAttendance(employeeId, month),
    getEmployeeActiveProject(employeeId),
  ]);

  if (!detail) {
    return NextResponse.json({ error: "Employee not found" }, { status: 404 });
  }

  // Keep the attendance grid on the same project scope as the salary figures
  const scopedRecords = projectId
    ? records.filter((r) => r.project_id === projectId || r.project_id == null)
    : records;

  const data = buildEmployeeStatementPdfData({
    detail,
    records: scopedRecords,
    projectName: project?.name ?? null,
  });

  const buffer = await renderToBuffer(EmployeeStatementPDF({ data }));

  const nameSlug = detail.employee.full_name
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const [year, monthNum] = month.split("-");
  const monthName = new Date(Number(year), Number(monthNum) - 1, 1).toLocaleDateString(
    "en-IN",
    { month: "long" }
  );
  const filename = `${nameSlug}-Statement-${monthName}-${year}.pdf`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
