"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  BarChart3,
  ClipboardList,
  AlertOctagon,
  Clock,
  CheckCircle2,
  ArrowLeft,
  MapPin,
  ExternalLink,
  RotateCw,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { type StreetlightReport } from "@/lib/mock-data";
import { getStoredReports } from "@/lib/reports-store";
import { supabase } from "@/lib/supabase";

// Fallback list of baseline barangays
export const SUPPORTED_BARANGAYS = [
  "Ampayon",
  "Baan Riverside",
  "Bancasi",
  "Bonbon",
  "Doongan",
  "Golden Ribbon",
  "Holy Redeemer",
  "Libertad",
  "Ong Yiu",
  "Pangabugan",
  "San Vicente",
  "Villa Kananga",
] as const;

export function AdminAnalyticsClient() {
  const [reports, setReports] = useState<StreetlightReport[]>([]);
  const [activeBarangays, setActiveBarangays] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Fetch all active barangays from public.barangays (is_active = true)
      // 2. Fetch reports from public.reports
      const [barangaysResult, reportsResult] = await Promise.all([
        supabase
          .from("barangays")
          .select("id, name, is_active")
          .eq("is_active", true)
          .order("name", { ascending: true }),
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
      ]);

      // Set active barangays dynamically (86 active Butuan City barangays)
      if (barangaysResult.data && barangaysResult.data.length > 0) {
        setActiveBarangays(barangaysResult.data.map((b) => b.name));
      } else {
        setActiveBarangays([...SUPPORTED_BARANGAYS]);
      }

      // Set live reports from Supabase
      if (reportsResult.data) {
        const mappedReports: StreetlightReport[] = reportsResult.data.map((row: any) => {
          let barangayName = "Unknown";
          if (row.barangays) {
            if (Array.isArray(row.barangays) && row.barangays.length > 0) {
              barangayName = row.barangays[0]?.name || "Unknown";
            } else if (typeof row.barangays === "object" && "name" in row.barangays) {
              barangayName = row.barangays.name || "Unknown";
            }
          }

          let assignedTeamName = "Pending Dispatch";
          if (row.maintenance_teams) {
            if (Array.isArray(row.maintenance_teams) && row.maintenance_teams.length > 0) {
              assignedTeamName = row.maintenance_teams[0]?.team_name || "Pending Dispatch";
            } else if (typeof row.maintenance_teams === "object" && "team_name" in row.maintenance_teams) {
              assignedTeamName = row.maintenance_teams.team_name || "Pending Dispatch";
            }
          }

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
            priority: row.priority || "High",
            status: row.status || "Pending",
            assignedTeam: assignedTeamName,
            reportedDate,
          };
        });

        setReports(mappedReports);
      } else {
        // Fallback to local storage if network request failed
        setReports(getStoredReports());
      }
    } catch (err) {
      console.error("Error loading analytics data from Supabase:", err);
      setReports(getStoredReports());
      setActiveBarangays([...SUPPORTED_BARANGAYS]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    const handleStorageChange = () => {
      fetchData();
    };

    window.addEventListener("butuan-reports-changed", handleStorageChange);
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("butuan-reports-changed", handleStorageChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [fetchData]);

  // Dynamic active barangay count (from public.barangays where is_active = true)
  const activeBarangayCount = activeBarangays.length;

  // Required KPI calculations derived directly from the reports data
  const totalReports = reports.length;
  const pendingReports = reports.filter((r) => r.status === "Pending").length;
  const underRepairReports = reports.filter((r) => r.status === "In Progress").length;
  const resolvedReports = reports.filter((r) => r.status === "Resolved").length;

  const pendingPct = totalReports > 0 ? Math.round((pendingReports / totalReports) * 100) : 0;
  const underRepairPct = totalReports > 0 ? Math.round((underRepairReports / totalReports) * 100) : 0;
  const resolvedPct = totalReports > 0 ? Math.round((resolvedReports / totalReports) * 100) : 0;

  // Breakdown across all active Butuan City barangays (not limited to 12)
  const barangayData = useMemo(() => {
    return activeBarangays.map((barangayName) => {
      const matching = reports.filter(
        (r) => r.barangay && r.barangay.trim().toLowerCase() === barangayName.trim().toLowerCase()
      );
      const count = matching.length;
      const pending = matching.filter((r) => r.status === "Pending").length;
      const underRepair = matching.filter((r) => r.status === "In Progress").length;
      const resolved = matching.filter((r) => r.status === "Resolved").length;
      const resolutionRate = count > 0 ? Math.round((resolved / count) * 100) : 0;

      return {
        name: barangayName,
        total: count,
        pending,
        underRepair,
        resolved,
        resolutionRate,
      };
    });
  }, [activeBarangays, reports]);

  // Filtered barangay list for fast search across all 86 barangays
  const filteredBarangayData = useMemo(() => {
    if (!searchQuery.trim()) return barangayData;
    const query = searchQuery.trim().toLowerCase();
    return barangayData.filter((b) => b.name.toLowerCase().includes(query));
  }, [barangayData, searchQuery]);

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner / Breadcrumb info matching Admin Dashboard */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
              Analytics & Resolution
            </h1>
            <Badge variant="outline" className="text-xs">
              Supabase Live Sync
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Operational metrics, resolution performance, and streetlight incident breakdown across {activeBarangayCount} Butuan City barangays.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/admin">
            <Button variant="ghost" size="sm" className="text-xs">
              <ArrowLeft data-icon="inline-start" />
              Operations Dashboard
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={fetchData}
            disabled={isLoading}
          >
            <RotateCw className={`size-3.5 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh Data
          </Button>
          <Link href="/admin/map">
            <Button variant="outline" size="sm" className="text-xs">
              <MapPin data-icon="inline-start" />
              Barangay Map
            </Button>
          </Link>
          <Link href="/resident">
            <Button variant="secondary" size="sm" className="text-xs">
              Resident Portal View
              <ExternalLink data-icon="inline-end" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Content: If loading or empty */}
      {isLoading ? (
        <Card className="p-12 text-center border-dashed">
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Clock className="size-7 animate-spin text-primary" />
            </div>
            <div className="flex flex-col gap-1 max-w-md">
              <span className="text-lg font-semibold text-foreground">
                Loading analytics data...
              </span>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Fetching reports and active barangay statistics from Supabase.
              </p>
            </div>
          </div>
        </Card>
      ) : totalReports === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <BarChart3 className="size-7" />
            </div>
            <div className="flex flex-col gap-1 max-w-md">
              <span className="text-lg font-semibold text-foreground">
                No reports available yet.
              </span>
              <p className="text-xs text-muted-foreground leading-relaxed">
                There are currently no streetlight problem reports logged in the system. As citizens submit reports through the portal or central dispatch logs incidents, statistics and barangay resolution data will populate here automatically.
              </p>
            </div>
            <div className="pt-2">
              <Link href="/admin/reports">
                <Button variant="outline" size="sm" className="text-xs">
                  Go to Incident Reports
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      ) : (
        <>
          {/* Summary KPI Cards */}
          <div id="analytics" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Total Reports */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Total Reports
                </CardTitle>
                <ClipboardList className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="font-heading text-2xl font-bold">
                  {totalReports}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Synchronized with citizen reports
                </p>
              </CardContent>
            </Card>

            {/* Pending Reports */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Pending Reports
                </CardTitle>
                <AlertOctagon className="size-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="font-heading text-2xl font-bold text-destructive">
                  {pendingReports}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Awaiting linemen assessment
                </p>
              </CardContent>
            </Card>

            {/* Under Repair Reports */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Under Repair Reports
                </CardTitle>
                <Clock className="size-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="font-heading text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {underRepairReports}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Line crews actively assigned
                </p>
              </CardContent>
            </Card>

            {/* Resolved Reports */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Resolved Reports
                </CardTitle>
                <CheckCircle2 className="size-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="font-heading text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {resolvedReports}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Restored & operational
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Breakdown Section: Status & Barangay */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Status Breakdown Card */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-base font-semibold">
                  Status Breakdown
                </CardTitle>
                <CardDescription className="text-xs">
                  Overall resolution progress across all recorded incidents.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Visual Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-muted-foreground">Overall Resolution Rate</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">
                      {resolvedPct}%
                    </span>
                  </div>
                  <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted/60">
                    <div
                      className="bg-emerald-500 transition-all"
                      style={{ width: `${resolvedPct}%` }}
                      title={`Resolved: ${resolvedPct}%`}
                    />
                    <div
                      className="bg-amber-500 transition-all"
                      style={{ width: `${underRepairPct}%` }}
                      title={`Under Repair: ${underRepairPct}%`}
                    />
                    <div
                      className="bg-destructive transition-all"
                      style={{ width: `${pendingPct}%` }}
                      title={`Pending: ${pendingPct}%`}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                    <span>{resolvedReports} of {totalReports} resolved</span>
                    <span className="font-mono">{totalReports - resolvedReports} active</span>
                  </div>
                </div>

                <div className="rounded-lg border divide-y text-xs">
                  {/* Pending Row */}
                  <div className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-2">
                      <span className="size-2.5 rounded-full bg-destructive" />
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">Pending</span>
                        <span className="text-[11px] text-muted-foreground">Awaiting inspection</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive" className="font-mono text-xs">
                        {pendingReports}
                      </Badge>
                      <span className="text-[11px] font-mono text-muted-foreground w-10 text-right">
                        {pendingPct}%
                      </span>
                    </div>
                  </div>

                  {/* Under Repair Row */}
                  <div className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-2">
                      <span className="size-2.5 rounded-full bg-amber-500" />
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">Under Repair</span>
                        <span className="text-[11px] text-muted-foreground">Crews dispatched</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="font-mono text-xs text-amber-700 dark:text-amber-300">
                        {underRepairReports}
                      </Badge>
                      <span className="text-[11px] font-mono text-muted-foreground w-10 text-right">
                        {underRepairPct}%
                      </span>
                    </div>
                  </div>

                  {/* Resolved Row */}
                  <div className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-2">
                      <span className="size-2.5 rounded-full bg-emerald-500" />
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">Resolved</span>
                        <span className="text-[11px] text-muted-foreground">Repaired & closed</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-xs border-emerald-500/40 text-emerald-600 dark:text-emerald-400">
                        {resolvedReports}
                      </Badge>
                      <span className="text-[11px] font-mono text-muted-foreground w-10 text-right">
                        {resolvedPct}%
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="border-t py-3 text-xs text-muted-foreground">
                Live counts sync with active incident updates.
              </CardFooter>
            </Card>

            {/* Detailed Breakdown by Barangay Card */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-base font-semibold">
                      Breakdown by Barangay
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Report volume across the {activeBarangayCount} supported Butuan City barangays.
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="text-[11px] self-start sm:self-auto font-mono">
                    {activeBarangayCount} Barangays Covered
                  </Badge>
                </div>

                {/* Barangay Search Filter */}
                <div className="relative pt-2">
                  <Search className="absolute left-2.5 top-4.5 size-3.5 text-muted-foreground pointer-events-none" />
                  <Input
                    type="search"
                    placeholder={`Search among all ${activeBarangayCount} barangays...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 text-xs h-8"
                  />
                </div>
              </CardHeader>

              <CardContent className="p-0 max-h-[500px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Barangay</TableHead>
                      <TableHead className="text-center">Total</TableHead>
                      <TableHead className="text-center">Pending</TableHead>
                      <TableHead className="text-center">Under Repair</TableHead>
                      <TableHead className="text-center">Resolved</TableHead>
                      <TableHead className="text-right">Resolution</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBarangayData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center text-xs text-muted-foreground">
                          No barangays matching &ldquo;{searchQuery}&rdquo;.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredBarangayData.map((b) => (
                        <TableRow key={b.name} className="hover:bg-muted/40 text-xs">
                          {/* Barangay Name */}
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <MapPin className="size-3.5 text-muted-foreground shrink-0" />
                              <span>{b.name}</span>
                            </div>
                          </TableCell>

                          {/* Total Count */}
                          <TableCell className="text-center font-mono font-semibold">
                            {b.total > 0 ? (
                              <span className="text-foreground">{b.total}</span>
                            ) : (
                              <span className="text-muted-foreground/40 font-normal">0</span>
                            )}
                          </TableCell>

                          {/* Pending */}
                          <TableCell className="text-center">
                            {b.pending > 0 ? (
                              <Badge variant="destructive" className="text-[10px] py-0 px-1 font-mono">
                                {b.pending}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground/40 font-mono">-</span>
                            )}
                          </TableCell>

                          {/* Under Repair */}
                          <TableCell className="text-center">
                            {b.underRepair > 0 ? (
                              <Badge variant="secondary" className="text-[10px] py-0 px-1 font-mono text-amber-700 dark:text-amber-300">
                                {b.underRepair}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground/40 font-mono">-</span>
                            )}
                          </TableCell>

                          {/* Resolved */}
                          <TableCell className="text-center">
                            {b.resolved > 0 ? (
                              <Badge variant="outline" className="text-[10px] py-0 px-1 font-mono border-emerald-500/40 text-emerald-600 dark:text-emerald-400">
                                {b.resolved}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground/40 font-mono">-</span>
                            )}
                          </TableCell>

                          {/* Resolution Rate */}
                          <TableCell className="text-right font-mono">
                            {b.total > 0 ? (
                              <span className={b.resolutionRate === 100 ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-foreground"}>
                                {b.resolutionRate}%
                              </span>
                            ) : (
                              <span className="text-muted-foreground/40">0%</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>

              <CardFooter className="border-t py-3 text-xs text-muted-foreground flex items-center justify-between">
                <span>
                  Showing {filteredBarangayData.length} of {activeBarangayCount} active Butuan City barangays
                </span>
                <Link href="/admin/map" className="text-primary hover:underline text-xs">
                  View spatial GIS map &rarr;
                </Link>
              </CardFooter>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
