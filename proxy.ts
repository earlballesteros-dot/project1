import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isAuthRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)"]);
const isAuthRedirectRoute = createRouteMatcher(["/auth-redirect(.*)"]);
const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();

  // 1. Signed-out users must NOT access protected Admin pages -> redirect to /sign-in
  if (!userId && isAdminRoute(req)) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  // 2. If session claims explicitly identify a resident attempting to access /admin -> redirect to /resident
  if (userId && isAdminRoute(req)) {
    if (sessionClaims?.metadata?.role === "resident") {
      return NextResponse.redirect(new URL("/resident", req.url));
    }
  }

  // 3. If already authenticated and visiting sign-in or sign-up, redirect to post-login dispatcher
  if (userId && isAuthRoute(req)) {
    return NextResponse.redirect(new URL("/auth-redirect", req.url));
  }

  // 4. If unauthenticated and visiting /auth-redirect, redirect to sign-in
  if (!userId && isAuthRedirectRoute(req)) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};

