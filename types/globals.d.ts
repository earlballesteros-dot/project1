/**
 * Extend Clerk's CustomJwtSessionClaims to include the user's role
 * from publicMetadata, injected via the Clerk Dashboard session token
 * customizer.
 *
 * Dashboard path: Sessions → Customize session token → Claims editor:
 *   {
 *     "metadata": "{{user.public_metadata}}"
 *   }
 *
 * This makes `sessionClaims.metadata.role` available on both client
 * (useAuth) and server (auth()).
 */
export {};

declare global {
  /** The two valid roles in this application. */
  type UserRole = "admin" | "resident";

  interface CustomJwtSessionClaims {
    metadata?: {
      /**
       * Role assigned by an administrator via publicMetadata.
       * Absent for regular users — treated as "resident" by default.
       */
      role?: UserRole;
    };
  }
}
