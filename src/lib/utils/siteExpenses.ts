import type {
  ExpenseCategory,
  SiteExpense,
  SiteExpenseCategoryTotal,
  SiteExpenseFormData,
  SiteExpenseSummary,
} from "@/types/database";

export function getEmptySiteExpenseForm(
  projectId = "",
  category = ""
): SiteExpenseFormData {
  return {
    project_id: projectId,
    expense_date: new Date().toISOString().slice(0, 10),
    category,
    amount: "",
    paid_to: "",
    payment_mode: "cash",
    notes: "",
  };
}

/** "Petrol / Diesel" -> "petrol_diesel" (stable code stored on each expense). */
export function expenseCategoryCodeFromName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function getExpenseCategoryName(
  categories: Pick<ExpenseCategory, "code" | "name">[],
  code: string
): string {
  return categories.find((c) => c.code === code)?.name ?? code;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function summarizeSiteExpenses(
  expenses: Pick<SiteExpense, "category" | "amount">[],
  categories: Pick<ExpenseCategory, "code" | "name" | "is_active">[]
): SiteExpenseSummary {
  const byCategory = new Map<string, SiteExpenseCategoryTotal>();
  for (const c of categories) {
    if (!c.is_active) continue;
    byCategory.set(c.code, {
      category: c.code,
      name: c.name,
      totalAmount: 0,
      entryCount: 0,
    });
  }

  let totalAmount = 0;
  for (const expense of expenses) {
    const bucket = byCategory.get(expense.category) ?? {
      category: expense.category,
      name: getExpenseCategoryName(categories, expense.category),
      totalAmount: 0,
      entryCount: 0,
    };
    const amount = Number(expense.amount);
    bucket.totalAmount = round2(bucket.totalAmount + amount);
    bucket.entryCount += 1;
    totalAmount += amount;
    byCategory.set(expense.category, bucket);
  }

  return {
    entryCount: expenses.length,
    totalAmount: round2(totalAmount),
    byCategory: Array.from(byCategory.values()),
  };
}

export interface SiteExpenseDay<T> {
  date: string;
  expenses: T[];
  totalAmount: number;
}

/**
 * Every calendar day of `month` (YYYY-MM), newest first, with that day's
 * expenses. Days with nothing spent come back empty so the list can show nil.
 * Future days of the current month are left out.
 */
export function groupSiteExpensesByDay<
  T extends Pick<SiteExpense, "expense_date" | "amount">,
>(
  expenses: T[],
  month: string,
  today = new Date().toISOString().slice(0, 10)
): SiteExpenseDay<T>[] {
  const [year, m] = month.split("-").map(Number);
  const lastDay = new Date(year, m, 0).getDate();
  const byDate = new Map<string, T[]>();
  for (const expense of expenses) {
    const list = byDate.get(expense.expense_date) ?? [];
    list.push(expense);
    byDate.set(expense.expense_date, list);
  }

  const days: SiteExpenseDay<T>[] = [];
  for (let d = lastDay; d >= 1; d--) {
    const date = `${month}-${String(d).padStart(2, "0")}`;
    if (date > today) continue;
    const dayExpenses = byDate.get(date) ?? [];
    days.push({
      date,
      expenses: dayExpenses,
      totalAmount: round2(dayExpenses.reduce((s, e) => s + Number(e.amount), 0)),
    });
  }
  return days;
}
