"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ProjectBankInflow } from "@/types/database";
import {
  addProjectBankInflow,
  deleteProjectBankInflow,
} from "@/lib/actions/projectBankInflows";
import { summarizeInflowsByWeek } from "@/lib/utils/projectBankInflows";
import {
  formatIndianRupee,
  formatRaBillDate,
  sanitizeIndianAmountInput,
} from "@/lib/utils/raBills";

interface ProjectBankInflowPanelProps {
  projectId: string;
  inflows: ProjectBankInflow[];
  summary: { total: number; thisMonth: number; entryCount: number };
  isAdmin: boolean;
}

const labelClass = "mb-1 block text-sm font-medium text-gray-700";
const inputClass =
  "w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]";

export function ProjectBankInflowPanel({
  projectId,
  inflows,
  summary,
  isAdmin,
}: ProjectBankInflowPanelProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const byWeek = summarizeInflowsByWeek(inflows);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await addProjectBankInflow(projectId, {
      received_date: date,
      amount,
      reference_note: note,
    });
    if (result && "error" in result && result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }
    setAmount("");
    setNote("");
    setLoading(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this bank inflow entry?")) return;
    setError(null);
    const result = await deleteProjectBankInflow(id, projectId);
    if (result && "error" in result && result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <section className="mt-8 space-y-4" id="bank-inflow">
      <div>
        <h2 className="text-lg font-semibold">Bank inflow</h2>
        <p className="text-sm text-[var(--muted)]">
          Log money received in your bank for this project — date, amount, and
          reference (UTR, cheque, etc.).
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-[var(--border)] bg-white p-4">
          <p className="text-xs text-[var(--muted)]">Total received</p>
          <p className="mt-1 text-lg font-bold text-emerald-800">
            {formatIndianRupee(summary.total)}
          </p>
          <p className="text-xs text-[var(--muted)]">
            {summary.entryCount} entr{summary.entryCount === 1 ? "y" : "ies"}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-white p-4">
          <p className="text-xs text-[var(--muted)]">This month</p>
          <p className="mt-1 text-lg font-bold">
            {formatIndianRupee(summary.thisMonth)}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-white p-4">
          <p className="text-xs text-[var(--muted)]">Recent weeks</p>
          <p className="mt-1 text-sm font-medium">
            {byWeek[0]?.weekLabel ?? "—"}
          </p>
          {byWeek[0] && (
            <p className="text-lg font-bold text-emerald-800">
              {formatIndianRupee(byWeek[0].totalAmount)}
            </p>
          )}
        </div>
      </div>

      {byWeek.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {byWeek.slice(0, 6).map((w) => (
            <span
              key={w.weekStart}
              className="rounded-lg border border-emerald-100 bg-emerald-50/80 px-3 py-1.5 text-xs"
            >
              <span className="font-medium text-emerald-900">{w.weekLabel}</span>
              <span className="ml-2 tabular-nums text-emerald-800">
                {formatIndianRupee(w.totalAmount)}
              </span>
            </span>
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {isAdmin && (
      <form
        onSubmit={handleAdd}
        className="pillar-card grid gap-4 p-5 sm:grid-cols-2"
      >
        <div>
          <label className={labelClass}>Date received *</label>
          <input
            type="date"
            className={inputClass}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
        <div>
          <label className={labelClass}>Amount (₹) *</label>
          <input
            type="text"
            inputMode="decimal"
            className={inputClass}
            placeholder="e.g. 2,50,000"
            value={amount}
            onChange={(e) =>
              setAmount(sanitizeIndianAmountInput(e.target.value))
            }
            required
          />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Reference / note</label>
          <input
            className={inputClass}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="UTR, NEFT ref, client payment for RA-2..."
          />
        </div>
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={loading}
            className="pillar-btn-primary text-sm disabled:opacity-60"
          >
            {loading ? "Saving..." : "Add bank inflow"}
          </button>
        </div>
      </form>
      )}

      {inflows.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-white">
          <table className="min-w-[560px] w-full text-sm">
            <thead>
              <tr className="border-b bg-[var(--background)] text-left text-xs uppercase text-[var(--muted)]">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3 w-20" />
              </tr>
            </thead>
            <tbody>
              {inflows.map((row) => (
                <tr key={row.id} className="border-b last:border-0">
                  <td className="px-4 py-3 whitespace-nowrap">
                    {formatRaBillDate(row.received_date)}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums text-emerald-800">
                    {formatIndianRupee(Number(row.amount))}
                  </td>
                  <td className="px-4 py-3 text-[var(--muted)]">
                    {row.reference_note || "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => handleDelete(row.id)}
                        className="text-xs font-medium text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-[var(--muted)]">
          No inflows logged yet for this project.
        </p>
      )}
    </section>
  );
}
