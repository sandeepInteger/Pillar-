"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import type { UserRole } from "@/types/database";
import { USER_ROLE_LABELS } from "@/types/database";
import { inviteUser, updateUserRole } from "@/lib/actions/users";
import type { AppUser } from "@/lib/queries/users";

interface UserManagementProps {
  users: AppUser[];
  currentUserId: string;
}

export function UserManagement({ users, currentUserId }: UserManagementProps) {
  const router = useRouter();
  const [showInvite, setShowInvite] = useState(false);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<UserRole>("viewer");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await inviteUser(email, fullName, role);
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setNotice(`Invitation sent to ${email}`);
    setEmail("");
    setFullName("");
    setRole("viewer");
    setShowInvite(false);
    router.refresh();
  }

  async function handleRoleChange(userId: string, newRole: UserRole) {
    setError(null);
    const result = await updateUserRole(userId, newRole);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  const inputClass =
    "w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--primary-muted)]";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[var(--muted)]">
          Admins have full access. Viewers can only read data.
        </p>
        <button
          type="button"
          onClick={() => setShowInvite((v) => !v)}
          className="pillar-btn-primary inline-flex items-center gap-2"
        >
          <UserPlus className="h-4 w-4" />
          Invite user
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {notice && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {notice}
        </div>
      )}

      {showInvite && (
        <form
          onSubmit={handleInvite}
          className="pillar-card grid gap-4 p-5 sm:grid-cols-2"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Email *
            </label>
            <input
              type="email"
              required
              className={inputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Full name
            </label>
            <input
              className={inputClass}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Role
            </label>
            <select
              className={inputClass}
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
            >
              {(Object.keys(USER_ROLE_LABELS) as UserRole[]).map((value) => (
                <option key={value} value={value}>
                  {USER_ROLE_LABELS[value]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-2 sm:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className="pillar-btn-primary disabled:opacity-60"
            >
              {loading ? "Sending…" : "Send invite"}
            </button>
            <button
              type="button"
              onClick={() => setShowInvite(false)}
              className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-white">
        <table className="min-w-[560px] w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--background)] text-left text-xs uppercase tracking-wide text-[var(--muted)]">
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold">Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user.id}
                className="border-b border-[var(--border)] last:border-0"
              >
                <td className="px-4 py-3">
                  {user.fullName ?? "—"}
                  {user.id === currentUserId && (
                    <span className="ml-2 text-xs text-[var(--muted)]">
                      (you)
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-[var(--muted)]">
                  {user.email ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <select
                    className="rounded-lg border border-[var(--border)] px-2 py-1.5 text-sm"
                    value={user.role}
                    onChange={(e) =>
                      handleRoleChange(user.id, e.target.value as UserRole)
                    }
                  >
                    {(Object.keys(USER_ROLE_LABELS) as UserRole[]).map(
                      (value) => (
                        <option key={value} value={value}>
                          {USER_ROLE_LABELS[value]}
                        </option>
                      )
                    )}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
