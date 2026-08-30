"use client";

import { Bell, ChevronDown, Menu, Search } from "lucide-react";
import type { Profile } from "@/types/database";

interface TopHeaderProps {
  profile: Profile | null;
  onMenuClick: () => void;
}

export function TopHeader({ profile, onMenuClick }: TopHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-[var(--border)] bg-[var(--background)]/90 px-4 py-3 backdrop-blur-md sm:gap-4 sm:px-6 sm:py-4 lg:px-8">
      {/* Mobile menu */}
      <button
        type="button"
        onClick={onMenuClick}
        className="rounded-xl border border-[var(--border)] bg-white p-2.5 text-gray-600 shadow-sm hover:text-[var(--primary)] lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" strokeWidth={1.75} />
      </button>

      {/* Search — hidden on smallest screens */}
      <div className="relative hidden min-w-0 flex-1 sm:block lg:max-w-xl">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-light)]" />
        <input
          type="search"
          placeholder="Search projects, people..."
          className="w-full rounded-xl border border-[var(--border)] bg-white py-2.5 pl-10 pr-12 text-sm shadow-sm outline-none placeholder:text-gray-400 focus:border-[var(--primary-muted)] focus:ring-2 focus:ring-[var(--primary-light)]"
          disabled
        />
        <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md border border-[var(--border)] bg-gray-50 px-1.5 py-0.5 text-[10px] font-medium text-[var(--muted)] md:inline">
          ⌘ K
        </kbd>
      </div>

      {/* Mobile title */}
      <div className="min-w-0 flex-1 sm:hidden">
        <p className="truncate text-sm font-bold text-[var(--foreground)]">
          Pillar
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <button
          type="button"
          className="relative rounded-xl border border-[var(--border)] bg-white p-2.5 text-gray-500 shadow-sm hover:text-[var(--primary)]"
          aria-label="Notifications"
        >
          <Bell className="h-[18px] w-[18px]" strokeWidth={1.75} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
        </button>

        <button
          type="button"
          className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-white py-1.5 pl-1.5 pr-2 shadow-sm sm:pr-3"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary-light)] text-xs font-bold text-[var(--primary)]">
            {(profile?.full_name ?? "U").charAt(0).toUpperCase()}
          </div>
          <span className="hidden max-w-[80px] truncate text-sm font-medium md:inline">
            {profile?.full_name?.split(" ")[0] ?? "User"}
          </span>
          <ChevronDown className="hidden h-4 w-4 text-[var(--muted-light)] sm:block" />
        </button>
      </div>
    </header>
  );
}
