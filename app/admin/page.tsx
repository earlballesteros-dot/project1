"use client";

import { useState, useEffect } from "react";
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
  MOCK_REPORTS,
  MOCK_BARANGAYS,
} from "@/lib/mock-data";
import { getStoredReports, updateReportStatus } from "@/lib/reports-store";
import { BUTUAN_MAINTENANCE_TEAMS } from "@/components/admin-teams-client";
import { useIsAdmin } from "@/lib/roles";

export default function AdminDashboard() {
  const isAdmin = useIsAdmin();
  const [reports, setReports] = useState<StreetlightReport[]>(MOCK_REPORTS);
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [selectedReport, setSelectedReport] = useState<StreetlightReport | null>(null);

  // Synchronize reports with local storage
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
  const teamsWorkload = BUTUAN_MAINTENANCE_TEAMS.map((team) => {
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

  const handleStatusChange = (id: string, newStatus: ReportStatus) => {
    const updated = updateReportStatus(id, newStatus);
    setReports(updated);
    if (selectedReport && selectedReport.id === id) {
      setSelectedReport({ ...selectedReport, status: newStatus });
    }
  };

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
              Live Local Sync
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
              {filteredReports.map((report) => (
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
                  <TableCell className="text-xs text-muted-foreground">
                    {report.assignedTeam || "Pending Dispatch"}
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>

        <CardFooter className="border-t py-3 text-xs text-muted-foreground flex items-center justify-between">
          <span>
            Showing {filteredReports.length} of {reports.length} local incident reports
          </span>
          <span className="text-xs text-muted-foreground">
            Synchronized with resident reporting portal via local store.
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
              Reported on {selectedReport?.reportedDate} • Assigned to: {selectedReport?.assignedTeam}
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
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={selectedReport.photoUrl}
                        alt="Streetlight defect attachment"
                        className="h-32 w-auto rounded border object-cover"
                      />
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
            </div>
          )}

          <DialogFooter showCloseButton />
        </DialogContent>
      </Dialog>
    </div>
  );
}
