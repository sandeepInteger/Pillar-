"use client";

import { useEffect, useState } from "react";
import type { Profile } from "@/types/database";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopHeader } from "@/components/layout/TopHeader";

interface DashboardShellProps {
  profile: Profile | null;
  children: React.ReactNode;
}

export function DashboardShell({ profile, children }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 1024) setSidebarOpen(false);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar
        profile={profile}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex min-h-screen flex-col lg:ml-[var(--sidebar-width)]">
        <TopHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </>
  );
}
