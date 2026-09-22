import { redirect } from "next/navigation";
import { getProfile } from "@/lib/queries/employees";
import type { Profile } from "@/types/database";

/** Redirects non-admins away from admin-only pages (create/edit forms). */
export async function requireAdmin(): Promise<Profile> {
  const profile = await getProfile();
  if (profile?.role !== "admin") {
    redirect("/");
  }
  return profile;
}
