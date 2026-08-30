import { getProfile } from "@/lib/queries/employees";
import { DashboardShell } from "@/components/layout/DashboardShell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getProfile();

  return <DashboardShell profile={profile}>{children}</DashboardShell>;
}
