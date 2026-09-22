import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getProfile } from "@/lib/queries/employees";
import type { UserRole } from "@/types/database";

export interface AppUser {
  id: string;
  email: string | null;
  fullName: string | null;
  role: UserRole;
  createdAt: string;
}

/** Admin-only. Merges profiles (role, name) with auth.users (email) via the service-role client. */
export async function getAllUsers(): Promise<AppUser[]> {
  const profile = await getProfile();
  if (profile?.role !== "admin") return [];

  const supabase = await createClient();
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("getAllUsers:", error.message);
    return [];
  }

  const admin = createAdminClient();
  const { data: authData, error: authError } = await admin.auth.admin.listUsers({
    perPage: 200,
  });
  if (authError) {
    console.error("getAllUsers (auth):", authError.message);
  }
  const emailById = new Map(
    (authData?.users ?? []).map((u) => [u.id, u.email ?? null])
  );

  return (profiles ?? []).map((p) => ({
    id: p.id,
    email: emailById.get(p.id) ?? null,
    fullName: p.full_name,
    role: p.role,
    createdAt: p.created_at,
  }));
}
