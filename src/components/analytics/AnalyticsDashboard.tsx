"use client";

import type { AnalyticsData } from "@/types/database";
import {
  ANALYTICS_SALARY_TYPES,
  EMPLOYEE_TYPE_CHART_COLORS,
  EMPLOYEE_TYPE_LABELS,
} from "@/types/database";
import { formatCurrency } from "@/lib/utils/salary";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  FileText,
  HardHat,
  IndianRupee,
  Landmark,
  TrendingUp,
  Users,
} from "lucide-react";
import { formatIndianRupee } from "@/lib/utils/raBills";

const PRIMARY = "#5D3FD3";
const PAID_COLOR = "#10b981";
const DUE_COLOR = "#f59e0b";
const LABOUR_COLOR = "#64748b";
const FOREMAN_COLOR = "#d97706";
const IGST_COLOR = "#059669";
const RETENTION_COLOR = "#d97706";
const TDS_COLOR = "#64748b";

interface AnalyticsDashboardProps {
  data: AnalyticsData;
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="pillar-card p-5 sm:p-6">
      <h3 className="font-semibold text-[var(--foreground)]">{title}</h3>
      {subtitle && (
        <p className="mt-1 text-sm text-[var(--muted)]">{subtitle}</p>
      )}
      <div className="mt-4 h-[280px] w-full">{children}</div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  accent?: string;
}) {
  return (
    <div className="pillar-card p-5">
      <div className="flex items-start justify-between">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${accent ?? PRIMARY}18` }}
        >
          <Icon
            className="h-5 w-5"
            style={{ color: accent ?? PRIMARY }}
            strokeWidth={1.75}
          />
        </div>
      </div>
      <p className="mt-4 text-2xl font-bold tracking-tight">{value}</p>
      <p className="mt-0.5 text-sm text-[var(--muted)]">{label}</p>
      {sub && <p className="mt-1 text-xs text-[var(--muted-light)]">{sub}</p>}
    </div>
  );
}

export function AnalyticsDashboard({ data }: AnalyticsDashboardProps) {
  const work = data.selectedMonthWork;
  const salary = data.selectedMonthSalaryTotals;
  const raBills = data.selectedMonthRaBills;

  const raBillChartData = data.raBillsByMonth.map((r) => ({
    name: r.monthShort,
    gross: r.grossAmount,
    igst: r.igstAmount,
    retention: r.retentionAmount,
    tds: r.tdsAmount,
    net: r.netAmount,
  }));

  const raBillCashChartData = data.raBillCashByMonth.map((r) => ({
    name: r.monthShort,
    cashInBank: r.amount,
    netConfirmed: data.raBillsByMonth.find((b) => b.month === r.month)?.netAmount ?? 0,
  }));

  const workChartData = data.workByMonth.map((w) => ({
    name: w.monthShort,
    labourDays: w.labourManDays,
    foremanDays: w.foremanManDays,
    workers: w.totalSiteWorkers,
    totalDays: w.totalSiteManDays,
  }));

  const salaryPaidDueData = data.salaryTotalsByMonth.map((s) => ({
    name: s.monthShort,
    paid: s.paidOut,
    due: Math.max(s.balanceDue, 0),
    gross: s.grossEarned,
  }));

  const focusMonth =
    data.selectedMonthWork?.month ?? data.toMonth;

  const salaryByTypeChart = ANALYTICS_SALARY_TYPES.map((type) => {
    const rows = data.salaryByType.filter(
      (r) => r.employeeType === type && r.month === focusMonth
    );
    const gross = rows.reduce((s, r) => s + r.grossEarned, 0);
    const paid = rows.reduce((s, r) => s + r.paidOut, 0);
    const due = rows.reduce((s, r) => s + r.balanceDue, 0);
    return {
      type,
      label: EMPLOYEE_TYPE_LABELS[type],
      gross,
      paid,
      due,
      color: EMPLOYEE_TYPE_CHART_COLORS[type],
    };
  }).filter((r) => r.gross > 0 || r.paid > 0);

  const grossByTypeOverTime = data.workByMonth.map((w) => {
    const row: Record<string, string | number> = { name: w.monthShort };
    for (const type of ANALYTICS_SALARY_TYPES) {
      const stats = data.salaryByType.find(
        (s) => s.month === w.month && s.employeeType === type
      );
      row[type] = stats?.grossEarned ?? 0;
    }
    return row;
  });

  const pieData = salaryByTypeChart.map((r) => ({
    name: r.label,
    value: r.gross,
    color: r.color,
  }));

  return (
    <div className="space-y-8">
      {/* Focus month KPIs */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">
          {work?.monthLabel ?? "Selected month"} snapshot
          {data.fromMonth !== data.toMonth && (
            <span className="ml-2 text-sm font-normal text-[var(--muted)]">
              (latest month in range)
            </span>
          )}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label="Labour on site"
            value={work?.labourWorkers ?? 0}
            sub={`${work?.foremanWorkers ?? 0} foremen`}
            icon={Users}
            accent={LABOUR_COLOR}
          />
          <KpiCard
            label="Site man-days"
            value={work?.totalSiteManDays ?? 0}
            sub={`Labour ${work?.labourManDays ?? 0} · Foreman ${work?.foremanManDays ?? 0}`}
            icon={HardHat}
            accent={FOREMAN_COLOR}
          />
          <KpiCard
            label="Gross earned"
            value={salary ? formatCurrency(salary.grossEarned) : "—"}
            sub="All employee types"
            icon={TrendingUp}
            accent={PRIMARY}
          />
          <KpiCard
            label="Paid / Due"
            value={
              salary
                ? `${formatCurrency(salary.paidOut)} / ${formatCurrency(salary.balanceDue)}`
                : "—"
            }
            sub="Payout vs balance"
            icon={IndianRupee}
            accent={PAID_COLOR}
          />
        </div>
      </div>

      {/* Work analytics */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">Work — labour & sites</h2>
        <div className="grid gap-4 xl:grid-cols-2">
          <ChartCard
            title="Man-days per month"
            subtitle="Labour vs foreman — total work on site"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workChartData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value) => [Number(value ?? 0), ""]}
                  labelFormatter={(label) => `Month: ${label}`}
                />
                <Legend />
                <Bar
                  dataKey="labourDays"
                  name="Labour man-days"
                  fill={LABOUR_COLOR}
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="foremanDays"
                  name="Foreman man-days"
                  fill={FOREMAN_COLOR}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title="Workers on site"
            subtitle="Unique people with attendance each month"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={workChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="workers"
                  name="Site workers"
                  stroke={PRIMARY}
                  strokeWidth={3}
                  dot={{ r: 4, fill: PRIMARY }}
                />
                <Line
                  type="monotone"
                  dataKey="totalDays"
                  name="Total man-days"
                  stroke={FOREMAN_COLOR}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <div className="mt-4 overflow-x-auto rounded-xl border border-[var(--border)] bg-white">
          <table className="min-w-[640px] w-full text-sm">
            <thead>
              <tr className="border-b bg-[var(--background)] text-left text-xs uppercase tracking-wide text-[var(--muted)]">
                <th className="px-4 py-3">Month</th>
                <th className="px-4 py-3 text-right">Labour</th>
                <th className="px-4 py-3 text-right">Foremen</th>
                <th className="px-4 py-3 text-right">Total workers</th>
                <th className="px-4 py-3 text-right">Labour days</th>
                <th className="px-4 py-3 text-right">Total man-days</th>
              </tr>
            </thead>
            <tbody>
              {data.workByMonth.map((row) => (
                <tr
                  key={row.month}
                  className="border-b last:border-0 hover:bg-gray-50/50"
                >
                  <td className="px-4 py-3 font-medium">{row.monthLabel}</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {row.labourWorkers}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {row.foremanWorkers}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {row.totalSiteWorkers}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {row.labourManDays}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums text-[var(--primary)]">
                    {row.totalSiteManDays}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Salary analytics */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">Money — salary & payouts</h2>
        <div className="grid gap-4 xl:grid-cols-2">
          <ChartCard
            title="Paid vs balance due"
            subtitle="Month-wise payout comparison"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salaryPaidDueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value ?? 0))}
                />
                <Legend />
                <Bar
                  dataKey="paid"
                  name="Paid out"
                  stackId="a"
                  fill={PAID_COLOR}
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="due"
                  name="Balance due"
                  stackId="a"
                  fill={DUE_COLOR}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title="Gross earned trend"
            subtitle="Total wages earned each month"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salaryPaidDueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value ?? 0))}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="gross"
                  name="Gross earned"
                  stroke={PRIMARY}
                  strokeWidth={3}
                  dot={{ r: 4, fill: PRIMARY }}
                />
                <Line
                  type="monotone"
                  dataKey="paid"
                  name="Paid out"
                  stroke={PAID_COLOR}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          <ChartCard
            title="Gross by employee type"
            subtitle={`Latest month: ${data.salaryTotalsByMonth.at(-1)?.monthLabel ?? ""}`}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salaryByTypeChart} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis
                  type="category"
                  dataKey="label"
                  tick={{ fontSize: 12 }}
                  width={80}
                />
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value ?? 0))}
                />
                <Legend />
                <Bar dataKey="gross" name="Gross" radius={[0, 4, 4, 0]}>
                  {salaryByTypeChart.map((entry) => (
                    <Cell key={entry.type} fill={entry.color} />
                  ))}
                </Bar>
                <Bar dataKey="paid" name="Paid" fill={PAID_COLOR} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title="Wage mix (latest month)"
            subtitle="Share of gross by role"
          >
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={2}
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => formatCurrency(Number(value ?? 0))}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-[var(--muted)]">
                No salary data for latest month
              </div>
            )}
          </ChartCard>
        </div>

        <ChartCard
          title="Gross earned by type — month comparison"
          subtitle="Labour, staff, engineer & others over time"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={grossByTypeOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => formatCurrency(Number(value ?? 0))} />
              <Legend />
              {ANALYTICS_SALARY_TYPES.map((type) => (
                <Bar
                  key={type}
                  dataKey={type}
                  name={EMPLOYEE_TYPE_LABELS[type]}
                  fill={EMPLOYEE_TYPE_CHART_COLORS[type]}
                  radius={[2, 2, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <div className="mt-4 overflow-x-auto rounded-xl border border-[var(--border)] bg-white">
          <table className="min-w-[880px] w-full text-sm">
            <thead>
              <tr className="border-b bg-[var(--background)] text-left text-xs uppercase tracking-wide text-[var(--muted)]">
                <th className="px-4 py-3">Month</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3 text-right">Workers</th>
                <th className="px-4 py-3 text-right">Man-days</th>
                <th className="px-4 py-3 text-right">Gross</th>
                <th className="px-4 py-3 text-right">Paid</th>
                <th className="px-4 py-3 text-right">Due</th>
              </tr>
            </thead>
            <tbody>
              {data.salaryByType
                .filter((r) => r.grossEarned > 0 || r.paidOut > 0 || r.manDays > 0)
                .map((row) => (
                  <tr
                    key={`${row.month}-${row.employeeType}`}
                    className="border-b last:border-0 hover:bg-gray-50/50"
                  >
                    <td className="px-4 py-3">{row.monthShort}</td>
                    <td className="px-4 py-3">
                      {EMPLOYEE_TYPE_LABELS[row.employeeType]}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {row.workers}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {row.manDays}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {formatCurrency(row.grossEarned)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-emerald-700">
                      {formatCurrency(row.paidOut)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-amber-700">
                      {formatCurrency(row.balanceDue)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* RA Bills analytics */}
      <section>
        <h2 className="mb-1 text-lg font-semibold">RA Bills — billing & bank</h2>
        <p className="mb-4 text-sm text-[var(--muted)]">
          Month-wise totals by bill confirmed date. Bank credit uses the date
          money was received.
        </p>

        <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label="Bills confirmed"
            value={raBills?.billCount ?? 0}
            sub={work?.monthLabel ?? "Selected month"}
            icon={FileText}
            accent={PRIMARY}
          />
          <KpiCard
            label="Gross + IGST"
            value={
              raBills
                ? formatIndianRupee(raBills.totalBillAmount)
                : "—"
            }
            sub={
              raBills && raBills.igstAmount > 0
                ? `IGST ${formatIndianRupee(raBills.igstAmount)}`
                : "Bill value on RA"
            }
            icon={TrendingUp}
            accent={IGST_COLOR}
          />
          <KpiCard
            label="Retention + TDS"
            value={
              raBills
                ? formatIndianRupee(
                    raBills.retentionAmount + raBills.tdsAmount
                  )
                : "—"
            }
            sub={
              raBills
                ? `${formatIndianRupee(raBills.retentionAmount)} held · ${formatIndianRupee(raBills.tdsAmount)} TDS`
                : undefined
            }
            icon={IndianRupee}
            accent={RETENTION_COLOR}
          />
          <KpiCard
            label="Net / pending"
            value={
              raBills ? formatIndianRupee(raBills.netAmount) : "—"
            }
            sub={
              raBills
                ? `${formatIndianRupee(raBills.receivedFromBills)} in bank · ${formatIndianRupee(raBills.pendingNet)} awaiting`
                : "Expected in bank"
            }
            icon={Landmark}
            accent={PAID_COLOR}
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <ChartCard
            title="Bill amounts by confirmed month"
            subtitle="Gross, IGST, retention & TDS"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={raBillChartData} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value) => formatIndianRupee(Number(value ?? 0))}
                />
                <Legend />
                <Bar
                  dataKey="gross"
                  name="Gross"
                  fill={PRIMARY}
                  radius={[2, 2, 0, 0]}
                />
                <Bar
                  dataKey="igst"
                  name="IGST"
                  fill={IGST_COLOR}
                  radius={[2, 2, 0, 0]}
                />
                <Bar
                  dataKey="retention"
                  name="Retention"
                  fill={RETENTION_COLOR}
                  radius={[2, 2, 0, 0]}
                />
                <Bar
                  dataKey="tds"
                  name="TDS"
                  fill={TDS_COLOR}
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title="Net vs bank credit"
            subtitle="Net from bills confirmed vs cash received that month"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={raBillCashChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value) => formatIndianRupee(Number(value ?? 0))}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="netConfirmed"
                  name="Net (confirmed month)"
                  stroke={PRIMARY}
                  strokeWidth={3}
                  dot={{ r: 4, fill: PRIMARY }}
                />
                <Line
                  type="monotone"
                  dataKey="cashInBank"
                  name="Cash in bank (receipt month)"
                  stroke={PAID_COLOR}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <div className="mt-4 overflow-x-auto rounded-xl border border-[var(--border)] bg-white">
          <table className="min-w-[1040px] w-full text-sm">
            <thead>
              <tr className="border-b bg-[var(--background)] text-left text-xs uppercase tracking-wide text-[var(--muted)]">
                <th className="px-4 py-3">Month</th>
                <th className="px-4 py-3 text-right">Bills</th>
                <th className="px-4 py-3 text-right">Gross</th>
                <th className="px-4 py-3 text-right">IGST</th>
                <th className="px-4 py-3 text-right">Total bill</th>
                <th className="px-4 py-3 text-right">Retention</th>
                <th className="px-4 py-3 text-right">TDS</th>
                <th className="px-4 py-3 text-right">Net in bank</th>
                <th className="px-4 py-3 text-right">Received</th>
                <th className="px-4 py-3 text-right">Pending</th>
                <th className="px-4 py-3 text-right">Bank credit</th>
              </tr>
            </thead>
            <tbody>
              {data.raBillsByMonth.map((row) => {
                const cash = data.raBillCashByMonth.find(
                  (c) => c.month === row.month
                );
                return (
                  <tr
                    key={row.month}
                    className="border-b last:border-0 hover:bg-gray-50/50"
                  >
                    <td className="px-4 py-3 font-medium">{row.monthLabel}</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {row.billCount}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {formatIndianRupee(row.grossAmount)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-emerald-800">
                      {row.igstAmount > 0
                        ? formatIndianRupee(row.igstAmount)
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {formatIndianRupee(row.totalBillAmount)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-amber-800">
                      {formatIndianRupee(row.retentionAmount)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                      {formatIndianRupee(row.tdsAmount)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-[var(--primary)]">
                      {formatIndianRupee(row.netAmount)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-emerald-700">
                      {formatIndianRupee(row.receivedFromBills)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-amber-700">
                      {formatIndianRupee(row.pendingNet)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {cash && cash.amount > 0
                        ? formatIndianRupee(cash.amount)
                        : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {data.raBillsByMonth.some((r) => r.billCount > 0) && (
              <tfoot>
                <tr className="border-t bg-[var(--background)] font-semibold">
                  <td className="px-4 py-3">Total</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {data.raBillsByMonth.reduce((s, r) => s + r.billCount, 0)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatIndianRupee(
                      data.raBillsByMonth.reduce((s, r) => s + r.grossAmount, 0)
                    )}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatIndianRupee(
                      data.raBillsByMonth.reduce((s, r) => s + r.igstAmount, 0)
                    )}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatIndianRupee(
                      data.raBillsByMonth.reduce(
                        (s, r) => s + r.totalBillAmount,
                        0
                      )
                    )}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatIndianRupee(
                      data.raBillsByMonth.reduce(
                        (s, r) => s + r.retentionAmount,
                        0
                      )
                    )}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatIndianRupee(
                      data.raBillsByMonth.reduce((s, r) => s + r.tdsAmount, 0)
                    )}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatIndianRupee(
                      data.raBillsByMonth.reduce((s, r) => s + r.netAmount, 0)
                    )}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatIndianRupee(
                      data.raBillsByMonth.reduce(
                        (s, r) => s + r.receivedFromBills,
                        0
                      )
                    )}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatIndianRupee(
                      data.raBillsByMonth.reduce((s, r) => s + r.pendingNet, 0)
                    )}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatIndianRupee(
                      data.raBillCashByMonth.reduce((s, r) => s + r.amount, 0)
                    )}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </section>
    </div>
  );
}
