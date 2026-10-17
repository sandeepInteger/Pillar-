"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import type {
  ExpenseCategory,
  Project,
  SalaryPaymentMode,
  SiteExpenseFormData,
  SiteExpenseSummary,
  SiteExpenseWithProject,
} from "@/types/database";
import { SALARY_PAYMENT_MODE_LABELS } from "@/types/database";
import { addSiteExpense, deleteSiteExpense } from "@/lib/actions/siteExpenses";
import {
  getEmptySiteExpenseForm,
  getExpenseCategoryName,
  groupSiteExpensesByDay,
} from "@/lib/utils/siteExpenses";
import { formatIndianRupee, sanitizeIndianAmountInput } from "@/lib/utils/raBills";
import { formatDate } from "@/lib/utils/employees";
import { formatMonthLabel } from "@/lib/utils/salary";

interface SiteExpenseTableProps {
  expenses: SiteExpenseWithProject[];
  summary: SiteExpenseSummary;
  categories: ExpenseCategory[];
  /** YYYY-MM shown in the date-wise list */
  month: string;
  isAdmin: boolean;
  /** All sites, for the site picker (main page) */
  projects?: Project[];
  /** Project page: site is fixed, so no site picker / column */
  fixedProjectId?: string;
}

const inputClass =
  "w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--primary-muted)]";
const labelClass = "mb-1 block text-sm font-medium text-gray-700";

