"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Project, RaBillFormData, RaBillType } from "@/types/database";
import { RA_BILL_TYPE_LABELS } from "@/types/database";
import { createRaBill, updateRaBill } from "@/lib/actions/raBills";
import {
  applyDefaultDeductionsToForm,
  billTypeHasRetention,
  computeRaBillNet,
  computeDefaultRetention,
  computeDefaultTds,
  formatIndianRupee,
  getRaBillRates,
  parseIndianAmount,
  parseRaBillAmounts,
  RA_BILL_IGST_RATE,
  RA_BILL_RATES,
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

  function isProjectTdsApplicable(projectId: string): boolean {
    return projects.find((p) => p.id === projectId)?.tds_applicable ?? true;
  }

  const projectTdsApplicable = isProjectTdsApplicable(form.project_id);
  const rates = getRaBillRates(form.bill_type, projectTdsApplicable);
  const hasRetention = billTypeHasRetention(form.bill_type);

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
          String(computeDefaultRetention(grossNum, prev.bill_type))
        );
      }
      if (!tdsManual.current) {
        next.tds_amount = sanitizeIndianAmountInput(
          String(
            computeDefaultTds(
              grossNum,
              prev.bill_type,
              isProjectTdsApplicable(prev.project_id)
            )
          )
        );
      }
      return next;
    });
  }

  /** Bill type / project decide the default rates, so re-apply them */
  function resetDeductions(next: RaBillFormData): RaBillFormData {
    retentionManual.current = false;
    tdsManual.current = false;
    return {
      ...next,
      ...applyDefaultDeductionsToForm(
        next,
        isProjectTdsApplicable(next.project_id)
      ),
    };
  }

  function recalculateDeductions() {
    setForm((prev) => resetDeductions(prev));
  }

  function updateBillType(bill_type: RaBillType) {
    setForm((prev) => resetDeductions({ ...prev, bill_type }));
  }

  function updateProject(project_id: string) {
    setForm((prev) => resetDeductions({ ...prev, project_id }));
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
              onChange={(e) => updateProject(e.target.value)}
              required
              disabled={!!billId}
            >
              <option value="">Select project...</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.project_code})
                  {p.tds_applicable === false ? " · No TDS" : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>RA bill type *</label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(RA_BILL_TYPE_LABELS) as RaBillType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => updateBillType(type)}
                  className={`rounded-lg border px-4 py-2 text-left text-sm transition-colors ${
                    form.bill_type === type
                      ? "border-gray-900 bg-gray-900 text-white"
                      : "border-[var(--border)] bg-white text-gray-700 hover:border-gray-400"
                  }`}
                >
                  <span className="block font-medium">
                    {RA_BILL_TYPE_LABELS[type]}
                  </span>
                  <span
                    className={`block text-xs ${
                      form.bill_type === type ? "text-gray-300" : "text-[var(--muted)]"
                    }`}
                  >
                    {RA_BILL_RATES[type].retention > 0
                      ? `${RA_BILL_RATES[type].retention * 100}% retention`
                      : "No retention"}
                    {" · "}
                    {RA_BILL_RATES[type].tds * 100}% TDS
                  </span>
                </button>
              ))}
            </div>
            {!projectTdsApplicable && (
              <p className="mt-2 text-xs text-amber-700">
                This project has no TDS — TDS defaults to 0.
              </p>
            )}
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
            Reset{hasRetention ? ` retention (${rates.retention * 100}%) &` : ""}{" "}
            TDS ({rates.tds * 100}%) from gross
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
          {hasRetention ? (
            <div>
              <label className={labelClass}>
                Retention held ({rates.retention * 100}% — editable)
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
          ) : (
            <div className="flex flex-col justify-end rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
              <p className="text-xs font-medium uppercase text-[var(--muted)]">
                Retention
              </p>
              <p className="mt-1 text-sm font-medium text-gray-700">
                No retention on labour supply bills
              </p>
            </div>
          )}
          <div>
            <label className={labelClass}>
              TDS deducted (
              {projectTdsApplicable ? `${rates.tds * 100}%` : "no TDS on this project"}{" "}
              — editable)
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
