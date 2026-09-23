"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ClipboardList,
  AlertOctagon,
  Clock,
  CheckCircle2,
  Download,
  ExternalLink,
  ShieldAlert,
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
  MOCK_REPORTS,
  MOCK_STATS,
} from "@/lib/mock-data";

export default function AdminDashboard() {
  const [statusFilter, setStatusFilter] = useState<string>("All");

  const filteredReports =
    statusFilter === "All"
      ? MOCK_REPORTS
      : MOCK_REPORTS.filter((r) => r.status === statusFilter);

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
              Phase 1 Prototype
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Monitor reported streetlight defects, assign repair teams, and track resolution across Butuan City.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Incidents Logged
            </CardTitle>
            <ClipboardList className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-heading text-2xl font-bold">
              {MOCK_STATS.totalReports}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              +14 reports filed this week
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
              {MOCK_STATS.pendingInspection}
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
              {MOCK_STATS.inProgress}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              3 line crews currently deployed
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
              {MOCK_STATS.resolvedThisMonth}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Avg repair time: {MOCK_STATS.averageResolutionHours} hours
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Streetlight Incident Table */}
      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg">City-Wide Streetlight Reports</CardTitle>
              <CardDescription>
                Live monitoring queue from all Butuan City barangays and purok residents.
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
                <TableHead>Barangay & Landmark</TableHead>
                <TableHead>Pole Tag</TableHead>
                <TableHead>Problem Type</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Assigned Crew</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="font-mono text-xs font-semibold">
                    {report.id}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-xs">{report.barangay}</span>
                      <span className="text-[11px] text-muted-foreground truncate max-w-[220px]">
                        {report.landmark}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {report.poleNumber}
                  </TableCell>
                  <TableCell className="text-xs">
                    {report.issueType}
                  </TableCell>
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
                  <TableCell className="text-xs text-muted-foreground">
                    {report.assignedTeam}
                  </TableCell>
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>

        <CardFooter className="border-t py-3 text-xs text-muted-foreground flex items-center justify-between">
          <span>
            Showing {filteredReports.length} of {MOCK_REPORTS.length} mock incidents
          </span>
          <span className="text-xs text-muted-foreground">
            Backend & Supabase database integration will occur in next phase.
          </span>
        </CardFooter>
      </Card>
    </div>
  );
}
