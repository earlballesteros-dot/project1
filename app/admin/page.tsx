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
  Eye,
  User,
  Phone,
  MapPin,
  FileText,
  BarChart3,
  Users,
  Wrench,
  Check,
  Trash2,
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
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  type StreetlightReport,
  type ReportStatus,
  type PriorityLevel,
  MOCK_BARANGAYS,
} from "@/lib/mock-data";
import {
  getStoredTeams,
  BUTUAN_MAINTENANCE_TEAMS,
  type MaintenanceTeamConfig,
} from "@/lib/teams-data";
import { useAuth } from "@clerk/nextjs";
import { useIsAdmin } from "@/lib/roles";
import { createClerkSupabaseClient } from "@/lib/supabase";

export default function AdminDashboard() {
  const { getToken } = useAuth();
  const supabase = useMemo(() => createClerkSupabaseClient(getToken), [getToken]);
  const isAdmin = useIsAdmin();
  const [reports, setReports] = useState<StreetlightReport[]>([]);
  const [teams, setTeams] = useState<MaintenanceTeamConfig[]>(BUTUAN_MAINTENANCE_TEAMS);
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [selectedReport, setSelectedReport] = useState<StreetlightReport | null>(null);
  const [crewToAssign, setCrewToAssign] = useState<string>("Pending Dispatch");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [signedPhotoUrl, setSignedPhotoUrl] = useState<string | null>(null);
  const [isPhotoLoading, setIsPhotoLoading] = useState<boolean>(false);
  const [photoError, setPhotoError] = useState<boolean>(false);

  // Load reports from Supabase public.reports
  useEffect(() => {
    let isMounted = true;

    async function fetchReports() {
      setIsLoading(true);
      setError(null);

      try {
        const { data, error: supabaseError } = await supabase
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
          .order("created_at", { ascending: false });

        if (supabaseError) {
          console.error("Error loading reports from Supabase:", supabaseError.message, supabaseError);
          if (isMounted) {
            setError(supabaseError.message);
            setReports([]);
          }
          return;
        }

        if (data && isMounted) {
          const mappedReports: StreetlightReport[] = data.map((row: any) => {
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
        console.error("Failed to query reports from Supabase:", err);
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

    fetchReports();

    return () => {
      isMounted = false;
    };
  }, [supabase]);

  // Synchronize teams with local storage
  useEffect(() => {
    setTeams(getStoredTeams());

    const handleStorageChange = () => {
      setTeams(getStoredTeams());
    };

    window.addEventListener("butuan-teams-changed", handleStorageChange);
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("butuan-teams-changed", handleStorageChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Sync selected crew dropdown when selected report changes
  useEffect(() => {
    if (selectedReport) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCrewToAssign(selectedReport.assignedTeam || "Pending Dispatch");
    }
  }, [selectedReport]);

  // Generate temporary signed URL for attached report photo from private storage
  useEffect(() => {
    let isMounted = true;

    if (!selectedReport?.photoUrl) {
      setSignedPhotoUrl(null);
      setIsPhotoLoading(false);
      setPhotoError(false);
      return;
    }

    function normalizeStoragePath(rawPath: string): string {
      if (!rawPath) return "";
      let path = rawPath.trim();

      // If full URL, strip query params and parse pathname
      if (path.startsWith("http://") || path.startsWith("https://")) {
        try {
          const url = new URL(path);
          path = url.pathname;
        } catch {
          path = path.replace(/^https?:\/\/[^\/]+/, "");
          path = path.split("?")[0].split("#")[0];
        }
      }

      // Strip standard Supabase storage endpoint prefixes
      path = path.replace(/^\/?storage\/v1\/object\/(?:public|sign|authenticated)\//, "");

      // Strip leading slashes
      path = path.replace(/^\/+/, "");

      // Strip bucket name prefix if present: "report-photos/"
      if (path.startsWith("report-photos/")) {
        path = path.slice("report-photos/".length);
      }

      // Strip leading slashes again if any
      path = path.replace(/^\/+/, "");

      // Collapse duplicated 'reports/' prefixes: 'reports/reports/...' -> 'reports/...'
      while (path.startsWith("reports/reports/")) {
        path = path.slice("reports/".length);
      }

      // Ensure it starts with "reports/" if the object is in the reports folder
      if (!path.startsWith("reports/") && path.length > 0) {
        path = `reports/${path}`;
      }

      return path;
    }

    async function loadSignedPhotoUrl() {
      setIsPhotoLoading(true);
      setPhotoError(false);
      setSignedPhotoUrl(null);

      try {
        const rawPhotoPath = selectedReport!.photoUrl!;
        const normalizedPath = normalizeStoragePath(rawPhotoPath);

        // Temporarily log normalized path for verification
        console.log("Normalized Storage path:", normalizedPath);

        const { data, error: storageError } = await supabase.storage
          .from("report-photos")
          .createSignedUrl(normalizedPath, 3600);

        if (storageError || !data?.signedUrl) {
          console.error(
            "Failed to generate signed photo URL:",
            storageError?.message || "No signed URL returned"
          );
          if (isMounted) {
            setPhotoError(true);
          }
        } else {
          if (isMounted) {
            setSignedPhotoUrl(data.signedUrl);
          }
        }
      } catch (err: unknown) {
        console.error("Unexpected error generating signed photo URL:", err);
        if (isMounted) {
          setPhotoError(true);
        }
      } finally {
        if (isMounted) {
          setIsPhotoLoading(false);
        }
      }
    }

    loadSignedPhotoUrl();

    return () => {
      isMounted = false;
    };
  }, [selectedReport?.id, selectedReport?.photoUrl, supabase]);

  const filteredReports =
    statusFilter === "All"
      ? reports
      : reports.filter((r) => r.status === statusFilter);

  // Dynamic KPI counts from live local data
  const totalReportsCount = reports.length;
  const pendingCount = reports.filter((r) => r.status === "Pending").length;
  const inProgressCount = reports.filter((r) => r.status === "In Progress").length;
  const resolvedCount = reports.filter((r) => r.status === "Resolved").length;

  const pendingPct = totalReportsCount > 0 ? Math.round((pendingCount / totalReportsCount) * 100) : 0;
  const inProgressPct = totalReportsCount > 0 ? Math.round((inProgressCount / totalReportsCount) * 100) : 0;
  const resolvedPct = totalReportsCount > 0 ? Math.round((resolvedCount / totalReportsCount) * 100) : 0;

  // Breakdown across the 12 supported Butuan City barangays
  const barangayBreakdown = MOCK_BARANGAYS.map((brgy) => {
    const matching = reports.filter(
      (r) => r.barangay.trim().toLowerCase() === brgy.trim().toLowerCase()
    );
    const count = matching.length;
    const pending = matching.filter((r) => r.status === "Pending").length;
    const underRepair = matching.filter((r) => r.status === "In Progress").length;
    const resolved = matching.filter((r) => r.status === "Resolved").length;
    const resolutionRate = count > 0 ? Math.round((resolved / count) * 100) : 0;

    return {
      name: brgy,
      total: count,
      pending,
      underRepair,
      resolved,
      resolutionRate,
    };
  });

  // Dynamic workload for the 4 maintenance teams based on active reports
  const teamsWorkload = teams.map((team) => {
    const assignedReports = reports.filter((r) =>
      r.assignedTeam?.toLowerCase().includes(team.keyword.toLowerCase())
    );
    const inProgressCount = assignedReports.filter((r) => r.status === "In Progress").length;
    const pendingCount = assignedReports.filter((r) => r.status === "Pending").length;
    const resolvedCount = assignedReports.filter((r) => r.status === "Resolved").length;
    const activeWorkload = inProgressCount + pendingCount;
    return {
      ...team,
      inProgressCount,
      pendingCount,
      resolvedCount,
      activeWorkload,
      statusText: inProgressCount > 0 ? "Dispatched" : activeWorkload > 0 ? "Staging" : "Standby",
      availability: activeWorkload >= 2 ? "High Workload" : activeWorkload === 1 ? "Engaged" : "Available",
    };
  });

  const handleStatusChange = async (id: string, newStatus: ReportStatus) => {
    try {
      const { error: updateError } = await supabase
        .from("reports")
        .update({ status: newStatus })
        .eq("id", id);

      if (updateError) {
        console.error("Error updating report status in Supabase:", updateError.message, updateError);
        alert(`Failed to update report status: ${updateError.message}`);
        return;
      }

      // Only update the local React state after the Supabase update succeeds
      setReports((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
      );
      if (selectedReport && selectedReport.id === id) {
        setSelectedReport((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unexpected error updating report status";
      console.error("Error updating report status:", err);
      alert(`Failed to update report status: ${msg}`);
    }
  };

  const handleAssignCrew = async (id: string, newTeam: string) => {
    try {
      let teamUuid: string | null = null;
      let teamDisplayName = "Pending Dispatch";

      if (newTeam && newTeam !== "Pending Dispatch") {
        const targetTeam = teams.find((t) => t.name === newTeam || t.id === newTeam);
        if (targetTeam) {
          teamDisplayName = targetTeam.name;

          // Check if team ID is already a valid UUID
          const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetTeam.id);
          if (isUuid) {
            teamUuid = targetTeam.id;
          } else {
            // Query Supabase maintenance_teams by team_code or team_name
            try {
              const { data: teamRow, error: teamQueryError } = await supabase
                .from("maintenance_teams")
                .select("id")
                .or(`team_code.eq.${targetTeam.id},team_name.eq.${targetTeam.name}`)
                .maybeSingle();

              if (teamRow?.id) {
                teamUuid = teamRow.id;
              } else if (teamQueryError) {
                console.error("Error finding maintenance team UUID in Supabase:", teamQueryError.message);
              }
            } catch (err) {
              console.error("Failed to query maintenance_teams table:", err);
            }

            // Fallback lookup if query didn't return
            if (!teamUuid) {
              const TEAM_UUID_MAP: Record<string, string> = {
                "BXU-CREW-01": "1db46bf7-9881-4b17-9709-7642872aa16c",
                "BXU-CREW-02": "d8209e09-2933-4b20-a809-9ddbeb2fcfbc",
                "BXU-CREW-03": "c8880b8a-2f30-4999-ac86-83fb01c9f1f5",
                "BXU-CREW-04": "e5042ceb-0e3d-4f12-86c4-58319c70d0bd",
              };
              teamUuid = TEAM_UUID_MAP[targetTeam.id] || targetTeam.id;
            }
          }
        }
      }

      const { error: updateError } = await supabase
        .from("reports")
        .update({ assigned_team_id: teamUuid })
        .eq("id", id);

      if (updateError) {
        console.error("Error updating assigned crew in Supabase:", updateError.message, updateError);
        alert(`Failed to assign team: ${updateError.message}`);
        return;
      }

      // Update local React state only after Supabase update succeeds
      setReports((prev) =>
        prev.map((r) => (r.id === id ? { ...r, assignedTeam: teamDisplayName } : r))
      );
      if (selectedReport && selectedReport.id === id) {
        setSelectedReport((prev) => (prev ? { ...prev, assignedTeam: teamDisplayName } : null));
        setCrewToAssign(teamDisplayName);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unexpected error assigning team";
      console.error("Error assigning crew:", err);
      alert(`Failed to assign team: ${msg}`);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this incident report? This action cannot be undone."
    );
    if (!confirmed) return;

    try {
      const { error: deleteError } = await supabase
        .from("reports")
        .delete()
        .eq("id", reportId);

      if (deleteError) {
        console.error("Error deleting report from Supabase:", deleteError.message, deleteError);
        alert(`Failed to delete report: ${deleteError.message}`);
        return;
      }

      // If successful: remove report from local React reports state
      setReports((prev) => prev.filter((r) => r.id !== reportId));

      // Close the selected-report dialog if applicable
      if (selectedReport && selectedReport.id === reportId) {
        setSelectedReport(null);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unexpected error deleting report";
      console.error("Error deleting report:", err);
      alert(`Failed to delete report: ${msg}`);
    }
  };

  // Find designated crew for currently viewed report based on its barangay
  const designatedTeam = selectedReport
    ? teams.find((t) => t.assignedBarangays.includes(selectedReport.barangay))
    : null;

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
            Monitor reported streetlight defects, assign repair teams, and track resolution across Butuan City.
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
        {totalReportsCount === 0 ? (
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

            {/* Simple Breakdown by Status & Barangay */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {/* Status Breakdown */}
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

              {/* Barangay Breakdown */}
              <Card className="lg:col-span-2">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-semibold">
                        Breakdown by Barangay
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Report volume across the 12 supported Butuan City barangays.
                      </CardDescription>
                    </div>
                    <Link href="/admin/analytics">
                      <Button variant="outline" size="xs" className="text-[11px]">
                        Full Details
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="p-0 max-h-[260px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="py-2 text-xs">Barangay</TableHead>
                        <TableHead className="py-2 text-xs text-center">Total</TableHead>
                        <TableHead className="py-2 text-xs text-center">Pending</TableHead>
                        <TableHead className="py-2 text-xs text-center">Under Repair</TableHead>
                        <TableHead className="py-2 text-xs text-center">Resolved</TableHead>
                        <TableHead className="py-2 text-xs text-right">Resolution</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {barangayBreakdown.map((b) => (
                        <TableRow key={b.name} className="hover:bg-muted/40 text-xs">
                          <TableCell className="py-1.5 font-medium">{b.name}</TableCell>
                          <TableCell className="py-1.5 text-center font-mono font-semibold">
                            {b.total > 0 ? b.total : <span className="text-muted-foreground/40 font-normal">0</span>}
                          </TableCell>
                          <TableCell className="py-1.5 text-center">
                            {b.pending > 0 ? (
                              <Badge variant="destructive" className="text-[10px] py-0 px-1 font-mono">
                                {b.pending}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground/40 font-mono">-</span>
                            )}
                          </TableCell>
                          <TableCell className="py-1.5 text-center">
                            {b.underRepair > 0 ? (
                              <Badge variant="secondary" className="text-[10px] py-0 px-1 font-mono text-amber-700 dark:text-amber-300">
                                {b.underRepair}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground/40 font-mono">-</span>
                            )}
                          </TableCell>
                          <TableCell className="py-1.5 text-center">
                            {b.resolved > 0 ? (
                              <Badge variant="outline" className="text-[10px] py-0 px-1 font-mono border-emerald-500/40 text-emerald-600 dark:text-emerald-400">
                                {b.resolved}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground/40 font-mono">-</span>
                            )}
                          </TableCell>
                          <TableCell className="py-1.5 text-right font-mono">
                            {b.total > 0 ? `${b.resolutionRate}%` : <span className="text-muted-foreground/40">-</span>}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>

      {/* Main Streetlight Incident Table */}
      <Card id="reports">
        <CardHeader className="border-b">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg">City-Wide Streetlight Reports</CardTitle>
              <CardDescription>
                Live monitoring queue from all Butuan City barangays and resident submissions.
              </CardDescription>
            </div>

            {/* Status Filter Buttons */}
            <div className="flex flex-wrap items-center gap-1.5">
              {(["All", "Pending", "In Progress", "Resolved"] as const).map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? "default" : "outline"}
                  size="xs"
                  onClick={() => setStatusFilter(status)}
                >
                  {status}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticket ID</TableHead>
                <TableHead>Reporter & Contact</TableHead>
                <TableHead>Location & Pole</TableHead>
                <TableHead>Problem & Description</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Assigned Crew</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-muted-foreground text-xs">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Clock className="size-5 animate-spin text-primary" />
                      <span>Loading reports from Supabase...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredReports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-muted-foreground text-xs">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      {error ? (
                        <>
                          <AlertOctagon className="size-5 text-destructive" />
                          <span className="text-destructive font-medium">
                            Unable to load reports from Supabase
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {error}
                          </span>
                        </>
                      ) : (
                        <span>No incident reports found matching current criteria.</span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredReports.map((report) => (
                <TableRow
                  key={report.id}
                  className="hover:bg-muted/40 cursor-pointer"
                  onClick={() => setSelectedReport(report)}
                >
                  {/* Ticket ID & Date */}
                  <TableCell className="font-mono text-xs font-semibold">
                    <div className="flex flex-col">
                      <span className="text-foreground">{report.id}</span>
                      <span className="text-[10px] text-muted-foreground font-normal">
                        {report.reportedDate}
                      </span>
                    </div>
                  </TableCell>

                  {/* Reporter Name & Contact Info */}
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-xs text-foreground">
                        {report.residentName}
                      </span>
                      <span className="text-[11px] text-muted-foreground font-mono">
                        {report.contactInfo || "No contact info"}
                      </span>
                    </div>
                  </TableCell>

                  {/* Streetlight Location & Pole Tag */}
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-xs text-foreground">
                        {report.barangay}
                      </span>
                      <span
                        className="text-[11px] text-muted-foreground truncate max-w-[200px]"
                        title={report.landmark}
                      >
                        {report.landmark}
                      </span>
                      {report.poleNumber && report.poleNumber !== "N/A" && (
                        <span className="text-[10px] text-muted-foreground/75 font-mono">
                          Pole: {report.poleNumber}
                        </span>
                      )}
                    </div>
                  </TableCell>

                  {/* Problem Type & Description */}
                  <TableCell>
                    <div className="flex flex-col max-w-[220px]">
                      <span className="text-xs font-medium text-foreground">
                        {report.issueType}
                      </span>
                      {report.description ? (
                        <span
                          className="text-[11px] text-muted-foreground truncate"
                          title={report.description}
                        >
                          {report.description}
                        </span>
                      ) : (
                        <span className="text-[11px] text-muted-foreground italic">
                          No description
                        </span>
                      )}
                    </div>
                  </TableCell>

                  {/* Priority Badge */}
                  <TableCell>
                    <Badge
                      variant={
                        report.priority === "Emergency"
                          ? "destructive"
                          : report.priority === "High"
                          ? "secondary"
                          : "outline"
                      }
                      className="text-[10px]"
                    >
                      {report.priority}
                    </Badge>
                  </TableCell>

                  {/* Assigned Crew */}
                  <TableCell className="text-xs" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={report.assignedTeam || "Pending Dispatch"}
                      onChange={(e) => handleAssignCrew(report.id, e.target.value)}
                      className="h-7 w-full max-w-[170px] rounded border border-input/40 hover:border-input bg-transparent px-2 py-0.5 text-xs text-foreground transition-colors cursor-pointer outline-none focus:border-ring dark:bg-input/20 truncate"
                      title="Assign or reassign maintenance crew"
                    >
                      <option value="Pending Dispatch" className="bg-background text-foreground">
                        Pending Dispatch
                      </option>
                      {teams.map((t) => (
                        <option key={t.id} value={t.name} className="bg-background text-foreground">
                          {t.name} {t.assignedBarangays.includes(report.barangay) ? "★" : ""}
                        </option>
                      ))}
                    </select>
                  </TableCell>

                  {/* Status Badge */}
                  <TableCell>
                    <Badge
                      variant={
                        report.status === "Resolved"
                          ? "outline"
                          : report.status === "In Progress"
                          ? "secondary"
                          : "destructive"
                      }
                      className="text-[11px]"
                    >
                      {report.status}
                    </Badge>
                  </TableCell>

                  {/* Action Button */}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedReport(report);
                        }}
                        className="text-xs text-primary"
                      >
                        <Eye className="size-3 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteReport(report.id);
                        }}
                        className="text-xs text-destructive hover:bg-destructive/10"
                        title="Delete report"
                      >
                        <Trash2 className="size-3.5 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
              )}
            </TableBody>
          </Table>
        </CardContent>

        <CardFooter className="border-t py-3 text-xs text-muted-foreground flex items-center justify-between">
          <span>
            Showing {filteredReports.length} of {reports.length} incident reports
          </span>
          <span className="text-xs text-muted-foreground">
            Synchronized with Supabase public.reports table.
          </span>
        </CardFooter>
      </Card>

      {/* Maintenance Teams Overview */}
      <Card id="crews">
        <CardHeader className="border-b">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">Maintenance Teams</CardTitle>
                <Badge variant="outline" className="text-xs">
                  4 Active Units
                </Badge>
              </div>
              <CardDescription className="text-xs">
                City Engineering & linemen crews assigned across Butuan City districts.
              </CardDescription>
            </div>
            <Link href="/admin/crews">
              <Button variant="outline" size="sm" className="text-xs">
                Open Dedicated Teams Page &rarr;
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Team Name</TableHead>
                <TableHead>Assigned Barangay / Area</TableHead>
                <TableHead className="text-center">Current Workload</TableHead>
                <TableHead className="text-center">Team Status</TableHead>
                <TableHead className="text-right">Availability</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teamsWorkload.map((t) => (
                <TableRow key={t.id} className="hover:bg-muted/40">
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                        <Users className="size-3.5 text-primary shrink-0" />
                        {t.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        Lead: {t.lead} • {t.vehicle}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-[260px]">
                      {t.assignedBarangays.map((b) => (
                        <Badge key={b} variant="secondary" className="text-[10px] py-0 px-1.5">
                          {b}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-mono text-xs">
                    <span className="font-bold">{t.activeWorkload} Active</span>
                    <span className="text-[10px] text-muted-foreground block">
                      {t.inProgressCount} in progress, {t.pendingCount} pending
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={t.inProgressCount > 0 ? "secondary" : "outline"} className="text-[11px]">
                      {t.statusText}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant="outline"
                      className={`text-[11px] ${
                        t.activeWorkload === 0
                          ? "border-emerald-500/50 text-emerald-600 dark:text-emerald-400"
                          : t.activeWorkload === 1
                          ? "border-blue-500/50 text-blue-600 dark:text-blue-400"
                          : "border-amber-500/50 text-amber-600 dark:text-amber-400"
                      }`}
                    >
                      {t.availability}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="border-t py-3 text-xs text-muted-foreground flex items-center justify-between">
          <span>Workload derived from active streetlight incident reports</span>
          <Link href="/admin/crews" className="text-primary hover:underline text-xs">
            View full crew roster & dispatch details &rarr;
          </Link>
        </CardFooter>
      </Card>

      {/* Incident Details Dialog using existing shadcn Dialog */}
      <Dialog
        open={!!selectedReport}
        onOpenChange={(open) => !open && setSelectedReport(null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-center justify-between pr-6">
              <Badge variant="outline" className="font-mono text-xs">
                {selectedReport?.id}
              </Badge>
              <Badge
                variant={
                  selectedReport?.status === "Resolved"
                    ? "outline"
                    : selectedReport?.status === "In Progress"
                    ? "secondary"
                    : "destructive"
                }
                className="text-xs"
              >
                {selectedReport?.status}
              </Badge>
            </div>
            <DialogTitle className="text-base pt-1">
              Streetlight Incident Details
            </DialogTitle>
            <DialogDescription className="text-xs">
              Reported on {selectedReport?.reportedDate} • Assigned to:{" "}
              <strong className="text-foreground">
                {selectedReport?.assignedTeam || "Pending Dispatch"}
              </strong>
            </DialogDescription>
          </DialogHeader>

          {selectedReport && (
            <div className="flex flex-col gap-3 py-2 text-xs">
              <div className="rounded-lg border divide-y">
                <div className="p-2.5 grid grid-cols-3 gap-1">
                  <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                    <User className="size-3.5 text-primary" />
                    Reporter:
                  </span>
                  <span className="col-span-2 font-semibold text-foreground">
                    {selectedReport.residentName}
                  </span>
                </div>

                <div className="p-2.5 grid grid-cols-3 gap-1">
                  <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                    <Phone className="size-3.5 text-primary" />
                    Contact Info:
                  </span>
                  <span className="col-span-2 font-mono text-foreground">
                    {selectedReport.contactInfo || "None provided"}
                  </span>
                </div>

                <div className="p-2.5 grid grid-cols-3 gap-1">
                  <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                    <MapPin className="size-3.5 text-primary" />
                    Location:
                  </span>
                  <span className="col-span-2 text-foreground">
                    Brgy. {selectedReport.barangay} • {selectedReport.landmark}
                  </span>
                </div>

                <div className="p-2.5 grid grid-cols-3 gap-1">
                  <span className="text-muted-foreground font-medium">Pole Tag:</span>
                  <span className="col-span-2 font-mono text-foreground">
                    {selectedReport.poleNumber || "N/A"}
                  </span>
                </div>

                <div className="p-2.5 grid grid-cols-3 gap-1">
                  <span className="text-muted-foreground font-medium">Problem Type:</span>
                  <span className="col-span-2 font-medium text-foreground">
                    {selectedReport.issueType}
                  </span>
                </div>

                <div className="p-2.5 grid grid-cols-3 gap-1 items-center">
                  <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                    <Wrench className="size-3.5 text-primary" />
                    Assigned Crew:
                  </span>
                  <span className="col-span-2 font-semibold text-foreground flex items-center gap-2">
                    {selectedReport.assignedTeam || "Pending Dispatch"}
                    {selectedReport.assignedTeam && selectedReport.assignedTeam !== "Pending Dispatch" ? (
                      <Badge variant="secondary" className="text-[10px] font-normal py-0">
                        Dispatched
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] font-normal py-0 text-amber-600 dark:text-amber-400">
                        Awaiting Assignment
                      </Badge>
                    )}
                  </span>
                </div>

                <div className="p-2.5 grid grid-cols-3 gap-1">
                  <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                    <FileText className="size-3.5 text-primary" />
                    Description:
                  </span>
                  <span className="col-span-2 text-foreground leading-relaxed">
                    {selectedReport.description || "No detailed description provided."}
                  </span>
                </div>

                {selectedReport.photoUrl && (
                  <div className="p-2.5 grid grid-cols-3 gap-1 items-start">
                    <span className="text-muted-foreground font-medium">Attached Photo:</span>
                    <div className="col-span-2">
                      {isPhotoLoading ? (
                        <div className="h-32 w-48 rounded border border-dashed flex items-center justify-center text-xs text-muted-foreground bg-muted/20">
                          Loading photo...
                        </div>
                      ) : photoError || !signedPhotoUrl ? (
                        <div className="text-xs text-muted-foreground py-1">
                          Unable to load photo
                        </div>
                      ) : (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={signedPhotoUrl}
                          alt="Streetlight defect attachment"
                          className="h-32 w-auto rounded border object-cover"
                          onError={() => setPhotoError(true)}
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Status Update Quick Buttons */}
              <div className="flex flex-col gap-1.5 pt-1">
                <span className="font-semibold text-foreground text-[11px]">
                  Update Status:
                </span>
                <div className="flex items-center gap-2">
                  {(["Pending", "In Progress", "Resolved"] as const).map((st) => (
                    <Button
                      key={st}
                      variant={selectedReport.status === st ? "default" : "outline"}
                      size="xs"
                      onClick={() => handleStatusChange(selectedReport.id, st)}
                    >
                      {st}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Assign Maintenance Crew Workflow */}
              <div className="flex flex-col gap-2 pt-2 border-t">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground text-[11px] flex items-center gap-1.5">
                    <Wrench className="size-3.5 text-primary" />
                    Assign Maintenance Crew:
                  </span>
                  {designatedTeam && (
                    <span className="text-[10px] text-muted-foreground">
                      Designated: <strong>{designatedTeam.keyword}</strong> ({selectedReport.barangay})
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={crewToAssign}
                    onChange={(e) => setCrewToAssign(e.target.value)}
                    className="flex h-8 flex-1 rounded-lg border border-input bg-transparent px-2.5 py-1 text-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30 text-foreground cursor-pointer"
                  >
                    <option value="Pending Dispatch" className="bg-background text-foreground">
                      Pending Dispatch (Unassigned)
                    </option>
                    {teams.map((t) => {
                      const isDesignated = t.assignedBarangays.includes(selectedReport.barangay);
                      return (
                        <option key={t.id} value={t.name} className="bg-background text-foreground">
                          {t.name} {isDesignated ? "★ (Designated Area)" : ""}
                        </option>
                      );
                    })}
                  </select>

                  <Button
                    size="xs"
                    onClick={() => handleAssignCrew(selectedReport.id, crewToAssign)}
                    disabled={crewToAssign === selectedReport.assignedTeam}
                    className="gap-1 px-3 shrink-0"
                  >
                    <Check className="size-3" />
                    Confirm Assignment
                  </Button>
                </div>

                {/* Quick shortcut if designated district crew is not yet assigned */}
                {designatedTeam && selectedReport.assignedTeam !== designatedTeam.name && (
                  <div className="flex items-center justify-between text-[11px] bg-primary/5 border border-primary/20 rounded p-1.5 px-2 mt-0.5">
                    <span className="text-muted-foreground">
                      Designated for {selectedReport.barangay}:{" "}
                      <strong className="text-foreground">{designatedTeam.name}</strong>
                    </span>
                    <Button
                      variant="outline"
                      size="xs"
                      className="h-6 text-[10px] text-primary hover:text-primary gap-1"
                      onClick={() => handleAssignCrew(selectedReport.id, designatedTeam.name)}
                    >
                      Assign {designatedTeam.keyword}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="sm:justify-between items-center" showCloseButton>
            <Button
              variant="destructive"
              size="xs"
              onClick={() => selectedReport && handleDeleteReport(selectedReport.id)}
              className="gap-1 text-xs"
            >
              <Trash2 className="size-3.5" />
              Delete Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
