import type { Metadata } from "next";
import { ResidentNav } from "@/components/resident-nav";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "Resident Dashboard • Butuan City Streetlight System",
  description: "Citizen portal for reporting and tracking public streetlight repairs in Butuan City.",
};

export default function ResidentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background font-sans text-foreground">
      <ResidentNav />
      <main className="flex-1 py-8 sm:py-10">{children}</main>
      <Footer />
    </div>
  );
}
