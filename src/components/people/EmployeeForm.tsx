"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import type { EmployeeFormData, PaymentMethodType } from "@/types/database";
import {
  EMPLOYEE_TYPE_LABELS,
  EMPLOYEE_STATUS_LABELS,
} from "@/types/database";
import { createEmployee, updateEmployee } from "@/lib/actions/employees";

interface EmployeeFormProps {
  initialData: EmployeeFormData;
  employeeId?: string;
}

export function EmployeeForm({ initialData, employeeId }: EmployeeFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<EmployeeFormData>(initialData);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const updateField = <K extends keyof EmployeeFormData>(
    key: K,
    value: EmployeeFormData[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const addPhone = () => {
    setForm((prev) => ({
      ...prev,
      phones: [
        ...prev.phones,
        { phone_number: "", label: "alternate", is_primary: false },
      ],
    }));
  };

  const removePhone = (index: number) => {
    setForm((prev) => ({
      ...prev,
      phones: prev.phones.filter((_, i) => i !== index),
    }));
  };

  const updatePhone = (
    index: number,
    field: keyof EmployeeFormData["phones"][0],
    value: string | boolean
  ) => {
    setForm((prev) => ({
      ...prev,
      phones: prev.phones.map((p, i) => {
        if (field === "is_primary" && value === true) {
          return { ...p, is_primary: i === index };
        }
        if (i === index) return { ...p, [field]: value };
        return p;
      }),
    }));
  };

  const addPayment = (type: PaymentMethodType) => {
    setForm((prev) => ({
      ...prev,
      payment_methods: [
        ...prev.payment_methods,
        {
          method_type: type,
          is_primary: prev.payment_methods.length === 0,
          account_holder_name: "",
          bank_name: "",
          account_number: "",
          ifsc_code: "",
          upi_id: "",
          upi_phone: "",
          notes: "",
        },
      ],
    }));
  };

  const removePayment = (index: number) => {
    setForm((prev) => ({
      ...prev,
      payment_methods: prev.payment_methods.filter((_, i) => i !== index),
    }));
  };

  const updatePayment = (
    index: number,
    field: keyof EmployeeFormData["payment_methods"][0],
    value: string | boolean
  ) => {
    setForm((prev) => ({
      ...prev,
      payment_methods: prev.payment_methods.map((m, i) => {
        if (field === "is_primary" && value === true) {
          return { ...m, is_primary: i === index };
        }
        if (i === index) return { ...m, [field]: value };
        return m;
      }),
    }));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!form.full_name.trim()) {
      setError("Full name is required");
      setLoading(false);
      return;
    }

    const result = employeeId
      ? await updateEmployee(employeeId, form)
      : await createEmployee(form);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--primary-muted)] focus:ring-1 focus:ring-[var(--primary-light)]";
  const labelClass = "mb-1 block text-sm font-medium text-gray-700";

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Basic Info */}
      <section className="pillar-card p-6">
        <h2 className="mb-4 text-lg font-semibold">Basic Information</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelClass}>Full Name *</label>
            <input
              className={inputClass}
              value={form.full_name}
              onChange={(e) => updateField("full_name", e.target.value)}
              required
            />
          </div>
          <div>
            <label className={labelClass}>Employee Type *</label>
            <select
              className={inputClass}
              value={form.employee_type}
              onChange={(e) =>
                updateField(
                  "employee_type",
                  e.target.value as EmployeeFormData["employee_type"]
                )
              }
            >
              {Object.entries(EMPLOYEE_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Designation</label>
            <input
              className={inputClass}
              placeholder="e.g. Senior Mason, Site Engineer"
              value={form.designation}
              onChange={(e) => updateField("designation", e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Status</label>
            <select
              className={inputClass}
              value={form.status}
              onChange={(e) =>
                updateField(
                  "status",
                  e.target.value as EmployeeFormData["status"]
                )
              }
            >
              {Object.entries(EMPLOYEE_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Start Date</label>
            <input
              type="date"
              className={inputClass}
              value={form.start_date}
              onChange={(e) => updateField("start_date", e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>End Date</label>
            <input
              type="date"
              className={inputClass}
              value={form.end_date}
              onChange={(e) => updateField("end_date", e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Phones */}
      <section className="pillar-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Phone Numbers</h2>
          <button
            type="button"
            onClick={addPhone}
            className="inline-flex items-center gap-1 text-sm font-medium text-[var(--primary)]"
          >
            <Plus className="h-4 w-4" /> Add Phone
          </button>
        </div>
        <div className="space-y-3">
          {form.phones.map((phone, index) => (
            <div key={index} className="flex flex-wrap items-end gap-3">
              <div className="min-w-[180px] flex-1">
                <label className={labelClass}>Phone Number</label>
                <input
                  className={inputClass}
                  placeholder="9876543210"
                  value={phone.phone_number}
                  onChange={(e) =>
                    updatePhone(index, "phone_number", e.target.value)
                  }
                />
              </div>
              <div className="w-32">
                <label className={labelClass}>Label</label>
                <select
                  className={inputClass}
                  value={phone.label}
                  onChange={(e) => updatePhone(index, "label", e.target.value)}
                >
                  <option value="primary">Primary</option>
                  <option value="alternate">Alternate</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="family">Family</option>
                </select>
              </div>
              <label className="flex items-center gap-2 pb-2 text-sm">
                <input
                  type="radio"
                  name="primary_phone"
                  checked={phone.is_primary}
                  onChange={() => updatePhone(index, "is_primary", true)}
                />
                Primary
              </label>
              {form.phones.length > 1 && (
                <button
                  type="button"
                  onClick={() => removePhone(index)}
                  className="pb-2 text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Address */}
      <section className="pillar-card p-6">
        <h2 className="mb-4 text-lg font-semibold">Address</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelClass}>Address Line 1</label>
            <input
              className={inputClass}
              value={form.address_line1}
              onChange={(e) => updateField("address_line1", e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Address Line 2</label>
            <input
              className={inputClass}
              value={form.address_line2}
              onChange={(e) => updateField("address_line2", e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>City</label>
            <input
              className={inputClass}
              value={form.city}
              onChange={(e) => updateField("city", e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>State</label>
            <input
              className={inputClass}
              value={form.state}
              onChange={(e) => updateField("state", e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Pincode</label>
            <input
              className={inputClass}
              value={form.pincode}
              onChange={(e) => updateField("pincode", e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Landmark</label>
            <input
              className={inputClass}
              value={form.landmark}
              onChange={(e) => updateField("landmark", e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Payment */}
      <section className="pillar-card p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Payment Details</h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => addPayment("upi")}
              className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm hover:bg-gray-50"
            >
              + UPI
            </button>
            <button
              type="button"
              onClick={() => addPayment("bank")}
              className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm hover:bg-gray-50"
            >
              + Bank Account
            </button>
          </div>
        </div>

        {form.payment_methods.length === 0 && (
          <p className="text-sm text-[var(--muted)]">
            No payment method added. Add UPI or bank details for salary payment.
          </p>
        )}

        <div className="space-y-4">
          {form.payment_methods.map((method, index) => (
            <div
              key={index}
              className="rounded-lg border border-gray-100 bg-gray-50 p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-semibold uppercase">
                  {method.method_type === "upi" ? "UPI" : "Bank Account"}
                </span>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="primary_payment"
                      checked={method.is_primary}
                      onChange={() => updatePayment(index, "is_primary", true)}
                    />
                    Primary
                  </label>
                  <button
                    type="button"
                    onClick={() => removePayment(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {method.method_type === "upi" ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>UPI ID</label>
                    <input
                      className={inputClass}
                      placeholder="name@paytm"
                      value={method.upi_id}
                      onChange={(e) =>
                        updatePayment(index, "upi_id", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className={labelClass}>UPI Phone</label>
                    <input
                      className={inputClass}
                      placeholder="Phone linked to UPI"
                      value={method.upi_phone}
                      onChange={(e) =>
                        updatePayment(index, "upi_phone", e.target.value)
                      }
                    />
                  </div>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>Account Holder Name</label>
                    <input
                      className={inputClass}
                      value={method.account_holder_name}
                      onChange={(e) =>
                        updatePayment(index, "account_holder_name", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Bank Name</label>
                    <input
                      className={inputClass}
                      value={method.bank_name}
                      onChange={(e) =>
                        updatePayment(index, "bank_name", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Account Number</label>
                    <input
                      className={inputClass}
                      value={method.account_number}
                      onChange={(e) =>
                        updatePayment(index, "account_number", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className={labelClass}>IFSC Code</label>
                    <input
                      className={inputClass}
                      value={method.ifsc_code}
                      onChange={(e) =>
                        updatePayment(index, "ifsc_code", e.target.value)
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Emergency & ID */}
      <section className="pillar-card p-6">
        <h2 className="mb-4 text-lg font-semibold">Emergency & ID</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Emergency Contact Name</label>
            <input
              className={inputClass}
              value={form.emergency_contact_name}
              onChange={(e) =>
                updateField("emergency_contact_name", e.target.value)
              }
            />
          </div>
          <div>
            <label className={labelClass}>Emergency Contact Phone</label>
            <input
              className={inputClass}
              value={form.emergency_contact_phone}
              onChange={(e) =>
                updateField("emergency_contact_phone", e.target.value)
              }
            />
          </div>
          <div>
            <label className={labelClass}>Aadhaar (last 4 digits)</label>
            <input
              className={inputClass}
              maxLength={4}
              value={form.aadhaar_last_4}
              onChange={(e) => updateField("aadhaar_last_4", e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>PAN Number</label>
            <input
              className={inputClass}
              value={form.pan_number}
              onChange={(e) => updateField("pan_number", e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Notes</label>
            <textarea
              className={inputClass}
              rows={3}
              value={form.notes}
              onChange={(e) => updateField("notes", e.target.value)}
            />
          </div>
        </div>
      </section>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-[var(--primary)] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[var(--primary-hover)] disabled:opacity-60"
        >
          {loading ? "Saving..." : employeeId ? "Update Employee" : "Save Employee"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-[var(--border)] px-6 py-2.5 text-sm font-medium hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
