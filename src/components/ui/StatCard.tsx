import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  href?: string;
}

function MiniSparkline() {
  return (
    <div className="mt-3 flex h-8 items-end gap-0.5">
      {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm pillar-gradient-bar opacity-70"
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  trendUp = true,
}: StatCardProps) {
  return (
    <div className="pillar-card p-5 transition hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary-light)]">
          <Icon className="h-5 w-5 text-[var(--primary)]" strokeWidth={1.75} />
        </div>
        {trend && (
          <span
            className={`text-xs font-semibold ${trendUp ? "text-emerald-600" : "text-red-500"}`}
          >
            {trend}
          </span>
        )}
      </div>
      <p className="mt-4 text-2xl font-bold tracking-tight">{value}</p>
      <p className="mt-0.5 text-sm text-[var(--muted)]">{label}</p>
      <MiniSparkline />
    </div>
  );
}
