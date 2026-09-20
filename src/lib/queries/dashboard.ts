import { createClient } from "@/lib/supabase/server";
import type {
  MonthRaBillStats,
  MonthSalaryTotals,
  RaBillSummary,
  RaBillWithProject,
} from "@/types/database";
import { getAnalyticsData } from "@/lib/queries/analytics";
import { getRaBills, summarizeRaBills } from "@/lib/queries/raBills";
import { getCurrentMonth, formatMonthLabel } from "@/lib/utils/salary";
import { getRaBillPaymentStatus } from "@/lib/utils/raBills";

export interface DashboardRecentInflow {
  id: string;
  received_date: string;
  amount: number;
  reference_note: string | null;
  project_id: string;
  project_name: string;
  project_code: string;
}

export interface DashboardOverview {
  monthLabel: string;
  raBill: RaBillSummary;
  pendingRaBills: RaBillWithProject[];
  salaryMonth: MonthSalaryTotals | null;
  raBillsMonth: MonthRaBillStats | null;
  bankInflowThisMonth: number;
  bankInflowAllTime: number;
  recentInflows: DashboardRecentInflow[];
}

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

async function getGlobalBankInflowFigures(): Promise<{
  thisMonth: number;
  allTime: number;
  recent: DashboardRecentInflow[];
}> {
  const supabase = await createClient();
  const month = getCurrentMonth();

  const [totalsRes, recentRes] = await Promise.all([
    supabase.from("project_bank_inflows").select("amount, received_date"),
    supabase
      .from("project_bank_inflows")
      .select(
        `
      id,
      received_date,
      amount,
      reference_note,
      project_id,
      projects (name, project_code)
    `
      )
      .order("received_date", { ascending: false })
      .limit(6),
  ]);

  if (totalsRes.error) {
    console.error("getGlobalBankInflowFigures:", totalsRes.error.message);
    return { thisMonth: 0, allTime: 0, recent: [] };
  }

  let thisMonth = 0;
  let allTime = 0;

  for (const row of totalsRes.data ?? []) {
    const amount = Number(row.amount);
    allTime += amount;
    if (String(row.received_date).startsWith(month)) {
      thisMonth += amount;
    }
  }

  const recent: DashboardRecentInflow[] = [];
  for (const row of recentRes.data ?? []) {
    const projects = row.projects as
      | { name: string; project_code: string }
      | { name: string; project_code: string }[]
      | null;
    const p = Array.isArray(projects) ? projects[0] : projects;
    recent.push({
      id: row.id as string,
      received_date: row.received_date as string,
      amount: Number(row.amount),
      reference_note: (row.reference_note as string | null) ?? null,
      project_id: row.project_id as string,
      project_name: p?.name ?? "Project",
      project_code: p?.project_code ?? "",
    });
  }

  return {
    thisMonth: roundMoney(thisMonth),
    allTime: roundMoney(allTime),
    recent,
  };
}

export async function getDashboardOverview(): Promise<DashboardOverview> {
  const month = getCurrentMonth();

  const [allRaBills, bank, analytics] = await Promise.all([
    getRaBills(),
    getGlobalBankInflowFigures(),
    getAnalyticsData(month, month, month),
  ]);

  const raBill = summarizeRaBills(allRaBills);
  const pendingRaBills = allRaBills
    .filter((b) => getRaBillPaymentStatus(b) === "pending")
    .slice(0, 5);

  return {
    monthLabel: formatMonthLabel(month),
    raBill,
    pendingRaBills,
    salaryMonth: analytics.selectedMonthSalaryTotals,
    raBillsMonth: analytics.selectedMonthRaBills,
    bankInflowThisMonth: bank.thisMonth,
    bankInflowAllTime: bank.allTime,
    recentInflows: bank.recent,
  };
}
