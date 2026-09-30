import type { Metadata } from "next";
import { AdminTeamsClient } from "@/components/admin-teams-client";

export const metadata: Metadata = {
  title: "Maintenance Teams • Butuan City Streetlight System",
  description: "Operations management and workload monitoring for Butuan City streetlight maintenance and repair crews.",
};

export default function AdminTeamsPage() {
  return <AdminTeamsClient />;
}
