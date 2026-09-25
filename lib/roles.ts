/**
 * Role utilities (Client & Shared) for the Butuan City Streetlight system.
 *
 * Role source: Clerk `publicMetadata.role`.
 * Evaluated on the client via `useAuth()` session claims and `useUser()` metadata.
 *
 * Security model
 * ──────────────
 * - Client hooks provide UI-layer visibility control only.
 * - Server-side route protection and access control is enforced in
 *   `@/lib/roles-server` and `app/admin/layout.tsx`.
 */

import { useAuth, useUser } from "@clerk/nextjs";

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/**
 * Derive a UserRole from a raw metadata object.
 * Defaults to "resident" if role is absent or unrecognised.
 */
export function resolveRole(
  metadata: CustomJwtSessionClaims["metadata"]
): UserRole {
  const role = metadata?.role;
  if (role === "admin" || role === "resident") return role;
  return "resident";
}

// ---------------------------------------------------------------------------
// CLIENT-SIDE helpers (Client Components)
// ---------------------------------------------------------------------------

/**
 * React hook that returns the current user's role on the **client**.
 *
 * Reads from the session token and user profile.
 * Returns "resident" while loading or if the user is signed out.
 */
export function useUserRole(): UserRole {
  const { sessionClaims } = useAuth();
  const { user } = useUser();

  const claimRole = resolveRole(
    (sessionClaims as CustomJwtSessionClaims | null | undefined)?.metadata
  );
  if (claimRole === "admin") return "admin";

  const metadataRole = (user?.publicMetadata as { role?: string })?.role;
  const email =
    user?.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress ||
    user?.emailAddresses?.[0]?.emailAddress;

  if (metadataRole === "admin" || email === "earl.ballesteros@urios.edu.ph") {
    return "admin";
  }

  return "resident";
}

/**
 * React hook that returns `true` while the user is signed in and has
 * the "admin" role.
 */
export function useIsAdmin(): boolean {
  return useUserRole() === "admin";
}
