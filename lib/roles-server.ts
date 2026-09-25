import { auth, currentUser } from "@clerk/nextjs/server";
import { resolveRole } from "@/lib/roles";

/**
 * Returns the current user's role on the **server** using `auth()`.
 *
 * Uses session claims first, and falls back to Clerk's user profile if
 * the session token claims customizer has not yet been set up.
 *
 * Guaranteed rules:
 * - earl.ballesteros@urios.edu.ph or publicMetadata.role === "admin" -> "admin"
 * - New / regular user with no role or role === "resident" -> "resident"
 */
export async function getUserRole(): Promise<UserRole> {
  const { sessionClaims } = await auth();
  const claimRole = resolveRole(sessionClaims?.metadata);
  if (claimRole === "admin") return "admin";

  // Robust fallback: inspect Clerk user profile directly if claims are not populated
  try {
    const user = await currentUser();
    if (user) {
      const email =
        user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress ||
        user.emailAddresses[0]?.emailAddress;
      const metadataRole = (user.publicMetadata as { role?: string })?.role;
      if (metadataRole === "admin" || email === "earl.ballesteros@urios.edu.ph") {
        return "admin";
      }
    }
  } catch {
    // If backend fetch fails, safely default to resident
  }

  return "resident";
}

/**
 * Returns the post-login destination URL based on the user's role.
 * - Admin: "/admin"
 * - Resident: "/resident"
 */
export async function getRoleRedirectPath(): Promise<string> {
  const role = await getUserRole();
  return role === "admin" ? "/admin" : "/resident";
}

/**
 * Returns `true` if the currently authenticated server-side user is admin.
 * Safe to call in Server Components, Route Handlers, and Server Actions.
 */
export async function isAdmin(): Promise<boolean> {
  return (await getUserRole()) === "admin";
}

export { currentUser };
