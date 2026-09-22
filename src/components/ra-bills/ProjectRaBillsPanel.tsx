import Link from "next/link";
import type { RaBillSummary, RaBillWithProject } from "@/types/database";
import {
  formatIndianRupee,
  formatRaBillDate,
  formatRaBillWorkPeriod,
  getRaBillPaymentStatus,
} from "@/lib/utils/raBills";

interface ProjectRaBillsPanelProps {
  projectId: string;
  bills: RaBillWithProject[];
  summary: RaBillSummary;
  isAdmin: boolean;
}

export function ProjectRaBillsPanel({
  projectId,
  bills,
  summary,
  isAdmin,
}: ProjectRaBillsPanelProps) {
  return (
    <section className="mt-8 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">RA Bills</h2>
          <p className="text-sm text-[var(--muted)]">
            Track confirmed bills, retention, TDS, and bank receipt.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/ra-bills?project=${projectId}`}
            className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-medium hover:bg-gray-50"
          >
            View all
          </Link>
          {isAdmin && (
            <Link
              href={`/ra-bills/new?project=${projectId}`}
              className="pillar-btn-primary text-sm"
            >
              Add RA Bill
            </Link>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-[var(--border)] bg-white p-4">
          <p className="text-xs text-[var(--muted)]">Awaiting bank</p>
          <p className="mt-1 text-lg font-bold text-amber-700">
            {formatIndianRupee(summary.pendingNet)}
          </p>
          <p className="text-xs text-[var(--muted)]">
            {summary.pendingCount} pending
          </p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-white p-4">
          <p className="text-xs text-[var(--muted)]">Retention on bills</p>
          <p className="mt-1 text-lg font-bold">
            {formatIndianRupee(summary.totalRetention)}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-white p-4">
          <p className="text-xs text-[var(--muted)]">TDS on bills</p>
          <p className="mt-1 text-lg font-bold">
            {formatIndianRupee(summary.totalTds)}
          </p>
        </div>
      </div>

      {bills.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] bg-white p-8 text-center text-sm text-[var(--muted)]">
          No RA bills for this project yet.
        </div>
      ) : (
        <ul className="space-y-2">
          {bills.slice(0, 5).map((bill) => {
            const status = getRaBillPaymentStatus(bill);
            return (
              <li
                key={bill.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--border)] bg-white px-4 py-3"
              >
                <div>
                  {isAdmin ? (
                    <Link
                      href={`/ra-bills/${bill.id}/edit`}
                      className="font-medium hover:text-[var(--primary)]"
                    >
                      {bill.bill_label}
                    </Link>
                  ) : (
                    <span className="font-medium">{bill.bill_label}</span>
                  )}
                  <p className="text-xs text-[var(--muted)]">
                    {bill.contractor_name && (
                      <span className="block">{bill.contractor_name}</span>
                    )}
                    {formatRaBillWorkPeriod(
                      bill.work_period_start,
                      bill.work_period_end
                    )}{" "}
                    · Net in bank{" "}
                    {formatIndianRupee(Number(bill.net_amount))}
                    {bill.gst_applicable && (
                      <span className="text-emerald-700">
                        {" "}
                        (incl. IGST)
                      </span>
                    )}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    status === "received"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-900"
                  }`}
                >
                  {status === "received" ? "In bank" : "Awaiting payment"}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
