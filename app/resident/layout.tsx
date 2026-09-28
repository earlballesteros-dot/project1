import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ResidentNav } from "@/components/resident-nav";
import { Footer } from "@/components/footer";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Resident Dashboard • Butuan City Streetlight System",
  description: "Citizen portal for reporting and tracking public streetlight repairs in Butuan City.",
};

/**
 * Server-side route protection for the Resident section:
 * - Signed-out users -> redirected to /sign-in
 * - Authenticated users -> granted access to the Resident Portal
 */
export default async function ResidentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  // Signed-out users must NOT access protected Resident pages
  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans text-foreground">
      <ResidentNav />
      <main className="flex-1 py-8 sm:py-10">{children}</main>
      <Footer />
    </div>
  );
}
