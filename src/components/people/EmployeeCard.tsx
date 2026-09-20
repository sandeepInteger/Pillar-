import Link from "next/link";
import Image from "next/image";
import { MapPin, Phone, CreditCard, Pencil, Wallet } from "lucide-react";
import type { EmployeeWithRelations } from "@/types/database";
import {
  EMPLOYEE_TYPE_LABELS,
  EMPLOYEE_STATUS_LABELS,
  EMPLOYEE_TYPE_COLORS,
  isFounderFixedSalary,
} from "@/types/database";
import {
  formatDate,
  getPrimaryPhone,
  getPrimaryPayment,
} from "@/lib/utils/employees";
import {
  formatRateDisplay,
  getEmployeeSalaryType,
} from "@/lib/utils/salary";

function payKindLabel(employee: EmployeeWithRelations): string {
  if (isFounderFixedSalary(employee.employee_type)) return "Fixed";
  const salaryType = getEmployeeSalaryType(employee);
  if (salaryType === "hourly") return "Hourly";
  if (salaryType === "daily") return "Daily";
  return "Monthly";
}

export function EmployeeCard({ employee }: { employee: EmployeeWithRelations }) {
  const primaryPhone = getPrimaryPhone(employee);
  const primaryPayment = getPrimaryPayment(employee);
  const extraPhones = employee.employee_phones.length - 1;
  const payKind = payKindLabel(employee);
  const rateDisplay = formatRateDisplay(employee);

  return (
    <div className="pillar-card p-4 sm:p-5 transition hover:shadow-md">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-gray-100">
          {employee.photo_url ? (
            <Image
              src={employee.photo_url}
              alt={employee.full_name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-lg font-bold text-gray-400">
              {employee.full_name.charAt(0)}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold">{employee.full_name}</h3>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${EMPLOYEE_TYPE_COLORS[employee.employee_type]}`}
            >
              {EMPLOYEE_TYPE_LABELS[employee.employee_type]}
            </span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                employee.status === "active"
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {EMPLOYEE_STATUS_LABELS[employee.status]}
            </span>
          </div>

          <p className="mt-1 text-sm text-[var(--muted)]">
            {employee.employee_code}
            {employee.designation && ` · ${employee.designation}`}
          </p>

          <p className="mt-2 inline-flex flex-wrap items-center gap-1.5 text-sm">
            <Wallet className="h-3.5 w-3.5 text-[var(--muted)]" />
            <span className="rounded-md bg-violet-50 px-2 py-0.5 text-xs font-semibold text-violet-800">
              {payKind}
            </span>
            {rateDisplay ? (
              <span className="font-medium text-gray-800">{rateDisplay}</span>
            ) : (
              <Link
                href={`/people/${employee.id}/edit`}
                className="text-xs font-medium text-amber-700 hover:underline"
              >
                Set pay rate
              </Link>
            )}
          </p>

          <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-600">
            {primaryPhone && (
              <span className="inline-flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" />
                {primaryPhone}
                {extraPhones > 0 && (
                  <span className="text-xs text-[var(--muted)]">
                    +{extraPhones} more
                  </span>
                )}
              </span>
            )}
            {(employee.city || employee.state) && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {[employee.city, employee.state].filter(Boolean).join(", ")}
              </span>
            )}
            {primaryPayment && (
              <span className="inline-flex items-center gap-1.5">
                <CreditCard className="h-3.5 w-3.5" />
                {primaryPayment}
              </span>
            )}
          </div>

          <p className="mt-2 text-xs text-[var(--muted)]">
            Started {formatDate(employee.start_date)}
          </p>
        </div>

        <div className="flex w-full shrink-0 gap-2 sm:w-auto">
          <Link
            href={`/people/${employee.id}`}
            className="flex-1 rounded-lg border border-[var(--border)] px-3 py-2 text-center text-sm font-medium hover:bg-gray-50 sm:flex-none sm:py-1.5"
          >
            View
          </Link>
          <Link
            href={`/people/${employee.id}/edit`}
            className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-[var(--primary-light)] px-3 py-2 text-sm font-medium text-[var(--primary)] hover:bg-violet-100 sm:flex-none sm:py-1.5"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Link>
        </div>
      </div>
    </div>
  );
}
