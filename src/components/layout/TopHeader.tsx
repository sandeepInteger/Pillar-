"use client";

import { Bell, ChevronDown, Search } from "lucide-react";
import type { Profile } from "@/types/database";

export function TopHeader({ profile }: { profile: Profile | null }) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-[var(--border)] bg-[var(--background)]/80 px-6 py-4 backdrop-blur-md lg:px-8">
      <div className="relative mx-auto w-full max-w-xl flex-1">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-light)]" />
        <input
          type="search"
          placeholder="Search projects, people, attendance..."
          className="w-full rounded-xl border border-[var(--border)] bg-white py-2.5 pl-10 pr-16 text-sm shadow-sm outline-none placeholder:text-gray-400 focus:border-[var(--primary-muted)] focus:ring-2 focus:ring-[var(--primary-light)]"
          disabled
        />
        <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md border border-[var(--border)] bg-gray-50 px-1.5 py-0.5 text-[10px] font-medium text-[var(--muted)] sm:inline">
          ⌘ K
        </kbd>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          className="relative rounded-xl border border-[var(--border)] bg-white p-2.5 text-gray-500 shadow-sm hover:text-[var(--primary)]"
        >
          <Bell className="h-[18px] w-[18px]" strokeWidth={1.75} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
        </button>

        <button
          type="button"
          className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-white py-1.5 pl-1.5 pr-3 shadow-sm"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary-light)] text-xs font-bold text-[var(--primary)]">
            {(profile?.full_name ?? "U").charAt(0).toUpperCase()}
          </div>
          <span className="hidden text-sm font-medium sm:inline">
            {profile?.full_name?.split(" ")[0] ?? "User"}
          </span>
          <ChevronDown className="h-4 w-4 text-[var(--muted-light)]" />
        </button>
      </div>
    </header>
  );
}