export function SiteExpenseTable({
  expenses,
  summary,
  categories,
  month,
  isAdmin,
  projects = [],
  fixedProjectId,
}: SiteExpenseTableProps) {
  const router = useRouter();
  const activeCategories = categories.filter((c) => c.is_active);
  const defaultProjectId = fixedProjectId ?? projects[0]?.id ?? "";
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<SiteExpenseFormData>(() =>
    getEmptySiteExpenseForm(defaultProjectId)
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hideNilDays, setHideNilDays] = useState(!!fixedProjectId);

  const showProject = !fixedProjectId;
  const allDays = groupSiteExpensesByDay(expenses, month);
  const days = hideNilDays ? allDays.filter((d) => d.expenses.length > 0) : allDays;
  const spentDayCount = allDays.filter((d) => d.expenses.length > 0).length;
  const colCount = 6 + (showProject ? 1 : 0) + (isAdmin ? 1 : 0);

  function updateField<K extends keyof SiteExpenseFormData>(
    key: K,
    value: SiteExpenseFormData[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await addSiteExpense(form);

    if (result && "error" in result && result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    // Keep site, date, category and mode for quick back-to-back entries
    setForm((prev) => ({ ...prev, amount: "", paid_to: "", notes: "" }));
    setLoading(false);
    router.refresh();
  }

  async function handleDelete(expenseId: string, projectId: string) {
    if (!confirm("Delete this expense?")) return;
    const result = await deleteSiteExpense(expenseId, projectId);
    if (result && "error" in result && result.error) {
      alert(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-[var(--border)] bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
            Total spent · {formatMonthLabel(month)}
          </p>
          <p className="mt-1 text-lg font-bold text-red-700">
            {formatIndianRupee(summary.totalAmount)}
          </p>
          <p className="text-xs text-[var(--muted)]">
            {summary.entryCount} entr{summary.entryCount === 1 ? "y" : "ies"}
          </p>
        </div>
        {summary.byCategory
          .filter((b) => b.entryCount > 0)
          .map((bucket) => (
            <div
              key={bucket.category}
              className="rounded-xl border border-[var(--border)] bg-white p-4"
            >
              <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
                {bucket.name}
              </p>
              <p className="mt-1 text-lg font-bold">
                {formatIndianRupee(bucket.totalAmount)}
              </p>
              <p className="text-xs text-[var(--muted)]">
                {bucket.entryCount} entr{bucket.entryCount === 1 ? "y" : "ies"}
              </p>
            </div>
          ))}
      </div>

      {isAdmin && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="pillar-btn-primary inline-flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Log expense
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {isAdmin && showForm && (
        <form
          onSubmit={handleSubmit}
          className="pillar-card grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {showProject && (
            <div>
              <label className={labelClass}>Site *</label>
              <select
                required
                className={inputClass}
                value={form.project_id}
                onChange={(e) => updateField("project_id", e.target.value)}
              >
                <option value="">Select site...</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className={labelClass}>Date *</label>
            <input
              type="date"
              required
              className={inputClass}
              value={form.expense_date}
              onChange={(e) => updateField("expense_date", e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Category *</label>
            <select
              required
              className={inputClass}
              value={form.category}
              onChange={(e) => updateField("category", e.target.value)}
            >
              <option value="">Select category...</option>
              {activeCategories.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Amount (₹) *</label>
            <input
              type="text"
              inputMode="decimal"
              required
              className={inputClass}
              placeholder="e.g. 2,500"
              value={form.amount}
              onChange={(e) =>
                updateField("amount", sanitizeIndianAmountInput(e.target.value))
              }
            />
          </div>
          <div>
            <label className={labelClass}>Paid to</label>
            <input
              className={inputClass}
              placeholder="Person / vendor / pump"
              value={form.paid_to}
              onChange={(e) => updateField("paid_to", e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Payment mode *</label>
            <select
              className={inputClass}
              value={form.payment_mode}
              onChange={(e) =>
                updateField("payment_mode", e.target.value as SalaryPaymentMode)
              }
            >
              {Object.entries(SALARY_PAYMENT_MODE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className={showProject ? "" : "sm:col-span-2"}>
            <label className={labelClass}>Notes</label>
            <input
              className={inputClass}
              placeholder="What it was for, bill no., ..."
              value={form.notes}
              onChange={(e) => updateField("notes", e.target.value)}
            />
          </div>
          <div className="flex gap-2 sm:col-span-2 lg:col-span-3">
            <button
              type="submit"
              disabled={loading}
              className="pillar-btn-primary disabled:opacity-60"
            >
              {loading ? "Saving…" : "Save expense"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm"
            >
              Close
            </button>
          </div>
        </form>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[var(--muted)]">
          <span className="font-semibold text-gray-700">{formatMonthLabel(month)}</span>
          {" · "}
          {spentDayCount} of {allDays.length} day{allDays.length === 1 ? "" : "s"} with
          expenses
        </p>
        <label className="inline-flex items-center gap-2 text-sm text-[var(--muted)]">
          <input
            type="checkbox"
            checked={hideNilDays}
            onChange={(e) => setHideNilDays(e.target.checked)}
          />
          Hide nil days
        </label>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-white">
        <table className="min-w-[900px] w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--background)] text-left text-xs uppercase tracking-wide text-[var(--muted)]">
              <th className="px-4 py-3 font-semibold">Date</th>
              {showProject && <th className="px-4 py-3 font-semibold">Site</th>}
              <th className="px-4 py-3 font-semibold">Category</th>
              <th className="px-4 py-3 font-semibold">Paid to</th>
              <th className="px-4 py-3 font-semibold">Mode</th>
              <th className="px-4 py-3 font-semibold text-right">Amount</th>
              <th className="px-4 py-3 font-semibold">Notes</th>
              {isAdmin && <th className="px-4 py-3 font-semibold text-right">Actions</th>}
              <th className="px-4 py-3 font-semibold text-right">Day total</th>
            </tr>
          </thead>
          <tbody>
            {days.length === 0 ? (
              <tr>
                <td colSpan={colCount + 1} className="px-4 py-10 text-center text-[var(--muted)]">
                  No expenses logged in {formatMonthLabel(month)}.
                </td>
              </tr>
            ) : (
              days.map((day) =>
                day.expenses.length === 0 ? (
                  <tr
                    key={day.date}
                    className="border-b border-[var(--border)] bg-[var(--background)] last:border-0"
                  >
                    <td className="px-4 py-2 tabular-nums whitespace-nowrap text-[var(--muted)]">
                      {formatDate(day.date)}
                    </td>
                    <td
                      colSpan={colCount - 1}
                      className="px-4 py-2 text-xs italic text-[var(--muted)]"
                    >
                      Nil — no expense
                    </td>
                    <td className="px-4 py-2 text-right text-[var(--muted)]">—</td>
                  </tr>
                ) : (
                  day.expenses.map((expense, i) => (
                    <tr
                      key={expense.id}
                      className={`align-top last:border-0 ${
                        i === day.expenses.length - 1 ? "border-b border-[var(--border)]" : ""
                      }`}
                    >
                      {i === 0 && (
                        <td
                          rowSpan={day.expenses.length}
                          className="px-4 py-3 tabular-nums font-medium whitespace-nowrap"
                        >
                          {formatDate(day.date)}
                          {day.expenses.length > 1 && (
                            <span className="block text-xs font-normal text-[var(--muted)]">
                              {day.expenses.length} entries
                            </span>
                          )}
                        </td>
                      )}
                      {showProject && (
                        <td className="px-4 py-3">
                          <span className="font-medium">{expense.projects.name}</span>
                          <span className="block text-xs text-[var(--muted)]">
                            {expense.projects.project_code}
                          </span>
                        </td>
                      )}
                      <td className="px-4 py-3">
                        {getExpenseCategoryName(categories, expense.category)}
                      </td>
                      <td className="px-4 py-3">{expense.paid_to || "—"}</td>
                      <td className="px-4 py-3 text-[var(--muted)]">
                        {SALARY_PAYMENT_MODE_LABELS[expense.payment_mode] ?? expense.payment_mode}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium">
                        {formatIndianRupee(Number(expense.amount))}
                      </td>
                      <td className="px-4 py-3 text-[var(--muted)]">{expense.notes || "—"}</td>
                      {isAdmin && (
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleDelete(expense.id, expense.project_id)}
                            className="text-xs font-medium text-red-600 hover:underline"
                          >
                            Delete
                          </button>
                        </td>
                      )}
                      {i === 0 && (
                        <td
                          rowSpan={day.expenses.length}
                          className="px-4 py-3 text-right tabular-nums font-semibold text-red-700"
                        >
                          {formatIndianRupee(day.totalAmount)}
                        </td>
                      )}
                    </tr>
                  ))
                )
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
