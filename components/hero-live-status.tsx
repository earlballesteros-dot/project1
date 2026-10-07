"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { supabase } from "@/lib/supabase";

export interface HeroReport {
  id: string;
  problem_type: string | null;
  pole_tag_id: string | null;
  status: string | null;
  assigned_team_id: string | null;
  created_at: string | null;
  barangays: { id: string; name: string } | { id: string; name: string }[] | null;
}

interface HeroData {
  reports: HeroReport[];
  resolvedThisMonth: number;
  openReports: number;
  activeDispatches: number;
  updatedAtText: string;
  isLoading: boolean;
  error: string | null;
}

let globalHeroData: HeroData = {
  reports: [],
  resolvedThisMonth: 0,
  openReports: 0,
  activeDispatches: 0,
  updatedAtText: "Updating...",
  isLoading: true,
  error: null,
};

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

let isFetching = false;

async function fetchHeroLiveData() {
  if (isFetching) return;
  isFetching = true;

  try {
    const { data, error } = await supabase
      .from("reports")
      .select(`
        id,
        problem_type,
        pole_tag_id,
        status,
        assigned_team_id,
        created_at,
        barangays (
          id,
          name
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading hero live data from Supabase:", error.message, error);
      globalHeroData = {
        ...globalHeroData,
        isLoading: false,
        error: error.message,
        updatedAtText: "Update unavailable",
      };
      notify();
      return;
    }

    const reports: HeroReport[] = (data || []) as unknown as HeroReport[];
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    let resolvedCount = 0;
    let openCount = 0;
    let dispatchesCount = 0;

    for (const report of reports) {
      const isResolved = report.status === "Resolved";
      if (!isResolved) {
        openCount++;
        if (report.assigned_team_id) {
          dispatchesCount++;
        }
      } else if (report.created_at) {
        try {
          const reportDate = new Date(report.created_at);
          if (
            !isNaN(reportDate.getTime()) &&
            reportDate.getFullYear() === currentYear &&
            reportDate.getMonth() === currentMonth
          ) {
            resolvedCount++;
          }
        } catch {
          // ignore parsing error
        }
      }
    }

    const timeString = now.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });

    globalHeroData = {
      reports,
      resolvedThisMonth: resolvedCount,
      openReports: openCount,
      activeDispatches: dispatchesCount,
      updatedAtText: `Updated at ${timeString}`,
      isLoading: false,
      error: null,
    };
    notify();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Failed to query hero live reports:", err);
    globalHeroData = {
      ...globalHeroData,
      isLoading: false,
      error: message,
      updatedAtText: "Update unavailable",
    };
    notify();
  } finally {
    isFetching = false;
  }
}

export function useHeroLiveData(): HeroData {
  const [data, setData] = useState<HeroData>(globalHeroData);

  useEffect(() => {
    const listener = () => setData({ ...globalHeroData });
    listeners.add(listener);

    fetchHeroLiveData();

    return () => {
      listeners.delete(listener);
    };
  }, []);

  return data;
}

function getBarangayName(barangays: HeroReport["barangays"]): string {
  if (!barangays) return "Butuan City";
  if (Array.isArray(barangays)) {
    return barangays[0]?.name || "Butuan City";
  }
  return barangays.name || "Butuan City";
}

export function HeroLiveMetrics({
  barangaysCovered,
}: {
  barangaysCovered?: number;
} = {}) {
  const { resolvedThisMonth, openReports, isLoading, error } = useHeroLiveData();

  return (
    <div className="grid grid-cols-3 gap-4 pt-4 border-t w-full max-w-lg text-center sm:text-left">
      <div>
        <span className="font-heading text-2xl font-bold text-foreground">
          {barangaysCovered !== undefined ? barangaysCovered : "—"}
        </span>
        <p className="text-xs text-muted-foreground">Barangays Covered</p>
      </div>
      <div>
        <span className="font-heading text-2xl font-bold text-foreground">
          {isLoading ? "—" : error ? "—" : resolvedThisMonth}
        </span>
        <p className="text-xs text-muted-foreground">Resolved This Month</p>
      </div>
      <div>
        <span className="font-heading text-2xl font-bold text-emerald-600 dark:text-emerald-400">
          {isLoading ? "—" : error ? "—" : openReports}
        </span>
        <p className="text-xs text-muted-foreground">Open Reports</p>
      </div>
    </div>
  );
}

export function HeroLiveCard() {
  const { reports, activeDispatches, updatedAtText, isLoading, error } = useHeroLiveData();

  const recentReports = reports.slice(0, 3);

  return (
    <Card id="live-status" className="border-border shadow-lg">
      <CardHeader className="border-b bg-muted/30 pb-4">
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="gap-1.5 text-xs font-medium">
            <Activity className="size-3 text-emerald-500 animate-pulse" />
            Live City Dispatch Snapshot
          </Badge>
          <span className="text-[11px] text-muted-foreground">{updatedAtText}</span>
        </div>
        <CardTitle className="pt-2 text-base">Butuan Central Monitoring</CardTitle>
        <CardDescription>
          Real-time status of public streetlights under active inspection.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 pt-4">
        {isLoading ? (
          [1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-start justify-between rounded-lg border p-3 bg-card animate-pulse"
            >
              <div className="flex flex-col gap-1.5 w-3/4">
                <div className="h-4 w-1/2 bg-muted rounded" />
                <div className="h-3 w-3/4 bg-muted/60 rounded" />
              </div>
              <div className="h-5 w-14 bg-muted rounded" />
            </div>
          ))
        ) : error ? (
          <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
            Live incident snapshot temporarily unavailable.
          </div>
        ) : recentReports.length === 0 ? (
          <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
            No incident reports currently logged.
          </div>
        ) : (
          recentReports.map((report) => {
            const barangayName = getBarangayName(report.barangays);
            const poleText =
              report.pole_tag_id && report.pole_tag_id !== "N/A"
                ? `Pole #${report.pole_tag_id} • `
                : "";

            return (
              <div
                key={report.id}
                className="flex items-start justify-between rounded-lg border p-3 bg-card"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="font-semibold text-sm">Brgy. {barangayName}</span>
                  <span className="text-xs text-muted-foreground">
                    {poleText}
                    {report.problem_type || "Streetlight Defect"}
                  </span>
                </div>
                <Badge
                  variant={
                    report.status === "Resolved"
                      ? "outline"
                      : report.status === "In Progress"
                      ? "secondary"
                      : "destructive"
                  }
                  className={`text-[10px] ${
                    report.status === "Resolved"
                      ? "text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                      : ""
                  }`}
                >
                  {report.status || "Pending"}
                </Badge>
              </div>
            );
          })
        )}
      </CardContent>
      <CardFooter className="flex items-center justify-between border-t bg-muted/20 text-xs text-muted-foreground py-3">
        <span>Active Dispatches: {isLoading ? "..." : error ? "—" : activeDispatches}</span>
        <Link href="/admin/reports" className="font-medium text-primary hover:underline">
          View full dispatch table &rarr;
        </Link>
      </CardFooter>
    </Card>
  );
}
