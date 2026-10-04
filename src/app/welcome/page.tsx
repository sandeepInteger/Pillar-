import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Banknote,
  Building2,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileText,
  FolderKanban,
  Landmark,
  Layers,
  Lock,
  Receipt,
  Repeat,
  Sheet,
  ShieldCheck,
  Smartphone,
  Users,
  Wallet,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Pillar — Construction workforce & payroll CRM",
  description:
    "Pillar runs your construction company in one place: people, projects, daily attendance, salary ledgers, RA bills, bank inflow and analytics.",
};

const features = [
  {
    icon: Users,
    title: "People master",
    body: "Every labourer, mason, carpenter, foreman, engineer, staff member and founder with photos, multiple phone numbers and saved UPI / bank details.",
  },
  {
    icon: FolderKanban,
    title: "Projects & teams",
    body: "Assign people to sites, share engineers across projects, and transfer labour from one site to another in a click.",
  },
  {
    icon: Clock,
    title: "Time & attendance",
    body: "Weekly grid for full, half and double shifts, hourly entries with overtime, absences and sick leave — per project.",
  },
  {
    icon: Banknote,
    title: "Salary & payroll",
    body: "Daily, monthly and hourly pay with SL allowance, unused-leave payout, deductions and carry-forward balances.",
  },
  {
    icon: Wallet,
    title: "Advances & kharcha ledger",
    body: "Record advances, weekly kharcha, bonuses and deductions by UPI, bank or cash — Paytm by default, saved details one tap away.",
  },
  {
    icon: FileText,
    title: "One-page monthly statement",
    body: "Attendance, total payable and the salary ledger with closing balance on a single printable PDF for each employee.",
  },
  {
    icon: Receipt,
    title: "RA bill tracking",
    body: "Running-account bills with work period, GST, retention and TDS, plus when and how much the client actually paid.",
  },
  {
    icon: Landmark,
    title: "Bank inflow",
    body: "Log every rupee received per project with UTR or cheque reference, with weekly and monthly totals.",
  },
  {
    icon: ClipboardList,
    title: "Work quantity",
    body: "Daily progress logs of executed quantities per project, filterable and ready for billing.",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    body: "Man-days, payroll cost by employee type, salary paid vs earned and RA bill cash flow across any month range.",
  },
  {
    icon: Sheet,
    title: "Google Sheets sync",
    body: "Keep a live copy of your employee register in Google Sheets for owners and accountants.",
  },
  {
    icon: ShieldCheck,
    title: "Roles & access",
    body: "Admins run operations; viewers get read-only access. Every table is protected with row-level security.",
  },
];

const steps = [
  {
    icon: Users,
    title: "Add your people",
    body: "Add your workforce with pay type, rate, SL allowance and payment details.",
  },
  {
    icon: Building2,
    title: "Staff your projects",
    body: "Create sites and assign teams. Founders can be charged to one project only.",
  },
  {
    icon: CalendarCheck,
    title: "Mark attendance daily",
    body: "Supervisors fill the weekly grid from any phone — shifts, hours, overtime and leave.",
  },
  {
    icon: Banknote,
    title: "Close the month",
    body: "Salaries calculate themselves. Record payouts and share each person's statement PDF.",
  },
];

const ledgerRows = [
  { date: "05 Aug", item: "Advance", mode: "UPI · Paytm", given: "Rs. 3,000", earned: "-" },
  { date: "12 Aug", item: "Weekly kharcha", mode: "Cash", given: "Rs. 1,000", earned: "-" },
  { date: "26 Aug", item: "Advance", mode: "Bank", given: "Rs. 4,000", earned: "-" },
  { date: "31 Aug", item: "Salary earned", mode: "-", given: "-", earned: "Rs. 17,875" },
];

const attendanceDays = [
  "P", "P", "P", "P", "P", "P",
  "A", "P", "P", "P", "P", "H",
  "P", "A", "P", "P", "P", "L",
  "P", "P", "A", "P", "P", "P",
];

function statusClass(status: string) {
  if (status === "A") return "bg-red-50 text-red-600";
  if (status === "H") return "bg-amber-50 text-amber-700";
  if (status === "L") return "bg-sky-50 text-sky-700";
  return "bg-emerald-50 text-emerald-700";
}

function Logo() {
  return (
    <span className="flex items-center gap-2">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl pillar-gradient-bar shadow-md">
        <Layers className="h-5 w-5 text-white" />
      </span>
      <span className="text-lg font-bold tracking-tight">Pillar</span>
    </span>
  );
}

