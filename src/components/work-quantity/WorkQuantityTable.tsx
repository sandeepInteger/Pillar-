"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import type {
  Project,
  WorkQuantityFormData,
  WorkQuantityLogWithProject,
  WorkQuantitySummary,
  WorkQuantityUnit,
  WorkTypeConfig,
} from "@/types/database";
import { addWorkQuantityLog, deleteWorkQuantityLog } from "@/lib/actions/workQuantity";
import {
  formatQuantity,
  getEmptyWorkQuantityForm,
  getWorkTypeName,
  groupWorkQuantityByDay,
} from "@/lib/utils/workQuantity";
import { formatIndianRupee } from "@/lib/utils/raBills";
import { formatDate } from "@/lib/utils/employees";
import { formatMonthLabel } from "@/lib/utils/salary";
import { WorkTypeQuantityFields } from "@/components/work-quantity/WorkTypeQuantityFields";

interface WorkQuantityTableProps {
  logs: WorkQuantityLogWithProject[];
  summary: WorkQuantitySummary;
  projects: Project[];
  workTypes: WorkTypeConfig[];
  /** YYYY-MM shown in the date-wise list */
  month: string;
  isAdmin: boolean;
}

const inputClass =
  "w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--primary-muted)]";
const labelClass = "mb-1 block text-sm font-medium text-gray-700";

