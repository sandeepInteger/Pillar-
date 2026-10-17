"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import type {
  WorkQuantityUnit,
  WorkTypeConfig,
  WorkTypeFormData,
} from "@/types/database";
import { WORK_QUANTITY_UNIT_LABELS } from "@/types/database";
import {
  addWorkType,
  setWorkTypeActive,
  updateWorkType,
} from "@/lib/actions/workQuantity";
import { getEmptyWorkTypeForm } from "@/lib/utils/workQuantity";
import {
  formatIndianAmount,
  formatIndianRupee,
  sanitizeIndianAmountInput,
} from "@/lib/utils/raBills";

interface WorkTypesManagerProps {
  workTypes: WorkTypeConfig[];
  isAdmin: boolean;
}

const inputClass =
  "w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--primary-muted)]";

export function WorkTypesManager({ workTypes, isAdmin }: WorkTypesManagerProps) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState<WorkTypeFormData>(getEmptyWorkTypeForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<WorkTypeFormData>(getEmptyWorkTypeForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(action: () => Promise<{ error?: string } | { success: boolean }>) {
    setError(null);
    setLoading(true);
    const result = await action();
    setLoading(false);
    if (result && "error" in result && result.error) {
      setError(result.error);
      return false;
    }
    router.refresh();
    return true;
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    // Enter inside an edit row submits this shared form — save that row instead.
    if (editingId) return handleSaveEdit(editingId);
    if (await run(() => addWorkType(addForm))) {
      setAddForm(getEmptyWorkTypeForm());
      setShowAdd(false);
    }
  }

  async function handleSaveEdit(id: string) {
    if (await run(() => updateWorkType(id, editForm))) setEditingId(null);
  }

  function startEdit(type: WorkTypeConfig) {
    setEditingId(type.id);
    setEditForm({
      name: type.name,
      unit: type.unit,
      rate: formatIndianAmount(Number(type.rate)),
    });
  }

  function renderFields(
    form: WorkTypeFormData,
    setForm: (f: WorkTypeFormData) => void
  ) {
    return (
      <>
        <td className="px-4 py-2">
          <input
            required
            className={inputClass}
            placeholder="e.g. Scaffolding Work"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </td>
        <td className="px-4 py-2">
          <select
            className={inputClass}
            value={form.unit}
            onChange={(e) =>
              setForm({ ...form, unit: e.target.value as WorkQuantityUnit })
            }
          >
            {Object.entries(WORK_QUANTITY_UNIT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </td>
        <td className="px-4 py-2">
          <input
            type="text"
            inputMode="decimal"
            required
            className={`${inputClass} text-right`}
            placeholder="₹ per unit"
            value={form.rate}
            onChange={(e) =>
              setForm({ ...form, rate: sanitizeIndianAmountInput(e.target.value) })
            }
          />
        </td>
      </>
    );
  }

  return (
    <section className="pillar-card space-y-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Work types &amp; rates</h2>
          <p className="text-sm text-[var(--muted)]">
            Fixed rate per measuring unit. Each log uses the rate set here at the
            time of logging — changing a rate does not change past entries.
          </p>
        </div>
        {isAdmin && !showAdd && (
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-3 py-2 text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            Add work type
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleAdd} className="overflow-x-auto">
        <table className="min-w-[620px] w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left text-xs uppercase tracking-wide text-[var(--muted)]">
              <th className="px-4 py-2 font-semibold">Work type</th>
              <th className="px-4 py-2 font-semibold">Measuring unit</th>
              <th className="px-4 py-2 font-semibold text-right">Rate (₹ / unit)</th>
              {isAdmin && <th className="px-4 py-2 font-semibold text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {workTypes.length === 0 && !showAdd && (
              <tr>
                <td
                  colSpan={isAdmin ? 4 : 3}
                  className="px-4 py-6 text-center text-[var(--muted)]"
                >
                  No work types yet.
                </td>
              </tr>
            )}
            {workTypes.map((type) =>
              editingId === type.id ? (
                <tr key={type.id} className="border-b border-[var(--border)]">
                  {renderFields(editForm, setEditForm)}
                  <td className="px-4 py-2 text-right whitespace-nowrap">
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => handleSaveEdit(type.id)}
                      className="text-xs font-medium text-[var(--primary)] hover:underline disabled:opacity-60"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="ml-3 text-xs font-medium text-[var(--muted)] hover:underline"
                    >
                      Cancel
                    </button>
                  </td>
                </tr>
              ) : (
                <tr
                  key={type.id}
                  className={`border-b border-[var(--border)] last:border-0 ${
                    type.is_active ? "" : "text-[var(--muted)]"
                  }`}
                >
                  <td className="px-4 py-3 font-medium">
                    {type.name}
                    {!type.is_active && (
                      <span className="ml-2 text-xs font-normal">(inactive)</span>
                    )}
                  </td>
                  <td className="px-4 py-3">{WORK_QUANTITY_UNIT_LABELS[type.unit]}</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatIndianRupee(Number(type.rate))} / {type.unit.toUpperCase()}
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => startEdit(type)}
                        className="text-xs font-medium text-[var(--primary)] hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() =>
                          run(() => setWorkTypeActive(type.id, !type.is_active))
                        }
                        className="ml-3 text-xs font-medium text-[var(--muted)] hover:underline disabled:opacity-60"
                      >
                        {type.is_active ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  )}
                </tr>
              )
            )}
            {isAdmin && showAdd && (
              <tr>
                {renderFields(addForm, setAddForm)}
                <td className="px-4 py-2 text-right whitespace-nowrap">
                  <button
                    type="submit"
                    disabled={loading}
                    className="text-xs font-medium text-[var(--primary)] hover:underline disabled:opacity-60"
                  >
                    {loading ? "Saving…" : "Add"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAdd(false)}
                    className="ml-3 text-xs font-medium text-[var(--muted)] hover:underline"
                  >
                    Cancel
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </form>
    </section>
  );
}
