"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  ClipboardList,
  AlertOctagon,
  Clock,
  CheckCircle2,
  Download,
  ExternalLink,
  ShieldAlert,
  ArrowLeft,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  type StreetlightReport,
  type ReportStatus,
  type PriorityLevel,
} from "@/lib/mock-data";
import { useAuth } from "@clerk/nextjs";
import { useIsAdmin } from "@/lib/roles";
import { createClerkSupabaseClient } from "@/lib/supabase";

export default function AdminDashboard() {
  const { getToken } = useAuth();
  const supabase = useMemo(() => createClerkSupabaseClient(getToken), [getToken]);
  const isAdmin = useIsAdmin();
  const [reports, setReports] = useState<StreetlightReport[]>([]);
  const [activeBarangaysCount, setActiveBarangaysCount] = useState<number>(86);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load reports and active barangay count from Supabase public tables
  useEffect(() => {
    let isMounted = true;

    async function fetchDashboardData() {
      setIsLoading(true);
      setError(null);

      try {
        // Query reports and active barangays count in parallel
        const [reportsResponse, barangaysCountResponse] = await Promise.all([
          supabase
            .from("reports")
            .select(`
              id,
              reporter_name,
              contact_info,
              street_purok_landmark,
              pole_tag_id,
              problem_type,
              description_hazard,
              photo_url,
              priority,
              status,
              assigned_team_id,
              created_at,
              barangays (
                id,
                name
              ),
              maintenance_teams (
                id,
                team_name
              )
            `)
            .order("created_at", { ascending: false }),
          supabase
            .from("barangays")
            .select("*", { count: "exact", head: true })
            .eq("is_active", true),
        ]);

        if (barangaysCountResponse.count !== null && isMounted) {
          setActiveBarangaysCount(barangaysCountResponse.count);
        }

        if (reportsResponse.error) {
          console.error("Error loading reports from Supabase:", reportsResponse.error.message, reportsResponse.error);
          if (isMounted) {
            setError(reportsResponse.error.message);
            setReports([]);
          }
          return;
        }

        if (reportsResponse.data && isMounted) {
          const mappedReports: StreetlightReport[] = reportsResponse.data.map((row: any) => {
            // barangays foreign key relation
            let barangayName = "Unknown";
            if (row.barangays) {
              if (Array.isArray(row.barangays) && row.barangays.length > 0) {
                barangayName = row.barangays[0]?.name || "Unknown";
              } else if (typeof row.barangays === "object" && "name" in row.barangays) {
                barangayName = row.barangays.name || "Unknown";
              }
            }

            // maintenance_teams foreign key relation
            let assignedTeamName = "Pending Dispatch";
            if (row.maintenance_teams) {
              if (Array.isArray(row.maintenance_teams) && row.maintenance_teams.length > 0) {
                assignedTeamName = row.maintenance_teams[0]?.team_name || "Pending Dispatch";
              } else if (typeof row.maintenance_teams === "object" && "team_name" in row.maintenance_teams) {
                assignedTeamName = row.maintenance_teams.team_name || "Pending Dispatch";
              }
            }

            // format created_at date
            let reportedDate = "";
            if (row.created_at) {
              try {
                const dateObj = new Date(row.created_at);
                reportedDate = isNaN(dateObj.getTime())
                  ? String(row.created_at).split("T")[0]
                  : dateObj.toISOString().split("T")[0];
              } catch {
                reportedDate = String(row.created_at).split("T")[0];
              }
            } else {
              reportedDate = new Date().toISOString().split("T")[0];
            }

            return {
              id: row.id,
              residentName: row.reporter_name || "Anonymous",
              contactInfo: row.contact_info || undefined,
              barangay: barangayName,
              landmark: row.street_purok_landmark || "",
              poleNumber: row.pole_tag_id || "N/A",
              issueType: row.problem_type || "Streetlight Issue",
              description: row.description_hazard || "",
              photoUrl: row.photo_url || undefined,
              priority: (row.priority as PriorityLevel) || "High",
              status: (row.status as ReportStatus) || "Pending",
              assignedTeam: assignedTeamName,
              reportedDate,
            };
          });

          setReports(mappedReports);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        console.error("Failed to query dashboard data from Supabase:", err);
        if (isMounted) {
          setError(msg);
          setReports([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchDashboardData();

    return () => {
      isMounted = false;
    };
  }, [supabase]);

  // Dynamic KPI counts from live report data
  const totalReportsCount = reports.length;
  const pendingCount = reports.filter((r) => r.status === "Pending").length;
  const inProgressCount = reports.filter((r) => r.status === "In Progress").length;
  const resolvedCount = reports.filter((r) => r.status === "Resolved").length;

  const pendingPct = totalReportsCount > 0 ? Math.round((pendingCount / totalReportsCount) * 100) : 0;
  const inProgressPct = totalReportsCount > 0 ? Math.round((inProgressCount / totalReportsCount) * 100) : 0;
  const resolvedPct = totalReportsCount > 0 ? Math.round((resolvedCount / totalReportsCount) * 100) : 0;

  // Donut chart geometry: radius = 58, circumference = 2 * PI * 58 ≈ 364.42
  const CIRCUMFERENCE = 364.42;

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner / Breadcrumb info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
              Operations & Incident Overview
            </h1>
            <Badge variant="outline" className="text-xs">
              Supabase Live Sync
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Monitor reported streetlight defects across {activeBarangaysCount} Butuan City barangays, assign repair teams, and track resolution.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-xs">
              <ArrowLeft data-icon="inline-start" />
              Public Home
            </Button>
          </Link>
          <Button variant="outline" size="sm" className="text-xs">
            <Download data-icon="inline-start" />
            Export Log (CSV)
          </Button>
          {!isAdmin && (
            <Link href="/resident">
              <Button variant="secondary" size="sm" className="text-xs">
                Switch to Resident Portal
                <ExternalLink data-icon="inline-end" />
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Emergency Hazard Callout */}
      <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <ShieldAlert className="size-5 text-destructive shrink-0 mt-0.5" />
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold text-sm text-destructive">
              Emergency Priority: Exposed Wiring Alert (Ticket #BXU-2026-0089)
            </span>
            <p className="text-xs text-muted-foreground">
              Location: Brgy. Villa Kananga, Rosales Street near Day Care Center. Flagged for urgent hazard isolation.
            </p>
          </div>
        </div>
        <Badge variant="destructive" className="shrink-0 text-xs">
          High Voltage Hazard
        </Badge>
      </div>

      {/* Analytics & Resolution Section */}
      <div id="analytics" className="space-y-4">
        {isLoading ? (
          <Card className="p-8 text-center border-dashed">
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Clock className="size-5 animate-spin text-primary" />
              </div>
              <span className="text-base font-semibold text-foreground">
                Loading dashboard overview...
              </span>
              <p className="text-xs text-muted-foreground">
                Fetching latest reports and statistics from Supabase.
              </p>
            </div>
          </Card>
        ) : error ? (
          <Card className="p-8 text-center border-dashed border-destructive/50">
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <AlertOctagon className="size-5" />
              </div>
              <span className="text-base font-semibold text-destructive">
                Failed to load reports
              </span>
              <p className="text-xs text-muted-foreground">
                {error}
              </p>
            </div>
          </Card>
        ) : totalReportsCount === 0 ? (
          <Card className="p-8 text-center border-dashed">
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <BarChart3 className="size-5" />
              </div>
              <span className="text-base font-semibold text-foreground">
                No reports available yet.
              </span>
              <p className="text-xs text-muted-foreground">
                Analytics and resolution statistics will calculate automatically once incident reports are logged.
              </p>
            </div>
          </Card>
        ) : (
          <>
            {/* KPI Stats Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Total Reports
                  </CardTitle>
                  <ClipboardList className="size-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="font-heading text-2xl font-bold">
                    {totalReportsCount}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Synchronized with citizen reports
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Pending Reports
                  </CardTitle>
                  <AlertOctagon className="size-4 text-destructive" />
                </CardHeader>
                <CardContent>
                  <div className="font-heading text-2xl font-bold text-destructive">
                    {pendingCount}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Awaiting linemen assessment
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Under Repair Reports
                  </CardTitle>
                  <Clock className="size-4 text-amber-500" />
                </CardHeader>
                <CardContent>
                  <div className="font-heading text-2xl font-bold text-amber-600 dark:text-amber-400">
                    {inProgressCount}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Line crews actively assigned
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Resolved Reports
                  </CardTitle>
                  <CheckCircle2 className="size-4 text-emerald-500" />
                </CardHeader>
                <CardContent>
                  <div className="font-heading text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {resolvedCount}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Restored & operational
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Dashboard Overview: Status Breakdown + Report Status Distribution Chart */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {/* Status Breakdown (Col 1) */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">
                    Status Breakdown
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Overall resolution progress across all recorded reports.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Resolution Rate</span>
                      <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">
                        {resolvedPct}%
                      </span>
                    </div>
                    <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted/60">
                      <div className="bg-emerald-500 transition-all" style={{ width: `${resolvedPct}%` }} />
                      <div className="bg-amber-500 transition-all" style={{ width: `${inProgressPct}%` }} />
                      <div className="bg-destructive transition-all" style={{ width: `${pendingPct}%` }} />
                    </div>
                  </div>

                  <div className="rounded-lg border divide-y text-xs">
                    <div className="flex items-center justify-between p-2">
                      <div className="flex items-center gap-1.5">
                        <span className="size-2 rounded-full bg-destructive" />
                        <span>Pending</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive" className="text-[10px] py-0 px-1.5 font-mono">
                          {pendingCount}
                        </Badge>
                        <span className="text-muted-foreground font-mono text-[11px] w-8 text-right">
                          {pendingPct}%
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-2">
                      <div className="flex items-center gap-1.5">
                        <span className="size-2 rounded-full bg-amber-500" />
                        <span>Under Repair</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-[10px] py-0 px-1.5 font-mono text-amber-700 dark:text-amber-300">
                          {inProgressCount}
                        </Badge>
                        <span className="text-muted-foreground font-mono text-[11px] w-8 text-right">
                          {inProgressPct}%
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-2">
                      <div className="flex items-center gap-1.5">
                        <span className="size-2 rounded-full bg-emerald-500" />
                        <span>Resolved</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-mono border-emerald-500/40 text-emerald-600 dark:text-emerald-400">
                          {resolvedCount}
                        </Badge>
                        <span className="text-muted-foreground font-mono text-[11px] w-8 text-right">
                          {resolvedPct}%
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t py-2 text-[11px] text-muted-foreground">
                  <Link href="/admin/analytics" className="text-primary hover:underline flex items-center gap-1">
                    Open dedicated Analytics page &rarr;
                  </Link>
                </CardFooter>
              </Card>

              {/* Status Distribution Chart (Col 2-3) */}
              <Card className="lg:col-span-2">
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    <div>
                      <CardTitle className="text-sm font-semibold">
                        System Status Distribution
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Visual distribution answering: what is the current operational status of the streetlight network?
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="text-[11px] self-start sm:self-auto font-mono">
                      {totalReportsCount} Total Incidents
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
                    {/* SVG Donut Ring Chart */}
                    <div className="sm:col-span-5 flex flex-col items-center justify-center">
                      <div className="relative size-36 sm:size-40 flex items-center justify-center">
                        <svg className="size-full -rotate-90" viewBox="0 0 160 160">
                          {/* Background Track */}
                          <circle
                            cx="80"
                            cy="80"
                            r="58"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="16"
                            className="text-muted/40"
                          />
                          {totalReportsCount > 0 ? (
                            <>
                              {/* Resolved Segment (Emerald) */}
                              <circle
                                cx="80"
                                cy="80"
                                r="58"
                                fill="none"
                                stroke="#10b981"
                                strokeWidth="16"
                                strokeDasharray={`${(resolvedCount / totalReportsCount) * CIRCUMFERENCE} ${CIRCUMFERENCE}`}
                                strokeDashoffset="0"
                                className="transition-all duration-500 ease-out"
                              />
                              {/* Under Repair Segment (Amber) */}
                              <circle
                                cx="80"
                                cy="80"
                                r="58"
                                fill="none"
                                stroke="#f59e0b"
                                strokeWidth="16"
                                strokeDasharray={`${(inProgressCount / totalReportsCount) * CIRCUMFERENCE} ${CIRCUMFERENCE}`}
                                strokeDashoffset={`-${(resolvedCount / totalReportsCount) * CIRCUMFERENCE}`}
                                className="transition-all duration-500 ease-out"
                              />
                              {/* Pending Segment (Destructive / Red) */}
                              <circle
                                cx="80"
                                cy="80"
                                r="58"
                                fill="none"
                                stroke="#ef4444"
                                strokeWidth="16"
                                strokeDasharray={`${(pendingCount / totalReportsCount) * CIRCUMFERENCE} ${CIRCUMFERENCE}`}
                                strokeDashoffset={`-${((resolvedCount + inProgressCount) / totalReportsCount) * CIRCUMFERENCE}`}
                                className="transition-all duration-500 ease-out"
                              />
                            </>
                          ) : null}
                        </svg>

                        {/* Center Metric */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                          <span className="font-heading text-2xl font-bold tracking-tight">
                            {resolvedPct}%
                          </span>
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                            Resolved
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Proportional Status Legend and Micro-bars */}
                    <div className="sm:col-span-7 flex flex-col gap-2.5">
                      {/* Resolved Status Bar */}
                      <div className="rounded-lg border bg-card/60 p-2.5 text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="size-2.5 rounded-full bg-emerald-500" />
                            <span className="font-medium text-foreground">Resolved</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-mono border-emerald-500/40 text-emerald-600 dark:text-emerald-400">
                              {resolvedCount} reports
                            </Badge>
                            <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold w-10 text-right">
                              {resolvedPct}%
                            </span>
                          </div>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-muted/60 overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${resolvedPct}%` }} />
                        </div>
                        <span className="text-[10px] text-muted-foreground block">
                          Restored, tested, and operational streetlight assets.
                        </span>
                      </div>

                      {/* Under Repair Status Bar */}
                      <div className="rounded-lg border bg-card/60 p-2.5 text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="size-2.5 rounded-full bg-amber-500" />
                            <span className="font-medium text-foreground">Under Repair</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-[10px] py-0 px-1.5 font-mono text-amber-700 dark:text-amber-300">
                              {inProgressCount} reports
                            </Badge>
                            <span className="font-mono text-amber-600 dark:text-amber-400 font-bold w-10 text-right">
                              {inProgressPct}%
                            </span>
                          </div>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-muted/60 overflow-hidden">
                          <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${inProgressPct}%` }} />
                        </div>
                        <span className="text-[10px] text-muted-foreground block">
                          Engineering crews actively deployed and conducting field work.
                        </span>
                      </div>

                      {/* Pending Status Bar */}
                      <div className="rounded-lg border bg-card/60 p-2.5 text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="size-2.5 rounded-full bg-destructive" />
                            <span className="font-medium text-foreground">Pending Assessment</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="destructive" className="text-[10px] py-0 px-1.5 font-mono">
                              {pendingCount} reports
                            </Badge>
                            <span className="font-mono text-destructive font-bold w-10 text-right">
                              {pendingPct}%
                            </span>
                          </div>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-muted/60 overflow-hidden">
                          <div className="h-full bg-destructive rounded-full transition-all" style={{ width: `${pendingPct}%` }} />
                        </div>
                        <span className="text-[10px] text-muted-foreground block">
                          Reported tickets awaiting field lineman triage and crew dispatch.
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="border-t py-2.5 text-[11px] text-muted-foreground flex items-center justify-between">
                  <span>
                    Current system status: {totalReportsCount > 0 ? (pendingCount === 0 ? "Optimal — No pending backlogs" : `${pendingCount} tickets awaiting crew assignment`) : "No active reports"}
                  </span>
                  <Link href="/admin/analytics" className="text-primary hover:underline flex items-center gap-1 font-medium">
                    View detailed barangay breakdown across all {activeBarangaysCount} barangays &rarr;
                  </Link>
                </CardFooter>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
