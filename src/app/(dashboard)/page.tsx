import { PageHeader } from "@/components/layout/PageHeader";
import { DashboardMoneySection } from "@/components/dashboard/DashboardMoneySection";
import { StatCard } from "@/components/ui/StatCard";
import { getDashboardOverview } from "@/lib/queries/dashboard";
import { getDashboardStats } from "@/lib/queries/employees";
import { getProjectStats } from "@/lib/queries/projects";
import {
  getAttendanceSummary,
  getTodayAttendanceSummary,
} from "@/lib/queries/attendance";
import { getCurrentWeekStart } from "@/lib/utils/attendance";
import {
  Users,
  HardHat,
  FolderKanban,
  Clock,
  AlertCircle,
  ArrowRight,
  IndianRupee,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { formatIndianRupee } from "@/lib/utils/raBills";

export default async function DashboardPage() {
  const weekStart = getCurrentWeekStart();
  const [stats, projectStats, weekAttendance, todayAttendance, overview] =
    await Promise.all([
      getDashboardStats(),
      getProjectStats(),
      getAttendanceSummary(weekStart),
      getTodayAttendanceSummary(),
      getDashboardOverview(),
    ]);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Sites, workforce, money & attendance at a glance"
        showAddEmployee
      />

      {/* Money — top priority */}
      <DashboardMoneySection data={overview} />

      {/* Operations KPIs */}
      <section className="mt-8">
        <h2 className="mb-4 text-lg font-semibold">Operations</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Active Projects"
            value={projectStats.active}
            icon={FolderKanban}
            trend={`${projectStats.total} total`}
          />
          <StatCard
            label="Active Workforce"
            value={stats.total}
            icon={Users}
            trend={`${stats.labour + stats.carpenter + stats.mason} labour trades`}
          />
          <StatCard
            label="Man-days This Week"
            value={weekAttendance.totalDayUnits}
            icon={Clock}
            trend={`${todayAttendance.present} present today`}
          />
          <StatCard
            label="On Site (labour + foreman)"
            value={
              stats.labour +
              stats.carpenter +
              stats.mason +
              stats.foreman
            }
            icon={HardHat}
            trend={`${stats.engineer} engineers`}
          />
        </div>
      </section>

      {/* Secondary metrics */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="pillar-card p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Workforce Breakdown</h2>
            <Link
              href="/people"
              className="text-sm font-medium text-[var(--primary)] hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Founder", value: stats.founder, pct: stats.total ? Math.round((stats.founder / stats.total) * 100) : 0 },
              { label: "Engineers", value: stats.engineer, pct: stats.total ? Math.round((stats.engineer / stats.total) * 100) : 0 },
              { label: "Foreman", value: stats.foreman, pct: stats.total ? Math.round((stats.foreman / stats.total) * 100) : 0 },
              { label: "Carpenter", value: stats.carpenter, pct: stats.total ? Math.round((stats.carpenter / stats.total) * 100) : 0 },
              { label: "Mason", value: stats.mason, pct: stats.total ? Math.round((stats.mason / stats.total) * 100) : 0 },
              { label: "Labour", value: stats.labour, pct: stats.total ? Math.round((stats.labour / stats.total) * 100) : 0 },
              { label: "Staff", value: stats.staff, pct: stats.total ? Math.round((stats.staff / stats.total) * 100) : 0 },
            ].map((item) => (
              <div key={item.label} className="rounded-xl bg-[var(--background)] p-4">
                <p className="text-xs text-[var(--muted)]">{item.label}</p>
                <p className="mt-1 text-xl font-bold">{item.value}</p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full pillar-gradient-bar"
                    style={{ width: `${Math.max(item.pct, 4)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pillar-card p-6">
          <h2 className="mb-4 font-semibold">Today&apos;s Attendance</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--muted)]">Present</span>
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-sm font-semibold text-emerald-700">
                {todayAttendance.present}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--muted)]">Absent</span>
              <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-sm font-semibold text-red-600">
                {todayAttendance.absent}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--muted)]">Man-days</span>
              <span className="rounded-full bg-[var(--primary-light)] px-2.5 py-0.5 text-sm font-semibold text-[var(--primary)]">
                {todayAttendance.manDays}
              </span>
            </div>
          </div>
          <Link
            href="/attendance"
            className="mt-5 flex items-center gap-1 text-sm font-medium text-[var(--primary)] hover:underline"
          >
            Mark attendance <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Quick links */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { href: "/projects", label: "Projects", desc: `${projectStats.active} active`, color: "bg-violet-50 text-violet-700" },
          { href: "/ra-bills", label: "RA Bills", desc: `${formatIndianRupee(overview.raBill.pendingNet)} pending`, color: "bg-amber-50 text-amber-800" },
          { href: "/salary", label: "Salary", desc: overview.salaryMonth ? `${overview.salaryMonth.balanceDue > 0 ? "Due" : "Clear"} this month` : "Payroll", color: "bg-indigo-50 text-indigo-700" },
          { href: "/people", label: "People", desc: `${stats.total} employees`, color: "bg-slate-100 text-slate-700" },
          { href: "/attendance", label: "Attendance", desc: `${weekAttendance.totalDayUnits} man-days / week`, color: "bg-purple-50 text-purple-700" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="pillar-card group p-5 transition hover:shadow-md"
          >
            <span className={`inline-block rounded-lg px-2.5 py-1 text-xs font-semibold ${item.color}`}>
              {item.label}
            </span>
            <p className="mt-3 font-semibold group-hover:text-[var(--primary)]">
              Open {item.label}
            </p>
            <p className="mt-1 text-sm text-[var(--muted)]">{item.desc}</p>
          </Link>
        ))}
      </div>

      {stats.missingPayment > 0 && (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-200/80 bg-amber-50/80 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="font-semibold text-amber-900">
              {stats.missingPayment} employee
              {stats.missingPayment > 1 ? "s" : ""} missing payment details
            </p>
            <p className="mt-1 text-sm text-amber-800">
              Add UPI or bank account before payroll.
            </p>
            <Link
              href="/people"
              className="mt-2 inline-block text-sm font-medium text-amber-900 underline"
            >
              View people →
            </Link>
          </div>
        </div>
      )}

      {overview.raBill.totalNet > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm">
          <IndianRupee className="h-4 w-4 text-[var(--muted)]" />
          <span className="text-[var(--muted)]">All RA bills:</span>
          <span className="font-medium">
            {formatIndianRupee(overview.raBill.receivedNet)} in bank
          </span>
          <span className="text-[var(--muted)]">·</span>
          <span className="font-medium text-amber-800">
            {formatIndianRupee(overview.raBill.pendingNet)} pending
          </span>
          <span className="text-[var(--muted)]">·</span>
          <Link href="/ra-bills" className="inline-flex items-center gap-1 font-medium text-[var(--primary)] hover:underline">
            <FileText className="h-3.5 w-3.5" />
            Manage bills
          </Link>
        </div>
      )}
    </div>
  );
}
