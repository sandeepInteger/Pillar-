import { getProfile } from "@/lib/queries/employees";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopHeader } from "@/components/layout/TopHeader";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getProfile();

  return (
    <>
      <Sidebar profile={profile} />
      <div
        className="flex h-screen flex-col"
        style={{ marginLeft: "var(--sidebar-width)" }}
      >
        <TopHeader profile={profile} />
        <main className="flex-1 overflow-y-auto px-6 py-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </>
  );
}
