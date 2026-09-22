"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import type {
  EmployeeSalaryDetail,
  SalaryPaymentFormData,
  SalaryPaymentMode,
  SalaryPaymentType,
} from "@/types/database";
import {
  SALARY_PAYMENT_APP_OPTIONS,
  SALARY_PAYMENT_MODE_LABELS,
  SALARY_PAYMENT_TYPE_LABELS,
} from "@/types/database";
import {
  addSalaryPayment,
  deleteSalaryPayment,
  updateSalaryPayment,
} from "@/lib/actions/salary";
import {
  addMonths,
  formatCurrency,
  formatMonthLabel,
  formatPaymentDetails,
  getEmptySalaryPaymentForm,
  getPrimaryPayment,
  paymentToFormData,
} from "@/lib/utils/salary";
import { formatDate } from "@/lib/utils/employees";

interface EmployeeSalaryLedgerProps {
  detail: EmployeeSalaryDetail;
  employeeType?: string;
  projectId?: string;
  /** Base route for the month prev/next links — defaults to the standalone Salary page. */
  basePath?: string;
  isAdmin: boolean;
}

const PURPOSE_OPTIONS: SalaryPaymentType[] = [
  "advance",
  "weekly_kharcha",
  "salary",
  "bonus",
  "deduction",
];

