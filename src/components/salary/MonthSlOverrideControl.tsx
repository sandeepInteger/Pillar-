"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setMonthlySlOverride } from "@/lib/actions/salary";
import { formatMonthLabel } from "@/lib/utils/salary";

type SlMode = "default" | "none" | "custom";

interface MonthSlOverrideControlProps {
  employeeId: string;
  month: string;
  /** SL days/month from the employee profile */
  defaultSlDays: number;
  /** Saved override for this month (0 = no SL), null = default applies */
  slOverride: number | null;
}

function modeFromOverride(slOverride: number | null): SlMode {
  if (slOverride == null) return "default";
  return slOverride === 0 ? "none" : "custom";
}

export function MonthSlOverrideControl({
  employeeId,
  month,
  defaultSlDays,
  slOverride,
}: MonthSlOverrideControlProps) {
  const router = useRouter();
  const [mode, setMode] = useState<SlMode>(modeFromOverride(slOverride));
  const [customDays, setCustomDays] = useState(
    slOverride != null && slOverride > 0 ? String(slOverride) : ""
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const savedMode = modeFromOverride(slOverride);
  const isDirty =
    mode !== savedMode ||
    (mode === "custom" && Number(customDays) !== slOverride);

  async function handleSave() {
    setError(null);
    let slDays: number | null = null;
    if (mode === "none") slDays = 0;
    if (mode === "custom") {
      slDays = Number.parseFloat(customDays);
      if (Number.isNaN(slDays) || slDays <= 0) {
        setError("Enter custom SL days greater than 0");
        return;
      }
    }

    setLoading(true);
    const result = await setMonthlySlOverride(employeeId, month, slDays);
    setLoading(false);
    if (result && "error" in result && result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  const inputClass =
    "rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--primary-muted)]";

  return (
    <div className="rounded-xl border border-[var(--border)] bg-white px-4 py-3">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            SL for {formatMonthLabel(month)}
          </label>
          <select
            className={inputClass}
            value={mode}
            onChange={(e) => setMode(e.target.value as SlMode)}
            disabled={loading}
          >
            <option value="default">
              Default ({defaultSlDays} SL/mo from profile)
            </option>
            <option value="none">No SL this month</option>
            <option value="custom">Custom SL this month</option>
          </select>
        </div>
        {mode === "custom" && (
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              SL days
            </label>
            <input
              type="number"
              min="0.5"
              max="31"
              step="0.5"
              className={`${inputClass} w-24`}
              placeholder="e.g. 2"
              value={customDays}
              onChange={(e) => setCustomDays(e.target.value)}
              disabled={loading}
            />
          </div>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={loading || !isDirty}
          className="pillar-btn-primary disabled:opacity-50"
        >
          {loading ? "Saving…" : "Save"}
        </button>
      </div>
      <p className="mt-2 text-xs text-[var(--muted)]">
        Applies to this month only. Other months keep the profile default.
      </p>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
