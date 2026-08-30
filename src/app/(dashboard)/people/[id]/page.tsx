import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { PhotoUpload } from "@/components/people/PhotoUpload";
import { DeleteEmployeeButton } from "@/components/people/DeleteEmployeeButton";
import { getEmployee, getProfile } from "@/lib/queries/employees";
import {
  EMPLOYEE_TYPE_LABELS,
  EMPLOYEE_STATUS_LABELS,
  EMPLOYEE_TYPE_COLORS,
} from "@/types/database";
import { formatDate, maskAccountNumber } from "@/lib/utils/employees";
import { Pencil, Phone, MapPin, CreditCard, User } from "lucide-react";

interface EmployeeDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function EmployeeDetailPage({
  params,
}: EmployeeDetailPageProps) {
  const { id } = await params;
  const [employee, profile] = await Promise.all([
    getEmployee(id),
    getProfile(),
  ]);

  if (!employee) notFound();

  const fullAddress = [
    employee.address_line1,
    employee.address_line2,
    employee.city,
    employee.state,
    employee.pincode,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div>
      <PageHeader title={employee.full_name} subtitle={employee.employee_code}>
        <Link
          href={`/people/${id}/edit`}
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary-light)] px-4 py-2 text-sm font-medium text-[var(--primary)] hover:bg-violet-100"
        >
          <Pencil className="h-4 w-4" />
          Edit
        </Link>
        {profile?.role === "admin" && (
          <DeleteEmployeeButton employeeId={id} name={employee.full_name} />
        )}
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-[var(--border)] bg-white p-6 lg:col-span-1">
          <PhotoUpload
            employeeId={employee.id}
            currentUrl={employee.photo_url}
            name={employee.full_name}
          />
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${EMPLOYEE_TYPE_COLORS[employee.employee_type]}`}
            >
              {EMPLOYEE_TYPE_LABELS[employee.employee_type]}
            </span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                employee.status === "active"
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {EMPLOYEE_STATUS_LABELS[employee.status]}
            </span>
          </div>
          {employee.designation && (
            <p className="mt-2 text-center text-sm text-[var(--muted)]">
              {employee.designation}
            </p>
          )}
          <p className="mt-1 text-center text-xs text-[var(--muted)]">
            Started {formatDate(employee.start_date)}
          </p>
        </div>

        <div className="space-y-6 lg:col-span-2">
          {/* Phones */}
          <section className="rounded-xl border border-[var(--border)] bg-white p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <Phone className="h-5 w-5 text-[var(--primary)]" />
              Phone Numbers
            </h2>
            {employee.employee_phones.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">No phone numbers</p>
            ) : (
              <ul className="space-y-2">
                {employee.employee_phones.map((phone) => (
                  <li
                    key={phone.id}
                    className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-2 text-sm"
                  >
                    <span>{phone.phone_number}</span>
                    <span className="text-[var(--muted)]">
                      {phone.label}
                      {phone.is_primary && " · Primary"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Address */}
          <section className="rounded-xl border border-[var(--border)] bg-white p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <MapPin className="h-5 w-5 text-[var(--primary)]" />
              Address
            </h2>
            <p className="text-sm">{fullAddress || "—"}</p>
            {employee.landmark && (
              <p className="mt-1 text-sm text-[var(--muted)]">
                Landmark: {employee.landmark}
              </p>
            )}
          </section>

          {/* Payment */}
          <section className="rounded-xl border border-[var(--border)] bg-white p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <CreditCard className="h-5 w-5 text-[var(--primary)]" />
              Payment Details
            </h2>
            {employee.employee_payment_methods.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">
                No payment method on file
              </p>
            ) : (
              <div className="space-y-3">
                {employee.employee_payment_methods.map((method) => (
                  <div
                    key={method.id}
                    className="rounded-lg bg-gray-50 p-4 text-sm"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-semibold uppercase">
                        {method.method_type}
                      </span>
                      {method.is_primary && (
                        <span className="text-xs text-[var(--primary)]">Primary</span>
                      )}
                    </div>
                    {method.method_type === "upi" ? (
                      <p>
                        UPI: {method.upi_id ?? "—"}
                        {method.upi_phone && ` · Phone: ${method.upi_phone}`}
                      </p>
                    ) : (
                      <>
                        <p>Holder: {method.account_holder_name ?? "—"}</p>
                        <p>Bank: {method.bank_name ?? "—"}</p>
                        <p>
                          A/C: {maskAccountNumber(method.account_number)} · IFSC:{" "}
                          {method.ifsc_code ?? "—"}
                        </p>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Emergency & ID */}
          <section className="rounded-xl border border-[var(--border)] bg-white p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <User className="h-5 w-5 text-[var(--primary)]" />
              Emergency & ID
            </h2>
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-[var(--muted)]">Emergency Contact</dt>
                <dd>{employee.emergency_contact_name ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-[var(--muted)]">Emergency Phone</dt>
                <dd>{employee.emergency_contact_phone ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-[var(--muted)]">Aadhaar (last 4)</dt>
                <dd>{employee.aadhaar_last_4 ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-[var(--muted)]">PAN</dt>
                <dd>{employee.pan_number ?? "—"}</dd>
              </div>
            </dl>
            {employee.notes && (
              <p className="mt-4 text-sm text-[var(--muted)]">
                Notes: {employee.notes}
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
