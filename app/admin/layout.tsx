import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserRole } from "@/lib/roles-server";
import { AdminShell } from "@/components/admin-shell";

export const dynamic = "force-dynamic";

/**
 * Server-side route protection for the Admin section:
 * - Signed-out users -> redirected to /sign-in
 * - Residents (role !== "admin") -> blocked and redirected to /resident
 * - Admin users (role = "admin") -> granted access to the Admin Dashboard
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  // 1. Signed-out users must NOT access protected Admin pages
  if (!userId) {
    redirect("/sign-in");
  }

  // 2. Only role = "admin" can access Admin routes
  const role = await getUserRole();
  if (role !== "admin") {
    // Block resident access and redirect to Resident Dashboard
    redirect("/resident");
  }

  return <AdminShell>{children}</AdminShell>;
}