export function EmployeeSalaryLedger({
  detail,
  employeeType,
  projectId,
  basePath = "/salary",
  isAdmin,
}: EmployeeSalaryLedgerProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<SalaryPaymentFormData>(
    getEmptySalaryPaymentForm()
  );

  const prevMonth = addMonths(detail.month, -1);
  const nextMonth = addMonths(detail.month, 1);
  const isEditing = editingId != null;

  function buildMonthHref(targetMonth: string) {
    const params = new URLSearchParams();
    params.set("month", targetMonth);
    if (employeeType && employeeType !== "all") params.set("type", employeeType);
    if (projectId) params.set("project", projectId);
    return `${basePath}/${detail.employee.id}?${params.toString()}`;
  }

  let runningBalance = 0;
  const ledgerWithBalance = detail.ledger.map((entry) => {
    runningBalance += entry.earned - entry.paidOut;
    return { ...entry, balance: runningBalance };
  });

  function updateField<K extends keyof SalaryPaymentFormData>(
    key: K,
    value: SalaryPaymentFormData[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleModeChange(mode: SalaryPaymentMode) {
    setForm((prev) => ({
      ...prev,
      payment_mode: mode,
      payment_app: mode === "upi" ? SALARY_PAYMENT_APP_OPTIONS[0] : "",
      payment_reference: "",
    }));
  }

  function openCreateForm() {
    setEditingId(null);
    setForm(getEmptySalaryPaymentForm());
    setError(null);
    setShowForm(true);
  }

  function openEditForm(paymentId: string) {
    const payment = detail.payments.find((p) => p.id === paymentId);
    if (!payment) return;
    setEditingId(paymentId);
    setForm(paymentToFormData(payment));
    setError(null);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(getEmptySalaryPaymentForm());
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = isEditing
      ? await updateSalaryPayment(editingId!, detail.employee.id, form)
      : await addSalaryPayment(detail.employee.id, {
          ...form,
          month: detail.month,
        });

    if (result && "error" in result && result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    closeForm();
    setLoading(false);
    router.refresh();
  }

  async function handleDelete(paymentId: string) {
    if (!confirm("Delete this payment entry?")) return;
    setError(null);
    setLoading(true);

    const result = await deleteSalaryPayment(paymentId, detail.employee.id);

    if (result && "error" in result && result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    if (editingId === paymentId) closeForm();
    setLoading(false);
    router.refresh();
  }

  const inputClass =
    "w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--primary-muted)]";
  const labelClass = "mb-1 block text-sm font-medium text-gray-700";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-white px-4 py-3">
        <Link
          href={buildMonthHref(prevMonth)}
          className="text-sm font-medium text-gray-600 hover:text-[var(--primary)]"
        >
          ← {formatMonthLabel(prevMonth)}
        </Link>
        <p className="text-sm font-semibold">{formatMonthLabel(detail.month)}</p>
        <Link
          href={buildMonthHref(nextMonth)}
          className="text-sm font-medium text-gray-600 hover:text-[var(--primary)]"
        >
          {formatMonthLabel(nextMonth)} →
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <div className="rounded-xl border border-[var(--border)] bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
            Opening balance
          </p>
          <p className="mt-1 text-2xl font-bold text-amber-700">
            {formatCurrency(detail.openingBalance)}
          </p>
          {detail.openingBalance !== 0 && (
            <p className="mt-1 text-xs text-[var(--muted)]">
              Carried from earlier months
            </p>
          )}
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
            Man-days
          </p>
          <p className="mt-1 text-2xl font-bold">{detail.manDays}</p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
            SL / Absent
          </p>
          <p className="mt-1 text-2xl font-bold">
            {detail.slDays} / {detail.absentDays}
          </p>
          {detail.slAllowance > 0 && (
            <p className="mt-1 text-xs text-[var(--muted)]">
              {detail.slAllowance} SL allowed/mo
            </p>
          )}
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
            Gross earned
          </p>
          <p className="mt-1 text-2xl font-bold text-[var(--primary)]">
            {detail.grossAmount != null
              ? formatCurrency(detail.grossAmount)
              : "—"}
          </p>
          {detail.salaryDeduction > 0 && (
            <p className="mt-1 text-xs text-amber-700">
              −{formatCurrency(detail.salaryDeduction)} deduction
            </p>
          )}
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
            This month paid
          </p>
          <p className="mt-1 text-2xl font-bold">
            {formatCurrency(detail.totalPaidOut)}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
            Total balance due
          </p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">
            {detail.balanceDue != null
              ? formatCurrency(detail.balanceDue)
              : "—"}
          </p>
          {detail.monthBalance != null && detail.monthBalance !== detail.balanceDue && (
            <p className="mt-1 text-xs text-[var(--muted)]">
              This month net: {formatCurrency(detail.monthBalance)}
            </p>
          )}
        </div>
      </div>

      {getPrimaryPayment(detail.employee) && (
        <p className="text-sm text-[var(--muted)]">
          Saved payout on profile: {getPrimaryPayment(detail.employee)}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Salary ledger</h2>
        {isAdmin && (
          <button
            type="button"
            onClick={openCreateForm}
            className="pillar-btn-primary inline-flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Record payment
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {isAdmin && showForm && (
        <form
          onSubmit={handleSubmit}
          className="pillar-card grid gap-4 p-5 sm:grid-cols-2"
        >
          <h3 className="sm:col-span-2 text-base font-semibold">
            {isEditing ? "Edit payment" : "Record payment"}
          </h3>

          <div>
            <label className={labelClass}>Date *</label>
            <input
              type="date"
              required
              className={inputClass}
              value={form.payment_date}
              onChange={(e) => updateField("payment_date", e.target.value)}
            />
          </div>

          <div>
            <label className={labelClass}>Amount (₹) *</label>
            <input
              type="number"
              min="1"
              step="1"
              required
              className={inputClass}
              placeholder="e.g. 1500"
              value={form.amount}
              onChange={(e) => updateField("amount", e.target.value)}
            />
          </div>

          <div>
            <label className={labelClass}>For what? *</label>
            <select
              className={inputClass}
              value={form.payment_type}
              onChange={(e) =>
                updateField("payment_type", e.target.value as SalaryPaymentType)
              }
            >
              {PURPOSE_OPTIONS.map((value) => (
                <option key={value} value={value}>
                  {SALARY_PAYMENT_TYPE_LABELS[value]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Mode of payment *</label>
            <select
              className={inputClass}
              value={form.payment_mode}
              onChange={(e) =>
                handleModeChange(e.target.value as SalaryPaymentMode)
              }
            >
              {Object.entries(SALARY_PAYMENT_MODE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {form.payment_mode === "upi" && (
            <>
              <div>
                <label className={labelClass}>UPI app used *</label>
                <select
                  className={inputClass}
                  value={form.payment_app}
                  onChange={(e) => updateField("payment_app", e.target.value)}
                >
                  {SALARY_PAYMENT_APP_OPTIONS.map((app) => (
                    <option key={app} value={app}>
                      {app}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>UPI ID *</label>
                <input
                  className={inputClass}
                  placeholder="name@upi or mobile UPI"
                  value={form.payment_reference}
                  onChange={(e) =>
                    updateField("payment_reference", e.target.value)
                  }
                  required
                />
              </div>
            </>
          )}

          {form.payment_mode === "bank" && (
            <div className="sm:col-span-2">
              <label className={labelClass}>Account number *</label>
              <input
                className={inputClass}
                placeholder="Account number used for transfer"
                value={form.payment_reference}
                onChange={(e) =>
                  updateField("payment_reference", e.target.value)
                }
                required
              />
            </div>
          )}

          <div className={form.payment_mode === "cash" ? "sm:col-span-2" : ""}>
            <label className={labelClass}>Notes</label>
            <input
              className={inputClass}
              placeholder="Optional remark"
              value={form.notes}
              onChange={(e) => updateField("notes", e.target.value)}
            />
          </div>

          <div className="flex gap-2 sm:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className="pillar-btn-primary"
            >
              {loading
                ? "Saving…"
                : isEditing
                  ? "Update payment"
                  : "Save payment"}
            </button>
            <button
              type="button"
              onClick={closeForm}
              className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-white">
        <table className="min-w-[960px] w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--background)] text-left text-xs uppercase tracking-wide text-[var(--muted)]">
              <th className="px-4 py-3 font-semibold">Date</th>
              <th className="px-4 py-3 font-semibold">For what</th>
              <th className="px-4 py-3 font-semibold">Mode</th>
              <th className="px-4 py-3 font-semibold">App / Reference</th>
              <th className="px-4 py-3 font-semibold text-right">Amount</th>
              <th className="px-4 py-3 font-semibold text-right">Earned</th>
              <th className="px-4 py-3 font-semibold text-right">Balance</th>
              <th className="px-4 py-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {ledgerWithBalance.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-10 text-center text-[var(--muted)]"
                >
                  No entries this month yet. Unpaid salary from earlier months
                  appears as opening balance. Salary is posted at month-end when
                  attendance is complete.
                </td>
              </tr>
            ) : (
              ledgerWithBalance.map((entry) => (
                <tr
                  key={entry.id}
                  className={`border-b border-[var(--border)] last:border-0 ${
                    entry.isCalculated ? "bg-[var(--primary-light)]/30" : ""
                  } ${editingId === entry.id ? "ring-1 ring-inset ring-[var(--primary)]" : ""}`}
                >
                  <td className="px-4 py-3 tabular-nums">
                    {formatDate(entry.date)}
                  </td>
                  <td className="px-4 py-3">{entry.label}</td>
                  <td className="px-4 py-3">
                    {entry.paymentMode
                      ? SALARY_PAYMENT_MODE_LABELS[entry.paymentMode]
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    {entry.isCalculated
                      ? "—"
                      : formatPaymentDetails({
                          payment_mode: entry.paymentMode,
                          payment_app: entry.paymentApp,
                          payment_reference: entry.paymentReference,
                        })}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-red-600">
                    {entry.paidOut !== 0
                      ? entry.paidOut < 0
                        ? `−${formatCurrency(Math.abs(entry.paidOut))}`
                        : formatCurrency(entry.paidOut)
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-emerald-700">
                    {entry.earned !== 0 ? formatCurrency(entry.earned) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-medium tabular-nums">
                    {formatCurrency(entry.balance)}
                  </td>
                  <td className="px-4 py-3">
                    {isAdmin && !entry.isCalculated && entry.id !== "earned" && entry.id !== "opening" && (
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEditForm(entry.id)}
                          disabled={loading}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-[var(--primary-light)] hover:text-[var(--primary)]"
                          title="Edit payment"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(entry.id)}
                          disabled={loading}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                          title="Delete payment"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {ledgerWithBalance.length > 0 && (
            <tfoot>
              <tr className="bg-[var(--background)] font-semibold">
                <td className="px-4 py-3" colSpan={4}>
                  Month closing balance
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {formatCurrency(detail.totalPaidOut)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {formatCurrency(
                    detail.openingBalance + (detail.grossAmount ?? 0)
                  )}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-[var(--primary)]">
                  {detail.balanceDue != null
                    ? formatCurrency(detail.balanceDue)
                    : "—"}
                </td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
