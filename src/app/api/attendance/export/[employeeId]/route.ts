import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { getEmployee } from "@/lib/queries/employees";
import { getEmployeeMonthAttendance } from "@/lib/queries/attendance";
import { getEmployeeActiveProject } from "@/lib/queries/projects";
import { getCurrentMonth } from "@/lib/utils/salary";
import { buildAttendancePdfData } from "@/lib/utils/attendancePdf";
import { AttendancePDF } from "@/components/pdf/AttendancePDF";

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

  const employee = await getEmployee(employeeId);
  if (!employee) {
    return NextResponse.json({ error: "Employee not found" }, { status: 404 });
  }

  const [records, project] = await Promise.all([
    getEmployeeMonthAttendance(employeeId, month),
    getEmployeeActiveProject(employeeId),
  ]);

  const data = buildAttendancePdfData({
    employee,
    records,
    month,
    projectName: project?.name ?? null,
  });

  const buffer = await renderToBuffer(AttendancePDF({ data }));

  const nameSlug = employee.full_name
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const [year, monthNum] = month.split("-");
  const monthName = new Date(Number(year), Number(monthNum) - 1, 1).toLocaleDateString(
    "en-IN",
    { month: "long" }
  );
  const filename = `${nameSlug}-Attendance-${monthName}-${year}.pdf`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