export function WorkQuantityTable({
  logs,
  summary,
  projects,
  workTypes,
  month,
  isAdmin,
}: WorkQuantityTableProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<WorkQuantityFormData>(() =>
    getEmptyWorkQuantityForm(projects[0]?.id ?? "")
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hideNilDays, setHideNilDays] = useState(false);

  const allDays = groupWorkQuantityByDay(logs, month);
  const days = hideNilDays ? allDays.filter((d) => d.logs.length > 0) : allDays;
  const workedDayCount = allDays.filter((d) => d.logs.length > 0).length;
  const colCount = isAdmin ? 9 : 8;

  function updateField<K extends keyof WorkQuantityFormData>(
    key: K,
    value: WorkQuantityFormData[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await addWorkQuantityLog(form);

    if (result && "error" in result && result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setForm(getEmptyWorkQuantityForm(form.project_id, form.work_type));
    setShowForm(false);
    setLoading(false);
    router.refresh();
  }

  async function handleDelete(logId: string, projectId: string) {
    if (!confirm("Delete this work quantity entry?")) return;
    const result = await deleteWorkQuantityLog(logId, projectId);
    if (result && "error" in result && result.error) {
      alert(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-[var(--border)] bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
            Total work value
          </p>
          <p className="mt-1 text-lg font-bold">
            {formatIndianRupee(summary.totalAmount)}
          </p>
          <p className="text-xs text-[var(--muted)]">
            {summary.entryCount} entr{summary.entryCount === 1 ? "y" : "ies"}
          </p>
        </div>
        {summary.byType.map((bucket) => {
          const units = Object.entries(bucket.totalsByUnit) as [
            WorkQuantityUnit,
            number,
          ][];
          return (
            <div
              key={bucket.workType}
              className="rounded-xl border border-[var(--border)] bg-white p-4"
            >
              <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
                {bucket.name}
              </p>
              {units.length === 0 ? (
                <p className="mt-1 text-lg font-bold text-[var(--muted)]">—</p>
              ) : (
                <p className="mt-1 text-lg font-bold">
                  {units
                    .map(([unit, qty]) => formatQuantity(qty, unit))
                    .join(" · ")}
                </p>
              )}
              <p className="text-xs text-[var(--muted)]">
                {formatIndianRupee(bucket.totalAmount)} ·{" "}
                {bucket.entryCount} entr{bucket.entryCount === 1 ? "y" : "ies"}
              </p>
            </div>
          );
        })}
      </div>

      {isAdmin && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="pillar-btn-primary inline-flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Log work
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
          <div>
            <label className={labelClass}>Project *</label>
            <select
              required
              className={inputClass}
              value={form.project_id}
              onChange={(e) => updateField("project_id", e.target.value)}
            >
              <option value="">Select project...</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Date *</label>
            <input
              type="date"
              required
              className={inputClass}
              value={form.work_date}
              onChange={(e) => updateField("work_date", e.target.value)}
            />
          </div>
          <WorkTypeQuantityFields
            form={form}
            workTypes={workTypes}
            onChange={(key, value) => updateField(key, value)}
            inputClass={inputClass}
            labelClass={labelClass}
          />
          <div>
            <label className={labelClass}>Notes</label>
            <input
              className={inputClass}
              placeholder="Optional remark"
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
              {loading ? "Saving…" : "Save entry"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[var(--muted)]">
          <span className="font-semibold text-gray-700">{formatMonthLabel(month)}</span>
          {" · "}
          {workedDayCount} of {allDays.length} day{allDays.length === 1 ? "" : "s"} with work
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
        <table className="min-w-[1000px] w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--background)] text-left text-xs uppercase tracking-wide text-[var(--muted)]">
              <th className="px-4 py-3 font-semibold">Date</th>
              <th className="px-4 py-3 font-semibold">Project</th>
              <th className="px-4 py-3 font-semibold">Work type</th>
              <th className="px-4 py-3 font-semibold text-right">Quantity</th>
              <th className="px-4 py-3 font-semibold text-right">Rate</th>
              <th className="px-4 py-3 font-semibold text-right">Amount</th>
              <th className="px-4 py-3 font-semibold">Notes</th>
              {isAdmin && <th className="px-4 py-3 font-semibold text-right">Actions</th>}
              <th className="px-4 py-3 font-semibold text-right">Day total</th>
            </tr>
          </thead>
          <tbody>
            {days.length === 0 ? (
              <tr>
                <td colSpan={colCount} className="px-4 py-10 text-center text-[var(--muted)]">
                  No work logged in {formatMonthLabel(month)}.
                </td>
              </tr>
            ) : (
              days.map((day) =>
                day.logs.length === 0 ? (
                  <tr
                    key={day.date}
                    className="border-b border-[var(--border)] bg-[var(--background)] last:border-0"
                  >
                    <td className="px-4 py-2 tabular-nums whitespace-nowrap text-[var(--muted)]">
                      {formatDate(day.date)}
                    </td>
                    <td
                      colSpan={colCount - 2}
                      className="px-4 py-2 text-xs italic text-[var(--muted)]"
                    >
                      Nil — no work logged
                    </td>
                    <td className="px-4 py-2 text-right text-[var(--muted)]">—</td>
                  </tr>
                ) : (
                  day.logs.map((log, i) => (
                      <tr
                        key={log.id}
                        className={`align-top last:border-0 ${
                          i === day.logs.length - 1 ? "border-b border-[var(--border)]" : ""
                        }`}
                      >
                        {i === 0 && (
                          <td
                            rowSpan={day.logs.length}
                            className="px-4 py-3 tabular-nums font-medium whitespace-nowrap"
                          >
                            {formatDate(day.date)}
                            {day.logs.length > 1 && (
                              <span className="block text-xs font-normal text-[var(--muted)]">
                                {day.logs.length} entries
                              </span>
                            )}
                          </td>
                        )}
                        <td className="px-4 py-3">
                          <span className="font-medium">{log.projects.name}</span>
                          <span className="block text-xs text-[var(--muted)]">
                            {log.projects.project_code}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {getWorkTypeName(workTypes, log.work_type)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums font-medium">
                          {formatQuantity(Number(log.quantity), log.unit)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-[var(--muted)]">
                          {log.rate == null
                            ? "—"
                            : `${formatIndianRupee(Number(log.rate))} / ${log.unit.toUpperCase()}`}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums font-medium">
                          {log.amount == null ? "—" : formatIndianRupee(Number(log.amount))}
                        </td>
                        <td className="px-4 py-3 text-[var(--muted)]">
                          {log.notes || "—"}
                        </td>
                        {isAdmin && (
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleDelete(log.id, log.project_id)}
                              className="text-xs font-medium text-red-600 hover:underline"
                            >
                              Delete
                            </button>
                          </td>
                        )}
                        {i === 0 && (
                          <td
                            rowSpan={day.logs.length}
                            className="px-4 py-3 text-right tabular-nums font-semibold"
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
