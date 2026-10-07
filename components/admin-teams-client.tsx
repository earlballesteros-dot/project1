"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Wrench,
  CheckCircle2,
  AlertOctagon,
  MapPin,
  Truck,
  ArrowLeft,
  ExternalLink,
  RotateCw,
  Phone,
  Radio,
  HardHat,
  BarChart3,
  Check,
  Activity,
  Layers,
  Undo2,
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
import { cn } from "cn";
import { type StreetlightReport } from "@/lib/mock-data";
import { getStoredReports } from "@/lib/reports-store";
import {
  BUTUAN_MAINTENANCE_TEAMS,
  type MaintenanceTeamConfig,
  SUPPORTED_12_BARANGAYS,
  getStoredTeams,
  updateTeamAssignedBarangays,
  resetTeamsToDefault,
  syncTeamToSupabase,
} from "@/lib/teams-data";
import { supabase } from "@/lib/supabase";

export { BUTUAN_MAINTENANCE_TEAMS, type MaintenanceTeamConfig };

export function AdminTeamsClient() {
  const [reports, setReports] = useState<StreetlightReport[]>([]);
  const [teams, setTeams] = useState<MaintenanceTeamConfig[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [editingBarangays, setEditingBarangays] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Dynamic active barangays from Supabase
  const [availableBarangays, setAvailableBarangays] = useState<string[]>([]);
  const [isLoadingBarangays, setIsLoadingBarangays] = useState(true);

  // Load active barangays from public.barangays
  useEffect(() => {
    let isMounted = true;

    async function fetchActiveBarangays() {
      setIsLoadingBarangays(true);
      try {
        const { data, error } = await supabase
          .from("barangays")
          .select("name, is_active")
          .eq("is_active", true)
          .order("name", { ascending: true });

        if (!isMounted) return;

        if (error) {
          console.error("Error fetching barangays for maintenance teams:", error.message);
          setAvailableBarangays([...SUPPORTED_12_BARANGAYS]);
        } else if (data && data.length > 0) {
          setAvailableBarangays(data.map((b) => b.name));
        } else {
          setAvailableBarangays([...SUPPORTED_12_BARANGAYS]);
        }
      } catch (err) {
        if (!isMounted) return;
        console.error("Failed to query barangays:", err);
        setAvailableBarangays([...SUPPORTED_12_BARANGAYS]);
      } finally {
        if (isMounted) {
          setIsLoadingBarangays(false);
        }
      }
    }

    fetchActiveBarangays();

    return () => {
      isMounted = false;
    };
  }, []);

  // Synchronize reports and teams with localStorage stores
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReports(getStoredReports());
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTeams(getStoredTeams());

    const handleReportsChange = () => {
      setReports(getStoredReports());
    };

    const handleTeamsChange = () => {
      setTeams(getStoredTeams());
    };

    window.addEventListener("butuan-reports-changed", handleReportsChange);
    window.addEventListener("butuan-teams-changed", handleTeamsChange);
    window.addEventListener("storage", () => {
      handleReportsChange();
      handleTeamsChange();
    });

    return () => {
      window.removeEventListener("butuan-reports-changed", handleReportsChange);
      window.removeEventListener("butuan-teams-changed", handleTeamsChange);
      window.removeEventListener("storage", () => {
        handleReportsChange();
        handleTeamsChange();
      });
    };
  }, []);

  const handleRefresh = () => {
    setReports(getStoredReports());
    setTeams(getStoredTeams());
  };

  // Derive workload for each maintenance team dynamically from current reports
  const teamWorkloadList = teams.map((team) => {
    const assignedReports = reports.filter((r) =>
      r.assignedTeam?.toLowerCase().includes(team.keyword.toLowerCase())
    );

    const inProgressCount = assignedReports.filter((r) => r.status === "In Progress").length;
    const pendingCount = assignedReports.filter((r) => r.status === "Pending").length;
    const resolvedCount = assignedReports.filter((r) => r.status === "Resolved").length;
    const totalAssigned = assignedReports.length;
    const activeWorkload = inProgressCount + pendingCount;

    // Derive real-time status and availability
    let statusText: string;
    let statusVariant: "secondary" | "outline" | "default";
    let availabilityText: string;
    let availabilityBadgeClass: string;

    if (inProgressCount > 0) {
      statusText = "Dispatched in Field";
      statusVariant = "secondary";
    } else if (pendingCount > 0) {
      statusText = "En Route / Staging";
      statusVariant = "default";
    } else {
      statusText = team.status || "Standby";
      statusVariant = statusText === "Dispatched in Field" ? "secondary" : "outline";
    }

    if (activeWorkload >= 2) {
      availabilityText = "High Workload";
      availabilityBadgeClass = "border-amber-500/50 text-amber-600 dark:text-amber-400";
    } else if (activeWorkload === 1) {
      availabilityText = "Engaged (Normal)";
      availabilityBadgeClass = "border-blue-500/50 text-blue-600 dark:text-blue-400";
    } else {
      availabilityText = team.availability || "Available for Dispatch";
      availabilityBadgeClass =
        availabilityText === "Engaged (Normal)"
          ? "border-blue-500/50 text-blue-600 dark:text-blue-400"
          : "border-emerald-500/50 text-emerald-600 dark:text-emerald-400";
    }

    return {
      ...team,
      assignedReports,
      inProgressCount,
      pendingCount,
      resolvedCount,
      totalAssigned,
      activeWorkload,
      statusText,
      statusVariant,
      availabilityText,
      availabilityBadgeClass,
    };
  });

  // Summary counts across all teams
  const totalTeams = teams.length;
  const dispatchedTeamsCount = teamWorkloadList.filter(
    (t) => t.inProgressCount > 0 || t.statusText === "Dispatched in Field"
  ).length;
  const standbyTeamsCount = teamWorkloadList.filter(
    (t) => t.activeWorkload === 0 && t.statusText === "Standby"
  ).length;
  const unassignedReports = reports.filter(
    (r) =>
      r.status !== "Resolved" &&
      (!r.assignedTeam || r.assignedTeam.toLowerCase().includes("pending dispatch"))
  );

  // Selected team object currently being viewed / edited in Dialog
  const selectedTeam = teamWorkloadList.find((t) => t.id === selectedTeamId) || null;

  const handleOpenTeam = (team: MaintenanceTeamConfig) => {
    setSelectedTeamId(team.id);
    setEditingBarangays([...team.assignedBarangays]);
    setSaveSuccess(false);
  };

  const handleCloseDialog = () => {
    setSelectedTeamId(null);
    setEditingBarangays([]);
    setSaveSuccess(false);
  };

  const handleToggleBarangay = (barangay: string) => {
    setSaveSuccess(false);
    setEditingBarangays((prev) =>
      prev.includes(barangay)
        ? prev.filter((b) => b !== barangay)
        : [...prev, barangay]
    );
  };

  const handleSelectAllBarangays = () => {
    setSaveSuccess(false);
    setEditingBarangays([...availableBarangays]);
  };

  const handleClearAllBarangays = () => {
    setSaveSuccess(false);
    setEditingBarangays([]);
  };

  const handleResetToBaselineRoster = () => {
    if (!selectedTeam) return;
    const defaultTeam = BUTUAN_MAINTENANCE_TEAMS.find((t) => t.id === selectedTeam.id);
    if (defaultTeam) {
      setEditingBarangays([...defaultTeam.assignedBarangays]);
      setSaveSuccess(false);
    }
  };

  const handleSaveBarangayAssignments = async () => {
    if (!selectedTeam) return;
    setIsSaving(true);
    try {
      // Reassign barangays exclusively across the maintenance team roster
      const updatedTeams = updateTeamAssignedBarangays(selectedTeam.id, editingBarangays, true);
      setTeams(updatedTeams);
      setSaveSuccess(true);

      // Async sync to Supabase (prepared for when database table is available)
      const currentUpdated = updatedTeams.find((t) => t.id === selectedTeam.id);
      if (currentUpdated) {
        void syncTeamToSupabase(currentUpdated);
      }

      // Hide success notification after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRestoreAllDefaults = () => {
    if (confirm("Reset all 4 maintenance teams to the default baseline barangay assignments?")) {
      const reset = resetTeamsToDefault();
      setTeams(reset);
      if (selectedTeamId) {
        const found = reset.find((t) => t.id === selectedTeamId);
        if (found) {
          setEditingBarangays([...found.assignedBarangays]);
        }
      }
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner / Breadcrumb info matching Admin Dashboard */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
              Maintenance Teams
            </h1>
            <Badge variant="outline" className="text-xs">
              Live Crew Dispatch
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Manage engineering crews, field linemen workload, and district coverage across Butuan City.
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
            onClick={handleRefresh}
          >
            <RotateCw data-icon="inline-start" />
            Refresh Crew Data
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={handleRestoreAllDefaults}
            title="Restore baseline 3-barangay assignments for all 4 teams"
          >
            <Undo2 data-icon="inline-start" />
            Reset Roster Defaults
          </Button>
          <Link href="/admin/map">
            <Button variant="outline" size="sm" className="text-xs">
              <MapPin data-icon="inline-start" />
              Barangay Map
            </Button>
          </Link>
          <Link href="/admin/analytics">
            <Button variant="outline" size="sm" className="text-xs">
              <BarChart3 data-icon="inline-start" />
              Analytics
            </Button>
          </Link>
          <Link href="/resident">
            <Button variant="secondary" size="sm" className="text-xs">
              Resident View
              <ExternalLink data-icon="inline-end" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Teams */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Units
            </CardTitle>
            <HardHat className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-heading text-2xl font-bold">
              {totalTeams} Teams
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              City Engineering & Linemen crews
            </p>
          </CardContent>
        </Card>

        {/* Dispatched Teams */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Active in Field
            </CardTitle>
            <Radio className="size-4 text-amber-500 animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="font-heading text-2xl font-bold text-amber-600 dark:text-amber-400">
              {dispatchedTeamsCount} Dispatched
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Teams with repairs in progress or active
            </p>
          </CardContent>
        </Card>

        {/* Standby Teams */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Available Units
            </CardTitle>
            <CheckCircle2 className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="font-heading text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {standbyTeamsCount} Ready
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Available for immediate dispatch
            </p>
          </CardContent>
        </Card>

        {/* Unassigned Incidents */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Unassigned Queue
            </CardTitle>
            <AlertOctagon className="size-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="font-heading text-2xl font-bold text-destructive">
              {unassignedReports.length} Tickets
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Awaiting crew assignment
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Maintenance Teams Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-lg">Maintenance Teams Roster & Coverage</CardTitle>
              <CardDescription className="text-xs">
                Click any team row or card to manage assigned barangays and view full crew details. Workload is dynamically calculated from incident reports.
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs font-mono self-start sm:self-auto">
              12 Supported Barangays
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[200px]">Team Name & Code</TableHead>
                <TableHead className="min-w-[180px]">Specialization</TableHead>
                <TableHead className="min-w-[170px]">Team Lead & Vehicle</TableHead>
                <TableHead className="min-w-[220px]">Assigned Barangay / Area</TableHead>
                <TableHead className="text-center min-w-[120px]">Team Status</TableHead>
                <TableHead className="text-center min-w-[130px]">Availability</TableHead>
                <TableHead className="text-center min-w-[140px]">Current Workload</TableHead>
                <TableHead className="text-right min-w-[110px]">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teamWorkloadList.map((t) => (
                <TableRow
                  key={t.id}
                  onClick={() => handleOpenTeam(t)}
                  className="hover:bg-muted/60 cursor-pointer transition-colors group"
                >
                  {/* Team Name & Code */}
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-xs text-foreground flex items-center gap-1.5 group-hover:text-primary transition-colors">
                        <Users className="size-3.5 text-primary shrink-0" />
                        {t.name}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0">
                          {t.id}
                        </Badge>
                      </div>
                    </div>
                  </TableCell>

                  {/* Specialization */}
                  <TableCell>
                    <span className="text-xs text-muted-foreground font-medium">
                      {t.specialization}
                    </span>
                  </TableCell>

                  {/* Team Lead & Vehicle */}
                  <TableCell>
                    <div className="flex flex-col text-xs gap-0.5">
                      <span className="font-medium text-foreground">{t.lead}</span>
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Truck className="size-3 text-primary/70 shrink-0" />
                        {t.vehicle}
                      </span>
                    </div>
                  </TableCell>

                  {/* Assigned Barangays (12 Supported Barangays) */}
                  <TableCell>
                    <div className="flex flex-col gap-1 max-w-[260px]">
                      {t.assignedBarangays.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {t.assignedBarangays.map((brgy) => (
                            <Badge
                              key={brgy}
                              variant="secondary"
                              className="text-[10px] px-1.5 py-0 font-normal"
                            >
                              {brgy}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[11px] text-muted-foreground italic">
                          No barangays assigned
                        </span>
                      )}
                    </div>
                  </TableCell>

                  {/* Team Status */}
                  <TableCell className="text-center">
                    <Badge
                      variant={
                        t.statusText === "Dispatched in Field"
                          ? "secondary"
                          : t.statusText === "En Route / Staging"
                          ? "default"
                          : "outline"
                      }
                      className="text-[11px]"
                    >
                      {t.statusText}
                    </Badge>
                  </TableCell>

                  {/* Availability */}
                  <TableCell className="text-center">
                    <Badge
                      variant="outline"
                      className={`text-[11px] font-medium ${t.availabilityBadgeClass}`}
                    >
                      {t.availabilityText}
                    </Badge>
                  </TableCell>

                  {/* Current Workload (Dynamically calculated from assigned reports) */}
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="font-mono font-bold text-xs">
                        {t.activeWorkload} Active
                      </span>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono">
                        <span className="text-amber-600 dark:text-amber-400">{t.inProgressCount} repair</span>
                        <span>•</span>
                        <span className="text-destructive">{t.pendingCount} pending</span>
                        <span>•</span>
                        <span className="text-emerald-600 dark:text-emerald-400">{t.resolvedCount} done</span>
                      </div>
                    </div>
                  </TableCell>

                  {/* Action */}
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-7 px-2.5 gap-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenTeam(t);
                      }}
                    >
                      <MapPin className="size-3 text-primary" />
                      Manage
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>

        <CardFooter className="border-t py-3 text-xs text-muted-foreground flex items-center justify-between">
          <span>
            Click on any team row to open the complete details dialog and reassign coverage barangays.
          </span>
          <Link href="/admin" className="text-primary hover:underline text-xs">
            Manage reports in Operations Queue &rarr;
          </Link>
        </CardFooter>
      </Card>

      {/* Active Team Workload Cards Detail */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-semibold">Maintenance Team Units</h2>
            <p className="text-xs text-muted-foreground">
              Click any unit card to open team details and assign coverage areas.
            </p>
          </div>
          <span className="text-xs text-muted-foreground font-mono">
            {teams.length} Active Crews
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {teamWorkloadList.map((team) => (
            <Card
              key={team.id}
              onClick={() => handleOpenTeam(team)}
              className="flex flex-col cursor-pointer hover:border-primary/50 hover:shadow-md transition-all group"
            >
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <Wrench className="size-4.5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-sm font-semibold group-hover:text-primary transition-colors">
                          {team.name}
                        </CardTitle>
                        <Badge variant="outline" className="text-[10px] font-mono">
                          {team.id}
                        </Badge>
                      </div>
                      <CardDescription className="text-[11px] flex items-center gap-1.5 flex-wrap mt-0.5">
                        <span className="font-medium text-foreground/80">{team.specialization}</span>
                        <span>•</span>
                        <span>Lead: {team.lead}</span>
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge
                      variant={team.statusText === "Dispatched in Field" ? "secondary" : "outline"}
                      className="text-[10px]"
                    >
                      {team.statusText}
                    </Badge>
                    <Badge variant="outline" className={`text-[10px] ${team.availabilityBadgeClass}`}>
                      {team.availabilityText}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-4 flex-1">
                <div className="flex flex-col gap-3">
                  <div className="flex items-start justify-between text-xs gap-2">
                    <span className="text-muted-foreground flex items-center gap-1 shrink-0">
                      <MapPin className="size-3.5 text-primary" />
                      Assigned Coverage:
                    </span>
                    <div className="flex flex-wrap gap-1 justify-end">
                      {team.assignedBarangays.length > 0 ? (
                        team.assignedBarangays.map((b) => (
                          <Badge key={b} variant="secondary" className="text-[10px] px-1.5 py-0 font-normal">
                            {b}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground italic text-xs">Unassigned</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Truck className="size-3.5 text-primary" />
                      Assigned Vehicle:
                    </span>
                    <span className="font-mono text-xs font-medium text-foreground">{team.vehicle}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Phone className="size-3.5 text-primary" />
                      Direct Contact:
                    </span>
                    <span className="text-xs font-mono">{team.contact}</span>
                  </div>

                  {/* Current Workload calculation display */}
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        <Activity className="size-3.5 text-primary" />
                        Current Workload ({team.activeWorkload} Active)
                      </span>
                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground">
                        <span className="text-amber-600 dark:text-amber-400 font-semibold">{team.inProgressCount} in progress</span>
                        <span>•</span>
                        <span className="text-destructive font-semibold">{team.pendingCount} pending</span>
                      </div>
                    </div>

                    {team.assignedReports.length === 0 ? (
                      <div className="rounded-lg border border-dashed p-3 text-center text-xs text-muted-foreground">
                        No active incident reports currently assigned to this team.
                      </div>
                    ) : (
                      <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                        {team.assignedReports.map((r) => (
                          <div
                            key={r.id}
                            className="flex items-center justify-between rounded-lg border p-2 text-xs bg-muted/20"
                          >
                            <div className="flex flex-col">
                              <span className="font-mono font-semibold text-foreground">
                                {r.id}
                              </span>
                              <span className="text-[11px] text-muted-foreground">
                                Brgy. {r.barangay} • {r.issueType}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Badge
                                variant={r.priority === "Emergency" ? "destructive" : "outline"}
                                className="text-[10px]"
                              >
                                {r.priority}
                              </Badge>
                              <Badge
                                variant={
                                  r.status === "Resolved"
                                    ? "outline"
                                    : r.status === "In Progress"
                                    ? "secondary"
                                    : "destructive"
                                }
                                className="text-[10px]"
                              >
                                {r.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>

              <CardFooter className="border-t pt-3 pb-3 flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">
                  {team.assignedBarangays.length} of 12 Barangays Assigned
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-7 gap-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenTeam(team);
                  }}
                >
                  <MapPin className="size-3 text-primary" />
                  Manage Barangays
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      {/* Team Details & Barangay Assignment shadcn/ui Dialog */}
      <Dialog
        open={!!selectedTeamId}
        onOpenChange={(open) => !open && handleCloseDialog()}
      >
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between pr-6 flex-wrap gap-2">
              <Badge variant="outline" className="font-mono text-xs px-2 py-0.5">
                {selectedTeam?.id}
              </Badge>
              <div className="flex items-center gap-1.5">
                <Badge
                  variant={selectedTeam?.statusText === "Dispatched in Field" ? "secondary" : "outline"}
                  className="text-xs"
                >
                  {selectedTeam?.statusText}
                </Badge>
                <Badge
                  variant="outline"
                  className={`text-xs ${selectedTeam?.availabilityBadgeClass || ""}`}
                >
                  {selectedTeam?.availabilityText}
                </Badge>
              </div>
            </div>
            <DialogTitle className="text-xl font-bold font-heading flex items-center gap-2 pt-1">
              <Users className="size-5 text-primary shrink-0" />
              {selectedTeam?.name}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {selectedTeam?.specialization}
            </DialogDescription>
          </DialogHeader>

          {selectedTeam && (
            <div className="flex flex-col gap-4 py-2">
              {/* Team Personnel & Equipment Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="rounded-lg border p-3 bg-muted/20 flex flex-col gap-1">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Team Lead & Direct Contact
                  </span>
                  <span className="font-semibold text-foreground text-sm">{selectedTeam.lead}</span>
                  <span className="text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Phone className="size-3 text-primary/80" />
                    <span className="font-mono">{selectedTeam.contact}</span>
                  </span>
                </div>

                <div className="rounded-lg border p-3 bg-muted/20 flex flex-col gap-1">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Assigned Vehicle & Equipment
                  </span>
                  <span className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                    <Truck className="size-4 text-primary shrink-0" />
                    {selectedTeam.vehicle}
                  </span>
                  <span className="text-muted-foreground">
                    Equipment certified for Butuan City streetlight servicing
                  </span>
                </div>
              </div>

              {/* Current Workload (Read-only / Calculated dynamically from incident reports) */}
              <div className="rounded-lg border p-3.5 bg-muted/30">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Activity className="size-4 text-primary" />
                    <span className="font-semibold text-xs">Current Workload</span>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    Calculated from incident reports (read-only)
                  </Badge>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center my-2">
                  <div className="rounded-md border bg-card p-2 shadow-xs">
                    <span className="text-[10px] text-muted-foreground block uppercase font-medium">Active</span>
                    <span className="font-mono font-bold text-lg text-foreground">
                      {selectedTeam.activeWorkload}
                    </span>
                  </div>
                  <div className="rounded-md border bg-card p-2 shadow-xs">
                    <span className="text-[10px] text-muted-foreground block uppercase font-medium">In Repair</span>
                    <span className="font-mono font-bold text-lg text-amber-600 dark:text-amber-400">
                      {selectedTeam.inProgressCount}
                    </span>
                  </div>
                  <div className="rounded-md border bg-card p-2 shadow-xs">
                    <span className="text-[10px] text-muted-foreground block uppercase font-medium">Pending</span>
                    <span className="font-mono font-bold text-lg text-destructive">
                      {selectedTeam.pendingCount}
                    </span>
                  </div>
                  <div className="rounded-md border bg-card p-2 shadow-xs">
                    <span className="text-[10px] text-muted-foreground block uppercase font-medium">Resolved</span>
                    <span className="font-mono font-bold text-lg text-emerald-600 dark:text-emerald-400">
                      {selectedTeam.resolvedCount}
                    </span>
                  </div>
                </div>

                {/* Active Assigned Incident Tickets List */}
                {selectedTeam.assignedReports.length > 0 ? (
                  <div className="mt-3 space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                    <span className="text-[11px] font-medium text-muted-foreground block">
                      Assigned Reports ({selectedTeam.assignedReports.length}):
                    </span>
                    {selectedTeam.assignedReports.map((r) => (
                      <div
                        key={r.id}
                        className="flex items-center justify-between rounded border bg-card px-2.5 py-1.5 text-[11px]"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold">{r.id}</span>
                          <span className="text-muted-foreground">Brgy. {r.barangay}</span>
                          <span className="text-muted-foreground">• {r.issueType}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Badge variant={r.priority === "Emergency" ? "destructive" : "outline"} className="text-[9px]">
                            {r.priority}
                          </Badge>
                          <Badge
                            variant={
                              r.status === "In Progress"
                                ? "secondary"
                                : r.status === "Resolved"
                                ? "outline"
                                : "destructive"
                            }
                            className="text-[9px]"
                          >
                            {r.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-muted-foreground mt-2 italic">
                    No active or pending incident reports currently assigned to this team.
                  </p>
                )}
              </div>

              {/* Admin Workflow: Assign & Reassign Barangays */}
              <div className="rounded-lg border p-4 bg-card shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <MapPin className="size-4 text-primary" />
                      <h3 className="font-semibold text-sm">Assign / Reassign Coverage Barangays</h3>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Select one or multiple barangays from the {availableBarangays.length} active Butuan City areas to assign to this maintenance crew.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-[11px] h-7 px-2"
                      onClick={handleSelectAllBarangays}
                    >
                      Select All
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-[11px] h-7 px-2"
                      onClick={handleClearAllBarangays}
                    >
                      Clear
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-[11px] h-7 px-2 text-muted-foreground"
                      onClick={handleResetToBaselineRoster}
                      title="Reset to default baseline barangays for this team"
                    >
                      Reset
                    </Button>
                  </div>
                </div>

                {isLoadingBarangays && (
                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground py-6">
                    <RotateCw className="size-3.5 animate-spin text-primary" />
                    <span>Loading active barangays from database...</span>
                  </div>
                )}

                {/* Active Barangays Selector Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[340px] overflow-y-auto p-1 border rounded-lg">
                  {availableBarangays.map((brgy) => {
                    const isSelected = editingBarangays.includes(brgy);
                    const otherAssignedTeam = teams.find(
                      (t) => t.id !== selectedTeam.id && t.assignedBarangays.includes(brgy)
                    );

                    return (
                      <button
                        key={brgy}
                        type="button"
                        onClick={() => handleToggleBarangay(brgy)}
                        className={cn(
                          "flex flex-col items-start p-2.5 rounded-lg border text-left transition-all text-xs relative",
                          isSelected
                            ? "border-primary bg-primary/10 text-primary shadow-xs ring-1 ring-primary/30"
                            : "border-border hover:bg-muted/50 text-foreground"
                        )}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="font-medium text-xs truncate max-w-[140px]">{brgy}</span>
                          {isSelected && <Check className="size-3.5 text-primary shrink-0" />}
                        </div>
                        {otherAssignedTeam && !isSelected ? (
                          <span className="text-[10px] text-muted-foreground mt-1 truncate max-w-[130px]">
                            Currently: {otherAssignedTeam.name.replace(/ \(.*\)/, "")}
                          </span>
                        ) : isSelected ? (
                          <span className="text-[10px] text-primary/80 mt-1 font-mono">
                            Assigned to {selectedTeam.keyword}
                          </span>
                        ) : (
                          <span className="text-[10px] text-muted-foreground/60 mt-1">
                            Click to assign
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Selection summary & Save feedback notice */}
                <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground pt-2.5 border-t flex-wrap gap-2">
                  <span className="flex items-center gap-1.5">
                    <Layers className="size-3.5 text-primary" />
                    <strong>{editingBarangays.length}</strong> of {availableBarangays.length} barangays selected
                  </span>
                  {saveSuccess && (
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 text-xs animate-in fade-in duration-200">
                      <CheckCircle2 className="size-3.5" />
                      Coverage assignments saved successfully!
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex items-center justify-between sm:justify-between w-full pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleCloseDialog}
            >
              Close
            </Button>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => selectedTeam && setEditingBarangays([...selectedTeam.assignedBarangays])}
                disabled={isSaving}
              >
                Reset Changes
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSaveBarangayAssignments}
                disabled={isSaving}
                className="gap-1.5"
              >
                {isSaving ? (
                  <>
                    <RotateCw className="size-3.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="size-3.5" />
                    Save Assignments
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
