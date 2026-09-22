"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getProfile } from "@/lib/queries/employees";
import type { UserRole } from "@/types/database";

async function requireAdmin() {
  const profile = await getProfile();
  if (profile?.role !== "admin") {
    return { profile: null, error: "Only an admin can manage users." };
  }
  return { profile, error: null };
}

export async function inviteUser(
  email: string,
  fullName: string,
  role: UserRole
) {
  const { error: authError } = await requireAdmin();
  if (authError) return { error: authError };

  const trimmedEmail = email.trim().toLowerCase();
  if (!trimmedEmail) return { error: "Email is required" };

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.inviteUserByEmail(
    trimmedEmail,
    { data: { full_name: fullName.trim() || trimmedEmail, role } }
  );

  if (error) return { error: error.message };

  // The DB trigger creates the profile row from user metadata; make sure
  // the requested role sticks even if the trigger's default ever changes.
  if (data.user) {
    await admin
      .from("profiles")
      .update({ role, full_name: fullName.trim() || trimmedEmail })
      .eq("id", data.user.id);
  }

  revalidatePath("/settings");
  return { error: null };
}

export async function updateUserRole(userId: string, role: UserRole) {
  const { profile, error: authError } = await requireAdmin();
  if (authError || !profile) return { error: authError };

  if (userId === profile.id && role !== "admin") {
    return { error: "You can't remove your own admin access." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId);

  if (error) return { error: error.message };

  revalidatePath("/settings");
  return { error: null };
}
