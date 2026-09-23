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
import { type StreetlightReport, type ReportStatus } from "@/lib/mock-data";
import { getStoredReports, updateReportStatus } from "@/lib/reports-store";

export default function AdminDashboard() {
  const [reports, setReports] = useState<StreetlightReport[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [selectedReport, setSelectedReport] = useState<StreetlightReport | null>(null);

  // Synchronize reports with local storage
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

  const filteredReports =
    statusFilter === "All"
      ? reports
      : reports.filter((r) => r.status === statusFilter);

  // Dynamic KPI counts from live local data
  const totalReportsCount = reports.length;
  const pendingCount = reports.filter((r) => r.status === "Pending").length;
  const inProgressCount = reports.filter((r) => r.status === "In Progress").length;
  const resolvedCount = reports.filter((r) => r.status === "Resolved").length;

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
          <Link href="/resident">
            <Button variant="secondary" size="sm" className="text-xs">
              Switch to Resident Portal
              <ExternalLink data-icon="inline-end" />
            </Button>
          </Link>
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

      {/* KPI Stats Cards */}
      <div id="analytics" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Incidents Logged
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
              Pending Inspection
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
              Under Repair / Dispatched
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
              Resolved This Month
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
