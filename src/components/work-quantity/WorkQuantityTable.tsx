"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import type {
  Project,
  WorkQuantityFormData,
  WorkQuantityLogWithProject,
  WorkQuantitySummary,
  WorkType,
  WorkQuantityUnit,
} from "@/types/database";
import { WORK_TYPE_DISPLAY_ORDER, WORK_TYPE_LABELS, WORK_QUANTITY_UNIT_LABELS } from "@/types/database";
import { addWorkQuantityLog, deleteWorkQuantityLog } from "@/lib/actions/workQuantity";
import {
  formatQuantity,
  getEmptyWorkQuantityForm,
  sanitizeQuantityInput,
} from "@/lib/utils/workQuantity";
import { formatDate } from "@/lib/utils/employees";

interface WorkQuantityTableProps {
  logs: WorkQuantityLogWithProject[];
  summary: WorkQuantitySummary;
  projects: Project[];
  isAdmin: boolean;
}

const inputClass =
  "w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--primary-muted)]";
const labelClass = "mb-1 block text-sm font-medium text-gray-700";

export function WorkQuantityTable({
  logs,
  summary,
  projects,
  isAdmin,
}: WorkQuantityTableProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<WorkQuantityFormData>(() =>
    getEmptyWorkQuantityForm(projects[0]?.id ?? "")
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

    setForm(getEmptyWorkQuantityForm(form.project_id));
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
      <div className="grid gap-3 sm:grid-cols-2">
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
                {WORK_TYPE_LABELS[bucket.workType]}
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
          <div>
            <label className={labelClass}>Work type *</label>
            <select
              className={inputClass}
              value={form.work_type}
              onChange={(e) => updateField("work_type", e.target.value as WorkType)}
            >
              {WORK_TYPE_DISPLAY_ORDER.map((type) => (
                <option key={type} value={type}>
                  {WORK_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Quantity *</label>
            <input
              type="text"
              inputMode="decimal"
              required
              className={inputClass}
              placeholder="e.g. 250"
              value={form.quantity}
              onChange={(e) =>
                updateField("quantity", sanitizeQuantityInput(e.target.value))
              }
            />
          </div>
          <div>
            <label className={labelClass}>Unit *</label>
            <select
              className={inputClass}
              value={form.unit}
              onChange={(e) => updateField("unit", e.target.value as WorkQuantityUnit)}
            >
              {Object.entries(WORK_QUANTITY_UNIT_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
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

      <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-white">
        <table className="min-w-[760px] w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--background)] text-left text-xs uppercase tracking-wide text-[var(--muted)]">
              <th className="px-4 py-3 font-semibold">Date</th>
              <th className="px-4 py-3 font-semibold">Project</th>
              <th className="px-4 py-3 font-semibold">Work type</th>
              <th className="px-4 py-3 font-semibold text-right">Quantity</th>
              <th className="px-4 py-3 font-semibold">Notes</th>
              {isAdmin && <th className="px-4 py-3 font-semibold text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td
                  colSpan={isAdmin ? 6 : 5}
                  className="px-4 py-10 text-center text-[var(--muted)]"
                >
                  No work quantity entries yet.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr
                  key={log.id}
                  className="border-b border-[var(--border)] last:border-0"
                >
                  <td className="px-4 py-3 tabular-nums">
                    {formatDate(log.work_date)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium">{log.projects.name}</span>
                    <span className="block text-xs text-[var(--muted)]">
                      {log.projects.project_code}
                    </span>
                  </td>
                  <td className="px-4 py-3">{WORK_TYPE_LABELS[log.work_type]}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium">
                    {formatQuantity(Number(log.quantity), log.unit)}
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
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
