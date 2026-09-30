"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Wrench,
  Clock,
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
import { type StreetlightReport } from "@/lib/mock-data";
import { getStoredReports } from "@/lib/reports-store";

export interface MaintenanceTeamConfig {
  id: string;
  name: string;
  keyword: string;
  specialization: string;
  lead: string;
  contact: string;
  assignedBarangays: string[];
  vehicle: string;
}

// Fixed team roster covering all 12 supported Butuan City barangays
export const BUTUAN_MAINTENANCE_TEAMS: MaintenanceTeamConfig[] = [
  {
    id: "BXU-CREW-01",
    name: "Team Alpha (City Engineering)",
    keyword: "Team Alpha",
    specialization: "Substation & High-Voltage Systems",
    lead: "Engr. Mateo Morales",
    contact: "0917 882 1044",
    assignedBarangays: ["Ampayon", "Baan Riverside", "Pangabugan"],
    vehicle: "Boom Truck #04",
  },
  {
    id: "BXU-CREW-02",
    name: "Team Bravo (Linemen)",
    keyword: "Team Bravo",
    specialization: "Overhead Lines & Luminaire Repairs",
    lead: "Foreman Jerry Alcantara",
    contact: "0920 551 3920",
    assignedBarangays: ["Doongan", "Holy Redeemer", "Golden Ribbon"],
    vehicle: "Bucket Truck #02",
  },
  {
    id: "BXU-CREW-03",
    name: "Team Charlie",
    keyword: "Team Charlie",
    specialization: "Photocell Sensors & Day-Burn Control",
    lead: "Sr. Lineman Rolando Dizon",
    contact: "0918 334 9021",
    assignedBarangays: ["Bancasi", "Bonbon", "Libertad"],
    vehicle: "Ladder Service Van #07",
  },
  {
    id: "BXU-CREW-04",
    name: "Emergency Response Unit",
    keyword: "Emergency",
    specialization: "Hazard Isolation & Ground Faults",
    lead: "Capt. Aris Villanueva",
    contact: "0939 990 4411",
    assignedBarangays: ["Villa Kananga", "Ong Yiu", "San Vicente"],
    vehicle: "Rapid Intervention Van #01",
  },
];

