import type { Metadata } from "next";
import { AdminAnalyticsClient } from "@/components/admin-analytics-client";

export const metadata: Metadata = {
  title: "Analytics & Resolution • Butuan City Streetlight System",
  description: "Operations metrics, incident resolution tracking, and barangay breakdown for Butuan City streetlight reports.",
};

export default function AdminAnalyticsPage() {
  return <AdminAnalyticsClient />;
}
