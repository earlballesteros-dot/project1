import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getRoleRedirectPath } from "@/lib/roles-server";

export const dynamic = "force-dynamic";

/**
 * Role-based post-login dispatcher:
 * - Admin (role = "admin") -> /admin
 * - Resident (role = "resident" or unassigned) -> /resident
 * - Signed out -> /sign-in
 */
export default async function AuthRedirectPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const destination = await getRoleRedirectPath();
  redirect(destination);
}
