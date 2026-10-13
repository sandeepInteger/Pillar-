import { Download } from "lucide-react";

/** Downloads a PDF of all bank inflow transactions for one project */
export function BankInflowDownloadButton({ projectId }: { projectId: string }) {
  return (
    <a
      href={`/api/projects/${encodeURIComponent(projectId)}/bank-inflows`}
      download
      className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
    >
      <Download className="h-4 w-4" />
      Download PDF
    </a>
  );
}
