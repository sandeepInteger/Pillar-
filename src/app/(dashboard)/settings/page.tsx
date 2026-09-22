import { PageHeader } from "@/components/layout/PageHeader";
import { ChangePasswordForm } from "@/components/settings/ChangePasswordForm";
import { UserManagement } from "@/components/settings/UserManagement";
import { getProfile } from "@/lib/queries/employees";
import { getAllUsers } from "@/lib/queries/users";
import { redirect } from "next/navigation";
import { KeyRound, Users } from "lucide-react";

export default async function SettingsPage() {
  const profile = await getProfile();
  if (!profile) redirect("/login");

  const isAdmin = profile.role === "admin";
  const users = isAdmin ? await getAllUsers() : [];

  return (
    <div>
      <PageHeader title="Settings" subtitle="Account and access" />

      <div className="space-y-6">
        <section className="rounded-xl border border-[var(--border)] bg-white p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <KeyRound className="h-5 w-5 text-[var(--primary)]" />
            Change Password
          </h2>
          <ChangePasswordForm />
        </section>

        {isAdmin && (
          <section className="rounded-xl border border-[var(--border)] bg-white p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <Users className="h-5 w-5 text-[var(--primary)]" />
              Users
            </h2>
            <UserManagement users={users} currentUserId={profile.id} />
          </section>
        )}
      </div>
    </div>
  );
}
