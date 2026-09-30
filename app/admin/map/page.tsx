import type { Metadata } from "next";
import { AdminMapClient } from "@/components/admin-map-client";

export const metadata: Metadata = {
  title: "Barangay Map & GIS • Butuan City Streetlight System",
  description: "Interactive GIS map for monitoring streetlight status across the 12 selected barangays of Butuan City, Agusan del Norte.",
};

export default function AdminMapPage() {
  return <AdminMapClient />;
}
