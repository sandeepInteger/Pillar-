"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  Clock,
  Banknote,
  Receipt,
  FileText,
  BarChart3,
  LogOut,
  Layers,
  X,
} from "lucide-react";
import type { Profile } from "@/types/database";
import { signOut } from "@/lib/actions/employees";

const menuSections = [
  {
    label: "Overview",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard, active: true },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/people", label: "People", icon: Users, active: true },
      { href: "/projects", label: "Projects", icon: FolderKanban, active: true },
      {
        href: "/attendance",
        label: "Time & Attendance",
        icon: Clock,
        active: true,
      },
      {
        href: "/salary",
        label: "Salary",
        icon: Banknote,
        active: true,
      },
    ],
  },
  {
    label: "Commerce",
    items: [
      { href: "/ra-bills", label: "RA Bills", icon: Receipt, active: true },
      { href: "#", label: "Invoices", icon: FileText, active: false },
    ],
  },
  {
    label: "Reports",
    items: [
      { href: "/analytics", label: "Analytics", icon: BarChart3, active: true },
    ],
  },
];

interface SidebarProps {
  profile: Profile | null;
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ profile, open, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex w-[min(100vw,280px)] flex-col border-r border-[var(--border)] bg-[var(--sidebar)] transition-transform duration-300 ease-in-out lg:z-40 lg:w-[var(--sidebar-width)] lg:translate-x-0 ${
        open ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      {/* Logo + close (mobile) */}
      <div className="flex items-center justify-between gap-3 px-4 py-5 sm:px-5 sm:py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl pillar-gradient-bar shadow-sm">
            <Layers className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-[var(--foreground)]">
              Pillar
            </h1>
            <p className="text-[11px] text-[var(--muted-light)]">
              Construction OS
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Nav sections */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        {menuSections.map((section) => (
          <div key={section.label} className="mb-5">
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-light)]">
              {section.label}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.active &&
                  (item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href));

                if (!item.active) {
                  return (
                    <li key={item.label}>
                      <span className="flex cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-gray-300">
                        <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
                        {item.label}
                        <span className="ml-auto rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-400">
                          Soon
                        </span>
                      </span>
                    </li>
                  );
                }

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                        isActive
                          ? "bg-white text-[var(--primary)] shadow-sm ring-1 ring-[var(--border)]"
                          : "text-gray-600 hover:bg-gray-50/80 hover:text-gray-900"
                      }`}
                    >
                      <Icon
                        className={`h-[18px] w-[18px] ${isActive ? "text-[var(--primary)]" : ""}`}
                        strokeWidth={1.75}
                      />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="border-t border-[var(--border)] p-4">
        <div className="flex items-center gap-3 rounded-xl bg-[var(--background)] p-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--primary-light)] text-sm font-bold text-[var(--primary)]">
            {(profile?.full_name ?? "U").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">
              {profile?.full_name ?? "User"}
            </p>
            <p className="text-xs capitalize text-[var(--muted)]">
              {profile?.role ?? "engineer"}
            </p>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-lg p-1.5 text-[var(--muted-light)] hover:bg-white hover:text-[var(--primary)]"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
