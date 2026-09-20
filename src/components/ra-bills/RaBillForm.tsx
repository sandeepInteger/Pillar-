"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Project, RaBillFormData } from "@/types/database";
import { createRaBill, updateRaBill } from "@/lib/actions/raBills";
import {
  applyDefaultDeductionsToForm,
  computeRaBillNet,
  computeDefaultRetention,
  computeDefaultTds,
  formatIndianRupee,
  parseIndianAmount,
  parseRaBillAmounts,
  RA_BILL_IGST_RATE,
  RA_BILL_RETENTION_RATE,
  RA_BILL_TDS_RATE,
  sanitizeIndianAmountInput,
} from "@/lib/utils/raBills";

interface RaBillFormProps {
  initialData: RaBillFormData;
  projects: Project[];
  billId?: string;
}

const labelClass = "mb-1 block text-sm font-medium text-gray-700";
const inputClass =
  "w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]";

export function RaBillForm({ initialData, projects, billId }: RaBillFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<RaBillFormData>(initialData);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const retentionManual = useRef(!!billId);
  const tdsManual = useRef(!!billId);

  const preview = useMemo(() => {
    try {
      return parseRaBillAmounts(form);
    } catch {
      return null;
    }
  }, [form]);

  const netPreview =
    preview != null ? preview.net_amount : computeRaBillNet(0, 0, 0);

  function updateField<K extends keyof RaBillFormData>(
    key: K,
    value: RaBillFormData[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateGrossAmount(raw: string) {
    const gross_amount = sanitizeIndianAmountInput(raw);
    const grossNum = parseIndianAmount(gross_amount);
    setForm((prev) => {
      const next = { ...prev, gross_amount };
      if (!retentionManual.current) {
        next.retention_amount = sanitizeIndianAmountInput(
          String(computeDefaultRetention(grossNum))
        );
      }
      if (!tdsManual.current) {
        next.tds_amount = sanitizeIndianAmountInput(
          String(computeDefaultTds(grossNum))
        );
      }
      return next;
    });
  }

  function recalculateDeductions() {
    retentionManual.current = false;
    tdsManual.current = false;
    setForm((prev) => ({ ...prev, ...applyDefaultDeductionsToForm(prev) }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = billId
      ? await updateRaBill(billId, form)
      : await createRaBill(form);

    if (result && "error" in result && result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    if (billId) {
      router.refresh();
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="pillar-card p-6">
        <h2 className="mb-4 text-lg font-semibold">Bill details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelClass}>Contractor name</label>
            <input
              className={inputClass}
              placeholder="e.g. Your firm / contracting company name"
              value={form.contractor_name}
              onChange={(e) => updateField("contractor_name", e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Project *</label>
            <select
              className={inputClass}
              value={form.project_id}
              onChange={(e) => updateField("project_id", e.target.value)}
              required
              disabled={!!billId}
            >
              <option value="">Select project...</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.project_code})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>RA Bill no. / name *</label>
            <input
              className={inputClass}
              placeholder="e.g. RA-3"
              value={form.bill_label}
              onChange={(e) => updateField("bill_label", e.target.value)}
              required
            />
          </div>
          <div>
            <label className={labelClass}>Confirmed / submitted date *</label>
            <input
              type="date"
              className={inputClass}
              value={form.confirmed_date}
              onChange={(e) => updateField("confirmed_date", e.target.value)}
              required
            />
          </div>
          <div>
            <label className={labelClass}>Period of work done — from *</label>
            <input
              type="date"
              className={inputClass}
              value={form.work_period_start}
              onChange={(e) =>
                updateField("work_period_start", e.target.value)
              }
              required
            />
          </div>
          <div>
            <label className={labelClass}>Period of work done — to *</label>
            <input
              type="date"
              className={inputClass}
              value={form.work_period_end}
              onChange={(e) => updateField("work_period_end", e.target.value)}
              required
            />
          </div>
        </div>
      </section>

      <section className="pillar-card p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Amounts (₹)</h2>
          <button
            type="button"
            onClick={recalculateDeductions}
            className="text-xs font-medium text-[var(--primary)] hover:underline"
          >
            Reset retention ({RA_BILL_RETENTION_RATE * 100}%) & TDS (
            {RA_BILL_TDS_RATE * 100}%) from gross
          </button>
        </div>
        <div className="mb-4 flex flex-wrap items-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3">
          <div>
            <p className="text-sm font-medium text-gray-800">
              GST / IGST received on this bill?
            </p>
            <p className="text-xs text-[var(--muted)]">
              Yes adds {RA_BILL_IGST_RATE * 100}% IGST on gross to the amount you
              receive in bank (after retention & TDS).
            </p>
          </div>
          <div className="flex rounded-lg border border-[var(--border)] bg-white p-0.5">
            <button
              type="button"
              onClick={() => updateField("gst_applicable", false)}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                !form.gst_applicable
                  ? "bg-gray-900 text-white"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              No
            </button>
            <button
              type="button"
              onClick={() => updateField("gst_applicable", true)}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                form.gst_applicable
                  ? "bg-gray-900 text-white"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Yes
            </button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Bill amount (gross) *</label>
            <input
              type="text"
              inputMode="decimal"
              className={inputClass}
              placeholder="e.g. 10,00,000"
              value={form.gross_amount}
              onChange={(e) => updateGrossAmount(e.target.value)}
              required
            />
          </div>
          {form.gst_applicable && preview && (
            <>
              <div className="flex flex-col justify-end rounded-xl border border-emerald-100 bg-emerald-50/80 p-4">
                <p className="text-xs font-medium uppercase text-emerald-800">
                  IGST ({RA_BILL_IGST_RATE * 100}% on gross)
                </p>
                <p className="mt-1 text-xl font-bold tabular-nums text-emerald-900">
                  {formatIndianRupee(preview.igst_amount)}
                </p>
              </div>
              <div className="sm:col-span-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                <div className="flex flex-wrap justify-between gap-2">
                  <span className="text-[var(--muted)]">
                    Total RA bill (gross + IGST)
                  </span>
                  <span className="font-semibold tabular-nums">
                    {formatIndianRupee(preview.total_bill_amount)}
                  </span>
                </div>
              </div>
            </>
          )}
          <div>
            <label className={labelClass}>
              Retention held ({RA_BILL_RETENTION_RATE * 100}% — editable)
            </label>
            <input
              type="text"
              inputMode="decimal"
              className={inputClass}
              value={form.retention_amount}
              onChange={(e) => {
                retentionManual.current = true;
                updateField(
                  "retention_amount",
                  sanitizeIndianAmountInput(e.target.value)
                );
              }}
            />
          </div>
          <div>
            <label className={labelClass}>
              TDS deducted ({RA_BILL_TDS_RATE * 100}% — editable)
            </label>
            <input
              type="text"
              inputMode="decimal"
              className={inputClass}
              value={form.tds_amount}
              onChange={(e) => {
                tdsManual.current = true;
                updateField(
                  "tds_amount",
                  sanitizeIndianAmountInput(e.target.value)
                );
              }}
            />
          </div>
          <div className="flex flex-col justify-end rounded-xl bg-violet-50 p-4">
            <p className="text-xs font-medium uppercase text-violet-800">
              {form.gst_applicable
                ? "Net in bank (after deductions + IGST)"
                : "Net payable (after retention & TDS)"}
            </p>
            {preview && form.gst_applicable && (
              <p className="mt-1 text-xs text-violet-700/90">
                Gross − retention − TDS + IGST
              </p>
            )}
            <p className="mt-1 text-2xl font-bold text-violet-900">
              {formatIndianRupee(netPreview)}
            </p>
          </div>
        </div>
      </section>

      <section className="pillar-card p-6">
        <h2 className="mb-1 text-lg font-semibold">Bank receipt</h2>
        <p className="mb-4 text-sm text-[var(--muted)]">
          Leave empty while payment is pending. When money hits your account,
          enter the date and amount received.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Received in bank (date)</label>
            <input
              type="date"
              className={inputClass}
              value={form.bank_received_date}
              onChange={(e) =>
                updateField("bank_received_date", e.target.value)
              }
            />
          </div>
          <div>
            <label className={labelClass}>Amount received (₹)</label>
            <input
              type="text"
              inputMode="decimal"
              className={inputClass}
              placeholder={`Default: ${formatIndianRupee(netPreview)}`}
              value={form.bank_received_amount}
              onChange={(e) =>
                updateField(
                  "bank_received_amount",
                  sanitizeIndianAmountInput(e.target.value)
                )
              }
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Notes</label>
            <textarea
              className={`${inputClass} min-h-[80px]`}
              value={form.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              placeholder="Cheque / UTR / client ref..."
            />
          </div>
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={loading}
          className="pillar-btn-primary disabled:opacity-60"
        >
          {loading ? "Saving..." : billId ? "Save changes" : "Add RA Bill"}
        </button>
      </div>
    </form>
  );
}
