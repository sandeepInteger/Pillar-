import Link from "next/link";
import type { RaBillSummary, RaBillWithProject } from "@/types/database";
import {
  formatIndianRupee,
  formatRaBillDate,
  formatRaBillWorkPeriod,
  getRaBillPaymentStatus,
} from "@/lib/utils/raBills";

interface RaBillTableProps {
  bills: RaBillWithProject[];
  summary: RaBillSummary;
}

export function RaBillTable({ bills, summary }: RaBillTableProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Bills" value={String(summary.billCount)} />
        <SummaryCard
          label="Pending in bank"
          value={formatIndianRupee(summary.pendingNet)}
          sub={`${summary.pendingCount} bill(s)`}
          accent
        />
        <SummaryCard
          label="Total retention (on bills)"
          value={formatIndianRupee(summary.totalRetention)}
        />
        <SummaryCard
          label="Total TDS (on bills)"
          value={formatIndianRupee(summary.totalTds)}
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-white">
        <table className="min-w-[1180px] w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--background)] text-left text-xs uppercase tracking-wide text-[var(--muted)]">
              <th className="px-4 py-3 font-semibold">Project</th>
              <th className="px-4 py-3 font-semibold">RA Bill</th>
              <th className="px-4 py-3 font-semibold">Work period</th>
              <th className="px-4 py-3 font-semibold">Confirmed</th>
              <th className="px-4 py-3 font-semibold text-right">Gross</th>
              <th className="px-4 py-3 font-semibold text-right">IGST</th>
              <th className="px-4 py-3 font-semibold text-right">Retention</th>
              <th className="px-4 py-3 font-semibold text-right">TDS</th>
              <th className="px-4 py-3 font-semibold text-right">Net in bank</th>
              <th className="px-4 py-3 font-semibold">Bank received</th>
              <th className="px-4 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {bills.length === 0 ? (
              <tr>
                <td
                  colSpan={11}
                  className="px-4 py-12 text-center text-[var(--muted)]"
                >
                  No RA bills yet. Add one to track submission and bank payment.
                </td>
              </tr>
            ) : (
              bills.map((bill) => {
                const status = getRaBillPaymentStatus(bill);
                return (
                  <tr
                    key={bill.id}
                    className="border-b border-[var(--border)] last:border-0 hover:bg-gray-50/50"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/projects/${bill.project_id}`}
                        className="font-medium hover:text-[var(--primary)]"
                      >
                        {bill.projects.name}
                      </Link>
                      <p className="text-xs text-[var(--muted)]">
                        {bill.projects.project_code}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/ra-bills/${bill.id}/edit`}
                        className="font-medium hover:text-[var(--primary)]"
                      >
                        {bill.bill_label}
                      </Link>
                      {bill.contractor_name && (
                        <p className="text-xs text-[var(--muted)]">
                          {bill.contractor_name}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs">
                      {formatRaBillWorkPeriod(
                        bill.work_period_start,
                        bill.work_period_end
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {formatRaBillDate(bill.confirmed_date)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {formatIndianRupee(Number(bill.gross_amount))}
                      {bill.gst_applicable && (
                        <span className="mt-0.5 block text-[10px] font-medium uppercase text-emerald-700">
                          + GST
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-emerald-800">
                      {bill.gst_applicable
                        ? formatIndianRupee(Number(bill.igst_amount))
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-amber-800">
                      {formatIndianRupee(Number(bill.retention_amount))}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                      {formatIndianRupee(Number(bill.tds_amount))}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">
                      {formatIndianRupee(Number(bill.net_amount))}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs">
                      {bill.bank_received_date ? (
                        <>
                          <span className="font-medium">
                            {formatRaBillDate(bill.bank_received_date)}
                          </span>
                          {bill.bank_received_amount != null && (
                            <span className="block text-[var(--muted)]">
                              {formatIndianRupee(Number(bill.bank_received_amount))}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-[var(--muted)]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          status === "received"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-900"
                        }`}
                      >
                        {status === "received"
                          ? "In bank"
                          : "Awaiting payment"}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
        {label}
      </p>
      <p
        className={`mt-1 text-xl font-bold ${accent ? "text-amber-700" : ""}`}
      >
        {value}
      </p>
      {sub && <p className="mt-0.5 text-xs text-[var(--muted)]">{sub}</p>}
    </div>
  );
}
