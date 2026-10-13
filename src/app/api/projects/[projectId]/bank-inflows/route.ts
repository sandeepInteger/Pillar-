import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { getProject } from "@/lib/queries/projects";
import { getProjectBankInflows } from "@/lib/queries/projectBankInflows";
import { sumInflowAmounts } from "@/lib/utils/projectBankInflows";
import { roundToTwoDecimals } from "@/lib/utils/employees";
import { DEFAULT_COMPANY_NAME } from "@/types/pdf";
import { BankInflowStatementPDF } from "@/components/pdf/BankInflowStatementPDF";

function formatPdfDate(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** PDF of every bank inflow transaction for one project, oldest first */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;
  const [project, inflows] = await Promise.all([
    getProject(projectId),
    getProjectBankInflows(projectId),
  ]);

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const sorted = inflows
    .slice()
    .sort(
      (a, b) =>
        a.received_date.localeCompare(b.received_date) ||
        a.created_at.localeCompare(b.created_at)
    );

  let runningTotal = 0;
  const rows = sorted.map((row, index) => {
    const amount = Number(row.amount);
    runningTotal = roundToTwoDecimals(runningTotal + amount);
    return {
      sr: index + 1,
      date: formatPdfDate(row.received_date),
      reference: row.reference_note || "-",
      amount,
      runningTotal,
    };
  });

  const today = new Date().toISOString().slice(0, 10);
  const buffer = await renderToBuffer(
    BankInflowStatementPDF({
      data: {
        companyName: DEFAULT_COMPANY_NAME,
        projectName: project.name,
        projectCode: project.project_code,
        clientName: project.client_name || "-",
        location: project.location || "-",
        periodFrom: sorted.length ? formatPdfDate(sorted[0].received_date) : "-",
        periodTo: sorted.length
          ? formatPdfDate(sorted[sorted.length - 1].received_date)
          : "-",
        generatedOn: formatPdfDate(today),
        rows,
        total: sumInflowAmounts(sorted),
      },
    })
  );

  const slug = (project.project_code || project.name)
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const filename = `${slug}-Bank-Inflow-${today}.pdf`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
