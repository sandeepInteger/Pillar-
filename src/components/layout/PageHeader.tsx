import Link from "next/link";
import { Plus } from "lucide-react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showAddEmployee?: boolean;
  children?: React.ReactNode;
}

export function PageHeader({
  title,
  subtitle,
  showAddEmployee,
  children,
}: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:mb-8 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0">
        <h1 className="text-xl font-bold tracking-tight text-[var(--foreground)] sm:text-2xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm text-[var(--muted)]">{subtitle}</p>
        )}
      </div>
      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
        {children}
        {showAddEmployee && (
          <Link
            href="/people/new"
            className="pillar-btn-primary w-full justify-center sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            Add Employee
          </Link>
        )}
      </div>
    </div>
  );
}
