"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type {
  WorkQuantityFormData,
  WorkQuantityLog,
  WorkQuantityUnit,
  WorkTypeConfig,
} from "@/types/database";
import { addWorkQuantityLog, deleteWorkQuantityLog } from "@/lib/actions/workQuantity";
import {
  formatQuantity,
  getEmptyWorkQuantityForm,
  getWorkTypeName,
  summarizeWorkQuantity,
} from "@/lib/utils/workQuantity";
import { formatIndianRupee } from "@/lib/utils/raBills";
import { formatDate } from "@/lib/utils/employees";
import { WorkTypeQuantityFields } from "@/components/work-quantity/WorkTypeQuantityFields";

interface ProjectWorkQuantityPanelProps {
  projectId: string;
  logs: WorkQuantityLog[];
  workTypes: WorkTypeConfig[];
  isAdmin: boolean;
}

const inputClass =
  "w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--primary-muted)]";
const labelClass = "mb-1 block text-sm font-medium text-gray-700";

export function ProjectWorkQuantityPanel({
  projectId,
  logs,
  workTypes,
  isAdmin,
}: ProjectWorkQuantityPanelProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<WorkQuantityFormData>(() =>
    getEmptyWorkQuantityForm(projectId)
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const summary = summarizeWorkQuantity(logs, workTypes);

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

    setForm(getEmptyWorkQuantityForm(projectId, form.work_type));
    setShowForm(false);
    setLoading(false);
    router.refresh();
  }

  async function handleDelete(logId: string) {
    if (!confirm("Delete this work quantity entry?")) return;
    const result = await deleteWorkQuantityLog(logId, projectId);
    if (result && "error" in result && result.error) {
      alert(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <section className="mt-8 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Work Quantity</h2>
          <p className="text-sm text-[var(--muted)]">
            Daily work performed on this site — {formatIndianRupee(summary.totalAmount)} total value
          </p>
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="pillar-btn-primary text-sm"
          >
            Log work
          </button>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
              <p className="text-xs text-[var(--muted)]">
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
                {formatIndianRupee(bucket.totalAmount)}
              </p>
            </div>
          );
        })}
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
          <div className="flex gap-2 sm:col-span-2">
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

      {logs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] bg-white p-8 text-center text-sm text-[var(--muted)]">
          No work quantity logged for this project yet.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-white">
          <table className="min-w-[720px] w-full text-sm">
            <thead>
              <tr className="border-b bg-[var(--background)] text-left text-xs uppercase text-[var(--muted)]">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Work type</th>
                <th className="px-4 py-3 text-right">Quantity</th>
                <th className="px-4 py-3 text-right">Rate</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3">Notes</th>
                {isAdmin && <th className="px-4 py-3 w-20" />}
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b last:border-0">
                  <td className="px-4 py-3 whitespace-nowrap">
                    {formatDate(log.work_date)}
                  </td>
                  <td className="px-4 py-3">
                    {getWorkTypeName(workTypes, log.work_type)}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums">
                    {formatQuantity(Number(log.quantity), log.unit)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-[var(--muted)]">
                    {log.rate == null
                      ? "—"
                      : `${formatIndianRupee(Number(log.rate))} / ${log.unit.toUpperCase()}`}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums">
                    {log.amount == null ? "—" : formatIndianRupee(Number(log.amount))}
                  </td>
                  <td className="px-4 py-3 text-[var(--muted)]">
                    {log.notes || "—"}
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(log.id)}
                        className="text-xs font-medium text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
