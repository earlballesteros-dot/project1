"use client";

import { useState, useEffect } from "react";
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
import { MOCK_BARANGAYS, type StreetlightReport } from "@/lib/mock-data";
import { getStoredReports } from "@/lib/reports-store";

// Exactly the 12 supported barangays specified in requirements
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
  const [mounted, setMounted] = useState(false);

  // Synchronize reports with the exact same localStorage store used by Admin Dashboard
  useEffect(() => {
    setReports(getStoredReports());
    setMounted(true);

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

  const handleManualRefresh = () => {
    setReports(getStoredReports());
  };

  // Required KPI calculations derived directly from the existing reports store
  const totalReports = reports.length;
  const pendingReports = reports.filter((r) => r.status === "Pending").length;
  const underRepairReports = reports.filter((r) => r.status === "In Progress").length;
  const resolvedReports = reports.filter((r) => r.status === "Resolved").length;

  const pendingPct = totalReports > 0 ? Math.round((pendingReports / totalReports) * 100) : 0;
  const underRepairPct = totalReports > 0 ? Math.round((underRepairReports / totalReports) * 100) : 0;
  const resolvedPct = totalReports > 0 ? Math.round((resolvedReports / totalReports) * 100) : 0;

  // Breakdown by the 12 supported barangays
  const barangayData = SUPPORTED_BARANGAYS.map((barangay) => {
    const matching = reports.filter(
      (r) => r.barangay.trim().toLowerCase() === barangay.trim().toLowerCase()
    );
    const count = matching.length;
    const pending = matching.filter((r) => r.status === "Pending").length;
    const underRepair = matching.filter((r) => r.status === "In Progress").length;
    const resolved = matching.filter((r) => r.status === "Resolved").length;
    const resolutionRate = count > 0 ? Math.round((resolved / count) * 100) : 0;

    return {
      name: barangay,
      total: count,
      pending,
      underRepair,
      resolved,
      resolutionRate,
    };
  });

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
              Live Local Sync
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Operational metrics, resolution performance, and streetlight incident breakdown across Butuan City.
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
            onClick={handleManualRefresh}
          >
            <RotateCw data-icon="inline-start" />
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

      {/* Main Content: If mounted and there are no reports, show empty state message */}
      {mounted && totalReports === 0 ? (
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
              <Link href="/admin">
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
                Live counts sync with Admin incident updates.
              </CardFooter>
            </Card>

            {/* Barangay Breakdown Card (12 Supported Barangays) */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-base font-semibold">
                      Breakdown by Barangay
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Streetlight defect volume across the 12 supported Butuan City barangays.
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="text-[11px] self-start sm:self-auto">
                    12 Barangays Covered
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-0">
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
                    {barangayData.map((b) => (
                      <TableRow key={b.name} className="hover:bg-muted/40">
                        {/* Barangay Name */}
                        <TableCell className="font-medium text-xs">
                          <div className="flex items-center gap-2">
                            <MapPin className="size-3.5 text-muted-foreground shrink-0" />
                            <span>{b.name}</span>
                          </div>
                        </TableCell>

                        {/* Total Count */}
                        <TableCell className="text-center font-mono text-xs">
                          {b.total > 0 ? (
                            <span className="font-semibold text-foreground">{b.total}</span>
                          ) : (
                            <span className="text-muted-foreground/50">0</span>
                          )}
                        </TableCell>

                        {/* Pending */}
                        <TableCell className="text-center">
                          {b.pending > 0 ? (
                            <Badge variant="destructive" className="text-[10px] py-0 px-1.5 font-mono">
                              {b.pending}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground/40 font-mono">-</span>
                          )}
                        </TableCell>

                        {/* Under Repair */}
                        <TableCell className="text-center">
                          {b.underRepair > 0 ? (
                            <Badge variant="secondary" className="text-[10px] py-0 px-1.5 font-mono text-amber-700 dark:text-amber-300">
                              {b.underRepair}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground/40 font-mono">-</span>
                          )}
                        </TableCell>

                        {/* Resolved */}
                        <TableCell className="text-center">
                          {b.resolved > 0 ? (
                            <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-mono border-emerald-500/40 text-emerald-600 dark:text-emerald-400">
                              {b.resolved}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground/40 font-mono">-</span>
                          )}
                        </TableCell>

                        {/* Resolution Rate */}
                        <TableCell className="text-right font-mono text-xs">
                          {b.total > 0 ? (
                            <span className={b.resolutionRate === 100 ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-muted-foreground"}>
                              {b.resolutionRate}%
                            </span>
                          ) : (
                            <span className="text-[11px] text-muted-foreground/50">No reports</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>

              <CardFooter className="border-t py-3 text-xs text-muted-foreground flex items-center justify-between">
                <span>Calculated directly from active local incident reports</span>
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
