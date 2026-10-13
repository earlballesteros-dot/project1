"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  ClipboardList,
  AlertOctagon,
  Clock,
  Download,
  ExternalLink,
  ArrowLeft,
  Eye,
  User,
  Phone,
  MapPin,
  FileText,
  Wrench,
  Check,
  Archive,
  Trash2,
  RotateCcw,
  RotateCw,
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
} from "@/lib/mock-data";
import {
  type MaintenanceTeamConfig,
  mapDbTeamToConfig,
} from "@/lib/teams-data";
import { useAuth } from "@clerk/nextjs";
import { useIsAdmin } from "@/lib/roles";
import { createClerkSupabaseClient } from "@/lib/supabase";

export function AdminReportsClient() {
  const { getToken } = useAuth();
  const supabase = useMemo(() => createClerkSupabaseClient(getToken), [getToken]);
  const isAdmin = useIsAdmin();
  const [reports, setReports] = useState<StreetlightReport[]>([]);
  const [teams, setTeams] = useState<MaintenanceTeamConfig[]>([]);
  const [viewMode, setViewMode] = useState<"active" | "archived" | "deleted">("active");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [selectedReport, setSelectedReport] = useState<StreetlightReport | null>(null);
  const [reportToArchive, setReportToArchive] = useState<StreetlightReport | null>(null);
  const [reportToDelete, setReportToDelete] = useState<StreetlightReport | null>(null);
  const [reportToRestore, setReportToRestore] = useState<StreetlightReport | null>(null);
  const [crewToAssign, setCrewToAssign] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [signedPhotoUrl, setSignedPhotoUrl] = useState<string | null>(null);
  const [isPhotoLoading, setIsPhotoLoading] = useState<boolean>(false);
  const [photoError, setPhotoError] = useState<boolean>(false);

  // Load teams from Supabase public.maintenance_teams
  const fetchTeams = useCallback(async () => {
    try {
      const { data, error: teamsError } = await supabase
        .from("maintenance_teams")
        .select("*")
        .order("team_code", { ascending: true });

      if (teamsError) {
        console.error("Error loading maintenance teams:", teamsError.message);
        return;
      }

      if (data) {
        setTeams(data.map(mapDbTeamToConfig));
      }
    } catch (err) {
      console.error("Failed to query maintenance_teams:", err);
    }
  }, [supabase]);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  // Load reports from Supabase public.reports
  const fetchReports = useCallback(async () => {
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
          is_archived,
          archived_at,
          is_deleted,
          deleted_at,
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
        setError(supabaseError.message);
        setReports([]);
        return;
      }

      if (data) {
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
          let assignedTeamName = "";
          let assignedTeamId: string | null = row.assigned_team_id || null;
          if (row.maintenance_teams) {
            if (Array.isArray(row.maintenance_teams) && row.maintenance_teams.length > 0) {
              assignedTeamName = row.maintenance_teams[0]?.team_name || "";
              if (!assignedTeamId) assignedTeamId = row.maintenance_teams[0]?.id || null;
            } else if (typeof row.maintenance_teams === "object" && "team_name" in row.maintenance_teams) {
              assignedTeamName = row.maintenance_teams.team_name || "";
              if (!assignedTeamId) assignedTeamId = row.maintenance_teams.id || null;
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
            assignedTeamId,
            reportedDate,
            isArchived: Boolean(row.is_archived),
            archivedAt: row.archived_at || null,
            isDeleted: Boolean(row.is_deleted),
            deletedAt: row.deleted_at || null,
          };
        });

        setReports(mappedReports);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.error("Failed to query reports from Supabase:", err);
      setError(msg);
      setReports([]);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Synchronize reports and teams with system events
  useEffect(() => {
    const handleReportsChange = () => {
      fetchReports();
    };

    const handleTeamsChange = () => {
      fetchTeams();
    };

    window.addEventListener("butuan-reports-changed", handleReportsChange);
    window.addEventListener("butuan-teams-changed", handleTeamsChange);
    window.addEventListener("storage", handleReportsChange);
    return () => {
      window.removeEventListener("butuan-reports-changed", handleReportsChange);
      window.removeEventListener("butuan-teams-changed", handleTeamsChange);
      window.removeEventListener("storage", handleReportsChange);
    };
  }, [fetchReports, fetchTeams]);

  // Sync selected crew dropdown when selected report changes
  useEffect(() => {
    if (selectedReport) {
      setCrewToAssign(selectedReport.assignedTeamId || "");
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

  const activeReports = useMemo(
    () => reports.filter((r) => !r.isArchived && !r.isDeleted),
    [reports]
  );
  const archivedReports = useMemo(
    () => reports.filter((r) => r.isArchived && !r.isDeleted),
    [reports]
  );
  const deletedReports = useMemo(
    () => reports.filter((r) => r.isDeleted),
    [reports]
  );

  const currentViewReports = useMemo(() => {
    if (viewMode === "archived") return archivedReports;
    if (viewMode === "deleted") return deletedReports;
    return activeReports;
  }, [viewMode, activeReports, archivedReports, deletedReports]);

  const filteredReports = useMemo(() => {
    return statusFilter === "All"
      ? currentViewReports
      : currentViewReports.filter((r) => r.status === statusFilter);
  }, [statusFilter, currentViewReports]);

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

  const handleAssignCrew = async (id: string, newTeamIdOrName: string) => {
    try {
      let teamUuid: string | null = null;
      let teamDisplayName = "";

      if (
        newTeamIdOrName &&
        newTeamIdOrName !== "Pending Dispatch" &&
        newTeamIdOrName !== "unassigned" &&
        newTeamIdOrName !== ""
      ) {
        const targetTeam = teams.find(
          (t) =>
            t.id === newTeamIdOrName ||
            t.name === newTeamIdOrName ||
            (t.teamCode && t.teamCode === newTeamIdOrName) ||
            (t.keyword && t.keyword === newTeamIdOrName)
        );
        if (targetTeam) {
          teamUuid = targetTeam.id;
          teamDisplayName = targetTeam.name;
        } else if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(newTeamIdOrName)) {
          teamUuid = newTeamIdOrName;
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
        prev.map((r) =>
          r.id === id
            ? { ...r, assignedTeam: teamDisplayName, assignedTeamId: teamUuid }
            : r
        )
      );
      if (selectedReport && selectedReport.id === id) {
        setSelectedReport((prev) =>
          prev
            ? { ...prev, assignedTeam: teamDisplayName, assignedTeamId: teamUuid }
            : null
        );
        setCrewToAssign(teamUuid || "");
      }

      // Notify other views immediately
      window.dispatchEvent(new Event("butuan-reports-changed"));
      window.dispatchEvent(new Event("storage"));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unexpected error assigning team";
      console.error("Error assigning crew:", err);
      alert(`Failed to assign team: ${msg}`);
    }
  };

  // 1. Safe Archive Report (preserves operational status, never hard-deletes)
  const handleConfirmArchive = async () => {
    if (!reportToArchive) return;
    setIsActionLoading(true);
    try {
      const now = new Date().toISOString();
      const { error: updateError } = await supabase
        .from("reports")
        .update({ is_archived: true, archived_at: now })
        .eq("id", reportToArchive.id);

      if (updateError) {
        console.error("Error archiving report in Supabase:", updateError.message);
        alert(`Failed to archive report: ${updateError.message}`);
        return;
      }

      setReports((prev) =>
        prev.map((r) =>
          r.id === reportToArchive.id ? { ...r, isArchived: true, archivedAt: now } : r
        )
      );
      if (selectedReport?.id === reportToArchive.id) {
        setSelectedReport((prev) => (prev ? { ...prev, isArchived: true, archivedAt: now } : null));
      }

      window.dispatchEvent(new Event("butuan-reports-changed"));
      window.dispatchEvent(new Event("storage"));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unexpected error archiving report";
      console.error("Error archiving report:", err);
      alert(`Failed to archive report: ${msg}`);
    } finally {
      setIsActionLoading(false);
      setReportToArchive(null);
    }
  };

  // 2. Safe Soft-Delete Report (preserves previous archive state, never hard-deletes)
  const handleConfirmDelete = async () => {
    if (!reportToDelete) return;
    setIsActionLoading(true);
    try {
      const now = new Date().toISOString();
      // SAFEGUARD: Never call .delete()! Soft-delete sets is_deleted to true while preserving is_archived.
      const { error: updateError } = await supabase
        .from("reports")
        .update({ is_deleted: true, deleted_at: now })
        .eq("id", reportToDelete.id);

      if (updateError) {
        console.error("Error soft-deleting report in Supabase:", updateError.message);
        alert(`Failed to delete report: ${updateError.message}`);
        return;
      }

      setReports((prev) =>
        prev.map((r) =>
          r.id === reportToDelete.id ? { ...r, isDeleted: true, deletedAt: now } : r
        )
      );
      if (selectedReport?.id === reportToDelete.id) {
        setSelectedReport((prev) => (prev ? { ...prev, isDeleted: true, deletedAt: now } : null));
      }

      window.dispatchEvent(new Event("butuan-reports-changed"));
      window.dispatchEvent(new Event("storage"));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unexpected error deleting report";
      console.error("Error deleting report:", err);
      alert(`Failed to delete report: ${msg}`);
    } finally {
      setIsActionLoading(false);
      setReportToDelete(null);
    }
  };

  // 3. Safe Restore Report
  // Safeguard 4:
  // - If restoring from Deleted: sets is_deleted = false, leaving is_archived intact.
  //   If it was archived before deletion, it correctly returns to Archived Reports.
  // - If restoring from Archived: sets is_archived = false, returning to Active Reports.
  const handleConfirmRestore = async () => {
    if (!reportToRestore) return;
    setIsActionLoading(true);
    try {
      const updatePayload: Record<string, any> = {};
      const isRestoringFromDeleted = Boolean(reportToRestore.isDeleted);

      if (isRestoringFromDeleted) {
        updatePayload.is_deleted = false;
        updatePayload.deleted_at = null;
      } else {
        updatePayload.is_archived = false;
        updatePayload.archived_at = null;
      }

      const { error: updateError } = await supabase
        .from("reports")
        .update(updatePayload)
        .eq("id", reportToRestore.id);

      if (updateError) {
        console.error("Error restoring report in Supabase:", updateError.message);
        alert(`Failed to restore report: ${updateError.message}`);
        return;
      }

      setReports((prev) =>
        prev.map((r) => {
          if (r.id !== reportToRestore.id) return r;
          if (isRestoringFromDeleted) {
            return { ...r, isDeleted: false, deletedAt: null };
          } else {
            return { ...r, isArchived: false, archivedAt: null };
          }
        })
      );

      if (selectedReport?.id === reportToRestore.id) {
        setSelectedReport((prev) => {
          if (!prev) return null;
          if (isRestoringFromDeleted) {
            return { ...prev, isDeleted: false, deletedAt: null };
          } else {
            return { ...prev, isArchived: false, archivedAt: null };
          }
        });
      }

      window.dispatchEvent(new Event("butuan-reports-changed"));
      window.dispatchEvent(new Event("storage"));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unexpected error restoring report";
      console.error("Error restoring report:", err);
      alert(`Failed to restore report: ${msg}`);
    } finally {
      setIsActionLoading(false);
      setReportToRestore(null);
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
              All Incident Reports
            </h1>
            <Badge variant="outline" className="text-xs">
              Supabase Live Sync
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Monitor reported streetlight defects, assign repair teams, and track resolution across Butuan City.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
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
            onClick={fetchReports}
            disabled={isLoading}
          >
            <RotateCw className={`size-3.5 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
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

      {/* Main Streetlight Incident Table */}
      <Card id="reports">
        <CardHeader className="border-b space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <span>City-Wide Streetlight Reports</span>
                {viewMode === "archived" && (
                  <Badge variant="secondary" className="text-[11px] gap-1 font-normal">
                    <Archive className="size-3" />
                    Archived
                  </Badge>
                )}
                {viewMode === "deleted" && (
                  <Badge variant="destructive" className="text-[11px] gap-1 font-normal">
                    <Trash2 className="size-3" />
                    Deleted (Trash)
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {viewMode === "active" && "Live monitoring queue from all Butuan City barangays and resident submissions."}
                {viewMode === "archived" && "Archived incident records preserved for historical tracking. Excluded from active monitoring."}
                {viewMode === "deleted" && "Soft-deleted incident records in trash. Recoverable to active or archived queues."}
              </CardDescription>
            </div>

            {/* View Mode Switcher: Active | Archived | Deleted */}
            <div className="inline-flex items-center rounded-lg border bg-muted/40 p-0.5 self-start sm:self-auto">
              <Button
                variant={viewMode === "active" ? "secondary" : "ghost"}
                size="xs"
                onClick={() => setViewMode("active")}
                className="text-xs font-medium shadow-2xs gap-1.5"
              >
                Active
                <Badge variant="outline" className="px-1.5 py-0 text-[10px] leading-tight font-mono">
                  {activeReports.length}
                </Badge>
              </Button>
              <Button
                variant={viewMode === "archived" ? "secondary" : "ghost"}
                size="xs"
                onClick={() => setViewMode("archived")}
                className="text-xs font-medium shadow-2xs gap-1.5"
              >
                <Archive className="size-3" />
                Archived
                <Badge variant="outline" className="px-1.5 py-0 text-[10px] leading-tight font-mono">
                  {archivedReports.length}
                </Badge>
              </Button>
              <Button
                variant={viewMode === "deleted" ? "secondary" : "ghost"}
                size="xs"
                onClick={() => setViewMode("deleted")}
                className="text-xs font-medium shadow-2xs gap-1.5"
              >
                <Trash2 className="size-3" />
                Deleted
                <Badge variant="outline" className="px-1.5 py-0 text-[10px] leading-tight font-mono">
                  {deletedReports.length}
                </Badge>
              </Button>
            </div>
          </div>

          {/* Operational Status Filter Buttons */}
          <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
            <span className="text-xs text-muted-foreground font-medium">
              Filter by Operational Status:
            </span>
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
          <div
            className={`overflow-x-auto [&>[data-slot=table-container]]:overflow-visible ${
              filteredReports.length > 10 ? "overflow-y-auto max-h-[580px]" : ""
            }`}
          >
            <Table>
              <TableHeader className="sticky top-0 bg-card [&_th]:bg-card z-10 border-b">
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
                          <span>
                            {viewMode === "active" && "No active incident reports found matching current criteria."}
                            {viewMode === "archived" && "No archived reports found."}
                            {viewMode === "deleted" && "No deleted reports in trash."}
                          </span>
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
                          value={report.assignedTeamId || ""}
                          onChange={(e) => handleAssignCrew(report.id, e.target.value)}
                          className="h-7 w-full max-w-[170px] rounded border border-input/40 hover:border-input bg-transparent px-2 py-0.5 text-xs text-foreground transition-colors cursor-pointer outline-none focus:border-ring dark:bg-input/20 truncate"
                          title="Assign or reassign maintenance crew"
                        >
                          <option value="" className="bg-background text-foreground">
                            Unassigned
                          </option>
                          {teams.map((t) => (
                            <option key={t.id} value={t.id} className="bg-background text-foreground">
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

                      {/* Action Buttons */}
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

                          {viewMode === "active" && (
                            <>
                              <Button
                                variant="ghost"
                                size="xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setReportToArchive(report);
                                }}
                                className="text-xs text-muted-foreground hover:text-foreground"
                                title="Archive report"
                              >
                                <Archive className="size-3.5 mr-1" />
                                Archive
                              </Button>
                              <Button
                                variant="ghost"
                                size="xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setReportToDelete(report);
                                }}
                                className="text-xs text-destructive hover:bg-destructive/10"
                                title="Delete report (Soft Delete)"
                              >
                                <Trash2 className="size-3.5 mr-1" />
                                Delete
                              </Button>
                            </>
                          )}

                          {viewMode === "archived" && (
                            <>
                              <Button
                                variant="ghost"
                                size="xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setReportToRestore(report);
                                }}
                                className="text-xs text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                                title="Restore to active reports"
                              >
                                <RotateCcw className="size-3.5 mr-1" />
                                Restore
                              </Button>
                              <Button
                                variant="ghost"
                                size="xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setReportToDelete(report);
                                }}
                                className="text-xs text-destructive hover:bg-destructive/10"
                                title="Move to deleted reports"
                              >
                                <Trash2 className="size-3.5 mr-1" />
                                Delete
                              </Button>
                            </>
                          )}

                          {viewMode === "deleted" && (
                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                setReportToRestore(report);
                              }}
                              className="text-xs text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                              title="Restore report"
                            >
                              <RotateCcw className="size-3.5 mr-1" />
                              Restore
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>

        <CardFooter className="border-t py-3 text-xs text-muted-foreground flex items-center justify-between">
          <span>
            Showing {filteredReports.length} of {currentViewReports.length}{" "}
            {viewMode === "active" ? "active" : viewMode === "archived" ? "archived" : "deleted"} incident reports
          </span>
          <span className="text-xs text-muted-foreground">
            Synchronized with Supabase public.reports table (Safe Archive & Soft-Delete enabled).
          </span>
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
                {selectedReport?.assignedTeam || "Unassigned"}
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
                    {selectedReport.assignedTeam || "Unassigned"}
                    {selectedReport.assignedTeamId ? (
                      <Badge variant="secondary" className="text-[10px] font-normal py-0">
                        Assigned
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
                    <option value="" className="bg-background text-foreground">
                      Unassigned (No Crew Assigned)
                    </option>
                    {teams.map((t) => {
                      const isDesignated = t.assignedBarangays.includes(selectedReport.barangay);
                      return (
                        <option key={t.id} value={t.id} className="bg-background text-foreground">
                          {t.name} {isDesignated ? "★ (Designated Area)" : ""}
                        </option>
                      );
                    })}
                  </select>

                  <Button
                    size="xs"
                    onClick={() => handleAssignCrew(selectedReport.id, crewToAssign)}
                    disabled={crewToAssign === (selectedReport.assignedTeamId || "")}
                    className="gap-1 px-3 shrink-0"
                  >
                    <Check className="size-3" />
                    Confirm Assignment
                  </Button>
                </div>

                {/* Quick shortcut if designated district crew is not yet assigned */}
                {designatedTeam && selectedReport.assignedTeamId !== designatedTeam.id && (
                  <div className="flex items-center justify-between text-[11px] bg-primary/5 border border-primary/20 rounded p-1.5 px-2 mt-0.5">
                    <span className="text-muted-foreground">
                      Designated for {selectedReport.barangay}:{" "}
                      <strong className="text-foreground">{designatedTeam.name}</strong>
                    </span>
                    <Button
                      variant="outline"
                      size="xs"
                      className="h-6 text-[10px] text-primary hover:text-primary gap-1"
                      onClick={() => handleAssignCrew(selectedReport.id, designatedTeam.id)}
                    >
                      Assign {designatedTeam.keyword}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="sm:justify-between items-center" showCloseButton>
            <div className="flex items-center gap-1.5 flex-wrap">
              {selectedReport && !selectedReport.isDeleted && !selectedReport.isArchived && (
                <>
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => setReportToArchive(selectedReport)}
                    className="gap-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <Archive className="size-3.5" />
                    Archive Report
                  </Button>
                  <Button
                    variant="destructive"
                    size="xs"
                    onClick={() => setReportToDelete(selectedReport)}
                    className="gap-1 text-xs"
                  >
                    <Trash2 className="size-3.5" />
                    Delete Report
                  </Button>
                </>
              )}

              {selectedReport && selectedReport.isArchived && !selectedReport.isDeleted && (
                <>
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => setReportToRestore(selectedReport)}
                    className="gap-1 text-xs text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                  >
                    <RotateCcw className="size-3.5" />
                    Restore to Active
                  </Button>
                  <Button
                    variant="destructive"
                    size="xs"
                    onClick={() => setReportToDelete(selectedReport)}
                    className="gap-1 text-xs"
                  >
                    <Trash2 className="size-3.5" />
                    Delete Report
                  </Button>
                </>
              )}

              {selectedReport && selectedReport.isDeleted && (
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => setReportToRestore(selectedReport)}
                  className="gap-1 text-xs text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                >
                  <RotateCcw className="size-3.5" />
                  Restore Report
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 1. Archive Incident Report Confirmation Dialog */}
      <Dialog
        open={!!reportToArchive}
        onOpenChange={(open) => !open && !isActionLoading && setReportToArchive(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Archive className="size-4" />
              </div>
              <DialogTitle className="text-base font-semibold">
                Archive Incident Report
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground pt-1.5">
              Are you sure you want to archive incident report{" "}
              <strong className="font-mono text-foreground">
                {reportToArchive?.id}
              </strong>
              ?
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground flex flex-col gap-1.5">
            <span className="font-semibold text-foreground text-xs">
              Archive Safeguards:
            </span>
            <ul className="list-disc pl-4 space-y-1 text-[11px] leading-relaxed">
              <li>The report will be safely moved to the <strong>Archived Reports</strong> view.</li>
              <li>Its operational status (<strong>{reportToArchive?.status}</strong>), assigned crew, and history are preserved.</li>
              <li>Archived reports are excluded from active monitoring counts and can be restored at any time.</li>
            </ul>
          </div>

          <DialogFooter className="flex-row gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={() => setReportToArchive(null)}
              disabled={isActionLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="default"
              size="xs"
              onClick={handleConfirmArchive}
              disabled={isActionLoading}
              className="gap-1.5"
            >
              <Archive className="size-3.5" />
              {isActionLoading ? "Archiving..." : "Archive Report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2. Soft-Delete Incident Report Confirmation Dialog */}
      <Dialog
        open={!!reportToDelete}
        onOpenChange={(open) => !open && !isActionLoading && setReportToDelete(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                <Trash2 className="size-4" />
              </div>
              <DialogTitle className="text-base font-semibold">
                Move Report to Trash
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground pt-1.5">
              Are you sure you want to delete incident report{" "}
              <strong className="font-mono text-foreground">
                {reportToDelete?.id}
              </strong>
              ?
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border bg-destructive/5 border-destructive/20 p-3 text-xs text-muted-foreground flex flex-col gap-1.5">
            <span className="font-semibold text-destructive text-xs">
              Soft-Delete Safeguards:
            </span>
            <ul className="list-disc pl-4 space-y-1 text-[11px] leading-relaxed">
              <li>This is a safe soft-delete. The report is <strong>never permanently removed</strong> from Supabase.</li>
              <li>The report will be moved to the <strong>Deleted Reports</strong> view.</li>
              <li>Its original operational status, assignments, landmark, and history remain intact.</li>
              <li>You can restore this report from Deleted Reports at any time.</li>
            </ul>
          </div>

          <DialogFooter className="flex-row gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={() => setReportToDelete(null)}
              disabled={isActionLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="xs"
              onClick={handleConfirmDelete}
              disabled={isActionLoading}
              className="gap-1.5"
            >
              <Trash2 className="size-3.5" />
              {isActionLoading ? "Deleting..." : "Move to Trash"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 3. Restore Incident Report Confirmation Dialog */}
      <Dialog
        open={!!reportToRestore}
        onOpenChange={(open) => !open && !isActionLoading && setReportToRestore(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <RotateCcw className="size-4" />
              </div>
              <DialogTitle className="text-base font-semibold">
                Restore Incident Report
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground pt-1.5">
              Restore incident report{" "}
              <strong className="font-mono text-foreground">
                {reportToRestore?.id}
              </strong>
              ?
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground flex flex-col gap-1.5">
            <span className="font-semibold text-foreground text-xs">
              Restore Target:
            </span>
            <p className="text-[11px] leading-relaxed">
              {reportToRestore?.isDeleted ? (
                reportToRestore.isArchived ? (
                  <>
                    This report was <strong>Archived</strong> prior to deletion. Restoring it will return it to your <strong>Archived Reports</strong> view.
                  </>
                ) : (
                  <>
                    This report will be restored to your <strong>Active Reports</strong> queue with its original operational status (<strong>{reportToRestore.status}</strong>).
                  </>
                )
              ) : (
                <>
                  This report will be restored to your <strong>Active Reports</strong> queue with its original operational status (<strong>{reportToRestore?.status}</strong>).
                </>
              )}
            </p>
          </div>

          <DialogFooter className="flex-row gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={() => setReportToRestore(null)}
              disabled={isActionLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="default"
              size="xs"
              onClick={handleConfirmRestore}
              disabled={isActionLoading}
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-600 dark:hover:bg-emerald-700"
            >
              <RotateCcw className="size-3.5" />
              {isActionLoading ? "Restoring..." : "Confirm Restore"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
