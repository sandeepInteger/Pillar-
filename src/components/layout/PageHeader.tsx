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
    <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm text-[var(--muted)]">{subtitle}</p>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {children}
        {showAddEmployee && (
          <Link href="/people/new" className="pillar-btn-primary">
            <Plus className="h-4 w-4" />
            Add Employee
          </Link>
        )}
      </div>
    </div>
  );
}
