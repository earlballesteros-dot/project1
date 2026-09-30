import type { Metadata } from "next";
import { AdminSettingsClient } from "@/components/admin-settings-client";

export const metadata: Metadata = {
  title: "System Settings • Butuan City Streetlight System",
  description: "Global system configuration, coverage barangays, notification preferences, and visual theme settings.",
};

export default function AdminSettingsPage() {
  return <AdminSettingsClient />;
}
