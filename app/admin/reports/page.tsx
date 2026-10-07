import type { Metadata } from "next";
import { AdminReportsClient } from "@/components/admin-reports-client";

export const metadata: Metadata = {
  title: "All Incident Reports • Butuan City Streetlight System",
  description: "Comprehensive queue of all reported streetlight defects and maintenance dispatches in Butuan City.",
};

export default function AdminReportsPage() {
  return <AdminReportsClient />;
}
