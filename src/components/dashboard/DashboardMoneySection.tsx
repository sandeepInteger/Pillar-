import Link from "next/link";
import type { DashboardOverview } from "@/lib/queries/dashboard";
import { formatCurrency } from "@/lib/utils/salary";
import {
  formatIndianRupee,
  formatRaBillDate,
} from "@/lib/utils/raBills";
import { ArrowRight, FileText, Landmark, Wallet } from "lucide-react";

interface DashboardMoneySectionProps {
  data: DashboardOverview;
}

export function DashboardMoneySection({ data }: DashboardMoneySectionProps) {
  const salary = data.salaryMonth;
  const raMonth = data.raBillsMonth;

  return (
    <section className="mt-8">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">Money snapshot</h2>
          <p className="text-sm text-[var(--muted)]">
            {data.monthLabel} · RA bills, bank inflow & payroll
          </p>
        </div>
        <Link
          href="/analytics"
          className="text-sm font-medium text-[var(--primary)] hover:underline"
        >
          Full analytics →
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MoneyCard
          icon={FileText}
          label="RA awaiting bank"
          value={formatIndianRupee(data.raBill.pendingNet)}
          sub={`${data.raBill.pendingCount} bill(s) · Retention ${formatIndianRupee(data.raBill.totalRetention)}`}
          href="/ra-bills?payment=pending"
          accent="amber"
        />
        <MoneyCard
          icon={Landmark}
          label="Bank inflow (this month)"
          value={formatIndianRupee(data.bankInflowThisMonth)}
          sub={`All projects · ${formatIndianRupee(data.bankInflowAllTime)} total logged`}
          href="/projects"
          accent="emerald"
        />
        <MoneyCard
          icon={Wallet}
          label="Salary balance due"
          value={
            salary ? formatCurrency(salary.balanceDue) : "—"
          }
          sub={
            salary
              ? `${formatCurrency(salary.paidOut)} paid of ${formatCurrency(salary.grossEarned)} earned`
              : "This month"
          }
          href="/salary"
          accent="violet"
        />
        <MoneyCard
          icon={FileText}
          label="RA confirmed (month)"
          value={
            raMonth && raMonth.billCount > 0
              ? formatIndianRupee(raMonth.netAmount)
              : "—"
          }
          sub={
            raMonth && raMonth.billCount > 0
              ? `${raMonth.billCount} bill(s) · IGST ${formatIndianRupee(raMonth.igstAmount)}`
              : "No bills confirmed this month"
          }
          href="/ra-bills"
          accent="slate"
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="pillar-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold">Pending RA bills</h3>
            <Link
              href="/ra-bills?payment=pending"
              className="text-xs font-medium text-[var(--primary)] hover:underline"
            >
              View all
            </Link>
          </div>
          {data.pendingRaBills.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">
              No bills waiting for bank payment.
            </p>
          ) : (
            <ul className="space-y-2">
              {data.pendingRaBills.map((bill) => (
                <li key={bill.id}>
                  <Link
                    href={`/ra-bills/${bill.id}/edit`}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--border)] px-3 py-2.5 text-sm hover:bg-gray-50/80"
                  >
                    <span>
                      <span className="font-medium">{bill.bill_label}</span>
                      <span className="mt-0.5 block text-xs text-[var(--muted)]">
                        {bill.projects.name}
                      </span>
                    </span>
                    <span className="font-semibold tabular-nums text-amber-800">
                      {formatIndianRupee(Number(bill.net_amount))}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="pillar-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold">Recent bank inflow</h3>
            <Link
              href="/projects"
              className="text-xs font-medium text-[var(--primary)] hover:underline"
            >
              By project
            </Link>
          </div>
          {data.recentInflows.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">
              Log credits under each project → Bank inflow.
            </p>
          ) : (
            <ul className="space-y-2">
              {data.recentInflows.map((row) => (
                <li key={row.id}>
                  <Link
                    href={`/projects/${row.project_id}#bank-inflow`}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--border)] px-3 py-2.5 text-sm hover:bg-gray-50/80"
                  >
                    <span>
                      <span className="font-medium text-emerald-800">
                        {formatIndianRupee(row.amount)}
                      </span>
                      <span className="mt-0.5 block text-xs text-[var(--muted)]">
                        {formatRaBillDate(row.received_date)} · {row.project_name}
                        {row.reference_note
                          ? ` · ${row.reference_note}`
                          : ""}
                      </span>
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-[var(--muted)]" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

function MoneyCard({
  icon: Icon,
  label,
  value,
  sub,
  href,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub: string;
  href: string;
  accent: "amber" | "emerald" | "violet" | "slate";
}) {
  const colors = {
    amber: "bg-amber-50 text-amber-700",
    emerald: "bg-emerald-50 text-emerald-700",
    violet: "bg-violet-50 text-violet-700",
    slate: "bg-slate-100 text-slate-700",
  };

  return (
    <Link
      href={href}
      className="pillar-card block p-5 transition hover:shadow-md"
    >
      <div
        className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${colors[accent]}`}
      >
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </div>
      <p className="mt-4 text-xl font-bold tracking-tight">{value}</p>
      <p className="mt-0.5 text-sm font-medium">{label}</p>
      <p className="mt-2 text-xs text-[var(--muted)]">{sub}</p>
    </Link>
  );
}
