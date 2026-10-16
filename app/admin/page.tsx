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
import { type StreetlightReport } from "@/lib/mock-data";
import { mapDbRowToReport } from "@/lib/reports-store";
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
              is_archived,
              is_deleted,
              barangays (
                id,
                name
              ),
              maintenance_teams (
                id,
                team_name
              )
            `)
            .eq("is_archived", false)
            .eq("is_deleted", false)
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
          const mappedReports: StreetlightReport[] = reportsResponse.data.map(mapDbRowToReport);

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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Operations & Incident Overview
            </h1>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 shadow-2xs">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
              </span>
              Supabase Live Sync
            </div>
          </div>
          <p className="text-sm text-muted-foreground max-w-3xl leading-relaxed">
            Monitor reported streetlight defects across {activeBarangaysCount} Butuan City barangays, assign repair teams, and track resolution.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href="/">
            <Button variant="ghost" size="sm" className="h-8 text-xs font-medium text-muted-foreground hover:text-foreground">
              <ArrowLeft data-icon="inline-start" className="size-3.5" />
              Public Home
            </Button>
          </Link>
          <Button variant="outline" size="sm" className="h-8 text-xs font-medium shadow-2xs hover:bg-muted/80">
            <Download data-icon="inline-start" className="size-3.5" />
            Export Log (CSV)
          </Button>
          {!isAdmin && (
            <Link href="/resident">
              <Button variant="secondary" size="sm" className="h-8 text-xs font-medium shadow-2xs">
                Switch to Resident Portal
                <ExternalLink data-icon="inline-end" className="size-3.5" />
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Emergency Hazard Callout */}
      <div className="relative overflow-hidden rounded-xl border border-destructive/30 border-l-4 border-l-destructive bg-card/90 dark:bg-card/60 p-4 sm:p-5 shadow-xs backdrop-blur-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors">
        <div className="flex items-start gap-3.5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-destructive/15 text-destructive ring-1 ring-destructive/25">
            <ShieldAlert className="size-5" />
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-sm text-foreground">
              Emergency Priority: Exposed Wiring Alert (Ticket #BXU-2026-0089)
            </span>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Location: Brgy. Villa Kananga, Rosales Street near Day Care Center. Flagged for urgent hazard isolation.
            </p>
          </div>
        </div>
        <Badge variant="destructive" className="shrink-0 text-xs font-semibold tracking-wide uppercase px-2.5 py-1 shadow-2xs">
          High Voltage Hazard
        </Badge>
      </div>

      {/* Analytics & Resolution Section */}
      <div id="analytics" className="space-y-5">
        {isLoading ? (
          <Card className="rounded-xl border border-dashed border-border/80 bg-card/60 p-10 text-center backdrop-blur-xs shadow-xs">
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-xl bg-muted/80 text-muted-foreground ring-1 ring-border/50">
                <Clock className="size-5 animate-spin text-primary" />
              </div>
              <div className="space-y-1">
                <span className="text-base font-semibold text-foreground block">
                  Loading dashboard overview...
                </span>
                <p className="text-xs text-muted-foreground">
                  Fetching latest reports and statistics from Supabase.
                </p>
              </div>
            </div>
          </Card>
        ) : error ? (
          <Card className="rounded-xl border border-dashed border-destructive/50 bg-card/60 p-10 text-center backdrop-blur-xs shadow-xs">
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-xl bg-destructive/10 text-destructive ring-1 ring-destructive/20">
                <AlertOctagon className="size-5" />
              </div>
              <div className="space-y-1">
                <span className="text-base font-semibold text-destructive block">
                  Failed to load reports
                </span>
                <p className="text-xs text-muted-foreground">
                  {error}
                </p>
              </div>
            </div>
          </Card>
        ) : totalReportsCount === 0 ? (
          <Card className="rounded-xl border border-dashed border-border/80 bg-card/60 p-10 text-center backdrop-blur-xs shadow-xs">
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-xl bg-muted/80 text-muted-foreground ring-1 ring-border/50">
                <BarChart3 className="size-5 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <span className="text-base font-semibold text-foreground block">
                  No reports available yet.
                </span>
                <p className="text-xs text-muted-foreground max-w-md">
                  Analytics and resolution statistics will calculate automatically once incident reports are logged.
                </p>
              </div>
            </div>
          </Card>
        ) : (
          <>
            {/* KPI Stats Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Total Reports */}
              <Card className="group relative overflow-hidden rounded-xl border border-border/80 bg-card/95 shadow-xs hover:border-border hover:shadow-md transition-all duration-200">
                <div className="absolute inset-x-0 top-0 h-0.5 bg-muted-foreground/30 group-hover:bg-foreground/50 transition-colors" />
                <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4 sm:px-5">
                  <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Total Reports
                  </CardTitle>
                  <div className="flex size-8 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground ring-1 ring-border/50 group-hover:text-foreground transition-colors">
                    <ClipboardList className="size-4" />
                  </div>
                </CardHeader>
                <CardContent className="px-4 sm:px-5 pb-4">
                  <div className="font-heading text-3xl font-bold tracking-tight text-foreground tabular-nums">
                    {totalReportsCount}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-normal">
                    Synchronized with citizen reports
                  </p>
                </CardContent>
              </Card>

              {/* Pending Reports */}
              <Card className="group relative overflow-hidden rounded-xl border border-border/80 bg-card/95 shadow-xs hover:border-destructive/40 hover:shadow-md transition-all duration-200">
                <div className="absolute inset-x-0 top-0 h-0.5 bg-destructive/60 group-hover:bg-destructive transition-colors" />
                <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4 sm:px-5">
                  <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Pending Reports
                  </CardTitle>
                  <div className="flex size-8 items-center justify-center rounded-lg bg-destructive/10 text-destructive ring-1 ring-destructive/20 group-hover:bg-destructive/15 transition-colors">
                    <AlertOctagon className="size-4" />
                  </div>
                </CardHeader>
                <CardContent className="px-4 sm:px-5 pb-4">
                  <div className="flex items-baseline gap-2">
                    <div className="font-heading text-3xl font-bold tracking-tight text-destructive tabular-nums">
                      {pendingCount}
                    </div>
                    {totalReportsCount > 0 && (
                      <span className="text-[11px] font-mono font-medium text-destructive px-1.5 py-0.5 rounded-sm bg-destructive/10 ring-1 ring-destructive/20">
                        {pendingPct}%
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-normal">
                    Awaiting linemen assessment
                  </p>
                </CardContent>
              </Card>

              {/* Under Repair Reports */}
              <Card className="group relative overflow-hidden rounded-xl border border-border/80 bg-card/95 shadow-xs hover:border-amber-500/40 hover:shadow-md transition-all duration-200">
                <div className="absolute inset-x-0 top-0 h-0.5 bg-amber-500/60 group-hover:bg-amber-500 transition-colors" />
                <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4 sm:px-5">
                  <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Under Repair Reports
                  </CardTitle>
                  <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/20 group-hover:bg-amber-500/15 transition-colors">
                    <Clock className="size-4" />
                  </div>
                </CardHeader>
                <CardContent className="px-4 sm:px-5 pb-4">
                  <div className="flex items-baseline gap-2">
                    <div className="font-heading text-3xl font-bold tracking-tight text-amber-600 dark:text-amber-400 tabular-nums">
                      {inProgressCount}
                    </div>
                    {totalReportsCount > 0 && (
                      <span className="text-[11px] font-mono font-medium text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded-sm bg-amber-500/10 ring-1 ring-amber-500/20">
                        {inProgressPct}%
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-normal">
                    Line crews actively assigned
                  </p>
                </CardContent>
              </Card>

              {/* Resolved Reports */}
              <Card className="group relative overflow-hidden rounded-xl border border-border/80 bg-card/95 shadow-xs hover:border-emerald-500/40 hover:shadow-md transition-all duration-200">
                <div className="absolute inset-x-0 top-0 h-0.5 bg-emerald-500/60 group-hover:bg-emerald-500 transition-colors" />
                <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4 sm:px-5">
                  <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Resolved Reports
                  </CardTitle>
                  <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20 group-hover:bg-emerald-500/15 transition-colors">
                    <CheckCircle2 className="size-4" />
                  </div>
                </CardHeader>
                <CardContent className="px-4 sm:px-5 pb-4">
                  <div className="flex items-baseline gap-2">
                    <div className="font-heading text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {resolvedCount}
                    </div>
                    {totalReportsCount > 0 && (
                      <span className="text-[11px] font-mono font-medium text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded-sm bg-emerald-500/10 ring-1 ring-emerald-500/20">
                        {resolvedPct}%
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-normal">
                    Restored & operational
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Dashboard Overview: Status Breakdown + Report Status Distribution Chart */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
              {/* Status Breakdown (Col 1) */}
              <Card className="rounded-xl border border-border/80 bg-card/95 shadow-xs flex flex-col justify-between">
                <div>
                  <CardHeader className="pb-3 pt-4 px-4 sm:px-5 border-b border-border/50">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold tracking-tight text-foreground">
                        Status Breakdown
                      </CardTitle>
                      <Badge variant="outline" className="text-[10px] font-mono font-medium text-muted-foreground px-2 py-0 border-border/60">
                        Live Triage
                      </Badge>
                    </div>
                    <CardDescription className="text-xs text-muted-foreground mt-0.5">
                      Overall resolution progress across all recorded reports.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-5 space-y-4">
                    {/* Progress bar */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-muted-foreground">Resolution Rate</span>
                        <div className="flex items-center gap-1.5 font-mono">
                          <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                            {resolvedPct}%
                          </span>
                          <span className="text-[11px] text-muted-foreground">completed</span>
                        </div>
                      </div>
                      <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted/70 p-0.5 ring-1 ring-border/50 gap-0.5">
                        <div
                          className="bg-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${resolvedPct}%` }}
                          title={`Resolved: ${resolvedPct}%`}
                        />
                        <div
                          className="bg-amber-500 rounded-full transition-all duration-500"
                          style={{ width: `${inProgressPct}%` }}
                          title={`Under Repair: ${inProgressPct}%`}
                        />
                        <div
                          className="bg-destructive rounded-full transition-all duration-500"
                          style={{ width: `${pendingPct}%` }}
                          title={`Pending: ${pendingPct}%`}
                        />
                      </div>
                    </div>

                    <div className="rounded-lg border border-border/60 divide-y divide-border/60 bg-muted/20 overflow-hidden text-xs">
                      <div className="flex items-center justify-between p-2.5 hover:bg-muted/40 transition-colors">
                        <div className="flex items-center gap-2">
                          <span className="size-2 rounded-full bg-destructive ring-2 ring-destructive/20" />
                          <span className="font-medium text-foreground">Pending</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <Badge variant="destructive" className="text-[11px] py-0 px-2 font-mono font-medium">
                            {pendingCount}
                          </Badge>
                          <span className="text-muted-foreground font-mono text-xs w-9 text-right font-medium">
                            {pendingPct}%
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-2.5 hover:bg-muted/40 transition-colors">
                        <div className="flex items-center gap-2">
                          <span className="size-2 rounded-full bg-amber-500 ring-2 ring-amber-500/20" />
                          <span className="font-medium text-foreground">Under Repair</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <Badge variant="secondary" className="text-[11px] py-0 px-2 font-mono font-medium text-amber-700 dark:text-amber-300 border border-amber-500/20 bg-amber-500/10">
                            {inProgressCount}
                          </Badge>
                          <span className="text-muted-foreground font-mono text-xs w-9 text-right font-medium">
                            {inProgressPct}%
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-2.5 hover:bg-muted/40 transition-colors">
                        <div className="flex items-center gap-2">
                          <span className="size-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
                          <span className="font-medium text-foreground">Resolved</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <Badge variant="outline" className="text-[11px] py-0 px-2 font-mono font-medium border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5">
                            {resolvedCount}
                          </Badge>
                          <span className="text-muted-foreground font-mono text-xs w-9 text-right font-medium">
                            {resolvedPct}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </div>
                <CardFooter className="border-t border-border/50 py-2.5 px-4 sm:px-5 text-xs text-muted-foreground bg-muted/20">
                  <Link
                    href="/admin/analytics"
                    className="text-primary hover:text-primary/80 transition-colors flex items-center gap-1 font-medium text-xs group"
                  >
                    <span>Open dedicated Analytics page</span>
                    <span className="transition-transform group-hover:translate-x-0.5">&rarr;</span>
                  </Link>
                </CardFooter>
              </Card>

              {/* Status Distribution Chart (Col 2-3) */}
              <Card className="rounded-xl border border-border/80 bg-card/95 shadow-xs lg:col-span-2 flex flex-col justify-between">
                <div>
                  <CardHeader className="pb-3 pt-4 px-4 sm:px-5 border-b border-border/50">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-sm font-semibold tracking-tight text-foreground">
                            System Status Distribution
                          </CardTitle>
                          <span className="size-1.5 rounded-full bg-emerald-500" />
                        </div>
                        <CardDescription className="text-xs text-muted-foreground mt-0.5">
                          Visual distribution answering: what is the current operational status of the streetlight network?
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="text-xs self-start sm:self-auto font-mono font-medium px-2.5 py-0.5 border-border/80 bg-muted/30">
                        {totalReportsCount} Total Incidents
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-5 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                      {/* SVG Donut Ring Chart */}
                      <div className="md:col-span-5 flex flex-col items-center justify-center">
                        <div className="relative size-40 sm:size-44 flex items-center justify-center">
                          <svg className="size-full -rotate-90 filter drop-shadow-2xs" viewBox="0 0 160 160">
                            {/* Subtle Guideline Ring */}
                            <circle
                              cx="80"
                              cy="80"
                              r="67"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1"
                              strokeDasharray="3 3"
                              className="text-border/60"
                            />
                            {/* Background Track */}
                            <circle
                              cx="80"
                              cy="80"
                              r="58"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="14"
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
                                  strokeWidth="14"
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
                                  strokeWidth="14"
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
                                  strokeWidth="14"
                                  strokeDasharray={`${(pendingCount / totalReportsCount) * CIRCUMFERENCE} ${CIRCUMFERENCE}`}
                                  strokeDashoffset={`-${((resolvedCount + inProgressCount) / totalReportsCount) * CIRCUMFERENCE}`}
                                  className="transition-all duration-500 ease-out"
                                />
                              </>
                            ) : null}
                          </svg>

                          {/* Center Metric */}
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                            <span className="font-heading text-3xl font-bold tracking-tight text-foreground tabular-nums">
                              {resolvedPct}%
                            </span>
                            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mt-0.5">
                              Resolved
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Proportional Status Legend and Micro-bars */}
                      <div className="md:col-span-7 flex flex-col gap-2.5">
                        {/* Resolved Status Bar */}
                        <div className="rounded-lg border border-border/70 bg-card/60 dark:bg-card/40 p-3 text-xs space-y-2 hover:border-emerald-500/40 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="size-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
                              <span className="font-semibold text-foreground">Resolved</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-[10px] py-0 px-2 font-mono font-medium border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5">
                                {resolvedCount} reports
                              </Badge>
                              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold text-xs w-10 text-right">
                                {resolvedPct}%
                              </span>
                            </div>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-muted/70 overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${resolvedPct}%` }} />
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">
                            Restored, tested, and operational streetlight assets.
                          </p>
                        </div>

                        {/* Under Repair Status Bar */}
                        <div className="rounded-lg border border-border/70 bg-card/60 dark:bg-card/40 p-3 text-xs space-y-2 hover:border-amber-500/40 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="size-2.5 rounded-full bg-amber-500 ring-2 ring-amber-500/20" />
                              <span className="font-semibold text-foreground">Under Repair</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-[10px] py-0 px-2 font-mono font-medium text-amber-700 dark:text-amber-300 border border-amber-500/20 bg-amber-500/10">
                                {inProgressCount} reports
                              </Badge>
                              <span className="font-mono text-amber-600 dark:text-amber-400 font-bold text-xs w-10 text-right">
                                {inProgressPct}%
                              </span>
                            </div>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-muted/70 overflow-hidden">
                            <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${inProgressPct}%` }} />
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">
                            Engineering crews actively deployed and conducting field work.
                          </p>
                        </div>

                        {/* Pending Status Bar */}
                        <div className="rounded-lg border border-border/70 bg-card/60 dark:bg-card/40 p-3 text-xs space-y-2 hover:border-destructive/40 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="size-2.5 rounded-full bg-destructive ring-2 ring-destructive/20" />
                              <span className="font-semibold text-foreground">Pending Assessment</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="destructive" className="text-[10px] py-0 px-2 font-mono font-medium">
                                {pendingCount} reports
                              </Badge>
                              <span className="font-mono text-destructive font-bold text-xs w-10 text-right">
                                {pendingPct}%
                              </span>
                            </div>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-muted/70 overflow-hidden">
                            <div className="h-full bg-destructive rounded-full transition-all duration-500" style={{ width: `${pendingPct}%` }} />
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">
                            Reported tickets awaiting field lineman triage and crew dispatch.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </div>

                <CardFooter className="border-t border-border/50 py-3 px-4 sm:px-5 text-xs text-muted-foreground bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`size-2 rounded-full ${pendingCount === 0 ? "bg-emerald-500" : "bg-amber-500"}`} />
                    <span className="font-medium text-foreground">
                      Current system status:{" "}
                      <span className="font-normal text-muted-foreground">
                        {totalReportsCount > 0 ? (pendingCount === 0 ? "Optimal — No pending backlogs" : `${pendingCount} tickets awaiting crew assignment`) : "No active reports"}
                      </span>
                    </span>
                  </div>
                  <Link href="/admin/analytics" className="text-primary hover:text-primary/80 transition-colors flex items-center gap-1 font-medium group">
                    <span>View detailed barangay breakdown across all {activeBarangaysCount} barangays</span>
                    <span className="transition-transform group-hover:translate-x-0.5">&rarr;</span>
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