export function AdminTeamsClient() {
  const [reports, setReports] = useState<StreetlightReport[]>([]);

  // Synchronize reports with the exact same localStorage store used by the Admin Dashboard
  useEffect(() => {
    setReports(getStoredReports());

    const handleStorageChange = () => {
      setReports(getStoredReports());
    };

    window.addEventListener("butuan-reports-changed", handleStorageChange);
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("butuan-reports-changed", handleStorageChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const handleRefresh = () => {
    setReports(getStoredReports());
  };

  // Derive workload for each maintenance team from existing report records
  const teamWorkloadList = BUTUAN_MAINTENANCE_TEAMS.map((team) => {
    const assignedReports = reports.filter((r) =>
      r.assignedTeam?.toLowerCase().includes(team.keyword.toLowerCase())
    );

    const inProgressCount = assignedReports.filter((r) => r.status === "In Progress").length;
    const pendingCount = assignedReports.filter((r) => r.status === "Pending").length;
    const resolvedCount = assignedReports.filter((r) => r.status === "Resolved").length;
    const totalAssigned = assignedReports.length;
    const activeWorkload = inProgressCount + pendingCount;

    // Derive real-time status and availability
    let statusText: "Dispatched in Field" | "En Route / Staging" | "Standby";
    let statusVariant: "secondary" | "outline" | "default";
    let availabilityText: "Available for Dispatch" | "Engaged (Normal)" | "High Workload";
    let availabilityBadgeClass: string;

    if (inProgressCount > 0) {
      statusText = "Dispatched in Field";
      statusVariant = "secondary";
    } else if (pendingCount > 0) {
      statusText = "En Route / Staging";
      statusVariant = "default";
    } else {
      statusText = "Standby";
      statusVariant = "outline";
    }

    if (activeWorkload >= 2) {
      availabilityText = "High Workload";
      availabilityBadgeClass = "border-amber-500/50 text-amber-600 dark:text-amber-400";
    } else if (activeWorkload === 1) {
      availabilityText = "Engaged (Normal)";
      availabilityBadgeClass = "border-blue-500/50 text-blue-600 dark:text-blue-400";
    } else {
      availabilityText = "Available for Dispatch";
      availabilityBadgeClass = "border-emerald-500/50 text-emerald-600 dark:text-emerald-400";
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
  const totalTeams = BUTUAN_MAINTENANCE_TEAMS.length;
  const dispatchedTeamsCount = teamWorkloadList.filter((t) => t.inProgressCount > 0).length;
  const standbyTeamsCount = teamWorkloadList.filter((t) => t.activeWorkload === 0).length;
  const unassignedReports = reports.filter(
    (r) =>
      r.status !== "Resolved" &&
      (!r.assignedTeam || r.assignedTeam.toLowerCase().includes("pending dispatch"))
  );

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
            Monitor engineering crews, field linemen workload, and district coverage across Butuan City.
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
            onClick={handleRefresh}
          >
            <RotateCw data-icon="inline-start" />
            Refresh Crew Data
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
              Teams with repairs in progress
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
              <CardTitle className="text-lg">Maintenance Teams Roster & Status</CardTitle>
              <CardDescription className="text-xs">
                Real-time workload and area coverage calculated from Butuan City streetlight incident reports.
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs font-mono self-start sm:self-auto">
              12 Barangays Assigned
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Team Name</TableHead>
                <TableHead>Lead & Vehicle</TableHead>
                <TableHead>Assigned Barangay / Area</TableHead>
                <TableHead className="text-center">Current Workload</TableHead>
                <TableHead className="text-center">Team Status</TableHead>
                <TableHead className="text-right">Availability</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teamWorkloadList.map((t) => (
                <TableRow key={t.id} className="hover:bg-muted/40">
                  {/* Team Name */}
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                        <Users className="size-3.5 text-primary shrink-0" />
                        {t.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {t.id} • {t.specialization}
                      </span>
                    </div>
                  </TableCell>

                  {/* Lead & Vehicle */}
                  <TableCell>
                    <div className="flex flex-col text-xs">
                      <span className="font-medium text-foreground">{t.lead}</span>
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Truck className="size-3 text-muted-foreground/75" />
                        {t.vehicle}
                      </span>
                    </div>
                  </TableCell>

                  {/* Assigned Barangays (12 Supported Barangays) */}
                  <TableCell>
                    <div className="flex flex-col gap-1 max-w-[260px]">
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
                    </div>
                  </TableCell>

                  {/* Current Workload */}
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

                  {/* Team Status */}
                  <TableCell className="text-center">
                    <Badge
                      variant={
                        t.inProgressCount > 0
                          ? "secondary"
                          : t.pendingCount > 0
                          ? "destructive"
                          : "outline"
                      }
                      className="text-[11px]"
                    >
                      {t.statusText}
                    </Badge>
                  </TableCell>

                  {/* Availability */}
                  <TableCell className="text-right">
                    <Badge
                      variant="outline"
                      className={`text-[11px] font-medium ${t.availabilityBadgeClass}`}
                    >
                      {t.availabilityText}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>

        <CardFooter className="border-t py-3 text-xs text-muted-foreground flex items-center justify-between">
          <span>
            Team workload dynamically synchronized with active incident reports.
          </span>
          <Link href="/admin" className="text-primary hover:underline text-xs">
            Manage reports in Operations Queue &rarr;
          </Link>
        </CardFooter>
      </Card>

      {/* Active Team Workload Cards Detail */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {teamWorkloadList.map((team) => (
          <Card key={team.id} className="flex flex-col">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Wrench className="size-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-semibold">{team.name}</CardTitle>
                    <CardDescription className="text-[11px]">
                      Lead: {team.lead} • Contact: {team.contact}
                    </CardDescription>
                  </div>
                </div>
                <Badge variant={team.inProgressCount > 0 ? "secondary" : "outline"} className="text-[10px]">
                  {team.availabilityText}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="pt-4 flex-1">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Assigned Coverage:</span>
                  <span className="font-medium text-foreground">
                    {team.assignedBarangays.join(", ")}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Assigned Vehicle:</span>
                  <span className="font-mono text-xs">{team.vehicle}</span>
                </div>

                {/* Assigned Incidents from live reports */}
                <div className="pt-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-2">
                    Active Assigned Reports ({team.assignedReports.length})
                  </span>

                  {team.assignedReports.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                      No incident reports currently assigned to this team.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[180px] overflow-y-auto">
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
          </Card>
        ))}
      </div>
    </div>
  );
}