function SectionHeading({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-sm font-semibold uppercase tracking-wider text-[var(--primary)]">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
      <p className="mt-4 text-base leading-relaxed text-[var(--muted)]">{body}</p>
    </div>
  );
}

function CheckList({ items }: { items: string[] }) {
  return (
    <ul className="mt-6 space-y-3">
      {items.map((item) => (
        <li key={item} className="flex gap-3 text-sm leading-relaxed text-gray-700">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[var(--primary)]" />
          {item}
        </li>
      ))}
    </ul>
  );
}

function DashboardPreview() {
  const bars = [42, 58, 51, 66, 73, 61, 80, 88, 76, 92, 84, 96];
  return (
    <div className="pillar-card overflow-hidden shadow-2xl shadow-indigo-200/60">
      <div className="flex items-center gap-1.5 border-b border-[var(--border)] bg-gray-50 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
        <span className="ml-3 text-xs text-[var(--muted)]">Dashboard</span>
      </div>
      <div className="grid gap-3 p-4 sm:grid-cols-3">
        {[
          { label: "Active workforce", value: "148", tone: "text-[var(--foreground)]" },
          { label: "Today present", value: "126", tone: "text-emerald-600" },
          { label: "Balance due", value: "Rs. 4.8L", tone: "text-[var(--primary)]" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-[var(--border)] p-3">
            <p className="text-[11px] uppercase tracking-wide text-[var(--muted)]">{stat.label}</p>
            <p className={`mt-1 text-xl font-bold ${stat.tone}`}>{stat.value}</p>
          </div>
        ))}
        <div className="rounded-xl border border-[var(--border)] p-3 sm:col-span-2">
          <p className="text-[11px] uppercase tracking-wide text-[var(--muted)]">Man-days by month</p>
          <div className="mt-3 flex h-24 items-end gap-1.5">
            {bars.map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t bg-gradient-to-t from-indigo-500 to-violet-400"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-[var(--border)] p-3">
          <p className="text-[11px] uppercase tracking-wide text-[var(--muted)]">Workforce mix</p>
          <div className="mt-3 space-y-2">
            {[
              { label: "Labour", pct: 62, color: "bg-indigo-500" },
              { label: "Foreman", pct: 14, color: "bg-violet-400" },
              { label: "Engineer", pct: 12, color: "bg-sky-400" },
              { label: "Staff", pct: 12, color: "bg-emerald-400" },
            ].map((row) => (
              <div key={row.label}>
                <div className="flex justify-between text-[11px] text-gray-600">
                  <span>{row.label}</span>
                  <span>{row.pct}%</span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-gray-100">
                  <div className={`h-1.5 rounded-full ${row.color}`} style={{ width: `${row.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AttendancePreview() {
  return (
    <div className="pillar-card p-5 shadow-xl shadow-indigo-100/60">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Ramesh Kumar · August</p>
        <span className="rounded-full bg-[var(--primary-light)] px-2.5 py-1 text-xs font-medium text-[var(--primary)]">
          Labour
        </span>
      </div>
      <div className="mt-4 grid grid-cols-4 gap-2 text-center">
        {[
          { label: "Present", value: "25" },
          { label: "Absent", value: "4" },
          { label: "Half day", value: "1" },
          { label: "Overtime", value: "12h" },
        ].map((s) => (
          <div key={s.label} className="rounded-lg bg-gray-50 py-2">
            <p className="text-base font-bold">{s.value}</p>
            <p className="text-[10px] uppercase tracking-wide text-[var(--muted)]">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-6 gap-1.5">
        {attendanceDays.map((status, i) => (
          <div
            key={i}
            className={`flex flex-col items-center rounded-md py-1.5 text-xs font-semibold ${statusClass(status)}`}
          >
            <span className="text-[9px] font-normal opacity-70">{i + 1}</span>
            {status}
          </div>
        ))}
      </div>
    </div>
  );
}

function LedgerPreview() {
  return (
    <div className="pillar-card overflow-hidden shadow-xl shadow-indigo-100/60">
      <div className="border-b border-[var(--border)] px-5 py-3">
        <p className="text-sm font-semibold">Salary ledger · August</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] text-xs">
          <thead>
            <tr className="bg-gray-50 text-left text-[var(--muted)]">
              <th className="px-4 py-2 font-medium">Date</th>
              <th className="px-4 py-2 font-medium">Entry</th>
              <th className="px-4 py-2 font-medium">Mode</th>
              <th className="px-4 py-2 text-right font-medium">Given</th>
              <th className="px-4 py-2 text-right font-medium">Earned</th>
            </tr>
          </thead>
          <tbody>
            {ledgerRows.map((row) => (
              <tr key={`${row.date}-${row.item}`} className="border-t border-[var(--border)]">
                <td className="px-4 py-2 text-[var(--muted)]">{row.date}</td>
                <td className="px-4 py-2">{row.item}</td>
                <td className="px-4 py-2 text-[var(--muted)]">{row.mode}</td>
                <td className="px-4 py-2 text-right tabular-nums">{row.given}</td>
                <td className="px-4 py-2 text-right tabular-nums text-emerald-700">{row.earned}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between bg-[var(--primary-light)] px-5 py-3">
        <p className="text-sm font-semibold text-[var(--primary)]">Monthly closing balance</p>
        <p className="text-base font-bold text-[var(--primary)]">Rs. 7,375</p>
      </div>
    </div>
  );
}

function BillsPreview() {
  return (
    <div className="pillar-card p-5 shadow-xl shadow-indigo-100/60">
      <p className="text-sm font-semibold">RA-4 · Sector 21 Tower</p>
      <div className="mt-4 space-y-2 text-sm">
        {[
          { label: "Gross amount", value: "Rs. 12,40,000" },
          { label: "GST", value: "+ Rs. 2,23,200" },
          { label: "Retention", value: "- Rs. 62,000" },
          { label: "TDS", value: "- Rs. 24,800" },
        ].map((row) => (
          <div key={row.label} className="flex justify-between">
            <span className="text-[var(--muted)]">{row.label}</span>
            <span className="tabular-nums">{row.value}</span>
          </div>
        ))}
        <div className="flex justify-between border-t border-[var(--border)] pt-2 font-semibold">
          <span>Net receivable</span>
          <span className="tabular-nums">Rs. 13,76,400</span>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
        <CheckCircle2 className="h-4 w-4" />
        Received in bank on 18 Sep
      </div>
    </div>
  );
}

export default function WelcomePage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-[var(--foreground)]">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-white/85 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/welcome" aria-label="Pillar home">
            <Logo />
          </Link>
          <div className="hidden items-center gap-8 text-sm font-medium text-gray-600 md:flex">
            <a href="#features" className="hover:text-[var(--primary)]">Features</a>
            <a href="#payroll" className="hover:text-[var(--primary)]">Payroll</a>
            <a href="#billing" className="hover:text-[var(--primary)]">Billing</a>
            <a href="#how-it-works" className="hover:text-[var(--primary)]">How it works</a>
          </div>
          <Link href="/login" className="pillar-btn-primary">
            Sign in
            <ArrowRight className="h-4 w-4" />
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative">
        <div className="pointer-events-none absolute -left-40 -top-40 h-[28rem] w-[28rem] rounded-full bg-purple-200/50 blur-3xl" />
        <div className="pointer-events-none absolute -right-40 top-20 h-[28rem] w-[28rem] rounded-full bg-indigo-200/50 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-16 sm:px-6 lg:grid-cols-2 lg:pt-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-3 py-1 text-xs font-medium text-gray-600 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Built for construction contractors
            </span>
            <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Run every site, worker and rupee from{" "}
              <span className="bg-gradient-to-r from-violet-600 to-indigo-500 bg-clip-text text-transparent">
                one place
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-[var(--muted)]">
              Pillar is the operations CRM for construction companies — people,
              projects, daily attendance, salary ledgers, RA bills and bank inflow,
              all connected so month-end closes itself.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/login" className="pillar-btn-primary justify-center px-6 text-base">
                Sign in to your workspace
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#features" className="pillar-btn-secondary justify-center px-6 text-base">
                Explore features
              </a>
            </div>
            <div className="mt-10 grid max-w-md grid-cols-3 gap-6 border-t border-[var(--border)] pt-6">
              {[
                { value: "7", label: "Worker categories" },
                { value: "3", label: "Pay types" },
                { value: "1", label: "Page statement" },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-2xl font-bold text-[var(--primary)]">{stat.value}</p>
                  <p className="text-xs text-[var(--muted)]">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
          <DashboardPreview />
        </div>
      </section>

      {/* Modules strip */}
      <section className="border-y border-[var(--border)] bg-[var(--background)]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-4 py-6 text-sm font-medium text-gray-500 sm:px-6">
          {["People", "Projects", "Attendance", "Salary", "RA Bills", "Bank Inflow", "Work Quantity", "Analytics"].map(
            (m) => (
              <span key={m} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--primary-muted)]" />
                {m}
              </span>
            )
          )}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-20 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading
            eyebrow="Everything in one platform"
            title="Built around how construction companies actually work"
            body="From the labourer marking attendance at the gate to the founder reading cash flow, every module shares the same data — no spreadsheets to reconcile."
          />
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="pillar-card group p-6 transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--primary-light)] text-[var(--primary)] transition group-hover:bg-[var(--primary)] group-hover:text-white">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-base font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Attendance deep dive */}
      <section className="bg-[var(--background)] py-20 sm:py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
          <AttendancePreview />
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-[var(--primary)]">
              Time & attendance
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Attendance that feeds payroll automatically
            </h2>
            <p className="mt-4 text-base leading-relaxed text-[var(--muted)]">
              Supervisors mark the whole crew in a weekly grid on their phone. Every
              entry flows straight into salary — no double entry, no month-end chase.
            </p>
            <CheckList
              items={[
                "Full, half and double shifts for site labour; hourly entries with overtime for skilled trades",
                "Sick leave with a monthly allowance — unused days are paid out automatically",
                "Filter by project to see exactly who worked on which site",
                "Man-day totals per day, week and month",
              ]}
            />
          </div>
        </div>
      </section>

      {/* Payroll deep dive */}
      <section id="payroll" className="scroll-mt-20 py-20 sm:py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
          <div className="lg:order-1">
            <p className="text-sm font-semibold uppercase tracking-wider text-[var(--primary)]">
              Salary & ledger
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Know exactly what you owe every worker
            </h2>
            <p className="mt-4 text-base leading-relaxed text-[var(--muted)]">
              Pillar keeps a running ledger for each person — earnings, advances,
              weekly kharcha and payouts — and carries the balance from month to month.
            </p>
            <CheckList
              items={[
                "Daily-wage, fixed monthly and hourly pay, plus founder fixed salary charged to one project",
                "Record payouts by UPI, bank or cash — pick the worker's saved UPI ID or account instantly",
                "Opening balance, advances and closing balance calculated for you",
                "Download a one-page statement with attendance, payable and ledger",
              ]}
            />
          </div>
          <div className="lg:order-2">
            <LedgerPreview />
          </div>
        </div>
      </section>

      {/* Billing deep dive */}
      <section id="billing" className="scroll-mt-20 bg-[var(--background)] py-20 sm:py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
          <BillsPreview />
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-[var(--primary)]">
              RA bills & cash flow
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Follow the money from bill to bank
            </h2>
            <p className="mt-4 text-base leading-relaxed text-[var(--muted)]">
              Track every running-account bill and every payment that lands in your
              account, project by project.
            </p>
            <CheckList
              items={[
                "RA bills with work period, contractor, GST, retention and TDS",
                "Mark when the client paid and the amount received",
                "Project bank inflow log with UTR / cheque references and weekly totals",
                "Analytics comparing billed, received and payroll cost over any period",
              ]}
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="scroll-mt-20 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading
            eyebrow="How it works"
            title="From first worker to month-end in four steps"
            body="Set it up once. After that, daily attendance is the only thing your team needs to enter."
          />
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map(({ icon: Icon, title, body }, i) => (
              <div key={title} className="relative pillar-card p-6">
                <span className="absolute right-5 top-5 text-3xl font-bold text-gray-100">
                  0{i + 1}
                </span>
                <span className="flex h-11 w-11 items-center justify-center rounded-xl pillar-gradient-bar text-white">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="bg-[var(--background)] py-16">
        <div className="mx-auto grid max-w-6xl gap-5 px-4 sm:grid-cols-3 sm:px-6">
          {[
            {
              icon: Lock,
              title: "Secure by default",
              body: "Supabase Auth sign-in and row-level security on every table.",
            },
            {
              icon: Smartphone,
              title: "Works on any phone",
              body: "Mobile-first screens so site supervisors can mark attendance on the go.",
            },
            {
              icon: Repeat,
              title: "Exports when you need them",
              body: "CSV salary exports, PDF statements and a live Google Sheets register.",
            },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-[var(--primary)] shadow-sm">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-[var(--muted)]">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-600 px-6 py-14 text-center text-white sm:px-12">
            <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
            <h2 className="relative text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to close your next month in minutes?
            </h2>
            <p className="relative mx-auto mt-4 max-w-xl text-base text-indigo-100">
              Sign in to your Pillar workspace and bring your people, projects and
              payroll together.
            </p>
            <Link
              href="/login"
              className="relative mt-8 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-white px-6 py-3 text-base font-semibold text-[var(--primary)] shadow-lg transition hover:bg-indigo-50"
            >
              Sign in
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border)]">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-[var(--muted)] sm:flex-row sm:px-6">
          <Logo />
          <p>Construction workforce, payroll & billing — in one place.</p>
          <p>© {new Date().getFullYear()} Pillar</p>
        </div>
      </footer>
    </div>
  );
}
