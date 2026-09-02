"use client";

import { Menu } from "lucide-react";

interface TopHeaderProps {
  onMenuClick: () => void;
}

export function TopHeader({ onMenuClick }: TopHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-[var(--border)] bg-[var(--background)]/90 px-4 py-3 backdrop-blur-md sm:px-6 lg:hidden">
      <button
        type="button"
        onClick={onMenuClick}
        className="rounded-xl border border-[var(--border)] bg-white p-2.5 text-gray-600 shadow-sm hover:text-[var(--primary)] lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" strokeWidth={1.75} />
      </button>

      <p className="text-sm font-bold text-[var(--foreground)] lg:hidden">
        Pillar
      </p>
    </header>
  );
}
