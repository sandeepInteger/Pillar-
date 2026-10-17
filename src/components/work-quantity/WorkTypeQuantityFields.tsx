"use client";

import type { WorkQuantityFormData, WorkTypeConfig } from "@/types/database";
import { WORK_QUANTITY_UNIT_LABELS } from "@/types/database";
import { computeWorkAmount, sanitizeQuantityInput } from "@/lib/utils/workQuantity";
import { formatIndianRupee } from "@/lib/utils/raBills";

interface WorkTypeQuantityFieldsProps {
  form: WorkQuantityFormData;
  workTypes: WorkTypeConfig[];
  onChange: (key: "work_type" | "quantity", value: string) => void;
  inputClass: string;
  labelClass: string;
}

/** Work type + quantity inputs; unit and rate are fixed by the selected work type. */
export function WorkTypeQuantityFields({
  form,
  workTypes,
  onChange,
  inputClass,
  labelClass,
}: WorkTypeQuantityFieldsProps) {
  const activeTypes = workTypes.filter((t) => t.is_active);
  const selected = activeTypes.find((t) => t.code === form.work_type);
  const quantity = Number.parseFloat(form.quantity);
  const amount =
    selected && Number.isFinite(quantity)
      ? computeWorkAmount(quantity, Number(selected.rate))
      : 0;

  return (
    <>
      <div>
        <label className={labelClass}>Work type *</label>
        <select
          required
          className={inputClass}
          value={form.work_type}
          onChange={(e) => onChange("work_type", e.target.value)}
        >
          <option value="">Select work type...</option>
          {activeTypes.map((type) => (
            <option key={type.code} value={type.code}>
              {type.name}
            </option>
          ))}
        </select>
        {selected && (
          <p className="mt-1 text-xs text-[var(--muted)]">
            {formatIndianRupee(Number(selected.rate))} per{" "}
            {WORK_QUANTITY_UNIT_LABELS[selected.unit]}
          </p>
        )}
      </div>
      <div>
        <label className={labelClass}>
          Quantity{selected ? ` (${selected.unit.toUpperCase()})` : ""} *
        </label>
        <input
          type="text"
          inputMode="decimal"
          required
          className={inputClass}
          placeholder="e.g. 250"
          value={form.quantity}
          onChange={(e) => onChange("quantity", sanitizeQuantityInput(e.target.value))}
        />
        {selected && (
          <p className="mt-1 text-xs text-[var(--muted)]">
            Amount: <span className="font-semibold text-gray-700">{formatIndianRupee(amount)}</span>
          </p>
        )}
      </div>
    </>
  );
}
